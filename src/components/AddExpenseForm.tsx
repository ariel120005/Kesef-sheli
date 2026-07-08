import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { CATEGORIES, GRADIENTS, SHADOW } from '../constants';
import { formatForeignAmount, getExchangeRateToILS } from '../currency';
import { ThemeColors, useTheme } from '../theme';
import { Category, Currency } from '../types';
import { CurrencyPicker } from './CurrencyPicker';

interface Props {
  onAdd: (
    amount: number,
    category: Category,
    note: string,
    recurring: boolean,
    originalAmount: number | null,
    originalCurrency: Currency | null
  ) => void;
}

const QUICK_AMOUNTS = [20, 50, 100, 200];

export function AddExpenseForm({ onAdd }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [note, setNote] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [currency, setCurrency] = useState<Currency | 'ILS'>('ILS');
  const [rate, setRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);

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
  const isForeign = currency !== 'ILS';
  const convertedILS = isForeign && rate && !isNaN(parsedAmount) ? parsedAmount * rate : null;

  const handleSubmit = () => {
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (isForeign) {
      if (!rate) return;
      onAdd(parsedAmount * rate, category, note.trim(), recurring, parsedAmount, currency);
    } else {
      onAdd(parsedAmount, category, note.trim(), recurring, null, null);
    }
    setAmount('');
    setNote('');
    setRecurring(false);
    setCurrency('ILS');
  };

  return (
    <View style={[styles.card, SHADOW]}>
      <Text style={styles.title}>הוספת הוצאה</Text>

      <TextInput
        style={styles.input}
        placeholder={isForeign ? 'סכום' : 'סכום (₪)'}
        placeholderTextColor={colors.subtext}
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        textAlign="right"
      />

      <View style={styles.quickAmountsWrap}>
        {QUICK_AMOUNTS.map((value) => (
          <Pressable
            key={value}
            onPress={() => setAmount(String(value))}
            style={styles.quickAmountChip}
          >
            <Text style={styles.quickAmountChipText}>{`₪${value}`}</Text>
          </Pressable>
        ))}
      </View>

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

      <View style={styles.categoryWrap}>
        {CATEGORIES.map((cat) => {
          const selected = cat === category;
          if (selected) {
            return (
              <Pressable key={cat} onPress={() => setCategory(cat)}>
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.categoryChip, styles.categoryChipSelected]}
                >
                  <Text style={styles.categoryChipTextSelected}>{cat}</Text>
                </LinearGradient>
              </Pressable>
            );
          }
          return (
            <Pressable key={cat} onPress={() => setCategory(cat)} style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{cat}</Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        style={styles.input}
        placeholder="הערה (לא חובה)"
        placeholderTextColor={colors.subtext}
        value={note}
        onChangeText={setNote}
        textAlign="right"
      />

      <View style={styles.recurringRow}>
        <Switch
          value={recurring}
          onValueChange={setRecurring}
          trackColor={{ false: colors.chipBackground, true: colors.turquoise }}
          thumbColor="#FFFFFF"
        />
        <Text style={styles.recurringText}>הוצאה קבועה כל חודש</Text>
      </View>

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
    quickAmountsWrap: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    quickAmountChip: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.chipBackground,
      borderRadius: 20,
      paddingVertical: 7,
      paddingHorizontal: 14,
    },
    quickAmountChipText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '600',
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
    categoryWrap: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 16,
    },
    categoryChip: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.chipBackground,
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    categoryChipSelected: {
      borderWidth: 0,
    },
    categoryChipText: {
      color: colors.text,
      fontSize: 13,
    },
    categoryChipTextSelected: {
      color: '#0A0A0F',
      fontWeight: '700',
      fontSize: 13,
    },
    recurringRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
    },
    recurringText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    submitButton: {
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
    },
    submitButtonText: {
      color: '#0A0A0F',
      fontWeight: '700',
      fontSize: 15,
    },
  });
}
