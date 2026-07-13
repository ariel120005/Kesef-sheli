import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GRADIENTS, SHADOW } from '../constants';
import { formatForeignAmount, getExchangeRateToILS } from '../currency';
import { ThemeColors, useTheme } from '../theme';
import { Currency, TripTransactionType } from '../types';
import { CurrencyPicker } from './CurrencyPicker';

interface Props {
  defaultCurrency?: Currency | 'ILS';
  isSharedTrip?: boolean;
  participantCount?: number;
  onAdd: (
    type: TripTransactionType,
    amount: number,
    note: string,
    originalAmount: number | null,
    originalCurrency: Currency | null,
    shared: boolean
  ) => void;
}

const TYPE_OPTIONS: { key: TripTransactionType; label: string }[] = [
  { key: 'expense', label: 'הוצאה' },
  { key: 'reimbursement', label: 'החזר' },
  { key: 'fee', label: 'עמלה' },
];

export function AddTripTransactionForm({
  defaultCurrency = 'ILS',
  isSharedTrip = false,
  participantCount = 0,
  onAdd,
}: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [type, setType] = useState<TripTransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [currency, setCurrency] = useState<Currency | 'ILS'>(defaultCurrency);
  const [rate, setRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [shared, setShared] = useState(true);
  const showSharedToggle = isSharedTrip && type === 'expense';

  useEffect(() => {
    if (currency === 'ILS') {
      setRate(null);
      return;
    }
    let cancelled = false;
    setRateLoading(true);
    getExchangeRateToILS(currency).then((result) => {
      if (!cancelled) {
        setRate(result.rate);
        setRateLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currency]);

  const parsedAmount = Number(amount.replace(',', '.'));
  const convertedILS =
    currency !== 'ILS' && rate && !isNaN(parsedAmount) ? parsedAmount * rate : null;

  const handleSubmit = () => {
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) return;
    const isShared = showSharedToggle && shared;
    if (currency !== 'ILS') {
      if (!rate) return;
      onAdd(type, parsedAmount * rate, note.trim(), parsedAmount, currency, isShared);
    } else {
      onAdd(type, parsedAmount, note.trim(), null, null, isShared);
    }
    setAmount('');
    setNote('');
    setCurrency(defaultCurrency);
  };

  return (
    <View style={[styles.card, SHADOW]}>
      <Text style={styles.title}>הוספת תנועה</Text>

      <View style={styles.typeWrap}>
        {TYPE_OPTIONS.map((opt) => {
          const selected = opt.key === type;
          if (selected) {
            return (
              <Pressable key={opt.key} onPress={() => setType(opt.key)} style={styles.typeChipFlex}>
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.typeChip, styles.typeChipSelected]}
                >
                  <Text style={styles.typeChipTextSelected}>{opt.label}</Text>
                </LinearGradient>
              </Pressable>
            );
          }
          return (
            <Pressable
              key={opt.key}
              onPress={() => setType(opt.key)}
              style={[styles.typeChipFlex, styles.typeChip]}
            >
              <Text style={styles.typeChipText}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        style={styles.input}
        placeholder={currency !== 'ILS' ? 'סכום' : 'סכום (₪)'}
        placeholderTextColor={colors.subtext}
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        textAlign="right"
      />

      <CurrencyPicker value={currency} onChange={setCurrency} />

      {currency !== 'ILS' && (
        <View style={styles.conversionRow}>
          {rateLoading ? (
            <ActivityIndicator size="small" color={colors.subtext} />
          ) : convertedILS !== null ? (
            <Text style={styles.conversionText}>
              {formatForeignAmount(parsedAmount, currency)} ≈ ₪
              {convertedILS.toLocaleString('he-IL', { maximumFractionDigits: 2 })}
            </Text>
          ) : null}
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="הערה (לא חובה)"
        placeholderTextColor={colors.subtext}
        value={note}
        onChangeText={setNote}
        textAlign="right"
      />

      {showSharedToggle && (
        <Pressable style={styles.sharedToggle} onPress={() => setShared((prev) => !prev)}>
          <View style={[styles.checkbox, shared && styles.checkboxChecked]}>
            {shared && <Text style={styles.checkboxMark}>✓</Text>}
          </View>
          <Text style={styles.sharedToggleText}>
            הוצאה משותפת — מתחלקת שווה בשווה בין {participantCount} משתתפים
          </Text>
        </Pressable>
      )}

      <Pressable onPress={handleSubmit}>
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.submitButton}
        >
          <Text style={styles.submitButtonText}>הוספה</Text>
        </LinearGradient>
      </Pressable>
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
      marginBottom: 18,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.chipBackground,
      borderRadius: 14,
      padding: 14,
      fontSize: 15,
      color: colors.text,
      marginBottom: 16,
    },
    typeWrap: {
      flexDirection: 'row-reverse',
      gap: 10,
      marginBottom: 16,
    },
    typeChipFlex: {
      flex: 1,
    },
    typeChip: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.chipBackground,
      borderRadius: 20,
      paddingVertical: 10,
      alignItems: 'center',
    },
    typeChipSelected: {
      borderWidth: 0,
    },
    typeChipText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '600',
    },
    typeChipTextSelected: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 13,
    },
    conversionRow: {
      alignItems: 'flex-end',
      marginBottom: 12,
    },
    conversionText: {
      color: colors.subtext,
      fontSize: 13,
      textAlign: 'right',
    },
    sharedToggle: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
      marginBottom: 18,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    checkboxMark: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
    },
    sharedToggleText: {
      color: colors.text,
      fontSize: 13,
      flex: 1,
      textAlign: 'right',
    },
    submitButton: {
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 15,
    },
  });
}
