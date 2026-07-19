import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { GRADIENTS, SHADOW } from '../constants';
import { formatForeignAmount, getExchangeRateToILS } from '../currency';
import { ThemeColors, useTheme } from '../theme';
import { Category, CategoryDef, Currency } from '../types';
import { CurrencyPicker } from './CurrencyPicker';

interface Props {
  categories: CategoryDef[];
  defaultCurrency?: Currency | 'ILS';
  onAdd: (
    amount: number,
    category: Category,
    note: string,
    recurring: boolean,
    originalAmount: number | null,
    originalCurrency: Currency | null
  ) => void | Promise<void>;
}

const QUICK_AMOUNTS = [20, 50, 100, 200];

export function AddExpenseForm({ categories, defaultCurrency = 'ILS', onAdd }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('');
  const [note, setNote] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [currency, setCurrency] = useState<Currency | 'ILS'>(defaultCurrency);
  const [rate, setRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!category && categories.length > 0) setCategory(categories[0].name);
  }, [categories, category]);

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

  const handleSubmit = async () => {
    if (submitting) return;
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setSubmitError('יש להזין סכום תקין');
      return;
    }
    if (!category) {
      // Only reachable while categories are still loading (e.g. a brand-new Firestore account
      // whose default set hasn't finished seeding yet) — the chip row is genuinely empty then, so
      // there's nothing to silently fail on, but the message still explains why the button seems
      // to do nothing instead of just no-op-ing.
      setSubmitError('טוען קטגוריות... נסו שוב בעוד רגע');
      return;
    }
    if (isForeign && !rate) {
      setSubmitError('טוען שער המרה... נסו שוב בעוד רגע');
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      if (isForeign) {
        await onAdd(parsedAmount * rate!, category, note.trim(), recurring, parsedAmount, currency);
      } else {
        await onAdd(parsedAmount, category, note.trim(), recurring, null, null);
      }
      setAmount('');
      setNote('');
      setRecurring(false);
      setCurrency(defaultCurrency);
    } catch (err) {
      // Surfaced to the user instead of failing silently — e.g. a Firestore permission-denied
      // error (unconfigured security rules) would otherwise show nothing at all on click.
      console.error('Failed to add expense:', err);
      setSubmitError('שמירת ההוצאה נכשלה. בדקו את החיבור ונסו שוב.');
    } finally {
      setSubmitting(false);
    }
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
        {categories.map((cat) => {
          const selected = cat.name === category;
          if (selected) {
            return (
              <Pressable key={cat.id} onPress={() => setCategory(cat.name)}>
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.categoryChip, styles.categoryChipSelected]}
                >
                  <Text style={styles.categoryChipTextSelected}>{cat.name}</Text>
                </LinearGradient>
              </Pressable>
            );
          }
          return (
            <Pressable key={cat.id} onPress={() => setCategory(cat.name)} style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{cat.name}</Text>
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
          trackColor={{ false: colors.chipBackground, true: colors.accent }}
          thumbColor="#FFFFFF"
        />
        <Text style={styles.recurringText}>הוצאה קבועה כל חודש</Text>
      </View>

      {submitError && <Text style={styles.errorText}>{submitError}</Text>}

      <Pressable onPress={handleSubmit} disabled={submitting}>
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>הוספה</Text>
          )}
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
      color: '#FFFFFF',
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
    errorText: {
      color: colors.danger,
      fontSize: 13,
      textAlign: 'right',
      marginBottom: 12,
    },
    submitButton: {
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
    },
    submitButtonDisabled: {
      opacity: 0.7,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 15,
    },
  });
}
