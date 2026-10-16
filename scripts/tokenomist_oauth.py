# One-time OAuth (PKCE) for the Tokenomist MCP server. Writes tokens to ../.tokenomist-oauth.json (gitignored).
import base64, hashlib, http.server, json, os, secrets, threading, urllib.parse, urllib.request
AUTH = "https://mcp-auth.tokenomist.ai"
REDIRECT = "http://localhost:8765/callback"
OUT = os.path.join(os.path.dirname(__file__), "..", ".tokenomist-oauth.json")

def post(url, data, form=False):
    body = urllib.parse.urlencode(data).encode() if form else json.dumps(data).encode()
    req = urllib.request.Request(url, body, {"Content-Type": "application/x-www-form-urlencoded" if form else "application/json"})
    return json.load(urllib.request.urlopen(req))

reg = post(f"{AUTH}/oauth2/register", {"client_name": "U-Bot Voice", "redirect_uris": [REDIRECT],
           "grant_types": ["authorization_code", "refresh_token"], "response_types": ["code"],
           "token_endpoint_auth_method": "none", "scope": "mcp:read"})
cid = reg["client_id"]
verifier = secrets.token_urlsafe(64)
challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
state = secrets.token_urlsafe(16)
url = f"{AUTH}/oauth2/authorize?" + urllib.parse.urlencode({"response_type": "code", "client_id": cid, "redirect_uri": REDIRECT,
      "scope": "mcp:read", "state": state, "code_challenge": challenge, "code_challenge_method": "S256", "resource": "https://mcp.tokenomist.ai"})
open(os.path.join(os.path.dirname(__file__), "..", ".tokenomist-authurl.txt"), "w").write(url)
print("AUTH_URL_WRITTEN", flush=True)

result = {}
class H(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        result.update({k: v[0] for k, v in q.items()})
        self.send_response(200); self.end_headers(); self.wfile.write(b"Tokenomist connected. You can close this tab.")
        threading.Thread(target=self.server.shutdown).start()
    def log_message(self, *a): pass
http.server.HTTPServer(("localhost", 8765), H).serve_forever()
assert result.get("state") == state, "state mismatch"
tok = post(f"{AUTH}/oauth2/token", {"grant_type": "authorization_code", "code": result["code"], "redirect_uri": REDIRECT,
           "client_id": cid, "code_verifier": verifier, "resource": "https://mcp.tokenomist.ai"}, form=True)
tok["client_id"] = cid
json.dump(tok, open(OUT, "w"))
print("TOKENS_SAVED", sorted(tok.keys()), flush=True)
