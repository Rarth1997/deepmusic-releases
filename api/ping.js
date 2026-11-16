// Censo de aparelhos: POST {id, v, n} grava/atualiza data/devices.json no repo.
// O aparelho manda uma vez por dia (throttle no app); entradas >90 dias caem.
const REPO = process.env.GITHUB_REPO || "Rarth1997/deepmusic-releases";
const FILE = "data/devices.json";
const BRANCH = "main";

function gh(path, options = {}) {
  const headers = {
    "User-Agent": "deepmusic-site",
    Accept: "application/vnd.github+json",
    ...options.headers,
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return fetch(`https://api.github.com/repos/${REPO}/${path}`, { ...options, headers });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method" });
    return;
  }
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  const id = String(body?.id || "").slice(0, 64);
  const code = Number(body?.v) || 0;
  const name = String(body?.n || "").slice(0, 32);
  if (!id || !code) {
    res.status(400).json({ error: "bad-body" });
    return;
  }
  try {
    let devices = {};
    let sha = null;
    const read = await gh(`contents/${FILE}?ref=${BRANCH}`);
    if (read.status === 200) {
      const json = await read.json();
      sha = json.sha;
      const content = Buffer.from(json.content, "base64").toString("utf8");
      try { devices = JSON.parse(content); } catch { devices = {}; }
    } else if (read.status !== 404) {
      res.status(502).json({ error: "read-failed", status: read.status });
      return;
    }
    devices[id] = { code, name, seen: Date.now() };
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    for (const [k, v] of Object.entries(devices)) {
      if (!v || (v.seen || 0) < cutoff) delete devices[k];
    }
    const put = await gh(`contents/${FILE}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "census: ping",
        content: Buffer.from(JSON.stringify({ updated: Date.now(), devices })).toString("base64"),
        branch: BRANCH,
        ...(sha ? { sha } : {}),
      }),
    });
    if (!put.ok) {
      res.status(502).json({ error: "write-failed", status: put.status });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "failed", message: String(error) });
  }
}
