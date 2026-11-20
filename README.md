# What's in the Box

A mobile-first app for keeping track of what is inside your storage boxes. It runs as an installable web app (PWA),
aimed at Android first, from the same codebase that can also build native iOS and Android apps.

- Add a box with a name, a location, and an optional photo of the inside.
- List the items in it. Each item has a name, plus an optional description and photo.
- Saving a box generates a QR code and a short code such as `K7M-4QP`. Print the label, stick it on the box, and
  later scan it or type the code to see the contents.
- Search across box names, locations, items, and codes.
- Print one label, or pick several (or all) and print them on shared sheets in three sizes to save paper.
- Everything is editable. "Empty box" clears the items but keeps the box and its QR code, so a labelled box can be reused.
- Data lives on the device. Backup & restore writes all boxes and photos to a single file.

## Two ways to use it

The same code builds both. Pick either; they don't depend on each other.

| | Web app (PWA) | Native app |
| --- | --- | --- |
| Get it | Open https://moinster.github.io/Whatsinthebox/ and choose "Add to Home screen" | Build it from this repo (below) |
| Needs | A browser. Best on Android Chrome | Node.js, plus an Expo account or Android Studio / Xcode |
| Data | Stored in the browser on that device | Stored in the app on that device |

Each install keeps its own data. To move boxes between them, use Backup & restore: a backup file made by one can be
restored in the other.

## Set up

Needs [Node.js](https://nodejs.org) 20 or newer.

```bash
git clone https://github.com/Moinster/Whatsinthebox.git
cd Whatsinthebox
npm install
```

## Native app

**Try it without building** — install [Expo Go](https://expo.dev/go) on the phone, then:

```bash
npx expo start
```

Scan the QR code in the terminal with Expo Go (Android) or the Camera app (iOS). The phone and computer must be on
the same network.

**Build an installable Android app (APK) in the cloud** — needs a free [Expo](https://expo.dev) account, no Android
Studio:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

The first build asks to create the project under your Expo account. The `preview` profile in `eas.json` is set to
produce an APK, which installs directly on a phone (the `production` profile produces a store bundle instead).

When it finishes, EAS gives a link to download the APK onto the phone. Use `--platform ios` for iPhone, which also
needs a paid Apple Developer account.

**Build on your own machine** — needs Android Studio (Android) or a Mac with Xcode (iOS):

```bash
npx expo run:android
npx expo run:ios
```

If you publish your own build, change `ios.bundleIdentifier` and `android.package` in `app.json` to your own.

## Web app (PWA)

```bash
npx expo start --web   # run in a browser while developing
npm run build:web      # build the installable, offline-capable site into dist/
```

`dist/` is a plain static site. Pushing to `main` deploys it to GitHub Pages through
`.github/workflows/deploy-pages.yml` (repository Settings → Pages → Source must be "GitHub Actions").

The site is served from `/Whatsinthebox`. That path is `experiments.baseUrl` in `app.json`: a fork under another
repository name must change it to match, and hosting at a domain root means removing it.

## Checks

```bash
npm run typecheck
npm run lint
```

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

## QR codes

The web app's QR codes are web links (`<site address>/?box=<code>`), so any phone camera opens the box in the web
app. The native app's QR codes use the app's own link (`whatsinthebox://?box=<code>`), so the camera opens the
installed app; set `EXPO_PUBLIC_WEB_URL` at build time to make it print web links instead.

Inside either app, the scanner and the code box accept both kinds of label, and the short code printed under the QR
(for example `K7M-4QP`) always works.
