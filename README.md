---
title: AI PHQ-9 Prototype
emoji: 🩺
colorFrom: green
colorTo: gray
sdk: docker
app_port: 7860
pinned: false
---

# AI-administered PHQ-9 — deployable prototype

A responsive web version of the prototype: conversational (AI) and standard
administration, multilingual (English, Malay, Mandarin, Tamil), live severity
scoring, item-9 safety flagging, an instant AI clinical summary, voice input,
and a consent-gated clinician handoff (WhatsApp / print-to-PDF). Works on phone
and desktop. **Demonstration only — not a medical device, not for clinical use.**

The small server (`server.js`) serves the app and relays model calls so your
**API key stays on the server and never reaches the browser**.

---

## Choose your model provider (this decides whether it costs anything)

The app works with **either** provider — you set one key, the server does the rest.
Nothing in the app itself changes.

### Option A — Google Gemini (FREE, no credit card) — recommended if payment is a problem

1. Go to **aistudio.google.com**, sign in with a normal Google account.
2. Click **Get API key → Create API key**. No credit card, no billing setup.
3. In Render → your service → **Environment**, add:
   - Key: `GEMINI_API_KEY`   Value: the key you just created.
   - (If an `ANTHROPIC_API_KEY` is already there, delete it, or add `PROVIDER` = `gemini`.)
4. Save. Render redeploys itself. Done — the conversation will work.

Free tier is roughly 1,500 requests/day, which is far more than enough for demos.
Limits and terms change — check Google's current pricing page.

**Important caveat:** on Google's *free* tier, prompts may be used to improve their
products. Fine for demonstrating with a fictional persona. **Never put real patient
data through the free tier** — for real fieldwork use a paid/enterprise tier with
data-processing terms, under your ethics approval.

### Option B — Anthropic Claude (pay-as-you-go)

Needs API credit on the account. Note a Claude **Pro subscription does NOT include
API credit** — they are separate products. Add credit at console.anthropic.com →
Billing, then set `ANTHROPIC_API_KEY` in Render.

Optional overrides: `PROVIDER` (`gemini` or `anthropic`), `GEMINI_MODEL`, `MODEL`.

---

## What you need first

1. An API key from whichever provider you picked above.
2. If you are on a **paid** provider, **set a monthly spending limit on the key
   before sharing the link publicly**. The app includes basic rate-limiting, but a
   spend cap is your real safety net. (Not needed on Gemini's free tier.)

---

## Easiest way to get a shareable link — Hugging Face (free)

1. Sign in at huggingface.co → **New → Space**.
2. Name it, pick a licence, set **Space SDK = Docker** (blank template), Create.
3. Open the **Files** tab → **Add file → Upload files**. Upload everything in this
   folder, keeping the structure: `server.js`, `package.json`, `Dockerfile`,
   `README.md`, and the `public/` folder (with `index.html` and
   `manifest.webmanifest` inside it).
4. Go to **Settings → Variables and secrets → New secret**:
   - Name: `GEMINI_API_KEY` (or `ANTHROPIC_API_KEY`) · Value: your key. Save.
     Use *secret*, not variable.
5. The Space builds automatically. When the status reads **Running**, the Space
   URL at the top is your shareable link — send it to your CMO or funder, or open
   it on your phone.

*(This README's top section is the Hugging Face Space config — leave it in place.)*

## Alternative — Render (free web service)

1. Put these files in a GitHub repo.
2. Render → **New → Web Service** → connect the repo.
3. It detects Node. Build command `npm install`, start command `node server.js`.
4. **Environment → Add** `ANTHROPIC_API_KEY` (and optionally `MODEL`).
5. Deploy → use the onrender.com URL it gives you.

## Run it on your own computer

```bash
npm install
export GEMINI_API_KEY=your-key        # Windows PowerShell: $env:GEMINI_API_KEY="your-key"
npm start
# open http://localhost:7860
```

---

## Notes

- **On a phone**, the app shows an *Add to Home Screen* prompt on the opening
  screen — Android offers a one-tap **Install**, iOS shows the Share → Add to
  Home Screen steps. It then opens full-screen with its own icon. Because it's a
  real page (not the in-chat preview), the microphone, print-to-PDF, and WhatsApp
  handoff all work.
- **Model**: defaults to `gemini-2.5-flash` when a Gemini key is set, otherwise
  `claude-sonnet-5`. Override with `GEMINI_MODEL` / `MODEL`. Model names, limits and
  pricing evolve — check the provider's current docs.
- **Health check**: visit `/healthz` on your deployed URL to confirm which provider
  and model the server is using and whether it can see your key.
- **Privacy**: the app stores nothing; responses live only in the browser tab
  until it's closed. The moment you add saving/logging, it becomes governed
  research (ethics approval, PDPA, secure storage) — build that under an approved
  protocol, not here.
- **Safety**: crisis resources shown in-app are Singapore-specific (SOS 1767,
  mindline.sg, IMH 6389 2222). Adjust if your audience is elsewhere.
