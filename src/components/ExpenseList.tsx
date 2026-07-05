import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants';
import { Expense } from '../types';
import { formatCurrency, formatDate } from '../utils';

interface Props {
  expenses: Expense[];
  onDelete: (id: string) => void;
}

export function ExpenseList({ expenses, onDelete }: Props) {
  const sorted = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const confirmDelete = (expense: Expense) => {
    Alert.alert('מחיקת הוצאה', `למחוק את ההוצאה "${expense.category}" בסך ${formatCurrency(expense.amount)}?`, [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחיקה', style: 'destructive', onPress: () => onDelete(expense.id) },
    ]);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>הוצאות אחרונות</Text>
      {sorted.length === 0 ? (
        <Text style={styles.emptyText}>עדיין לא נוספו הוצאות</Text>
      ) : (
        sorted.map((expense) => (
          <View key={expense.id} style={styles.row}>
            <Pressable onPress={() => confirmDelete(expense)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>מחק</Text>
            </Pressable>
            <View style={styles.rowInfo}>
              <View style={styles.rowTop}>
                <Text style={styles.category}>{expense.category}</Text>
                <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
              </View>
              {!!expense.note && <Text style={styles.note}>{expense.note}</Text>}
              <Text style={styles.date}>{formatDate(expense.date)}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'right',
    marginBottom: 12,
  },
  emptyText: {
    color: COLORS.subtext,
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  rowInfo: {
    flex: 1,
    marginRight: 10,
  },
  rowTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  category: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  amount: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  note: {
    color: COLORS.subtext,
    fontSize: 13,
    textAlign: 'right',
    marginTop: 2,
  },
  date: {
    color: COLORS.subtext,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2,
  },
  deleteButton: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FEE2E2',
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '700',
  },
});
