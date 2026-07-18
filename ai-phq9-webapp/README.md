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
**Anthropic API key stays on the server and never reaches the browser**.

---

## What you need first

1. An Anthropic API key — create one at console.anthropic.com → API keys.
2. **Set a monthly spending limit on that key before sharing the link publicly**
   (console → Limits). The app includes basic rate-limiting, but a spend cap is
   your real safety net.

---

## Easiest way to get a shareable link — Hugging Face (free)

1. Sign in at huggingface.co → **New → Space**.
2. Name it, pick a licence, set **Space SDK = Docker** (blank template), Create.
3. Open the **Files** tab → **Add file → Upload files**. Upload everything in this
   folder, keeping the structure: `server.js`, `package.json`, `Dockerfile`,
   `README.md`, and the `public/` folder (with `index.html` and
   `manifest.webmanifest` inside it).
4. Go to **Settings → Variables and secrets → New secret**:
   - Name: `ANTHROPIC_API_KEY`  · Value: your key. Save. (Use *secret*, not variable.)
   - Optional secret `MODEL` if you want a model other than the default.
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
export ANTHROPIC_API_KEY=sk-ant-...   # Windows PowerShell: $env:ANTHROPIC_API_KEY="sk-ant-..."
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
- **Model**: defaults to `claude-sonnet-5`; change with the `MODEL` env variable.
  Model names and pricing evolve — check current options at docs.claude.com.
- **Privacy**: the app stores nothing; responses live only in the browser tab
  until it's closed. The moment you add saving/logging, it becomes governed
  research (ethics approval, PDPA, secure storage) — build that under an approved
  protocol, not here.
- **Safety**: crisis resources shown in-app are Singapore-specific (SOS 1767,
  mindline.sg, IMH 6389 2222). Adjust if your audience is elsewhere.
