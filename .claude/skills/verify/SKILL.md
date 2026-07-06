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

## Resolved gap: `Alert.alert` used to be a no-op on web

`react-native-web`'s `Alert` module is a stub — it never shows a dialog or
fires a callback — so any confirm flow built on `Alert.alert(...)` was
silently untestable through this container's web-preview path. Fixed by
replacing every `Alert.alert` confirm (delete-expense, sign-out,
delete-all-data) with `src/components/ConfirmDialog.tsx`, a plain themed
`Modal` that works identically on native and web. Confirm flows are fully
exercisable through Playwright now — no more caveats needed in reports.

## Everything else worth checking

Budget-meter color thresholds (green/orange/red + overage text), category
breakdown sorting, invalid-amount rejection (`0`, negative, non-numeric), and
RTL layout all render correctly through this web path and are fully
observable via screenshots.
