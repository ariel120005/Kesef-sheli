import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { CATEGORIES, GRADIENTS, SHADOW } from '../constants';
import { formatForeignAmount, getExchangeRateToILS } from '../currency';
import { ThemeColors, useTheme } from '../theme';
import { Category, Currency, Expense } from '../types';
import { CurrencyPicker } from './CurrencyPicker';

interface Props {
  expense: Expense | null;
  onClose: () => void;
  onSave: (
    id: string,
    amount: number,
    category: Category,
    note: string,
    recurring: boolean,
    originalAmount: number | null,
    originalCurrency: Currency | null
  ) => void;
}

export function EditExpenseModal({ expense, onClose, onSave }: Props) {
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
    if (expense) {
      const hasOriginal = !!expense.originalCurrency && expense.originalAmount != null;
      setAmount(String(hasOriginal ? expense.originalAmount : expense.amount));
      setCategory(expense.category);
      setNote(expense.note);
      setRecurring(!!expense.recurring);
      setCurrency(hasOriginal ? (expense.originalCurrency as Currency) : 'ILS');
    }
  }, [expense]);

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

  const handleSave = () => {
    if (!expense) return;
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (currency !== 'ILS') {
      if (!rate) return;
      onSave(expense.id, parsedAmount * rate, category, note.trim(), recurring, parsedAmount, currency);
    } else {
      onSave(expense.id, parsedAmount, category, note.trim(), recurring, null, null);
    }
    onClose();
  };

  return (
    <Modal visible={!!expense} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, SHADOW]}>
          <Text style={styles.title}>עריכת הוצאה</Text>

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

          <View style={styles.buttonsRow}>
            <Pressable style={styles.button} onPress={handleSave}>
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>שמירה</Text>
              </LinearGradient>
            </Pressable>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelButtonText}>ביטול</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'center',
      padding: 24,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    title: {
      fontSize: 18,
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
      marginBottom: 20,
    },
    recurringText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    buttonsRow: {
      flexDirection: 'row-reverse',
      gap: 12,
    },
    button: {
      flex: 1,
      borderRadius: 14,
      overflow: 'hidden',
    },
    saveButton: {
      paddingVertical: 14,
      alignItems: 'center',
    },
    saveButtonText: {
      color: '#0A0A0F',
      fontWeight: '700',
    },
    cancelButton: {
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: colors.chipBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      color: colors.text,
      fontWeight: '600',
    },
  });
}
