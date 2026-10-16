# U-Bot Voice

Talk to your U-topia money in your own language.
Team OrangeEgg, U-Hackathon 2026, AI track.

- Live demo: https://orangeegg-ubot-voice.vercel.app
- Code: https://github.com/Spidergy07/orangeegg-ubot-voice
- Pitch deck: https://drive.google.com/file/d/1rJF8K_lIGNZSbNknvgxZIsvCVb2k0Mfa/view

## Problem
U-topia members come from many countries, but every task in the app still runs through menus and screens. Freezing a lost card, sending money to family abroad or booking a trip all mean tapping through several steps, and a member who does not read the app's language has to guess or wait for support. Token unlock schedules matter before you buy a token, yet they sit on another site and rarely show up at the moment of purchase.

## Solution
U-Bot Voice adds a voice button to the U-topia app. Members speak in Thai, English, Filipino, German, Vietnamese or Japanese, and U-Bot answers by voice in the same language.

They can also ask it to do things: send money, freeze or unfreeze the card, set an alert, buy a token, or book a flight, hotel, ride or groceries. U-Bot prepares each action and waits; nothing happens until the member taps Confirm.

Before a token purchase, U-Bot reads the unlock schedule from Tokenomist and says how many days remain until the next unlock, what share of supply and market cap it is, and who receives it. The source appears on screen. U-Bot does not predict prices.

## U-Bot integration
Bookings go through the same U-topia Pay handoff that u.bot uses. When a member asks for a flight, hotel, ride or groceries, the assistant returns a `book` action with one of u.bot's four kinds (`flights`, `hotels`, `uber`, `groceries`). After Confirm, the app opens "Review & pay in U-topia Pay" with u.bot's `ubot-pay` link (`https://ubot-pay-v2.vercel.app?type=...`), so a member can start a booking by voice in their own language and pay in the flow u.bot already uses.

## Demo flows
1. "Buy 300 USDT of ARB": U-Bot gives the unlock facts, then shows a confirm sheet with the same warning.
2. "Padalhan mo si Maria ng 50 USDT" (Filipino, send Maria 50 USDT): U-Bot prepares the transfer and asks for confirmation.
3. "อายัดบัตรให้หน่อย" (Thai, freeze my card): after Confirm, the card shows Frozen.
4. "จองไฟลต์ไปมะนิลาวันที่ 20" (Thai, book a flight to Manila on the 20th): after Confirm, U-topia Pay opens.

## What is live and what is simulated
Live: Claude understanding and structured actions, ElevenLabs voice, the confirm flow, six languages, the U-topia Pay handoff and the Vercel deployment.

Simulated: account data such as balances, the card and transactions, because the U-topia app has no public API yet. Each action maps to one app endpoint once it is connected.

Waiting on access: Tokenomist unlock data. The integration is written and our key is set, but it is on the free plan and the API returns 403, so the demo shows labelled sample unlock data until the hackathon API grant is active.

## Trust rules
The model returns an action object and the app runs it only after the tap. U-Bot never asks for passwords, seed phrases or card numbers. Token answers give numbers and their source.

## How it's made
The frontend is a single HTML/JS page styled after the U-topia app. It uses the Web Speech API for voice input and keeps the demo account in the browser.

The backend is a set of Vercel serverless functions (`api/chat`, `api/tts`, `api/unlocks`, `api/config`) that share `lib/core.mjs` and apply a per-IP rate limit.

Claude (`claude-sonnet-5.5` via OpenRouter) gets a system prompt that asks for JSON `{reply, lang, action, unlock_slug}` and replies in the user's language. Tokenomist data comes from API v5 `GET /v5/unlock/events/{slug}` with `x-api-key`. ElevenLabs text to speech uses Eleven v3 for Thai and Multilingual v2 for other languages. The U-Bot `book` action builds the U-topia Pay handoff link.

## Next
Connect the account actions to U-topia app endpoints, add ElevenLabs Scribe for speech input and a phone line for members who prefer to call, and read out a Tokenomist heads-up for tokens a member already holds.
