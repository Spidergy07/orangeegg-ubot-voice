import json, urllib.request
tok=json.load(open('.tokenomist-oauth.json'))
H={'Authorization':'Bearer '+tok['access_token'],'Content-Type':'application/json','Accept':'application/json, text/event-stream','MCP-Protocol-Version':'2025-06-18'}
sid=None
def rpc(method, params=None, id=1, notify=False):
    global sid
    body={'jsonrpc':'2.0','method':method,'params':params or {}}
    if not notify: body['id']=id
    h=dict(H); 
    if sid: h['Mcp-Session-Id']=sid
    r=urllib.request.urlopen(urllib.request.Request('https://mcp.tokenomist.ai/', json.dumps(body).encode(), h))
    sid=r.headers.get('Mcp-Session-Id') or sid
    raw=r.read().decode()
    if notify: return None
    for line in raw.splitlines():
        if line.startswith('data:'): return json.loads(line[5:])
    return json.loads(raw) if raw.strip() else None
print(rpc('initialize',{'protocolVersion':'2025-06-18','capabilities':{},'clientInfo':{'name':'ubot-voice','version':'0.1'}})['result']['serverInfo'])
rpc('notifications/initialized',notify=True)
tools=rpc('tools/list',id=2)['result']['tools']
for t in tools: print('-', t['name'], ':', (t.get('description') or '')[:90].replace('\n',' '), '| args:', list((t.get('inputSchema') or {}).get('properties',{}).keys()))
import sys
def call(name, args, id):
    r=rpc('tools/call',{'name':name,'arguments':args},id=id)
    res=r.get('result') or r.get('error')
    txt=''.join(c.get('text','') for c in (res.get('content') or [])) if isinstance(res,dict) else str(res)
    return res.get('isError'), txt
for i,(n,a) in enumerate([('unlock_event_list',{'tokenId':'arbitrum','start':'2026-10-16','end':'2026-12-31'}),('upcoming_unlock_events',{'minMarketCap':500000000})]):
    err,txt=call(n,a,10+i); print('==',n,'isError=',err, len(txt)); print(txt[:900])
