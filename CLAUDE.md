@AGENTS.md

# כסף שלי — Expense & Budget Tracker

Android app built with React Native + Expo (managed workflow). Hebrew UI, RTL layout. All data
is stored locally on-device — there is no backend/server.

## Stack

- Expo SDK 57, React 19, React Native 0.86, TypeScript.
- Local persistence: `@react-native-async-storage/async-storage`.
- No navigation library — MVP is a single scrollable screen.
- No global state library — plain hooks (`src/hooks`) wrap AsyncStorage read/write.

## MVP scope

- Add an expense: amount, category (fixed Hebrew list), free-text note.
- Set a monthly budget.
- Visual budget meter: bar fills with % of budget spent, changes color
  (green → orange → red) as it approaches/exceeds the budget.
- Breakdown of the current month's spending by category.
- Recent expenses list, newest first, with per-item delete (confirm before delete).
- "Current month" is always the real calendar month (no month picker in the MVP).

## RTL approach

The UI must read right-to-left in Hebrew. Rather than relying on
`I18nManager.forceRTL` (which needs a full app reload/restart to take effect and is
finicky under Expo Go), every component is styled manually for RTL:
`textAlign: 'right'` on text, `flexDirection: 'row-reverse'` on rows that mix an
icon/button with a label. This keeps behavior predictable when testing live in Expo Go.

## Project structure

```
App.tsx                     screen composition
src/types.ts                Expense, Category types
src/constants.ts            category list, colors, AsyncStorage keys
src/utils.ts                currency formatting, month-matching helpers
src/hooks/useExpenses.ts     load/save/add/delete expenses
src/hooks/useBudget.ts       load/save monthly budget
src/components/BudgetMeter.tsx        progress bar + set-budget button
src/components/SetBudgetModal.tsx     modal to input/edit the monthly budget
src/components/AddExpenseForm.tsx     amount/category/note inputs + add button
src/components/CategoryBreakdown.tsx  per-category totals for the current month
src/components/ExpenseList.tsx        recent expenses with delete
```

## Commands

- `npm install` — install dependencies.
- `npm start` — start the Expo dev server (then scan the QR code with Expo Go).
- `npm run android` — start and try to open in a connected/emulated Android device.

## Notes for future work (post-MVP, not implemented)

- Editing an existing expense.
- Month picker / history across months.
- Multiple budgets per category.
- Charts (currently just a list + a single progress bar).
