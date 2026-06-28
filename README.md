# 689 Cats Static PWA mit config.js

Diese Version hat keinen src-Ordner und keinen Build-Prozess.

## Dateien

- index.html
- config.js
- manifest.json
- README.md

## Was du ändern musst

In `config.js`:

```js
window.CATS_SUPABASE_URL = "https://DEIN-PROJEKT.supabase.co";
window.CATS_SUPABASE_ANON_KEY = "DEIN_ANON_PUBLIC_KEY";
```

ersetzen mit deinen echten Supabase-Daten.

## Upload auf GitHub mit iPhone

Alle vier Dateien direkt ins Hauptverzeichnis des Repositorys hochladen.

## Vercel

Framework Preset: Other  
Build Command: leer lassen oder `echo static`  
Output Directory: `.`  
Root Directory: `./`

Keine Environment Variables nötig.
