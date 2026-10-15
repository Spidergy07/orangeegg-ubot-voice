# U-Bot Voice

**Talk to your U-topia money in your own language.**
Team OrangeEgg, U-Hackathon 2026, AI track.

- Live demo: https://orangeegg-ubot-voice.vercel.app
- Code: https://github.com/Spidergy07/orangeegg-ubot-voice
- Pitch deck: https://drive.google.com/file/d/1rJF8K_lIGNZSbNknvgxZIsvCVb2k0Mfa/view

## Problem
U-topia members come from many countries. Every task in a money app still means reading menus and tapping through screens: freezing a lost card, sending money to family abroad, booking a trip. A member who does not read the app's language has to guess or wait for support. And token unlock schedules, which matter before buying a token, live on another site instead of appearing at the moment of purchase.

## Solution
One voice button inside the U-topia app.

- **Ask** in Thai, English, Filipino, German, Vietnamese or Japanese. U-Bot answers in the same language, by voice.
- **Act** by saying it: send money, freeze or unfreeze the card, set an alert, buy a token, or book a flight, hotel, ride or groceries. U-Bot prepares the action; nothing happens until the member taps Confirm.
- **Know before you buy**: for a token purchase, U-Bot reads the unlock schedule from Tokenomist and states the facts (days to unlock, share of supply and market cap, who receives it) with the source on screen. Facts only, no price predictions.

## U-Bot integration
U-Bot Voice is built as the voice and action layer for U-Bot. Bookings use u.bot's own U-topia Pay handoff: when a member asks to book a flight, hotel, ride or groceries, the assistant returns a `book` action with the same four kinds u.bot uses (`flights`, `hotels`, `uber`, `groceries`), and after Confirm the app opens "Review & pay in U-topia Pay" with the same `ubot-pay` deep link (`https://ubot-pay-v2.vercel.app?type=...`). A member can therefore start a booking by voice in their own language and finish it in the same U-topia Pay flow u.bot uses.

## Demo flows
1. "Buy 300 USDT of ARB": unlock facts first, then a confirm sheet repeating the warning.
2. "Padalhan mo si Maria ng 50 USDT" (Filipino): transfer prepared, confirm in the app.
3. "อายัดบัตรให้หน่อย" (Thai, freeze my card): confirm, then the card shows Frozen.
4. "จองไฟลต์ไปมะนิลาวันที่ 20" (Thai, book a flight to Manila on the 20th): confirm, then U-topia Pay opens.

## Live vs simulated (honest status)
- Live: Claude understanding and structured actions, the confirm flow, six languages, U-topia Pay handoff, deployment on Vercel.
- Simulated: account data (balances, card, transactions), because the U-topia app has no public API yet. Each action maps to one app endpoint when connected.
- Pending keys: Tokenomist unlock data (sample data is shown and labelled until the key is active) and ElevenLabs voice (browser speech is used until the key is set). Both integrations are written.

## Trust rules
- Confirm before anything moves: the model only returns an action object; the app runs it after the tap.
- Never asks for passwords, seed phrases or card numbers.
- Facts, not advice, with the source shown.

## How it's made
- Frontend: single-page HTML/JS styled after the U-topia app, Web Speech API for voice input, browser storage for the demo account.
- Backend: Vercel serverless functions (`api/chat`, `api/tts`, `api/unlocks`, `api/config`) sharing `lib/core.mjs`.
- LLM: Claude (`claude-sonnet-5.5` via OpenRouter) with a system prompt that returns JSON `{reply, lang, action, unlock_slug}`; replies follow the user's language.
- Tokenomist: API v5 `GET /v5/unlock/events/{slug}` with `x-api-key`.
- ElevenLabs: text to speech, Eleven v3 for Thai and Multilingual v2 for other languages.
- U-Bot: `book` action and U-topia Pay handoff link matching u.bot.
- Per-IP rate limit on the public demo.

## Next
- Connect the five account actions to U-topia app endpoints.
- ElevenLabs Scribe for speech input and a phone line for members who prefer to call.
- Spoken Tokenomist heads-up for tokens a member already holds.
