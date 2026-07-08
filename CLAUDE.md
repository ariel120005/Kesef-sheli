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
- No navigation library — screens are switched by plain state in `App.tsx` (an `overlayStack`
  array for the settings/profile/trips/etc. screens, so back navigates one level at a time), with
  a custom bottom tab bar (see below).
- CSV export (`src/csvExport.ts`): `expo-file-system` + `expo-sharing` on native (both
  precompiled into Expo Go, no dev build needed) to write a temp file and open the share sheet; a
  plain `Blob` + anchor-click download on web.
- Charts: `react-native-svg` for the category donut chart (works in Expo Go and on web via
  react-native-web, no custom native code). Map tab (web): `maplibre-gl` (vector-tile rendering,
  styled by MapTiler, needs a free MapTiler API key — see "MapTiler setup" below) plus Nominatim
  place search (`MapScreen.web.tsx`); `react-native-webview` with a static world embed on native
  for now (`MapScreen.tsx`) until a future development build moves native to `react-native-maps` +
  Google Maps — see "Notes for future work".

## MapTiler setup

The web Map tab renders with MapLibre GL JS using MapTiler-hosted vector styles, which needs a
free MapTiler API key (not required for any other part of the app):

1. Sign up (or log in) at [maptiler.com](https://www.maptiler.com/cloud/) — no credit card needed
   for the free tier (100,000 map loads/month, reset monthly).
2. Go to your [Account → Keys page](https://cloud.maptiler.com/account/keys/). MapTiler creates a
   "Default key" automatically — you can use that, or click **Create a key** to make a
   project-specific one (name it e.g. "kesef-sheli").
3. Copy the key.
4. Add it to your `.env` file (copy `.env.example` first if you haven't already):
   `EXPO_PUBLIC_MAPTILER_KEY=your_key_here`.
5. Restart `npm start` (or re-run the web export) so the new env var gets picked up — like the
   Firebase vars, it's inlined into the JS bundle at build time, so an already-running dev server
   or an already-exported `/docs` build won't pick up a key added afterwards.

If the key isn't set, the Map tab shows a "MapTiler לא מוגדר" message instead of crashing — same
pattern as `isFirebaseConfigured`. This is why the public GitHub Pages preview's Map tab shows that
message: no real key is committed there, same as Firebase.

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

- `users/{uid}` — document with `budget` (monthly budget), `savingsGoal` (monthly savings
  target), `defaultCurrency` (default selection for the currency picker — `'ILS'` or a
  `Currency` code), `monthStartDay` (1–28, which day of the month the budget period resets on —
  defaults to 1, i.e. the plain calendar month), `categoriesInitialized` (internal flag set
  once the default category set has been seeded — see `categories` subcollection below),
  `notificationSources` (array of `NotificationSource` — see "Bank-notification auto-detection"
  below), and `notificationSourcesInitialized` (same lazy-seeding pattern, for the one Bit
  preset) fields.
- `users/{uid}/expenses/{autoId}` — one document per expense (`amount`, `category`, `note`,
  `date`, optional `recurring`, optional `autoDetected`, optional `originalAmount`/
  `originalCurrency` when entered in a foreign currency — see "Foreign-currency entry" above).
  `amount` is always ILS. `category` is a free-text category name (see the קטגוריות screen under
  "App structure & navigation" below), not a fixed enum.
- `users/{uid}/categories/{autoId}` — one document per category (`name`, `color`) the user has
  added, renamed, or recolored. Seeded with the 8 defaults
  (`DEFAULT_CATEGORIES` in `src/constants.ts`) the first time a `categories` snapshot for that
  account comes back empty and `categoriesInitialized` isn't set yet, so deleting down to zero
  categories afterwards doesn't silently reseed them.
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
      match /categories/{categoryId} {
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
profile icon (rightmost) that opens the profile menu, a full screen (not a dropdown — see below).
The search icon next to it is a no-op placeholder shown **only on the מפה tab** (`TopBar`'s
`showSearch` prop) — it's the only tab with an actual search feature (its own always-visible
search bar built into the map itself, see below); בית and תובנות don't show it.

Settings, the profile menu, the account/sign-in screen, Trips, Savings Goal, and Categories are
**not** tabs — they're `OverlayScreen`s (`src/types.ts`) pushed onto a real navigation stack
(`overlayStack: OverlayScreen[]` in `App.tsx`, not just a single "current screen" — needed because
these can nest more than one level deep, e.g. profile menu → settings → categories) reached via
the profile icon (or, for Trips/Savings Goal, also directly via a shortcut card on the Insights
tab). Each screen's back button calls `popOverlay` (pop the stack one level), so it always returns
to wherever it was actually opened from — the profile menu if opened from there, or the tab
directly if opened via an Insights shortcut card. Switching bottom tabs clears the whole overlay
stack (`closeAllOverlays`).

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
  **MapLibre GL** map (vector tiles, styled by MapTiler, needs `EXPO_PUBLIC_MAPTILER_KEY` — see
  "MapTiler setup" above) with a Google-Maps-style **layer switcher** (floating button,
  bottom-right) between three MapTiler styles: satellite (`hybrid` — the default layer, which
  already bakes road/place labels onto the imagery, MapTiler's own "hybrid" style, so satellite
  view isn't just an unlabeled photo), streets (`streets-v2` light / `streets-v2-dark` dark,
  theme-matched and swapped live on toggle), and topographic (`topo-v2`). A **"locate me" button**
  next to the layer switcher re-centers the map on the device's live location on demand; the map
  also tries this once automatically on mount (falls back to a default Israel view if geolocation
  is denied or unavailable), dropping a turquoise "your location" dot either way. Demo expenses
  that have a `location` (lat/lng) show as pins — tapping one opens a popup with the expense's
  category/amount/note/date; pins are plain `maplibregl.Marker` DOM overlays, so they survive
  layer switches (`map.setStyle()`) without needing to be re-added. A permanent Google-Maps-style
  search bar floats over the top of the map (not a toggled icon) and calls Nominatim (OSM's free
  geocoding API, unrelated to MapTiler's own quota, debounced ~450ms) as you type, showing an
  autocomplete dropdown of matching places; picking one pans/zooms the map there and drops a
  marker. The top bar itself (profile + search icons) floats over the map here too — translucent
  dark background, white icons — instead of reserving its own row like on every other tab
  (`TopBar`'s `floating` prop), so the map truly fills the screen edge-to-edge. The native version
  (`src/screens/MapScreen.tsx`,
  `react-native-webview` with a static world embed) is a placeholder for now — see "Notes for
  future work" for the `react-native-maps` + Google Maps upgrade planned once there's a real
  development build to test
  it on. Picked via Metro's `.web.tsx` platform extension the same way `firebase.ts` /
  `firebase.web.ts` are.
- **פרופיל (Profile menu)** — `src/screens/ProfileMenuScreen.tsx`, opened as a full screen (not a
  dropdown) from the top bar's profile icon, listing rows: הגדרות, then התחברות/החשבון שלי (label
  flips once signed in), then טיולים and יעד חיסכון. The latter two are per-account features: in
  demo mode they're always shown (there's no sign-in concept there), but in real Firebase mode
  they're hidden from the menu until the user is actually signed in (the Insights-tab shortcut
  cards still work either way, just showing the same locked state as Home when signed out).
  - **הגדרות (Settings)** — `src/screens/SettingsScreen.tsx`. Always available: light/dark theme
    toggle. Per-account (same demo-mode-or-signed-in gating as above): מטבע ברירת מחדל (default
    currency — a `CurrencyPicker`, sets which currency the amount forms' currency toggle opens on
    by default; still ILS unless changed), יום תחילת חודש (which day of the month the budget
    period resets on — 1–28, defaults to 1 — see `getBudgetPeriod` in `src/utils.ts`), ניהול
    קטגוריות (opens the Categories screen, see below), ייצוא נתונים (CSV) (`src/csvExport.ts`
    builds the CSV — date/amount/category/note columns, UTF-8 BOM prefix so Hebrew renders
    correctly in Excel — then downloads it directly via a Blob on web, or writes it to a temp file
    and opens the native share sheet via `expo-file-system`/`expo-sharing` on native, both
    precompiled into Expo Go), בדיקת פענוח התראות (פיתוח) (opens the bank-notification
    parse-test dev screen, see below), אילו אפליקציות לעקוב אחריהן (opens the notification-source
    allowlist screen, see below), and איפוס נתונים
    (deletes all expenses/history only, not the budget/categories/settings — double-confirmed:
    a first dialog, then a second with the literal message "האם אתה בטוח? פעולה זו בלתי הפיכה", so
    it can't be tapped by accident). Only shown when actually signed in (real Firebase mode):
    התנתקות and מחיקת החשבון (deletes the entire `users/{uid}` doc + all subcollections — broader
    than "איפוס נתונים" above, which only clears expenses).
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
  - **קטגוריות (Categories)** — `src/screens/CategoriesScreen.tsx`, reached via Settings' "ניהול
    קטגוריות" row (not its own top-level menu item). Lists every category as a row (color dot,
    name, edit/delete icons) plus a "קטגoriה חדשה" row at the top. Add/edit go through the shared
    `CategoryFormModal.tsx` (name text field + a swatch grid of `CATEGORY_COLOR_SWATCHES` from
    `src/constants.ts` — no free-form color picker, to keep colors visually consistent). Deleting a
    category checks whether any expense currently uses its name; if so the delete is blocked with
    an inline banner instead of a confirm dialog (deleting an in-use category would silently orphan
    those expenses' category field), otherwise it goes through the normal `ConfirmDialog`.
  - **בדיקת פענוח (parse-test)** — `src/screens/ParseTestScreen.tsx`, a temporary dev-only screen
    reached via Settings, for calibrating `src/bankNotificationParser.ts` against real
    notification text before there's any native notification-reading permission at all (see "MVP
    scope" and "Notes for future work"). Always parses whatever is pasted, with no source-app
    filtering — it's a pure text-parsing test tool, deliberately separate from the (future) native
    listener's package-name allowlist below, since a manually-pasted test string has no "sending
    app" for that allowlist to apply to in the first place.
  - **אילו אפליקציות לעקוב אחריהן (notification sources)** — `src/screens/
    NotificationSourcesScreen.tsx`, the explicit per-app allowlist for the (future) notification
    listener (see "MVP scope" and "Notes for future work"). Every source — the one Bit preset, or
    any manually-added app — defaults to disabled; the screen's own text explains why (Android's
    listener permission is all-or-nothing, this allowlist is what narrows it down in practice).

Home, Insights, Settings, Categories, and the Savings Goal screen all need the same budget/
expenses/savings-goal/categories/default-currency/month-start-day/notification-sources numbers to
stay in sync in demo mode now that they're separate screens, so that demo state lives in one shared
`DemoBudgetDataProvider` (`src/hooks/useDemoBudgetData.tsx`, wrapping the whole app in `App.tsx`)
instead of being duplicated per screen — real Firebase mode doesn't need this since every screen's
Firestore hook (`useCategories`, `useAppSettings`, etc.) already reads/writes the same underlying
document/subcollection.

## Theming

`src/theme.tsx` provides `useTheme()` → `{ mode, colors, toggleTheme }`. `colors` merges
theme-invariant brand/accent colors (`BRAND` in `src/constants.ts` — purple/turquoise/etc., used
for gradients and status colors) with theme-dependent surface colors (`DARK_COLORS` /
`LIGHT_COLORS` — background, card, text, border...). Every component computes its
`StyleSheet` via a `getStyles(colors)` function called in the component body (not a
module-level constant), so it re-renders correctly on theme toggle.

## MVP scope

- Sign up / sign in with email + password; data is scoped to the signed-in account.
- Add an expense: amount, category, free-text note. Categories are user-managed (add/rename/
  recolor/delete via Settings → ניהול קטגוריות, see below), not a fixed list — a new account (or
  demo mode) is seeded with 8 defaults (`DEFAULT_CATEGORIES` in `src/constants.ts`).
- Quick-amount shortcuts: fixed ₪20/50/100/200 chips under the amount field on the add-expense
  form that fill it in one tap — a static list, not derived from usage.
- Foreign-currency entry: the add/edit forms for both regular expenses and trip transactions let
  you enter the amount in USD/EUR/THB/VND instead of ILS (useful mid-trip, so you can type the
  amount exactly as printed on a local receipt). The currency choice is a compact toggle
  (`CurrencyPicker.tsx`, shared by all four amount forms) showing just the selected currency
  (e.g. "₪") that opens a dropdown to switch, instead of showing every option openly — it starts
  on whichever currency is set as the account's default (Settings → מטבע ברירת מחדל, plain ILS
  unless changed). `src/currency.ts` converts entered amounts to ILS using a free, keyless
  daily-rate API (falls back to a fixed approximate rate if that fetch fails, e.g. offline). Both
  the original amount+currency and the converted ILS amount are stored (`originalAmount`/
  `originalCurrency` on `Expense`/`TripTransaction`) and shown side by side in the list —
  `amount` is always ILS so the rest of the app's math never needs to know about currencies.
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
  (`CategoryDonutChart.tsx`, on the Insights tab, colored by each category's own `color` field —
  `CATEGORY_COLOR_SWATCHES` in `src/constants.ts` is the picker's swatch list, derived from the
  app's own turquoise/purple/green/rose brand hues and validated CVD-safe against both theme
  surfaces, but a category can be recolored to any swatch so per-category color isn't guaranteed
  globally unique once customized).
- Recent expenses list, newest first, tap an expense to edit its amount/category/note/recurring
  flag, per-item delete (confirm before delete). Empty state shows a small floating-coins
  animation instead of plain text (`src/components/EmptyExpensesState.tsx`).
- Recurring expenses: marking an expense "הוצאה קבועה כל חודש" doesn't schedule anything
  server-side — instead, each time expenses are loaded, `src/recurring.ts` checks whether the
  latest instance of each distinct recurring "series" (matched by category+note+amount) is from
  a past calendar month, and if so auto-logs a fresh copy dated today. No cron job, no
  Cloud Function.
- "Current month" for the budget meter, category breakdown/donut, AI insights, and savings goal
  is the calendar month by default, but shifted to start on a custom day instead of the 1st if the
  account has set יום תחילת חודש (Settings) — e.g. day 10 so a payday-to-payday budget period lines
  up with when salary actually arrives. `getBudgetPeriod`/`isSameMonth` in `src/utils.ts` compute
  this; no month **picker** (browsing past months) exists in the MVP.
- Settings: light/dark mode toggle; per-account (demo mode, or signed-in real mode): default
  currency, month-start day, category management, CSV export, and a double-confirmed reset of all
  expenses/history (see "Profile menu" under "App structure & navigation" above for the full
  breakdown); signed-in-only: sign out, delete the whole account.
- Trip mode: create a trip with a name and its own budget (separate from the monthly budget).
  Inside a trip, log `expense` transactions as normal, `fee` transactions for cash-withdrawal
  fees (kept out of expense category totals), and `reimbursement` transactions for money
  received back (e.g. via Bit) — reimbursements offset net spend rather than counting as an
  expense. The trip screen shows gross spend, total reimbursed, net spend, and remaining budget.
- Bank-notification auto-detection basis: `src/bankNotificationParser.ts` has pure, dependency-free
  functions (`parseBankNotification`, `guessCategoryFromMerchant`) that parse Hebrew bank-app
  notification text into a charge (→ expense, category guessed from merchant) or a credit (→
  reimbursement, same concept as trip mode; Bit's "מחכים לך" pending-transfer wording counts as an
  immediate credit too, not just an already-confirmed "קיבלת"/"התקבל"). Notifications that glue
  Hebrew and Latin/digit text together with no space at all (seen on a real device — e.g. "בית
  עסקKING MEAT... בסך155.0 שח") are handled by inserting a space at every Hebrew↔Latin/digit
  script boundary before parsing. `guessCategoryFromMerchant` matches merchant-name keywords
  (Hebrew and English — e.g. `meat`/`food`/`wolt`) against a fixed default-category→keywords
  table, picking the *longest* matching keyword across all buckets (not the first bucket in list
  order) so a more specific compound name like "סופר פארם" isn't shadowed by a shorter generic
  keyword like "סופר", then maps that guess onto whichever of the account's actual (possibly
  renamed/custom) categories has that name. The exact wording Israeli bank/card apps use isn't
  documented publicly, so the patterns are a best-effort guess, tuned against real notification
  text pasted into **בדיקת פענוח** in Settings (`src/screens/ParseTestScreen.tsx`, a temporary
  dev-only screen) — paste real notification text and see exactly what gets extracted, to
  calibrate further against your own bank's real format. This screen intentionally has no
  source-app filtering (see below) — it's a pure parsing-logic test tool, unrelated to which
  apps are approved to send notifications, since a manually-pasted string has no "sending app" at
  all. This is parsing logic only — see "Notes for future work" for what's still needed to
  actually read notifications on-device.
- Bank-notification source allowlist: Android's `NotificationListenerService` permission is
  all-or-nothing at the OS level — once granted, the (future) native listener technically
  receives every notification posted on the device. **אילו אפליקציות לעקוב אחריהן** in Settings
  (`src/screens/NotificationSourcesScreen.tsx`) is the explicit, per-app allowlist that narrows
  that down: every source (a preset like Bit, or a manually-added `packageName` + display label)
  defaults to **disabled** — nothing is approved just because it's listed, the user must flip
  each switch on deliberately. `src/notificationFilter.ts`'s `isNotificationSourceApproved`
  (`packageName`, `enabledPackageNames[]` → `boolean`) is a single, trivial, side-effect-free
  check meant to be the *first* thing the native listener's `onNotificationPosted` calls, before
  any text extraction, storage, or logging — see "Notes for future work" for exactly where that
  hook goes once the native module exists. Only Bit's package name (`com.familypay.bit`) is
  preset, since a wrong guess at a bank app's package name would be a real access-control mistake
  (the user might trust a toggle that doesn't correspond to their actual bank app); every other
  app is added manually with its real package name (findable via the app's Play Store listing
  URL, which ends in `?id=<package name>`).
- Map tab (web): a real, fullscreen MapLibre GL map styled by MapTiler (needs a free API key —
  see "MapTiler setup") with a layer switcher (satellite default, plus streets and topographic), a "locate me" button,
  geolocation on load, a permanent Nominatim place-search bar (autocomplete, pans the map to the
  picked place with a pin), and pins for any expense with a `location`. Demo data has four
  expenses with real Tel-Aviv-area coordinates so pins show up out of the box. Native is a
  placeholder for now (see "Notes for future work").

## RTL approach

The UI must read right-to-left in Hebrew. Rather than relying on
`I18nManager.forceRTL` (which needs a full app reload/restart to take effect and is
finicky under Expo Go), every component is styled manually for RTL:
`textAlign: 'right'` on text, `flexDirection: 'row-reverse'` on rows that mix an
icon/button with a label. This keeps behavior predictable when testing live in Expo Go.

## Project structure

```
App.tsx                              ThemeProvider + AuthProvider + DemoBudgetDataProvider + tab/overlay-stack switching
src/types.ts                         Expense, Category, CategoryDef, TabKey, OverlayScreen, Trip, TripTransaction types
src/constants.ts                     DEFAULT_CATEGORIES, CATEGORY_COLOR_SWATCHES, BRAND/DARK_COLORS/LIGHT_COLORS, gradients
src/theme.tsx                        ThemeProvider/useTheme (dark/light, persisted)
src/firebaseConfig.ts                reads EXPO_PUBLIC_FIREBASE_* env vars
src/firebase.ts / firebase.web.ts    platform-specific Firebase app/auth/db init
src/maptilerConfig.ts                reads EXPO_PUBLIC_MAPTILER_KEY, isMapTilerConfigured flag
src/utils.ts                         currency formatting, getBudgetPeriod/isSameMonth (month-start-day aware)
src/currency.ts                      foreign-currency list, live-rate fetch (+ offline fallback), formatting
src/csvExport.ts                     builds + downloads/shares a CSV of all expenses
src/hooks/useAuth.tsx                AuthProvider/useAuth (sign up/in/out, current user)
src/hooks/useExpenses.ts             Firestore-backed expenses (onSnapshot, add, delete)
src/hooks/useBudget.ts               Firestore-backed monthly budget (onSnapshot, update)
src/hooks/useSavingsGoal.ts          Firestore-backed savings goal (onSnapshot, update)
src/hooks/useCategories.ts           Firestore-backed categories (onSnapshot, add/update/delete, lazy default-seeding)
src/hooks/useAppSettings.ts          Firestore-backed defaultCurrency + monthStartDay (onSnapshot, update)
src/hooks/useDemoBudgetData.tsx      DemoBudgetDataProvider/useDemoBudgetData — shared demo expenses/budget/goal/
                                      categories/defaultCurrency/monthStartDay state
src/hooks/useTrips.ts                Firestore-backed trips (onSnapshot, add, delete)
src/hooks/useTripTransactions.ts     Firestore-backed transactions for one trip (onSnapshot, add, update, delete)
src/insights.ts                      rule-based Hebrew insight generator (no LLM call), month-start-day aware
src/recurring.ts                     finds which recurring expenses need this month's copy
src/bankNotificationParser.ts        pure text parsing: bank notification → charge/credit, merchant → category
src/notificationFilter.ts            isNotificationSourceApproved gate + the one Bit preset source
src/hooks/useNotificationSources.ts  Firestore-backed approved-app allowlist (onSnapshot, toggle/add/remove, lazy seed)
src/demoData.ts                      sample expenses/budget/goal/trips/categories for demo mode
src/screens/HomeScreen.tsx           budget meter + add-expense form + category breakdown + expense list
src/screens/InsightsScreen.tsx       AI insights card + category donut chart + savings-goal/trips shortcut cards
src/screens/AuthScreen.tsx           sign-in / sign-up form (supports embedded mode, no standalone header)
src/screens/ProfileMenuScreen.tsx    full-screen profile menu (settings/account/trips/savings-goal rows; overlay screen)
src/screens/ProfileScreen.tsx        AuthScreen when signed out, account card when signed in (overlay screen)
src/screens/TripsScreen.tsx          trip list + trip detail (auth-gated, or demo mode; overlay screen)
src/screens/SavingsGoalScreen.tsx    full savings-goal card + edit modal (overlay screen)
src/screens/SettingsScreen.tsx       theme toggle, default currency, month-start day, categories nav, CSV export,
                                      reset data, bank-notification parse-test nav, notification-sources nav,
                                      sign out, delete account (overlay screen)
src/screens/CategoriesScreen.tsx     category list (color/name/edit/delete) + add row (overlay screen)
src/screens/ParseTestScreen.tsx      dev-only screen: paste bank notification text, see the parsed result
                                      (no source-app filtering — pure parsing test tool; overlay screen)
src/screens/NotificationSourcesScreen.tsx  per-app allowlist for the (future) notification listener — presets +
                                      manual add, everything off by default (overlay screen)
src/screens/MapScreen.tsx / .web.tsx world map: static react-native-webview embed (native) vs
                                      real MapLibre GL map + Nominatim place search + expense pins (web)
src/components/TopBar.tsx            profile icon (opens the profile menu screen) + search icon (Map tab only)
src/components/BottomTabBar.tsx      fixed 3-tab bottom bar (תובנות / בית / מפה)
src/components/BudgetMeter.tsx       gradient progress bar + set-budget button
src/components/SavingsGoalCard.tsx   savings goal progress bar + set-goal button
src/components/AmountInputModal.tsx  generic modal to input/edit an amount (budget, savings goal, month-start day)
src/components/CurrencyPicker.tsx    compact currency toggle + dropdown, shared by all four amount forms/modals
src/components/AddExpenseForm.tsx    amount/currency/category/note/recurring inputs + add button
src/components/EditExpenseModal.tsx  edit an existing expense's amount/currency/category/note/recurring
src/components/CategoryFormModal.tsx shared add/edit-category modal: name field + color swatch grid
src/components/EmptyExpensesState.tsx animated "no expenses yet" illustration
src/components/AIInsightsCard.tsx    renders the generated insight strings
src/components/CategoryBreakdown.tsx per-category totals for the current month (list form)
src/components/CategoryDonutChart.tsx per-category totals for the current month (donut chart + legend)
src/components/ExpenseList.tsx       recent expenses, tap to edit, delete button
src/components/ConfirmDialog.tsx     custom confirm modal (Alert.alert is a no-op on web)
src/components/CreateTripModal.tsx   trip creation form (name + budget)
src/components/TripCard.tsx          trip list-item summary (gross/net/budget bar)
src/components/TripStatsCard.tsx     trip detail stats (gross, reimbursed, net, budget, remaining)
src/components/AddTripTransactionForm.tsx  type chips (הוצאה/החזר/עמלה) + amount/currency/note + add
src/components/TripTransactionList.tsx     trip transactions list, tap to edit, delete button
src/components/EditTripTransactionModal.tsx edit an existing trip transaction's type/amount/currency/note
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
  `MapScreen.web.tsx` already does with MapLibre GL. `react-native-maps` needs a Google Maps API key and
  (like the bank-notification listener) isn't in Expo Go's precompiled module set, so this also
  waits on an EAS development build to actually test on a device.
- **Bank-notification auto-detection, native wiring (Android only).** The text-parsing basis
  (`src/bankNotificationParser.ts`) and the source allowlist (`src/notificationFilter.ts`,
  `src/screens/NotificationSourcesScreen.tsx`) are done and testable today (the `src/screens/
  ParseTestScreen.tsx` dev screen simulates the whole pipeline), but reading real notifications
  requires native code this managed-workflow project doesn't have yet:
  1. `expo prebuild` (or an EAS config plugin) to generate the `android/` project, since a
     `NotificationListenerService` is native-only — Expo Go can't load it.
  2. A Kotlin/Java `NotificationListenerService` declared in `AndroidManifest.xml` with the
     `BIND_NOTIFICATION_LISTENER_SERVICE` permission. Android grants this permission for *all*
     notifications on the device — there's no OS-level way to scope it to specific apps — so
     `onNotificationPosted(sbn)` must call the JS-side `isNotificationSourceApproved(sbn.packageName,
     enabledPackageNames)` check (via the native module bridge in step 4) as the very first thing
     it does, before reading `sbn.notification.extras` or doing anything else with the
     notification, and return immediately if it's not approved. This is what makes the
     transparency statement in `NotificationSourcesScreen.tsx` accurate rather than aspirational:
     the filtering has to happen before any text ever leaves the OS notification object.
  3. The user must manually grant notification access in Android Settings → apps with notification
     access — this cannot be requested/auto-granted like a normal runtime permission.
  4. A native module (e.g. via `NativeEventEmitter`) bridging each captured notification's package
     name + text to JS. The JS-side handler checks `isNotificationSourceApproved` again (defense in
     depth, and to source the current `enabledPackageNames` from Firestore/demo state) before
     calling `parseBankNotification` and `guessCategoryFromMerchant` and writing an expense/
     reimbursement with `autoDetected: true`.
  5. Since Expo Go doesn't support custom native modules, building and testing this needs an
     EAS-built development client (`eas build --profile development`), not `npm start`.
