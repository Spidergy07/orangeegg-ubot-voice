# U-Bot Voice (team OrangeEgg, U-Hackathon 2026, AI track)

Talk to your U-topia money in your own language. A voice layer for the U-topia super app: ask about your card, wallet and transfers in Thai, English, Filipino, German and more; U-Bot proposes the action and nothing happens until you confirm. Before you buy a token, U-Bot reads the real unlock schedule from Tokenomist and tells you the facts in your language.

## Stack
- Frontend: single-page HTML/JS styled after the U-topia app, Web Speech API for voice input
- LLM: Claude (claude-sonnet-5.5) via OpenRouter, structured JSON actions
- Voice: ElevenLabs text-to-speech (Eleven v3 for Thai, multilingual v2 otherwise), browser speech as fallback
- Token data: Tokenomist API v5 `/v5/unlock/events/{slug}` (sample data shown and labelled when no key)
- Hosting: Vercel serverless functions (`api/`)

Account data in the demo is simulated in the browser because the U-topia app has no public API.

## Run locally
```
cp .env.example .env   # add keys
OPENROUTER_API_KEY=... node server.mjs
open http://localhost:5173
```

Env vars: `OPENROUTER_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` (optional), `TOKENOMIST_API_KEY`, `UBOT_MODEL` (optional).
