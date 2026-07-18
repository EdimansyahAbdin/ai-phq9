// Tiny backend for the AI-administered PHQ-9 prototype.
// Serves the responsive web app and proxies model calls so the API key
// stays on the server and never reaches the browser.

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 7860;              // HF Spaces default; Render/Railway inject their own
const API_KEY = process.env.ANTHROPIC_API_KEY;      // set as a secret on your host
const MODEL = process.env.MODEL || "claude-sonnet-5";
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

app.get("/healthz", (_req, res) =>
  res.json({ ok: true, model: MODEL, keyConfigured: !!API_KEY }));

app.post("/api/message", async (req, res) => {
  if (!API_KEY) return res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY." });

  const fwd = req.headers["x-forwarded-for"];
  const ip = (fwd ? String(fwd).split(",")[0].trim() : "") || req.socket.remoteAddress || "unknown";
  if (rateLimited(ip)) return res.status(429).json({ error: "Too many requests — please slow down." });

  const { system, messages } = req.body || {};
  if (!Array.isArray(messages)) return res.status(400).json({ error: "messages must be an array." });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: typeof system === "string" ? system : undefined,
        messages,
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error("Anthropic error", r.status, JSON.stringify(data));
      return res.status(r.status).json({ error: (data && data.error && data.error.message) || "Upstream model error." });
    }
    res.json(data); // client reads data.content[] text blocks
  } catch (e) {
    console.error("Proxy failure", e);
    res.status(502).json({ error: "Failed to reach the model service." });
  }
});

app.listen(PORT, () => console.log(`Listening on ${PORT} · model ${MODEL} · key ${API_KEY ? "set" : "MISSING"}`));
