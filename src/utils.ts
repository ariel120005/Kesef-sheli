export function formatCurrency(amount: number): string {
  return `₪${amount.toLocaleString('he-IL', { maximumFractionDigits: 2 })}`;
}

export function isSameMonth(isoDate: string, reference: Date = new Date()): boolean {
  const d = new Date(isoDate);
  return (
    d.getFullYear() === reference.getFullYear() && d.getMonth() === reference.getMonth()
  );
}

export function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
