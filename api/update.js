const REPO = process.env.GITHUB_REPO || "Rarth1997/deepmusic-releases";

// Lê a última Release do GitHub e devolve o update.json do app com o link
// do APK apontando para o asset (download direto, sem depender do PC).
export default async function handler(req, res) {
  const headers = {
    "User-Agent": "deepmusic-site",
    Accept: "application/vnd.github+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const releaseRes = await fetch(
      `https://api.github.com/repos/${REPO}/releases/latest`,
      { headers }
    );
    if (!releaseRes.ok) {
      res.status(502).json({ error: "release-unavailable", status: releaseRes.status });
      return;
    }
    const release = await releaseRes.json();

    const updateAsset = (release.assets || []).find((a) => a.name === "update.json");
    const apkAsset = (release.assets || []).find((a) => a.name.endsWith(".apk"));

    let update = null;
    if (updateAsset) {
      const assetRes = await fetch(updateAsset.browser_download_url, { headers });
      if (assetRes.ok) {
        update = await assetRes.json();
      }
    }

    if (!update) {
      update = {
        versionCode: 0,
        versionName: release.tag_name || "",
        apkUrl: apkAsset ? apkAsset.browser_download_url : "",
        sha256: "",
        size: apkAsset ? apkAsset.size : 0,
        builtAt: Date.parse(release.published_at || "") || Date.now(),
        notes: release.name || release.body || "",
      };
    } else if (apkAsset) {
      // O update.json local guarda o IP da LAN; o link público é o asset.
      update.apkUrl = apkAsset.browser_download_url;
    }

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");
    res.status(200).json(update);
  } catch (error) {
    res.status(500).json({ error: "fetch-failed", message: String(error) });
  }
}
