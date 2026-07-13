import { Trip, TripTransaction } from './types';

export interface TripBalance {
  uid: string;
  paid: number; // total paid toward shared ("for everyone") expenses
  share: number; // this participant's equal share of those same shared expenses
  balance: number; // paid - share: positive = owed money by the group, negative = owes the group
}

export interface Settlement {
  fromUid: string;
  toUid: string;
  amount: number;
}

const EPSILON = 0.01;

// Only 'expense' transactions logged "for everyone" (splitAmongUids set) feed the shared pool —
// fees, reimbursements, and personal (non-split) expenses stay outside this math entirely; they
// already show up in the trip's overall gross/net stats (TripStatsCard) regardless.
export function computeTripBalances(trip: Trip, transactions: TripTransaction[]): TripBalance[] {
  const participants = trip.participants ?? [];
  const paid: Record<string, number> = {};
  const share: Record<string, number> = {};
  participants.forEach((p) => {
    paid[p.uid] = 0;
    share[p.uid] = 0;
  });

  transactions.forEach((t) => {
    if (t.type !== 'expense' || !t.splitAmongUids || t.splitAmongUids.length === 0) return;
    if (t.paidByUid) paid[t.paidByUid] = (paid[t.paidByUid] ?? 0) + t.amount;
    const perPerson = t.amount / t.splitAmongUids.length;
    t.splitAmongUids.forEach((uid) => {
      share[uid] = (share[uid] ?? 0) + perPerson;
    });
  });

  return participants.map((p) => ({
    uid: p.uid,
    paid: paid[p.uid] ?? 0,
    share: share[p.uid] ?? 0,
    balance: (paid[p.uid] ?? 0) - (share[p.uid] ?? 0),
  }));
}

// Minimizes the number of transfers needed to settle every balance (Splitwise-style): repeatedly
// matches the largest creditor against the largest debtor instead of showing a separate transfer
// per underlying expense, so e.g. "A owes B 50, B owes C 50" collapses into "A pays C 50".
export function simplifyDebts(balances: TripBalance[]): Settlement[] {
  const creditors = balances
    .filter((b) => b.balance > EPSILON)
    .map((b) => ({ uid: b.uid, amount: b.balance }))
    .sort((a, b) => b.amount - a.amount);
  const debtors = balances
    .filter((b) => b.balance < -EPSILON)
    .map((b) => ({ uid: b.uid, amount: -b.balance }))
    .sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);
    if (amount > EPSILON) {
      settlements.push({
        fromUid: debtor.uid,
        toUid: creditor.uid,
        amount: Math.round(amount * 100) / 100,
      });
    }
    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount <= EPSILON) i++;
    if (creditor.amount <= EPSILON) j++;
  }
  return settlements;
}

export function generateJoinCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
