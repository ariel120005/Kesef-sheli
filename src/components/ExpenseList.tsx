import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SHADOW } from '../constants';
import { ThemeColors, useTheme } from '../theme';
import { Expense } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { ConfirmDialog } from './ConfirmDialog';
import { EmptyExpensesState } from './EmptyExpensesState';

interface Props {
  expenses: Expense[];
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
}

export function ExpenseList({ expenses, onDelete, onEdit }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);

  const sorted = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <View style={[styles.card, SHADOW]}>
      <Text style={styles.title}>הוצאות אחרונות</Text>
      {sorted.length === 0 ? (
        <EmptyExpensesState />
      ) : (
        sorted.map((expense) => (
          <View key={expense.id} style={styles.row}>
            <Pressable onPress={() => setPendingDelete(expense)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>מחק</Text>
            </Pressable>
            <Pressable style={styles.rowInfo} onPress={() => onEdit(expense)}>
              <View style={styles.rowTop}>
                <View style={styles.categoryRow}>
                  <Text style={styles.category}>{expense.category}</Text>
                  {expense.recurring && (
                    <View style={styles.recurringBadge}>
                      <Text style={styles.recurringBadgeText}>קבוע</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
              </View>
              {!!expense.note && <Text style={styles.note}>{expense.note}</Text>}
              <Text style={styles.date}>{formatDate(expense.date)}</Text>
            </Pressable>
          </View>
        ))
      )}

      <ConfirmDialog
        visible={!!pendingDelete}
        title="מחיקת הוצאה"
        message={
          pendingDelete
            ? `למחוק את ההוצאה "${pendingDelete.category}" בסך ${formatCurrency(pendingDelete.amount)}?`
            : ''
        }
        confirmLabel="מחיקה"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 22,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'right',
      marginBottom: 8,
    },
    row: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    rowInfo: {
      flex: 1,
      marginRight: 14,
    },
    rowTop: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    categoryRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
    },
    category: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
      textAlign: 'right',
    },
    recurringBadge: {
      backgroundColor: colors.chipBackground,
      borderRadius: 8,
      paddingVertical: 2,
      paddingHorizontal: 6,
    },
    recurringBadgeText: {
      color: colors.turquoise,
      fontSize: 10,
      fontWeight: '700',
    },
    amount: {
      color: colors.turquoise,
      fontSize: 14,
      fontWeight: '700',
    },
    note: {
      color: colors.subtext,
      fontSize: 13,
      textAlign: 'right',
      marginTop: 4,
    },
    date: {
      color: colors.subtext,
      fontSize: 12,
      textAlign: 'right',
      marginTop: 4,
    },
    deleteButton: {
      borderRadius: 10,
      paddingVertical: 7,
      paddingHorizontal: 12,
      backgroundColor: colors.deleteBackground,
    },
    deleteButtonText: {
      color: colors.danger,
      fontSize: 12,
      fontWeight: '700',
    },
  });
}
