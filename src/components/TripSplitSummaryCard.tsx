import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SHADOW } from '../constants';
import { computeTripBalances, simplifyDebts } from '../debtSimplification';
import { ThemeColors, useTheme } from '../theme';
import { Trip, TripTransaction } from '../types';
import { formatCurrency } from '../utils';

interface Props {
  trip: Trip;
  transactions: TripTransaction[];
  currentUid: string;
}

// Per-participant paid/share/balance, plus the minimal set of transfers (see
// src/debtSimplification.ts) that settles everyone up — the "who owes who" view of a shared trip.
export function TripSplitSummaryCard({ trip, transactions, currentUid }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  if (!trip.isShared || (trip.participants?.length ?? 0) === 0) return null;

  const balances = computeTripBalances(trip, transactions);
  const settlements = simplifyDebts(balances);
  const nameByUid = new Map((trip.participants ?? []).map((p) => [p.uid, p.displayName]));
  const displayName = (uid: string) => (uid === currentUid ? 'את/ה' : nameByUid.get(uid) ?? 'משתמש');

  return (
    <View style={[styles.card, SHADOW]}>
      <Text style={styles.title}>חלוקת הוצאות</Text>

      {balances.map((b) => (
        <View key={b.uid} style={styles.participantRow}>
          <Text style={styles.participantName}>{displayName(b.uid)}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statText}>שילמ/ה {formatCurrency(b.paid)}</Text>
            <Text style={styles.statText}>חלק: {formatCurrency(b.share)}</Text>
          </View>
          <Text
            style={[
              styles.balanceText,
              { color: b.balance > 0.01 ? colors.safe : b.balance < -0.01 ? colors.danger : colors.subtext },
            ]}
          >
            {b.balance > 0.01
              ? `חייבים לו/לה ${formatCurrency(b.balance)}`
              : b.balance < -0.01
                ? `חייב/ת ${formatCurrency(Math.abs(b.balance))}`
                : 'מאוזנ/ת'}
          </Text>
        </View>
      ))}

      <View style={styles.divider} />

      <Text style={styles.settlementTitle}>קיזוז וסגירת חשבון</Text>
      {settlements.length === 0 ? (
        <Text style={styles.settledText}>הכל מאוזן — אין העברות נדרשות</Text>
      ) : (
        settlements.map((s, index) => (
          <View key={index} style={styles.settlementRow}>
            <Ionicons name="swap-horizontal-outline" size={16} color={colors.accent} />
            <Text style={styles.settlementText}>
              {displayName(s.fromUid)} צריכ/ה להעביר ל{displayName(s.toUid)} {formatCurrency(s.amount)}
            </Text>
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
      marginBottom: 16,
    },
    participantRow: {
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    participantName: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
      textAlign: 'right',
    },
    statsRow: {
      flexDirection: 'row-reverse',
      gap: 12,
      marginTop: 4,
    },
    statText: {
      color: colors.subtext,
      fontSize: 12,
    },
    balanceText: {
      fontSize: 13,
      fontWeight: '700',
      textAlign: 'right',
      marginTop: 4,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 16,
    },
    settlementTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'right',
      marginBottom: 10,
    },
    settledText: {
      color: colors.safe,
      fontSize: 13,
      textAlign: 'center',
      paddingVertical: 8,
      fontWeight: '600',
    },
    settlementRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 6,
    },
    settlementText: {
      color: colors.text,
      fontSize: 13,
      textAlign: 'right',
      flex: 1,
    },
  });
}
