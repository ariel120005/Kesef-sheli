// expo-file-system's new SDK 57 API (File/Directory classes) has no simple async
// write-string-to-cache helper; the legacy module keeps the old, simpler function-based API.
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Expense } from './types';
import { formatDate } from './utils';

function escapeCsvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function buildExpensesCSV(expenses: Expense[]): string {
  const header = ['תאריך', 'סכום', 'קטגוריה', 'הערה'];
  const rows = expenses.map((e) => [formatDate(e.date), String(e.amount), e.category, e.note ?? '']);
  const lines = [header, ...rows].map((row) => row.map(escapeCsvField).join(','));
  // Leading BOM so Hebrew text renders correctly when the CSV is opened in Excel.
  return '﻿' + lines.join('\n');
}

// Downloads the CSV directly on web; on native, writes it to a temp file and opens the share
// sheet (expo-file-system + expo-sharing are both precompiled into Expo Go, no dev build needed).
export async function exportExpensesCSV(expenses: Expense[]): Promise<void> {
  const csv = buildExpensesCSV(expenses);
  const filename = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;

  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  const fileUri = FileSystem.cacheDirectory + filename;
  await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'ייצוא הוצאות' });
  }
}
