// Vercel serverless function: POST /api/generate
// Keeps the Anthropic API key on the server. The browser never sees it.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(500).json({ error: "Missing API key. Add ANTHROPIC_API_KEY in Vercel project settings." });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const { system, userMessage } = body || {};
  if (!system || !userMessage) {
    res.status(400).json({ error: "Missing prompt." });
    return;
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1200,
        system,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      res.status(502).json({ error: "The writer is unavailable right now." });
      return;
    }

    const script = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    res.status(200).json({ script });
  } catch {
    res.status(500).json({ error: "Could not reach the writer. Check the connection and try again." });
  }
}
