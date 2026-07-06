import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SHADOW } from '../constants';
import { formatForeignAmount } from '../currency';
import { ThemeColors, useTheme } from '../theme';
import { TripTransaction, TripTransactionType } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { ConfirmDialog } from './ConfirmDialog';

interface Props {
  transactions: TripTransaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: TripTransaction) => void;
}

const TYPE_LABELS: Record<TripTransactionType, string> = {
  expense: 'הוצאה',
  reimbursement: 'החזר',
  fee: 'עמלה',
};

export function TripTransactionList({ transactions, onDelete, onEdit }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [pendingDelete, setPendingDelete] = useState<TripTransaction | null>(null);

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const amountColor = (type: TripTransactionType) =>
    type === 'reimbursement' ? colors.safe : type === 'fee' ? colors.warning : colors.text;
  const amountSign = (type: TripTransactionType) => (type === 'reimbursement' ? '+' : '-');

  return (
    <View style={[styles.card, SHADOW]}>
      <Text style={styles.title}>תנועות הטיול</Text>
      {sorted.length === 0 ? (
        <Text style={styles.emptyText}>עדיין אין תנועות בטיול הזה</Text>
      ) : (
        sorted.map((transaction) => (
          <View key={transaction.id} style={styles.row}>
            <Pressable onPress={() => setPendingDelete(transaction)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>מחק</Text>
            </Pressable>
            <Pressable style={styles.rowInfo} onPress={() => onEdit(transaction)}>
              <View style={styles.rowTop}>
                <View style={styles.typeRow}>
                  <Text style={styles.type}>{TYPE_LABELS[transaction.type]}</Text>
                  {transaction.autoDetected && (
                    <View style={styles.autoBadge}>
                      <Text style={styles.autoBadgeText}>זוהה אוטומטית</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.amount, { color: amountColor(transaction.type) }]}>
                  {amountSign(transaction.type)}
                  {formatCurrency(transaction.amount)}
                </Text>
              </View>
              {!!transaction.note && <Text style={styles.note}>{transaction.note}</Text>}
              {!!transaction.originalCurrency && transaction.originalAmount != null && (
                <Text style={styles.originalAmount}>
                  שולם {formatForeignAmount(transaction.originalAmount, transaction.originalCurrency)}
                </Text>
              )}
              <Text style={styles.date}>{formatDate(transaction.date)}</Text>
            </Pressable>
          </View>
        ))
      )}

      <ConfirmDialog
        visible={!!pendingDelete}
        title="מחיקת תנועה"
        message={
          pendingDelete
            ? `למחוק את התנועה "${TYPE_LABELS[pendingDelete.type]}" בסך ${formatCurrency(pendingDelete.amount)}?`
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
    emptyText: {
      color: colors.subtext,
      fontSize: 14,
      textAlign: 'center',
      paddingVertical: 20,
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
    typeRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
    },
    type: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
      textAlign: 'right',
    },
    autoBadge: {
      backgroundColor: colors.chipBackground,
      borderRadius: 8,
      paddingVertical: 2,
      paddingHorizontal: 6,
    },
    autoBadgeText: {
      color: colors.turquoise,
      fontSize: 10,
      fontWeight: '700',
    },
    amount: {
      fontSize: 14,
      fontWeight: '700',
    },
    note: {
      color: colors.subtext,
      fontSize: 13,
      textAlign: 'right',
      marginTop: 4,
    },
    originalAmount: {
      color: colors.subtext,
      fontSize: 12,
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
