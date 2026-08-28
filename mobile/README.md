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
hand**. After any backend change to a route, a DTO or a status code:

```bash
# with the API running on :5200 (see the repo README)
npm run api:gen
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
