# LocalBuddy mobile

Expo (dev build) client for the LocalBuddy API. See
[ADR-0009](../docs/adr/0009-frontend-expo-generated-client.md) for why it is shaped this way.

```bash
npm install
npm start                 # Expo dev server
npm run typecheck         # tsc --noEmit
```

## The API client is generated

`src/api/generated.ts` is produced from the backend's OpenAPI document and is **never edited by
hand**. The document is committed as `backend/openapi.v1.json`: after any backend change to a
route, a DTO or a status code, `dotnet test` rewrites it and fails once, so the diff gets read.
Then:

```bash
npm run api:gen           # reads ../backend/openapi.v1.json; the API does not need to be running
npm run typecheck         # a breaking change shows up here, not in a simulator
```

## Pointing the app at the API

The default is `http://localhost:5200`, which only works in a simulator on the same machine. On a
phone or an Android emulator, set the LAN address before starting:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.x:5200 npm start
```

## Layout

| Path | Holds |
|------|-------|
| `src/app/` | Routes. The folder *is* the navigation map; `(groups)` do not appear in the URL. |
| `src/components/` | Presentational only — props in, pixels out, no fetching. |
| `src/api/` | `generated.ts` (codegen), `client.ts` (bearer + errors), `hooks.ts` (queries + keys). |
| `src/lib/` | `auth.tsx`, the only global state. Everything else is server state or route state. |

Member photos must go through `<AuthedImage>`: `GET /api/v1/photos/{id}/content` filters on the
caller, so a bare URL 404s for any host who restricted visibility.

## Translations

Every word the app shows lives in `src/i18n/`: `en.ts` is the source, and `it.ts`, `es.ts` and
`fr.ts` are typed against it. Screens and components read them through `useStrings()`; the
language follows the phone unless the member picks one under Me > Language.

- **Adding a key:** add it to `en.ts` first, then run `npm run typecheck`. Every dictionary still
  missing it is listed as an error. Plurals and interpolation are functions, not templates.
- **Adding a language:** copy `en.ts` to `<code>.ts` (the ISO 639-1 code `expo-localization`
  reports), type it as `Strings`, translate it, and add it to `DICTIONARIES` and
  `LANGUAGE_NAMES` in `src/i18n/index.tsx`.
- **Server errors** are translated from their `code` under `errors`; a code not listed there
  shows the server's own English `detail`.
- Italian uses the informal "tu", Spanish "tú", French "vous". The Spanish and French
  dictionaries still need a review by a native speaker.
