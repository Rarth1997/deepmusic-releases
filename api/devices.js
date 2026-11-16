// Painel admin: GET ?key=ADMIN_KEY devolve {total, devices:[{id, code, name, seen}]}.
const REPO = process.env.GITHUB_REPO || "Rarth1997/deepmusic-releases";
const FILE = "data/devices.json";
const BRANCH = "main";

export default async function handler(req, res) {
  const ADMIN_KEY = process.env.ADMIN_KEY || "dmk-9f2c61a8";
  if ((req.query.key || "") !== ADMIN_KEY) {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  try {
    const read = await fetch(
      `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${FILE}`,
      { headers: { "User-Agent": "deepmusic-site" } }
    );
    if (!read.ok) {
      res.status(200).json({ total: 0, devices: [] });
      return;
    }
    const json = await read.json();
    const devices = Object.entries(json.devices || {})
      .map(([id, v]) => ({ id, code: v.code || 0, name: v.name || "", seen: v.seen || 0 }))
      .sort((a, b) => b.seen - a.seen);
    res.status(200).json({ total: devices.length, devices });
  } catch (error) {
    res.status(500).json({ error: "failed", message: String(error) });
  }
}
