@AGENTS.md

# הכסף של בוקי — Expense & Budget Tracker

Android app built with React Native + Expo (managed workflow). Hebrew UI, RTL layout. Real user
accounts via Firebase Authentication; data lives in Firestore (per-user), not just on-device, so
it survives switching devices. Trips can be shared with other accounts (join by code or QR — see
"Shared trips" in MVP scope); sharing the rest of one account's data (budget, regular expenses)
with a partner is still a future goal, not implemented.

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
- Shared trips (see "Shared trips" in MVP scope): `react-native-qrcode-svg` (built on
  `react-native-svg`, no native code — works on both native and web) renders a shared trip's join
  code as a QR image; `expo-camera`'s `CameraView` (precompiled into Expo Go, native only —
  `QRScannerModal.web.tsx` is the web fallback) scans one back on the joining side.

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
- `users/{uid}/trips/{tripId}` — one document per **personal** (unshared) trip (`name`, `budget`,
  `createdAt`, optional `endedAt`), a budget kept separate from the monthly budget above. `endedAt`
  is set once via "סיים טיול" (see the Trips bullet under "App structure & navigation" below) and
  never cleared afterwards — it's what makes a trip's summary (final gross/net/days/daily-average)
  permanently viewable and is also how the bank-notification auto-detection routing (see
  "Bank-notification auto-detection" in MVP scope below) decides whether a trip still counts as
  open. Once a trip is turned shared (see "Shared trips" below), its document (and transactions)
  move out of here into a top-level `sharedTrips/{tripId}` and this copy is deleted.
- `users/{uid}/trips/{tripId}/transactions/{autoId}` — one document per personal-trip transaction
  (`type`: `'expense' | 'reimbursement' | 'fee'`, `amount`, `note`, `date`, optional
  `autoDetected`, optional `originalAmount`/`originalCurrency`, optional `paidByUid`/
  `splitAmongUids` — always null here since a personal trip has no participants).
  `reimbursement` transactions (money received back, e.g. via Bit) offset net trip spending rather
  than counting as a separate expense; `fee` is its own type so cash-withdrawal fees don't
  pollute expense totals.
- `sharedTrips/{tripId}` — one document per **shared** trip (see "Shared trips" below), same shape
  as a personal trip plus `isShared: true`, `joinCode` (6 digits), `ownerUid` (who created it),
  `participants` (`TripParticipant[]`: `uid`/`displayName`/`joinedAt`), and `participantUids`
  (the same uids as a flat string array, purely so Firestore can query
  `where('participantUids', 'array-contains', uid)` — array fields of objects can't be queried
  into directly). Top-level, not nested under any single `users/{uid}`, since that's the only way
  a second account can ever see it — `useTrips.ts` merges this collection with the caller's own
  `users/{uid}/trips` into one flat `trips` list.
- `sharedTrips/{tripId}/transactions/{autoId}` — same shape as a personal trip's transactions,
  plus real `paidByUid`/`splitAmongUids` on any expense logged "for everyone" (see "Shared trips").

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
    // Shared trips (see "Shared trips" below) live outside any one user's own subtree, since
    // that's the only way a second account can ever read/write them. Read is open to any signed-in
    // user — needed both for the "my shared trips" array-contains query and for looking a trip up
    // by its join code before you're a participant yet, exactly like a Splitwise/Discord-style
    // invite code; write is restricted to existing participants, plus one narrow carve-out letting
    // a non-participant join by adding *only themselves* (and nothing else) to the trip.
    match /sharedTrips/{tripId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.ownerUid;
      allow update: if request.auth != null && (
        request.auth.uid in resource.data.participantUids ||
        (request.auth.uid in request.resource.data.participantUids &&
         !(request.auth.uid in resource.data.participantUids) &&
         request.resource.data.participantUids.size() == resource.data.participantUids.size() + 1)
      );
      allow delete: if request.auth != null && request.auth.uid == resource.data.ownerUid;
      match /transactions/{transactionId} {
        allow read, write: if request.auth != null &&
          request.auth.uid in get(/databases/$(database)/documents/sharedTrips/$(tripId)).data.participantUids;
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

Settings, the profile menu, the account/sign-in screen, Trips, Savings Goal, Categories, and About
are **not** tabs — they're `OverlayScreen`s (`src/types.ts`) pushed onto a real navigation stack
(`overlayStack: OverlayScreen[]` in `App.tsx`, not just a single "current screen" — needed because
these can nest more than one level deep, e.g. settings → categories) reached via the profile icon
(or, for Trips/Savings Goal, also directly via a shortcut card on the Insights tab). Each screen's
back button calls `popOverlay` (pop the stack one level), so it always returns to wherever it was
actually opened from. Switching bottom tabs clears the whole overlay stack. On web, the device
back button / swipe-back gesture is mirrored into browser history as a single "depth" number
(non-home tab = +1, each stacked overlay = +1 more), giving real hierarchical parent-child back
navigation — one step at a time up the tree, never straight to home and never a stale visit-order
history — with the profile menu itself treated as a transient selector rather than a real tree
node (picking a row from it swaps the menu out for the destination instead of stacking on top of
it, so e.g. settings' parent is whichever tab the profile icon was opened from, not the profile
menu). See the two `useEffect`s and `replaceOverlay` near the top of `AppContent` in `App.tsx`.

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
    demo-mode split as Home; in demo mode its trips/transactions state lives in the shared
    `DemoBudgetDataProvider` (see below) rather than a screen-local hook, so other screens — the
    bank-notification parse-test tool's auto-routing — can see the same trips. A trip can be
    marked finished via a **"סיים טיול"** button (with a confirm dialog), which sets the trip's
    `endedAt` and permanently reveals a `TripSummaryCard.tsx` (gross spend, total reimbursed,
    final net spend, trip length in days, and net spend per day) whenever the trip is reopened
    afterwards — `endedAt` is never cleared. Once ended, the add-transaction form is hidden (no
    new transactions), but the existing transaction list stays viewable/editable, and both the
    trip list card and the detail header show an "הסתיים" badge. **Shared trips** (Splitwise-style
    — see the "Shared trips" MVP-scope bullet below for the full data flow) are the same screen: an
    unshared trip's detail view shows a `TripShareCard.tsx` with a "הפוך למשותף" button; a shared
    one shows the 6-digit join code (as digits and a `react-native-qrcode-svg` QR image, plus a
    native `Share.share()` button) and the participant list instead, and a `TripSplitSummaryCard.tsx`
    beneath it (per-participant paid/share/balance, plus the simplified settlement transfers from
    `src/debtSimplification.ts`). The trip list's top row also has a **"הצטרף לטיול"** button
    (`JoinTripModal.tsx`) — enter a 6-digit code manually, or tap "סרוק QR" to scan one with the
    camera (`QRScannerModal.tsx`/`.web.tsx`, see below). Only the trip's owner (or, in demo mode,
    always — see below) sees the delete-trip icon on a shared trip, so one participant can't
    unilaterally delete it out from under everyone else. Multiple currencies within the
    same trip are already supported without any special handling — every transaction stores its
    own `originalAmount`/`originalCurrency` independent of the others (see "Foreign-currency
    entry" in MVP scope below), and the trip's gross/net/summary totals are always summed from the
    ILS-converted `amount` field regardless of what currency each transaction was entered in.
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
    app" for that allowlist to apply to in the first place. Beyond just previewing what would be
    extracted, a **"צור רשומה בפועל (מצב הדגמה)"** button (demo mode only — hidden when Firebase
    is configured, since this dev tool shouldn't write real accounts' data) actually creates the
    record, exercising the same routing the future native listener will use: if any trip is
    currently open (no `endedAt` set — the most recently created one if more than one happens to
    be open), a `charge` becomes an `expense` transaction on that trip and a `credit` becomes a
    `reimbursement` transaction on it; with no open trip, a `charge` becomes a regular general
    expense (category guessed the same way as the preview) and a `credit` is **not** created at
    all, since reimbursements are a trip-only concept with no equivalent among general expenses —
    a banner explains why nothing was created in that case. Every other outcome shows a banner
    naming the exact amount/merchant and where it landed (which trip, or "הוצאות כלליות"), so this
    screen doubles as a way to test the trip-vs-general-expenses auto-routing logic itself, not
    just the text parsing.
  - **אילו אפליקציות לעקוב אחריהן (notification sources)** — `src/screens/
    NotificationSourcesScreen.tsx`, the explicit per-app allowlist for the (future) notification
    listener (see "MVP scope" and "Notes for future work"). Every source — the one Bit preset, or
    any manually-added app — defaults to disabled; the screen's own text explains why (Android's
    listener permission is all-or-nothing, this allowlist is what narrows it down in practice).
  - **אודות ועזרה (About)** — `src/screens/AboutScreen.tsx`, reached via Settings' "אודות ועזרה"
    row (always shown, not gated behind `showAccountFeatures`/sign-in like the per-account rows
    above it). Static reference content, no live data: the app name/logo (`AppLogo.tsx`, see
    below) + a hardcoded version string (kept in sync with `package.json`/`app.json` by hand, no
    build-time wiring), a one-line explanation of what each of the three bottom tabs does, and a
    checklist of the app's main features — meant as a plain-English reminder of what's actually
    built, for whenever the feature list has grown past what's easy to remember.

A brief **splash screen** (`src/screens/SplashScreen.tsx`) shows on every app launch — a
fixed-duration (`SPLASH_DURATION_MS` in `App.tsx`, currently 1.3s) gate in front of
`ThemeProvider`/`AuthProvider`/`DemoBudgetDataProvider`, always on the dark surface regardless of
the user's chosen theme (matches how a launch screen looks before the theme provider is even
mounted). Shows `AppLogo.tsx` — the app's real logo (`assets/logo.jpg`, a full icon+wordmark+
tagline lockup, so nothing else needs to caption it) — every place that shows the logo (splash
screen, About screen) goes through this one component; swap `assets/logo.jpg` to change it
everywhere at once.

Home, Insights, Settings, Categories, Trips, and the Savings Goal screen all need the same budget/
expenses/savings-goal/categories/default-currency/month-start-day/notification-sources/trips
numbers to stay in sync in demo mode now that they're separate screens, so that demo state lives
in one shared `DemoBudgetDataProvider` (`src/hooks/useDemoBudgetData.tsx`, wrapping the whole app
in `App.tsx`) instead of being duplicated per screen — real Firebase mode doesn't need this since
every screen's Firestore hook (`useCategories`, `useAppSettings`, `useTrips`, etc.) already
reads/writes the same underlying document/subcollection. Trips joined this shared provider later
than the rest specifically so the parse-test screen's auto-creation feature (see the Settings
screen bullet above) could see the same open/closed trip state as the Trips screen itself.

## Theming

`src/theme.tsx` provides `useTheme()` → `{ mode, colors, toggleTheme }`. `colors` merges
theme-invariant brand/status colors (`BRAND` in `src/constants.ts`) with theme-dependent surface
colors (`DARK_COLORS` / `LIGHT_COLORS` — background, card, text, border...). Every component
computes its `StyleSheet` via a `getStyles(colors)` function called in the component body (not a
module-level constant), so it re-renders correctly on theme toggle.

The app is built around a vivid three-stop **"aurora" gradient** (cyan → violet → pink,
`GRADIENTS.primary` = `['#22D3EE', '#8B5CF6', '#EC4899']`) used for every "live" UI element —
buttons, progress-bar fills, selected chips/icons — instead of a flat single color, for more
visual energy; `BRAND.accent` (`#8B5CF6`, the violet midpoint) is the anchor color for solid
(non-gradient) uses like icons/switches/link text. Semantic status colors
(`danger`/`safe`/`warning`/`over` — over-budget red, on-track green, warning amber) are separate
from the accent since they signal meaning, not brand identity. **Dark mode is the default and
the flagship look** — a rich, deep violet-black (`#0B0618` background / `#1C1430` card, not a
neutral dark tone) that makes the aurora gradient glow — with white text/icons; light mode
inverts the text (pure black) on a pale lavender-white background (`#F6F2FF`, white cards). A
`DotBackground` component (`src/components/DotBackground.tsx`) layers a subtle, session-stable
sparkle texture (SVG circles, `react-native-svg` — mostly white, a few tinted with the aurora
colors) behind all content in both themes — mounted once in `App.tsx` (behind the main content
and the auth-initializing loading screen) and once in `SplashScreen.tsx`, since every screen's
own container is otherwise transparent and lets the single top-level background paint through.

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
- Shared trips (Splitwise-style group expense splitting): any trip can be turned shared via a
  **"הפוך למשותף"** button (`TripShareCard.tsx`), which generates a unique 6-digit `joinCode` and
  makes the current user its first participant (`ownerUid`). Other people join via **"הצטרף
  לטיול"** on the trip list (`JoinTripModal.tsx`) by entering that code manually, or by scanning a
  QR image of it (`QRScannerModal.tsx` on native, via `expo-camera`'s `CameraView` with barcode
  scanning; `QRScannerModal.web.tsx` explains that live QR scanning needs a real camera module and
  points back to manual entry, since the web preview has none) — capped at
  `MAX_TRIP_PARTICIPANTS` (5, `src/constants.ts`) participants, a soft UI limit rather than a hard
  technical one. Any participant can log an `expense` transaction as **"הוצאה משותפת"** (a checkbox
  on `AddTripTransactionForm.tsx`, shown only for `type === 'expense'` on a shared trip) — this
  sets `paidByUid` (who actually paid, always the person logging it) and `splitAmongUids` (a
  snapshot of every participant's uid *at that moment*, so a later joiner doesn't retroactively
  change the math on expenses logged before they joined) on the transaction; an expense logged
  without the checkbox stays personal/unsplit, exactly like a transaction on a non-shared trip.
  `src/debtSimplification.ts`'s `computeTripBalances` sums, per participant, how much they paid
  toward shared expenses vs. their equal share of them (`balance = paid − share`); `simplifyDebts`
  then reduces those balances to the *minimum* number of transfers that settles everyone up
  (Splitwise's classic greedy largest-creditor/largest-debtor matching — e.g. "A owes B 50, B owes
  C 50" collapses into one transfer, "A pays C 50", instead of two), shown in
  `TripSplitSummaryCard.tsx` alongside each participant's own paid/share/balance numbers. `fee`
  and `reimbursement` transactions, and any non-split `expense`, stay outside this math entirely —
  they still count toward the trip's overall gross/net stats (`TripStatsCard.tsx`, unaffected by
  any of this) but aren't part of who-owes-who. Only the trip's owner can delete a shared trip
  (`TripsScreen.tsx`'s `canDeleteTrip`, comparing `trip.ownerUid` against the signed-in uid) so one
  participant can't unilaterally remove it for everyone; split settings themselves aren't editable
  after a transaction is created (`EditTripTransactionModal.tsx` was deliberately left untouched —
  only type/amount/currency/note are editable, to keep the scope of what "editing" can silently
  change to the split math bounded). Since accounts have no separate profile-name field today,
  `deriveDisplayName` (`src/utils.ts`) suggests the part of the email before `@` as a starting
  display name wherever one is needed (sharing or joining) — always editable before submitting.
  Demo mode ships one trip (טיול לאילת) pre-shared with 3 mock participants and a mix of
  paid-by/split expenses (`DEMO_TRIP_PARTICIPANTS`/updated `DEMO_TRIP_TRANSACTIONS` in
  `src/demoData.ts`) so the balance/settlement UI has real non-trivial numbers to show without
  needing a second account; `useDemoBudgetData.tsx`'s `joinTripByCode` simulates joining by adding
  a freshly-named mock participant (there's no second real account to switch to in one browser
  tab), and `makeTripShared` works the same as the real-mode version, just entirely in memory. See
  the Firestore data model above for how a shared trip's storage (`sharedTrips/{tripId}`, a
  top-level collection instead of nested under one user) differs from a personal trip's.
- Bank-notification auto-detection basis: `src/bankNotificationParser.ts` has pure, dependency-free
  functions (`parseBankNotification`, `guessCategoryFromMerchant`) that parse Hebrew bank-app
  notification text into a charge (→ expense, category guessed from merchant) or a credit (→
  reimbursement, same concept as trip mode; Bit's "מחכים לך" pending-transfer wording counts as an
  immediate credit too, not just an already-confirmed "קיבלת"/"התקבל"). Also covers Pepper's
  2nd-person "הוצאת... בכרטיס האשראי" charge wording, generic bank credit phrasing ("נכנס/ה/ו לך")
  with no sender name at all, and Bit's outgoing-transfer confirmation ("העברה שביצעת ל<name>...
  הושלמה") — distinct from CREDIT_KEYWORDS' "העברה אליך" (a transfer *to* you), this one is money
  *you* sent, so it's a charge. A notification that's clearly a recognized charge/credit but has no
  extractable amount at all (e.g. a bare "נכנסה לך משכורת", no number anywhere in the text) still
  returns a result instead of failing silently — `ParsedBankNotification.amount` is `number | null`,
  and `null` means "recognized, but needs the amount filled in by hand"; the parse-test screen shows
  "לא ידוע — נדרשת השלמה ידנית" for it and the demo record-creation button explains why nothing was
  created rather than silently doing nothing. Notifications that glue
  Hebrew and Latin/digit text together with no space at all (seen on real devices — e.g. Isracard's
  "בית עסקKING MEAT... בסך155.0 שח" or Pepper's "בSHUK HAIIM HATOVIM") are handled by inserting a
  space at every Hebrew↔Latin/digit script boundary before parsing; the resulting "ב SHUK..." is
  matched by a merchant pattern anchored on a capital Latin letter right after "ב " specifically —
  narrow enough to never fire on the countless ordinary Hebrew words that start with the same
  "in/at" prefix. `guessCategoryFromMerchant` matches merchant-name keywords
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
App.tsx                              splash-screen gate + ThemeProvider + AuthProvider + DemoBudgetDataProvider +
                                      tab/overlay-stack switching + browser-history back-navigation sync (web)
src/types.ts                         Expense, Category, CategoryDef, TabKey, OverlayScreen, Trip, TripParticipant,
                                      TripTransaction types
src/constants.ts                     DEFAULT_CATEGORIES, CATEGORY_COLOR_SWATCHES, BRAND/DARK_COLORS/LIGHT_COLORS,
                                      gradients, MAX_TRIP_PARTICIPANTS
src/debtSimplification.ts            pure functions: computeTripBalances, simplifyDebts (Splitwise-style greedy
                                      min-transfer settlement), generateJoinCode — see "Shared trips" in MVP scope
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
                                      categories/defaultCurrency/monthStartDay/trips/currentUid state, incl. demo
                                      makeTripShared/joinTripByCode
src/hooks/useTrips.ts                Firestore-backed trips — merges personal (users/{uid}/trips) + shared
                                      (sharedTrips, array-contains query) into one list; add/delete/endTrip,
                                      makeTripShared (migrates a personal trip + its transactions into sharedTrips),
                                      joinTripByCode (looks a trip up by joinCode, adds the caller as a participant)
src/hooks/useTripTransactions.ts     Firestore-backed transactions for one trip — takes the full Trip (not just its
                                      id) to route reads/writes to sharedTrips/{id} vs users/{uid}/trips/{id} based
                                      on trip.isShared; add/update/delete
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
src/screens/ParseTestScreen.tsx      dev-only screen: paste bank notification text, see the parsed result, and
                                      (demo mode) actually create the routed expense/reimbursement record
                                      (no source-app filtering — pure parsing test tool; overlay screen)
src/screens/NotificationSourcesScreen.tsx  per-app allowlist for the (future) notification listener — presets +
                                      manual add, everything off by default (overlay screen)
src/screens/AboutScreen.tsx          static app name/version/logo, per-tab explanations, feature checklist
                                      (overlay screen, reached via Settings)
src/screens/SplashScreen.tsx         brief fixed-duration launch screen — logo on the dark surface
src/components/AppLogo.tsx           the app's real logo (assets/logo.jpg) — every place that shows the logo
                                      goes through here
src/components/DotBackground.tsx     subtle scattered white-dot texture layered behind all content (both
                                      themes) — mounted once in App.tsx + once in SplashScreen.tsx
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
src/components/TripCard.tsx          trip list-item summary (gross/net/budget bar), shared-trip participant-count
                                      badge, canDelete-gated delete icon
src/components/TripStatsCard.tsx     trip detail stats (gross, reimbursed, net, budget, remaining)
src/components/TripSummaryCard.tsx   permanent post-trip summary (gross, reimbursed, net, days, daily average) —
                                      renders once trip.endedAt is set, via "סיים טיול"
src/components/TripShareCard.tsx     "הפוך למשותף" prompt (unshared trip) or join code + QR image + share button +
                                      participant list (shared trip) — see "Shared trips" in MVP scope
src/components/TripSplitSummaryCard.tsx  per-participant paid/share/balance + simplified settlement transfers,
                                      built on src/debtSimplification.ts
src/components/JoinTripModal.tsx     "הצטרף לטיול" modal: 6-digit code entry (manual or via QRScannerModal) +
                                      display-name field
src/components/QRScannerModal.tsx / .web.tsx  native camera QR scanner (expo-camera CameraView) vs a web fallback
                                      explaining that live QR scanning needs a real camera module
src/components/AddTripTransactionForm.tsx  type chips (הוצאה/החזר/עמלה) + amount/currency/note + add; on a shared
                                      trip, an extra "הוצאה משותפת" checkbox (type==='expense' only) that snapshots
                                      paidByUid/splitAmongUids onto the transaction
src/components/TripTransactionList.tsx     trip transactions list, tap to edit, delete button
src/components/EditTripTransactionModal.tsx edit an existing trip transaction's type/amount/currency/note (split
                                      settings are intentionally not editable here — see "Shared trips")
```

## Commands

- `npm install` — install dependencies.
- Copy `.env.example` to `.env` and fill in your Firebase web app config first.
- `npm start` — start the Expo dev server (then scan the QR code with Expo Go).
- `npm run android` — start and try to open in a connected/emulated Android device.

## Notes for future work (post-MVP, not implemented)

- Sharing the *rest* of one account's data with a partner (budget, regular expenses, categories —
  a shared household doc instead of per-uid); trips specifically are already shareable (see
  "Shared trips" in MVP scope).
- Shared-trip participants leaving/being removed after joining, and editing a transaction's
  split settings (paidByUid/splitAmongUids) after creation — both deliberately out of scope for
  now to keep the debt math predictable.
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
