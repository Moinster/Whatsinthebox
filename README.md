# What's in the Box

A mobile-first app (iOS and Android) for keeping track of what is inside your storage boxes.

- Add a box with a name, a location, and an optional photo of the inside.
- List the items in it. Each item has a name, plus an optional description and photo.
- Saving a box generates a QR code. Print the label, stick it on the box, and scan it later to see the contents.
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

Store builds use [EAS](https://docs.expo.dev/eas/): `npx eas-cli@latest build`.

## Layout

| Path | What |
| --- | --- |
| `src/app/` | Screens (Expo Router): home, box list, box view, editor, scanner, backup |
| `src/lib/store.ts` | Box storage. The only module that touches persistence |
| `src/lib/photos.ts` | Taking, storing, and resolving photos |
| `src/lib/qr.ts` | QR code content and rendering |
| `src/lib/backup.ts` | Backup file export and restore |
| `src/components/ui.tsx` | Shared buttons, fields, cards |

A box's QR code encodes `whatsinthebox://box/<id>`, which is also a deep link: on a phone with the app installed, the
system camera opens the box directly.
