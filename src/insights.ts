import { Expense } from './types';
import { formatCurrency, getBudgetPeriod } from './utils';

interface MonthWindow {
  start: Date;
  end: Date;
}

function monthOffsetFromNow(offset: number, monthStartDay: number, now: Date): MonthWindow {
  const shifted = new Date(now.getFullYear(), now.getMonth() + offset, now.getDate());
  return getBudgetPeriod(monthStartDay, shifted);
}

function isInMonth(dateStr: string, window: MonthWindow): boolean {
  const d = new Date(dateStr);
  return d >= window.start && d < window.end;
}

function sumByCategory(expenses: Expense[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const e of expenses) {
    totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
  }
  return totals;
}

function topEntry(totals: Map<string, number>): [string, number] | null {
  let best: [string, number] | null = null;
  for (const entry of totals) {
    if (!best || entry[1] > best[1]) best = entry;
  }
  return best;
}

export function generateInsights(
  expenses: Expense[],
  budget: number | null,
  monthStartDay: number = 1,
  now: Date = new Date()
): string[] {
  const insights: string[] = [];

  const thisMonthWindow = monthOffsetFromNow(0, monthStartDay, now);
  const lastMonthWindow = monthOffsetFromNow(-1, monthStartDay, now);
  const thisMonthExpenses = expenses.filter((e) => isInMonth(e.date, thisMonthWindow));
  const lastMonthExpenses = expenses.filter((e) => isInMonth(e.date, lastMonthWindow));

  const thisMonthTotals = sumByCategory(thisMonthExpenses);
  const lastMonthTotals = sumByCategory(lastMonthExpenses);

  let biggestIncrease: { category: string; percent: number } | null = null;
  for (const [category, thisTotal] of thisMonthTotals) {
    const lastTotal = lastMonthTotals.get(category) ?? 0;
    if (lastTotal <= 0) continue;
    const percent = ((thisTotal - lastTotal) / lastTotal) * 100;
    if (percent > 5 && (!biggestIncrease || percent > biggestIncrease.percent)) {
      biggestIncrease = { category, percent };
    }
  }
  if (biggestIncrease) {
    insights.push(
      `החודש הוצאתם ${Math.round(biggestIncrease.percent)}% יותר על ${biggestIncrease.category} לעומת החודש שעבר`
    );
  }

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekTotals = sumByCategory(expenses.filter((e) => new Date(e.date) >= weekAgo));
  const topWeekCategory = topEntry(weekTotals);
  if (topWeekCategory) {
    insights.push(
      `רוב ההוצאות שלכם השבוע היו על ${topWeekCategory[0]} (${formatCurrency(topWeekCategory[1])})`
    );
  }

  if (budget && budget > 0) {
    const spent = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const ratio = spent / budget;
    if (ratio >= 1) {
      insights.push(`חרגתם מהתקציב החודשי ב-${formatCurrency(spent - budget)}`);
    } else if (ratio >= 0.8) {
      insights.push(`ניצלתם כבר ${Math.round(ratio * 100)}% מהתקציב החודשי`);
    }
  }

  const topMonthCategory = topEntry(thisMonthTotals);
  if (topMonthCategory) {
    insights.push(
      `הקטגוריה עם ההוצאה הגבוהה ביותר החודש: ${topMonthCategory[0]} (${formatCurrency(topMonthCategory[1])})`
    );
  }

  if (insights.length === 0) {
    insights.push('הוסיפו כמה הוצאות כדי לקבל תובנות מותאמות אישית');
  }

  return insights.slice(0, 4);
}
