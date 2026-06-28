# 689 Cats No-src PWA

Diese Version hat keinen src-Ordner und kein Build-System.

Lade nur diese drei Dateien ins Hauptverzeichnis des Repositorys:

- index.html
- manifest.json
- README.md

Wichtig: In `index.html` müssen diese Platzhalter ersetzt werden:

- %%VITE_SUPABASE_URL%%
- %%VITE_SUPABASE_ANON_KEY%%

Vercel:
- Framework Preset: Other
- Root Directory: ./
- Build Command leer lassen oder `echo static`
- Output Directory leer lassen oder `.`
