@AGENTS.md

# כסף שלי — Expense & Budget Tracker

Android app built with React Native + Expo (managed workflow). Hebrew UI, RTL layout. Real user
accounts via Firebase Authentication; data lives in Firestore (per-user), not just on-device, so
it survives switching devices. A future goal (not implemented) is letting a partner share the
same account's data.

## Stack

- Expo SDK 57, React 19, React Native 0.86, TypeScript.
- Auth: Firebase Authentication (email/password) via the `firebase` JS SDK — **not**
  `@react-native-firebase`, since that requires a custom native build and won't run in Expo Go.
- Data: Cloud Firestore, scoped per-user under `users/{uid}`.
- Local-only state: theme preference (`src/theme.tsx`), persisted via AsyncStorage.
- No navigation library — screens are switched by plain state in `App.tsx`, with a custom
  bottom tab bar (see below).
- Charts: `react-native-svg` for the category donut chart (works in Expo Go and on web via
  react-native-web, no custom native code). Map tab: a real `leaflet` map (CARTO's free basemap
  tiles, no API key) plus Nominatim place search on web (`MapScreen.web.tsx`); `react-native-webview`
  with a static world embed on native for now (`MapScreen.tsx`) until a future development build
  moves native to `react-native-maps` + Google Maps — see "Notes for future work".

## Firebase setup

Firebase config comes from `EXPO_PUBLIC_FIREBASE_*` environment variables (see `.env.example`),
inlined at build time by Expo — copy `.env.example` to `.env` and fill in the values from the
Firebase Console (Project settings → General → your Web app's config). No values are hardcoded
in source, and `.env` is gitignored.

`src/firebase.ts` (native) vs `src/firebase.web.ts` (web) are separate because the Firebase Auth
SDK needs different persistence per platform: `initializeAuth` +
`getReactNativePersistence(AsyncStorage)` on native, plain `getAuth()` (browser
`localStorage`-backed) on web. Metro picks the right file automatically via the `.web.ts` platform
extension. If Firebase isn't configured (`isFirebaseConfigured` is false), `auth`/`db` stay `null`
and the UI shows a "Firebase לא מוגדר" message instead of crashing.

### Firestore data model

- `users/{uid}` — document with `budget` (monthly budget) and `savingsGoal` (monthly savings
  target) fields.
- `users/{uid}/expenses/{autoId}` — one document per expense (`amount`, `category`, `note`,
  `date`, optional `recurring`, optional `autoDetected`, optional `originalAmount`/
  `originalCurrency` when entered in a foreign currency — see "Foreign-currency entry" above).
  `amount` is always ILS.
- `users/{uid}/trips/{tripId}` — one document per trip (`name`, `budget`, `createdAt`), a budget
  kept separate from the monthly budget above.
- `users/{uid}/trips/{tripId}/transactions/{autoId}` — one document per trip transaction
  (`type`: `'expense' | 'reimbursement' | 'fee'`, `amount`, `note`, `date`, optional
  `autoDetected`, optional `originalAmount`/`originalCurrency`). `reimbursement` transactions
  (money received back, e.g. via Bit) offset net trip spending rather than counting as a
  separate expense; `fee` is its own type so cash-withdrawal fees don't pollute expense totals.

### Firestore security rules (set these in the Firebase Console)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /expenses/{expenseId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /trips/{tripId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        match /transactions/{transactionId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  }
}
```

## App structure & navigation

Three bottom tabs, bar always visible, RTL order (rightmost → leftmost): תובנות, בית, מפה.
`App.tsx` also renders a fixed top row (`src/components/TopBar.tsx`) above the tab content — a
profile icon (rightmost) that opens a dropdown menu, and a search icon next to it. The search icon
is a no-op placeholder (מפה has its own always-visible search bar built into the map itself — see
below). Settings, the account/sign-in screen, Trips, and the Savings Goal screen are **not** tabs
— they're `OverlayScreen`s (`src/types.ts`) reached only via
the profile dropdown menu (or, for Trips/Savings Goal, via a shortcut card on the Insights tab),
each with its own back button that returns to whichever tab was active. `App.tsx` holds
`activeTab` (the three bottom tabs) and `overlayScreen` (which of the four, or `null`) as
separate state — switching bottom tabs always clears any open overlay screen.

- **בית (Home)** — the expense tracker's core loop: budget meter (view/edit the monthly budget),
  add-expense form, category breakdown, and the recent-expenses list. Requires being signed in;
  shows a locked/empty state otherwise. When Firebase isn't configured at all (e.g. the public
  GitHub Pages preview), it instead shows a fully interactive **demo mode** (`src/demoData.ts`)
  with sample data, and a "מצב הדגמה" badge makes that clear.
- **תובנות (Insights)** — top to bottom: a donut chart of this month's spending by category
  (`CategoryDonutChart.tsx`, `react-native-svg`) with a percentage legend, then the AI insights
  card (short rule-based Hebrew observations), then two small shortcut cards ("יעד חיסכון" and
  "טיולים") that each open their respective `OverlayScreen` on tap. Same demo-mode data as Home —
  see `src/hooks/useDemoBudgetData.tsx` below.
- **מפה (Map)** — on web (`src/screens/MapScreen.web.tsx`), a real, fullscreen interactive
  `leaflet` map with a Google-Maps-style **layer switcher** (floating button, bottom-right) between
  three free, keyless tile sources: satellite (Esri World Imagery — the default layer), streets
  (CARTO Voyager/Dark Matter, theme-matched and swapped live on toggle), and topographic
  (OpenTopoMap). Switching layers cross-fades the new tiles in before removing the old layer
  (waits for the new layer's `load` event), instead of a hard cut. A **"locate me" button** next to
  the layer switcher re-centers the map on the device's live location on demand; the map also tries
  this once automatically on mount (falls back to a default Israel view if geolocation is denied or
  unavailable), dropping a turquoise "your location" dot either way. Demo expenses that have a
  `location` (lat/lng) show as pins — tapping one opens a popup with the expense's
  category/amount/note/date. A permanent Google-Maps-style search bar floats over the top of the
  map (not a toggled icon) and calls Nominatim (OSM's free geocoding API, debounced ~450ms) as you
  type, showing an autocomplete dropdown of matching places; picking one pans/zooms the map there
  and drops a marker. The native version (`src/screens/MapScreen.tsx`, `react-native-webview` with
  a static world embed) is a placeholder for now — see "Notes for future work" for the
  `react-native-maps` + Google Maps upgrade planned once there's a real development build to test
  it on. Picked via Metro's `.web.tsx` platform extension the same way `firebase.ts` /
  `firebase.web.ts` are.
- **Profile dropdown menu** (opened from the top bar's profile icon) — rows: הגדרות, then
  התחברות/החשבון שלי (label flips once signed in), then טיולים and יעד חיסכון. The latter two are
  per-account features: in demo mode they're always shown (there's no sign-in concept there), but
  in real Firebase mode they're hidden from the menu until the user is actually signed in (the
  Insights-tab shortcut cards still work either way, just showing the same locked state as Home
  when signed out).
  - **הגדרות (Settings)** — light/dark theme toggle (always available), plus sign-out and
    delete-all-data (only shown when signed in).
  - **התחברות / החשבון שלי (Profile)** — shows the email/password sign-in-or-sign-up form
    (`src/screens/AuthScreen.tsx`, rendered `embedded` to skip its standalone header) when signed
    out, or a simple account card (email) when signed in.
  - **טיולים (Trips)** — trip mode (`src/screens/TripsScreen.tsx`): a list of trips (each with
    its own budget, separate from the monthly budget) and a detail view per trip showing gross
    spend, total reimbursed, net spend, and budget remaining (`TripStatsCard.tsx`), plus a form to
    add expense/reimbursement/fee transactions and a list to edit/delete them. Same auth-gated /
    demo-mode split as Home, with its own local-state mirror hook when Firebase isn't configured.
  - **יעד חיסכון (Savings Goal)** — `src/screens/SavingsGoalScreen.tsx`, the full `SavingsGoalCard`
    (moved out of Home) plus its edit modal.

Home, Insights, and the Savings Goal screen all need the same budget/expenses/savings-goal
numbers to stay in sync in demo mode now that they're separate screens, so that demo state lives
in one shared `DemoBudgetDataProvider` (`src/hooks/useDemoBudgetData.tsx`, wrapping the whole app
in `App.tsx`) instead of being duplicated per screen — real Firebase mode doesn't need this since
every screen's Firestore hook already reads/writes the same underlying document.

## Theming

`src/theme.tsx` provides `useTheme()` → `{ mode, colors, toggleTheme }`. `colors` merges
theme-invariant brand/accent colors (`BRAND` in `src/constants.ts` — purple/turquoise/etc., used
for gradients and status colors) with theme-dependent surface colors (`DARK_COLORS` /
`LIGHT_COLORS` — background, card, text, border...). Every component computes its
`StyleSheet` via a `getStyles(colors)` function called in the component body (not a
module-level constant), so it re-renders correctly on theme toggle.

## MVP scope

- Sign up / sign in with email + password; data is scoped to the signed-in account.
- Add an expense: amount, category (fixed Hebrew list), free-text note.
- Quick-amount shortcuts: fixed ₪20/50/100/200 chips under the amount field on the add-expense
  form that fill it in one tap — a static list, not derived from usage.
- Foreign-currency entry: the add/edit forms for both regular expenses and trip transactions let
  you enter the amount in USD/EUR/THB/VND instead of ILS (useful mid-trip, so you can type the
  amount exactly as printed on a local receipt). `src/currency.ts` converts it to ILS using a
  free, keyless daily-rate API (falls back to a fixed approximate rate if that fetch fails, e.g.
  offline). Both the original amount+currency and the converted ILS amount are stored
  (`originalAmount`/`originalCurrency` on `Expense`/`TripTransaction`) and shown side by side in
  the list — `amount` is always ILS so the rest of the app's math never needs to know about
  currencies.
- Set a monthly budget.
- Visual budget meter: gradient bar fills with % of budget spent, the gradient itself
  changes (green → orange → red) as it approaches/exceeds the budget.
- Savings goal: a separate target + progress meter, where "saved so far" is derived as
  `max(budget - spentThisMonth, 0)` — the app has no separate income/deposit tracking, so
  savings is just unspent budget. Shows "היעד הושג" once saved ≥ goal.
- AI insights card: a handful of Hebrew, rule-based observations (month-over-month category
  change, top category this week/month, budget pace) computed locally in `src/insights.ts` —
  **not** a live LLM call. A real Claude API integration was considered but rejected for now
  since it would need a server-side proxy (e.g. a Firebase Cloud Function) to keep the API key
  off the client; the local heuristics were chosen as the no-cost, no-backend option.
- Breakdown of the current month's spending by category, both as a list
  (`CategoryBreakdown.tsx`, on Home) and as a donut chart with a percentage legend
  (`CategoryDonutChart.tsx`, on the Insights tab). Category colors (`CATEGORY_COLORS` in
  `src/constants.ts`) are a fixed-order categorical palette derived from the app's own
  turquoise/purple/green/rose brand hues, validated CVD-safe against both theme surfaces.
- Recent expenses list, newest first, tap an expense to edit its amount/category/note/recurring
  flag, per-item delete (confirm before delete). Empty state shows a small floating-coins
  animation instead of plain text (`src/components/EmptyExpensesState.tsx`).
- Recurring expenses: marking an expense "הוצאה קבועה כל חודש" doesn't schedule anything
  server-side — instead, each time expenses are loaded, `src/recurring.ts` checks whether the
  latest instance of each distinct recurring "series" (matched by category+note+amount) is from
  a past calendar month, and if so auto-logs a fresh copy dated today. No cron job, no
  Cloud Function.
- "Current month" is always the real calendar month (no month picker in the MVP).
- Settings: light/dark mode toggle, sign out, delete all data (with confirmation).
- Trip mode: create a trip with a name and its own budget (separate from the monthly budget).
  Inside a trip, log `expense` transactions as normal, `fee` transactions for cash-withdrawal
  fees (kept out of expense category totals), and `reimbursement` transactions for money
  received back (e.g. via Bit) — reimbursements offset net spend rather than counting as an
  expense. The trip screen shows gross spend, total reimbursed, net spend, and remaining budget.
- Bank-notification auto-detection basis: `src/bankNotificationParser.ts` has pure, dependency-free
  functions (`parseBankNotification`, `guessCategoryFromMerchant`) that parse Hebrew bank-app
  notification text into a charge (→ expense, category guessed from merchant) or a credit (→
  reimbursement, same concept as trip mode). This is parsing logic only — see "Notes for future
  work" for what's still needed to actually read notifications on-device.
- Map tab (web): a real, fullscreen Leaflet map with a layer switcher (satellite default, plus
  streets and topographic — all free, keyless tile sources), a "locate me" button, geolocation on
  load, a permanent Nominatim place-search bar (autocomplete, pans the map to the picked place with
  a pin), and pins for any expense with a `location`. Demo data has four expenses with real
  Tel-Aviv-area coordinates so pins show up out of the box. Native is a placeholder for now (see
  "Notes for future work").

## RTL approach

The UI must read right-to-left in Hebrew. Rather than relying on
`I18nManager.forceRTL` (which needs a full app reload/restart to take effect and is
finicky under Expo Go), every component is styled manually for RTL:
`textAlign: 'right'` on text, `flexDirection: 'row-reverse'` on rows that mix an
icon/button with a label. This keeps behavior predictable when testing live in Expo Go.

## Project structure

```
App.tsx                              ThemeProvider + AuthProvider + DemoBudgetDataProvider + tab/overlay switching
src/types.ts                         Expense, Category, TabKey, OverlayScreen, Trip, TripTransaction types
src/constants.ts                     category list, BRAND/DARK_COLORS/LIGHT_COLORS, gradients, CATEGORY_COLORS
src/theme.tsx                        ThemeProvider/useTheme (dark/light, persisted)
src/firebaseConfig.ts                reads EXPO_PUBLIC_FIREBASE_* env vars
src/firebase.ts / firebase.web.ts    platform-specific Firebase app/auth/db init
src/utils.ts                         currency formatting, month-matching helpers
src/currency.ts                      foreign-currency list, live-rate fetch (+ offline fallback), formatting
src/hooks/useAuth.tsx                AuthProvider/useAuth (sign up/in/out, current user)
src/hooks/useExpenses.ts             Firestore-backed expenses (onSnapshot, add, delete)
src/hooks/useBudget.ts               Firestore-backed monthly budget (onSnapshot, update)
src/hooks/useSavingsGoal.ts          Firestore-backed savings goal (onSnapshot, update)
src/hooks/useDemoBudgetData.tsx      DemoBudgetDataProvider/useDemoBudgetData — shared demo expenses/budget/goal state
src/hooks/useTrips.ts                Firestore-backed trips (onSnapshot, add, delete)
src/hooks/useTripTransactions.ts     Firestore-backed transactions for one trip (onSnapshot, add, update, delete)
src/insights.ts                      rule-based Hebrew insight generator (no LLM call)
src/recurring.ts                     finds which recurring expenses need this month's copy
src/bankNotificationParser.ts        pure text parsing: bank notification → charge/credit, merchant → category
src/demoData.ts                      sample expenses/budget/goal/trips for demo mode
src/screens/HomeScreen.tsx           budget meter + add-expense form + category breakdown + expense list
src/screens/InsightsScreen.tsx       AI insights card + category donut chart + savings-goal/trips shortcut cards
src/screens/AuthScreen.tsx           sign-in / sign-up form (supports embedded mode, no standalone header)
src/screens/ProfileScreen.tsx        AuthScreen when signed out, account card when signed in (overlay screen)
src/screens/TripsScreen.tsx          trip list + trip detail (auth-gated, or demo mode; overlay screen)
src/screens/SavingsGoalScreen.tsx    full savings-goal card + edit modal (overlay screen)
src/screens/SettingsScreen.tsx       theme toggle, sign out, delete all data (overlay screen)
src/screens/MapScreen.tsx / .web.tsx world map: static react-native-webview embed (native) vs
                                      real leaflet map + Nominatim place search + expense pins (web)
src/components/TopBar.tsx            profile icon (+ dropdown menu) and search icon, shown above the tab content
src/components/BottomTabBar.tsx      fixed 3-tab bottom bar (תובנות / בית / מפה)
src/components/BudgetMeter.tsx       gradient progress bar + set-budget button
src/components/SavingsGoalCard.tsx   savings goal progress bar + set-goal button
src/components/AmountInputModal.tsx  generic modal to input/edit an amount (budget, savings goal)
src/components/AddExpenseForm.tsx    amount/category/note/recurring inputs + add button
src/components/EditExpenseModal.tsx  edit an existing expense's amount/category/note/recurring
src/components/EmptyExpensesState.tsx animated "no expenses yet" illustration
src/components/AIInsightsCard.tsx    renders the generated insight strings
src/components/CategoryBreakdown.tsx per-category totals for the current month (list form)
src/components/CategoryDonutChart.tsx per-category totals for the current month (donut chart + legend)
src/components/ExpenseList.tsx       recent expenses, tap to edit, delete button
src/components/ConfirmDialog.tsx     custom confirm modal (Alert.alert is a no-op on web)
src/components/CreateTripModal.tsx   trip creation form (name + budget)
src/components/TripCard.tsx          trip list-item summary (gross/net/budget bar)
src/components/TripStatsCard.tsx     trip detail stats (gross, reimbursed, net, budget, remaining)
src/components/AddTripTransactionForm.tsx  type chips (הוצאה/החזר/עמלה) + amount/note + add
src/components/TripTransactionList.tsx     trip transactions list, tap to edit, delete button
src/components/EditTripTransactionModal.tsx edit an existing trip transaction's type/amount/note
```

## Commands

- `npm install` — install dependencies.
- Copy `.env.example` to `.env` and fill in your Firebase web app config first.
- `npm start` — start the Expo dev server (then scan the QR code with Expo Go).
- `npm run android` — start and try to open in a connected/emulated Android device.

## Notes for future work (post-MVP, not implemented)

- Sharing one account's data with a partner (e.g. a shared household doc instead of per-uid).
- Upgrading the AI insights from local heuristics to a real Claude API call, via a Firebase Cloud
  Function (Blaze plan) that holds the Anthropic API key server-side.
- Month picker / history across months.
- Multiple budgets per category.
- Password reset / email verification.
- **Map tab, native (Android).** `MapScreen.tsx` is currently just a static world embed via
  `react-native-webview` — the plan is to switch to `react-native-maps` with the Google Maps
  provider for a real interactive native map (pinch-zoom, native place search, etc.), matching what
  `MapScreen.web.tsx` already does with Leaflet. `react-native-maps` needs a Google Maps API key and
  (like the bank-notification listener) isn't in Expo Go's precompiled module set, so this also
  waits on an EAS development build to actually test on a device.
- **Bank-notification auto-detection, native wiring (Android only).** The text-parsing basis
  (`src/bankNotificationParser.ts`) is done and unit-testable today, but reading real notifications
  requires native code this managed-workflow project doesn't have yet:
  1. `expo prebuild` (or an EAS config plugin) to generate the `android/` project, since a
     `NotificationListenerService` is native-only — Expo Go can't load it.
  2. A Kotlin/Java `NotificationListenerService` declared in `AndroidManifest.xml` with the
     `BIND_NOTIFICATION_LISTENER_SERVICE` permission, filtering to the banking app's package name.
  3. The user must manually grant notification access in Android Settings → apps with notification
     access — this cannot be requested/auto-granted like a normal runtime permission.
  4. A native module (e.g. via `NativeEventEmitter`) bridging each captured notification's text to
     JS, which then calls `parseBankNotification` and `guessCategoryFromMerchant` and writes an
     expense/reimbursement with `autoDetected: true`.
  5. Since Expo Go doesn't support custom native modules, building and testing this needs an
     EAS-built development client (`eas build --profile development`), not `npm start`.
