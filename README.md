# What's in the Box

A mobile-first app for keeping track of what is inside your storage boxes. It runs as an installable web app (PWA),
aimed at Android first, from the same codebase that can also build native iOS and Android apps.

- Add a box with a name, a location, and an optional photo of the inside.
- List the items in it. Each item has a name, plus an optional description and photo.
- Saving a box generates a QR code and a short code such as `K7M-4QP`. Print the label, stick it on the box, and
  later scan it or type the code to see the contents.
- Search across box names, locations, and items.
- Everything is editable. "Empty box" clears the items but keeps the box and its QR code, so a labelled box can be reused.
- Data lives on the device. Backup & restore writes all boxes and photos to a single file.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code in the terminal with Expo Go (Android) or the Camera app (iOS), or press `w` for the web preview.

```bash
npm run typecheck   # TypeScript check
```

## Web app (PWA)

```bash
npm run build:web   # builds the installable, offline-capable site into dist/
```

Pushing to `main` deploys `dist/` to GitHub Pages through `.github/workflows/deploy-pages.yml`
(repository Settings → Pages → Source must be set to "GitHub Actions"). The site is served from
`/Whatsinthebox`; that path is `experiments.baseUrl` in `app.json` and must change if the app moves to a domain root.

Native store builds use [EAS](https://docs.expo.dev/eas/): `npx eas-cli@latest build`.

## Layout

| Path | What |
| --- | --- |
| `src/app/` | Screens (Expo Router): home, box list, box view, editor, scanner, backup |
| `src/lib/store.ts` | Box storage. The only module that touches persistence |
| `src/lib/photos.ts`, `photos.web.ts` | Taking, storing, and resolving photos (files on native, IndexedDB on web) |
| `src/lib/qr.ts` | Box codes, QR link format, and QR rendering |
| `src/components/Scanner.tsx`, `Scanner.web.tsx` | Camera QR scanner |
| `scripts/build-web.mjs` | PWA build: manifest link, service worker, 404 fallback |
| `src/lib/backup.ts` | Backup file export and restore |
| `src/components/ui.tsx` | Shared buttons, fields, cards |

A box's QR code encodes `<app address>/?box=<code>`, so any phone camera can open it. The in-app scanner and the
code box accept a link from any address, so labels keep working inside the app if the hosting address changes.
