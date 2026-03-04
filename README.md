# Stripo React Wrapper Example

React + TypeScript example of a reusable wrapper for Stripo editor.

Based on:
- [stripoinc/stripo-plugin-samples quick-start-guide](https://github.com/stripoinc/stripo-plugin-samples/blob/main/quick-start-guide/index.html)

## Included

- `src/components/StripoEditor.tsx`
  - wrapper over `window.UIEditor.initEditor(...)`
  - typed props/events
  - `forwardRef` API: `save`, `getTemplateData`, `compileEmail`, `undo`, `redo`, `isReady`
- `src/lib/stripoScriptLoader.ts` - Stripo script loader
- `src/lib/loadDemoTemplate.ts` - loads demo HTML/CSS template
- `src/App.tsx` - example host app + external toolbar

## Run

1. Install dependencies:
```bash
npm install
```

2. Create frontend env:
```bash
cp .env.example .env
```

3. Fill `.env`:
```bash
VITE_STRIPO_TOKEN_ENDPOINT=https://plugins.stripo.email/api/v1/auth
VITE_STRIPO_PLUGIN_ID=YOUR_PLUGIN_ID
VITE_STRIPO_SECRET_KEY=YOUR_SECRET_KEY
VITE_STRIPO_USER_ID=1
```

4. Start dev server:
```bash
npm run dev
```

## How to add credentials

Use your Stripo credentials in frontend env:
- `VITE_STRIPO_PLUGIN_ID`
- `VITE_STRIPO_SECRET_KEY`
- `VITE_STRIPO_USER_ID`
- `VITE_STRIPO_TOKEN_ENDPOINT=https://plugins.stripo.email/api/v1/auth`

## Scripts

- `npm run dev`
- `npm run lint`
- `npm run build`
- `npm run preview`

## Security

Keep `VITE_STRIPO_SECRET_KEY` private and do not commit real credentials to git.
