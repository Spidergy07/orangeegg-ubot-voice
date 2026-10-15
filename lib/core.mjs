// Shared logic for the local server and Vercel functions. Stateless: the
// demo account lives in the browser and is sent with each chat request.
export const OR_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '';
const OR_BASE = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
export const MODEL = process.env.UBOT_MODEL || 'anthropic/claude-sonnet-5.5';
export const XI_KEY = process.env.ELEVENLABS_API_KEY || '';
const XI_VOICE = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';
export const TOK_KEY = process.env.TOKENOMIST_API_KEY || '';

export const services = () => ({ llm: !!OR_KEY, voice: !!XI_KEY, tokenomist: !!TOK_KEY, model: MODEL });

const SAMPLE_UNLOCKS = {
  arbitrum: { name: 'Arbitrum', symbol: 'ARB', nextUnlock: { inDays: 6, amountPct: 2.0, valueToMarketCapPct: 1.9, groups: [{ name: 'Team and advisors', pct: 56 }, { name: 'Investors', pct: 44 }] } },
  sui: { name: 'Sui', symbol: 'SUI', nextUnlock: { inDays: 3, amountPct: 1.3, valueToMarketCapPct: 1.2, groups: [{ name: 'Series B investors', pct: 48 }, { name: 'Community reserve', pct: 52 }] } },
  optimism: { name: 'Optimism', symbol: 'OP', nextUnlock: { inDays: 12, amountPct: 1.6, valueToMarketCapPct: 1.5, groups: [{ name: 'Core contributors', pct: 60 }, { name: 'Investors', pct: 40 }] } },
  aptos: { name: 'Aptos', symbol: 'APT', nextUnlock: { inDays: 9, amountPct: 1.0, valueToMarketCapPct: 1.1, groups: [{ name: 'Core contributors', pct: 35 }, { name: 'Foundation', pct: 30 }, { name: 'Investors', pct: 35 }] } },
};
const SYMBOL_TO_SLUG = { ARB: 'arbitrum', SUI: 'sui', OP: 'optimism', APT: 'aptos' };

export async function getUnlocks(slug) {
  if (TOK_KEY) {
    try {
      const start = new Date().toISOString().slice(0, 10);
      const end = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      const r = await fetch(`https://api.tokenomist.ai/v5/unlock/events/${encodeURIComponent(slug)}?start=${start}&end=${end}`, { headers: { 'x-api-key': TOK_KEY } });
      if (r.ok) return { source: 'tokenomist', slug, raw: await r.json() };
      console.warn('tokenomist', r.status, await r.text());
    } catch (e) { console.warn('tokenomist error', e.message); }
  }
  const s = SAMPLE_UNLOCKS[slug];
  return s ? { source: 'sample', slug, ...s } : { source: 'none', slug };
}

function tokensMentioned(text) {
  const up = text.toUpperCase();
  const slugs = new Set();
  for (const [sym, slug] of Object.entries(SYMBOL_TO_SLUG)) if (new RegExp(`\\b${sym}\\b`).test(up)) slugs.add(slug);
  for (const [slug, d] of Object.entries(SAMPLE_UNLOCKS)) if (up.includes(d.name.toUpperCase())) slugs.add(slug);
  return [...slugs];
}

const SYSTEM = `You are U-Bot, the voice assistant inside a borderless money app (wallet, U-Pay transfers, U-Card Visa).
Reply in the SAME language the user speaks (Thai, English, Tagalog, German, etc.). Keep replies short and spoken-friendly (max 3 sentences).
You can propose ONE action; the app asks the user to confirm before anything happens. Never claim an action is done.
Actions: transfer {to, amount, currency}, freeze_card {}, unfreeze_card {}, buy_token {symbol, usdt}, set_alert {symbol, condition}.
When a token is discussed or about to be bought and unlock data is provided, state the facts first (days until unlock, percent of supply or market cap, who receives it) and name the source ("Tokenomist" if source is tokenomist, otherwise say "sample data"). Do not give investment advice or predict prices; let the user decide.
Never ask for passwords, seed phrases or card numbers. Only mention token facts when the user asks about that token in the current message; do not comment on earlier answers.
Return ONLY JSON: {"reply": string, "lang": BCP-47 code like "th-TH", "action": null | {"type": string, "params": object, "summary": string}, "unlock_slug": string | null}`;

export async function chat(messages, state) {
  const userMsgs = messages.filter(m => m.role === 'user').map(m => m.content || '');
  const last = userMsgs.at(-1) || '';
  // tokens from the latest message first, then earlier ones, so follow-ups keep their facts
  const slugs = [...new Set([...tokensMentioned(last), ...tokensMentioned(userMsgs.slice(-6).join(' '))])];
  const unlocks = await Promise.all(slugs.map(getUnlocks));
  const context = `ACCOUNT STATE: ${JSON.stringify(state || {})}\nUNLOCK DATA: ${JSON.stringify(unlocks)}`;
  if (!OR_KEY) return fallbackChat(last, unlocks, state);
  const r = await fetch(`${OR_BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${OR_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, temperature: 0.2, max_tokens: 900, messages: [{ role: 'system', content: SYSTEM + '\n\n' + context }, ...messages.slice(-10)] }),
  });
  if (!r.ok) { console.warn('llm', r.status, await r.text()); return fallbackChat(last, unlocks, state); }
  const j = await r.json();
  return { ...parseReply(j.choices?.[0]?.message?.content || ''), unlocks };
}

// Model output should be JSON; recover the spoken reply even if it is wrapped or cut off.
function parseReply(text) {
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  const reply = text.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)/);
  const lang = text.match(/"lang"\s*:\s*"([^"]+)"/);
  return { reply: reply ? JSON.parse(`"${reply[1]}"`) : text.replace(/[{}]/g, '').trim(), lang: lang ? lang[1] : 'en-US', action: null };
}

function fallbackChat(text, unlocks, state) {
  const t = text.toLowerCase();
  const last4 = state?.card?.last4 || '';
  if (/freeze|อายัด|ล็อกบัตร/.test(t)) return { reply: `I can freeze your card ending ${last4}. Confirm?`, lang: 'en-US', action: { type: 'freeze_card', params: {}, summary: `Freeze card ${last4}` }, unlocks };
  if (unlocks[0]?.nextUnlock) { const u = unlocks[0]; return { reply: `${u.name} unlocks ${u.nextUnlock.amountPct}% of supply in ${u.nextUnlock.inDays} days (sample data).`, lang: 'en-US', action: null, unlock_slug: u.slug, unlocks }; }
  return { reply: 'LLM key missing, fallback mode.', lang: 'en-US', action: null, unlocks };
}

export async function tts(text, lang) {
  if (!XI_KEY || !text) return null;
  const model = /^th/.test(lang || '') ? 'eleven_v3' : 'eleven_multilingual_v2';
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${XI_VOICE}?output_format=mp3_44100_128`, {
    method: 'POST', headers: { 'xi-api-key': XI_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: String(text).slice(0, 600), model_id: model }),
  });
  if (!r.ok) { console.warn('tts', r.status, await r.text()); return null; }
  return Buffer.from(await r.arrayBuffer());
}

// Crude per-instance limit so a public demo URL cannot burn the LLM budget.
const hits = new Map();
export function limited(ip, max = 40, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < windowMs);
  arr.push(now); hits.set(ip, arr);
  return arr.length > max;
}
