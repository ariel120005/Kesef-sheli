---
name: verify
description: How to actually run this Expo/React Native app in this container (no Android SDK/emulator here) to observe a change instead of just typechecking it.
---

# Verifying "כסף שלי" in this container

There is no Android SDK, no `adb`, no emulator here. The only way to drive the
real UI is Expo's **web** target, rendered through `react-native-web` (already
a dependency) and driven headlessly with Playwright (Chromium is preinstalled
at `/opt/pw-browsers/chromium`; the `playwright` npm package lives at
`/opt/node22/lib/node_modules/playwright`, not in this project's
`node_modules`, so `require` it by full path or run node from `/opt/node22`).

## Steps that work

1. Start the web bundler in the background:
   `CI=1 nohup npx expo start --web --port 8082 > /tmp/expo-web.log 2>&1 &`
2. Poll `curl -s -o /dev/null -w '%{http_code}' http://localhost:8082` until `200`.
3. Drive it with a small Playwright script (`chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })`),
   using `getByPlaceholder`/`getByText({ exact: true })` — Hebrew labels
   collide often (e.g. "הוספה" as both a section title and a button), so
   `exact: true` matters.
4. Kill the server when done: `pkill -f "expo start --web"`.

## Known gap: `Alert.alert` is a no-op on web

`react-native-web`'s `Alert` module (`node_modules/react-native-web/src/exports/Alert/index.js`)
is a stub — `static alert() {}`. It never shows a browser dialog and never
fires any callback. `ExpenseList.tsx`'s delete-confirmation flow uses
`Alert.alert(...)`, so **the delete confirmation cannot be exercised through
the web target** — clicking "מחק" does nothing observable there, which is a
tooling limitation, not evidence the feature is broken. On real Android/Expo
Go this is a fully native, well-trodden RN API and should work; if you need to
actually verify it in this container, either mock/replace `Alert` for the web
build only, or accept this as an untestable path here and call it out in the
report.

## Everything else worth checking

Budget-meter color thresholds (green/orange/red + overage text), category
breakdown sorting, invalid-amount rejection (`0`, negative, non-numeric), and
RTL layout all render correctly through this web path and are fully
observable via screenshots.
