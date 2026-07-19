// Backend for the AI-administered PHQ-9 prototype.
// Serves the responsive web app and proxies model calls so the API key stays
// on the server and never reaches the browser.
//
// Works with EITHER provider — whichever key you set:
//   GEMINI_API_KEY     -> Google Gemini (free tier, no credit card)
//   ANTHROPIC_API_KEY  -> Anthropic Claude (pay-as-you-go API credit)
// If both are set, Gemini is used unless PROVIDER=anthropic.
// The browser code is identical either way: this server always replies in the
// same shape, so nothing in public/index.html needs to change.

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 7860;

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const PROVIDER = (process.env.PROVIDER || (GEMINI_KEY ? "gemini" : "anthropic")).toLowerCase();
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const ANTHROPIC_MODEL = process.env.MODEL || "claude-sonnet-5";
const MAX_TOKENS = 1000;

app.use(express.json({ limit: "256kb" }));
app.use(express.static(path.join(__dirname, "public")));

// simple in-memory rate limiter (blunts casual abuse of a public demo)
const hits = new Map();
const WINDOW_MS = 5 * 60 * 1000, LIMIT = 80;
function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip) || { n: 0, t: now };
  if (now - rec.t > WINDOW_MS) { rec.n = 0; rec.t = now; }
  rec.n++; hits.set(ip, rec);
  return rec.n > LIMIT;
}

app.get("/healthz", (_req, res) => res.json({
  ok: true,
  provider: PROVIDER,
  model: PROVIDER === "gemini" ? GEMINI_MODEL : ANTHROPIC_MODEL,
  keyConfigured: PROVIDER === "gemini" ? !!GEMINI_KEY : !!ANTHROPIC_KEY,
}));

async function readJson(r) {
  const txt = await r.text();
  try { return JSON.parse(txt); }
  catch (_) { return { error: { message: (txt || "").slice(0, 200) || "Unreadable response from model service." } }; }
}

// --- Gemini: translate to/from its format, reply in the shape the app expects ---
async function callGemini(system, messages) {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/"
            + encodeURIComponent(GEMINI_MODEL) + ":generateContent";
  const body = {
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }],
    })),
    generationConfig: { maxOutputTokens: MAX_TOKENS, temperature: 0.4 },
  };
  if (system) body.system_instruction = { parts: [{ text: system }] };

  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": GEMINI_KEY },
    body: JSON.stringify(body),
  });
  const data = await readJson(r);
  if (!r.ok) {
    const msg = (data && data.error && data.error.message) || "Upstream model error.";
    return { ok: false, status: r.status, error: msg };
  }
  const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
  const text = parts.map((p) => p.text || "").join("");
  return { ok: true, payload: { content: [{ type: "text", text }] } };
}

async function callAnthropic(system, messages) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: MAX_TOKENS,
      system: typeof system === "string" ? system : undefined,
      messages,
    }),
  });
  const data = await readJson(r);
  if (!r.ok) {
    const msg = (data && data.error && data.error.message) || "Upstream model error.";
    return { ok: false, status: r.status, error: msg };
  }
  return { ok: true, payload: data };
}

app.post("/api/message", async (req, res) => {
  const usingGemini = PROVIDER === "gemini";
  if (usingGemini && !GEMINI_KEY) return res.status(500).json({ error: "Server is missing GEMINI_API_KEY." });
  if (!usingGemini && !ANTHROPIC_KEY) return res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY." });

  const fwd = req.headers["x-forwarded-for"];
  const ip = (fwd ? String(fwd).split(",")[0].trim() : "") || req.socket.remoteAddress || "unknown";
  if (rateLimited(ip)) return res.status(429).json({ error: "Too many requests — please slow down." });

  const { system, messages } = req.body || {};
  if (!Array.isArray(messages)) return res.status(400).json({ error: "messages must be an array." });

  try {
    const out = usingGemini ? await callGemini(system, messages) : await callAnthropic(system, messages);
    if (!out.ok) {
      console.error(PROVIDER + " error", out.status, out.error);
      return res.status(out.status).json({ error: out.error });
    }
    res.json(out.payload);
  } catch (e) {
    console.error("Proxy failure", e);
    res.status(502).json({ error: "Failed to reach the model service." });
  }
});

app.listen(PORT, () => console.log(
  `Listening on ${PORT} · provider ${PROVIDER} · model ${PROVIDER === "gemini" ? GEMINI_MODEL : ANTHROPIC_MODEL} · key ${(PROVIDER === "gemini" ? GEMINI_KEY : ANTHROPIC_KEY) ? "set" : "MISSING"}`
));
