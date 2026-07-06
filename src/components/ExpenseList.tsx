import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SHADOW } from '../constants';
import { ThemeColors, useTheme } from '../theme';
import { Expense } from '../types';
import { formatCurrency, formatDate } from '../utils';

interface Props {
  expenses: Expense[];
  onDelete: (id: string) => void;
}

export function ExpenseList({ expenses, onDelete }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

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
    <View style={[styles.card, SHADOW]}>
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
    emptyText: {
      color: colors.subtext,
      textAlign: 'right',
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
    },
    category: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
      textAlign: 'right',
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
