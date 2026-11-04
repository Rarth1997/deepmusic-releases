# DeepMusic — Releases e site

- **Página de download:** https://deepmusic-rarths-projects.vercel.app
- **update.json do app:** https://deepmusic-rarths-projects.vercel.app/api/update
- **APKs:** aba *Releases* deste repositório

## Estrutura
- `index.html` — página de download (Vercel)
- `api/update.js` — lê a última Release e devolve o JSON do app
- `package.json` / `vercel.json` — configuração do projeto

## Publicar
O script `tools/release-apk.sh` do projeto DeepMusic cria a Release
(`vX.Y.Z`) com o APK + `update.json`; o site passa a servir a nova versão
automaticamente (cache de 5 minutos).
