const REPO = process.env.GITHUB_REPO || "Rarth1997/deepmusic-releases";

// Estatísticas públicas: downloads por versão (contados pelo GitHub).
export default async function handler(req, res) {
  const headers = {
    "User-Agent": "deepmusic-site",
    Accept: "application/vnd.github+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO}/releases?per_page=20`,
      { headers }
    );
    if (!response.ok) {
      res.status(502).json({ error: "github-unavailable", status: response.status });
      return;
    }
    const releases = await response.json();

    const rows = releases
      .filter((release) => !release.draft)
      .map((release) => {
        const apk = (release.assets || []).find((a) => a.name.endsWith(".apk"));
        return {
          tag: release.tag_name,
          name: release.name || release.tag_name,
          publishedAt: release.published_at,
          downloads: apk ? apk.download_count : 0,
          size: apk ? apk.size : 0,
        };
      });

    const total = rows.reduce((sum, row) => sum + row.downloads, 0);
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");
    res.status(200).json({ total, releases: rows });
  } catch (error) {
    res.status(500).json({ error: "fetch-failed", message: String(error) });
  }
}
