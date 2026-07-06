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
- No navigation library — three screens are switched by plain state in `App.tsx`, with a custom
  bottom tab bar (see below).

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
  `date`).

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
    }
  }
}
```

## App structure & navigation

Three tabs, bottom bar always visible, RTL order (rightmost → leftmost): פרופיל, בית, הגדרות.

- **בית (Home)** — the expense tracker (budget meter, savings goal, add-expense form, AI
  insights, category breakdown, recent expenses). Requires being signed in; shows a locked/empty
  state otherwise. When Firebase isn't configured at all (e.g. the public GitHub Pages preview),
  it instead shows a fully interactive **demo mode** (`src/demoData.ts`) with sample data held in
  local component state — nothing is persisted, and a "מצב הדגמה" badge makes that clear.
- **פרופיל (Profile)** — shows the email/password sign-in-or-sign-up form
  (`src/screens/AuthScreen.tsx`) when signed out, or a simple account card (email) when signed in.
- **הגדרות (Settings)** — light/dark theme toggle (always available), plus sign-out and
  delete-all-data (only shown when signed in).

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
- Breakdown of the current month's spending by category.
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

## RTL approach

The UI must read right-to-left in Hebrew. Rather than relying on
`I18nManager.forceRTL` (which needs a full app reload/restart to take effect and is
finicky under Expo Go), every component is styled manually for RTL:
`textAlign: 'right'` on text, `flexDirection: 'row-reverse'` on rows that mix an
icon/button with a label. This keeps behavior predictable when testing live in Expo Go.

## Project structure

```
App.tsx                              ThemeProvider + AuthProvider + tab switching
src/types.ts                         Expense, Category, TabKey types
src/constants.ts                     category list, BRAND/DARK_COLORS/LIGHT_COLORS, gradients
src/theme.tsx                        ThemeProvider/useTheme (dark/light, persisted)
src/firebaseConfig.ts                reads EXPO_PUBLIC_FIREBASE_* env vars
src/firebase.ts / firebase.web.ts    platform-specific Firebase app/auth/db init
src/utils.ts                         currency formatting, month-matching helpers
src/hooks/useAuth.tsx                AuthProvider/useAuth (sign up/in/out, current user)
src/hooks/useExpenses.ts             Firestore-backed expenses (onSnapshot, add, delete)
src/hooks/useBudget.ts               Firestore-backed monthly budget (onSnapshot, update)
src/hooks/useSavingsGoal.ts          Firestore-backed savings goal (onSnapshot, update)
src/insights.ts                      rule-based Hebrew insight generator (no LLM call)
src/recurring.ts                     finds which recurring expenses need this month's copy
src/demoData.ts                      sample expenses/budget/goal for demo mode
src/screens/HomeScreen.tsx           the expense tracker (auth-gated, or demo mode)
src/screens/AuthScreen.tsx           sign-in / sign-up form
src/screens/ProfileScreen.tsx        AuthScreen when signed out, account card when signed in
src/screens/SettingsScreen.tsx       theme toggle, sign out, delete all data
src/components/BottomTabBar.tsx      fixed 3-tab bottom bar
src/components/BudgetMeter.tsx       gradient progress bar + set-budget button
src/components/SavingsGoalCard.tsx   savings goal progress bar + set-goal button
src/components/AmountInputModal.tsx  generic modal to input/edit an amount (budget, savings goal)
src/components/AddExpenseForm.tsx    amount/category/note/recurring inputs + add button
src/components/EditExpenseModal.tsx  edit an existing expense's amount/category/note/recurring
src/components/EmptyExpensesState.tsx animated "no expenses yet" illustration
src/components/AIInsightsCard.tsx    renders the generated insight strings
src/components/CategoryBreakdown.tsx per-category totals for the current month
src/components/ExpenseList.tsx       recent expenses, tap to edit, delete button
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
- Charts (currently just a list + a single progress bar).
- Password reset / email verification.
