import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GRADIENTS, SHADOW } from '../constants';
import { formatForeignAmount, getExchangeRateToILS } from '../currency';
import { ThemeColors, useTheme } from '../theme';
import { Currency, TripTransaction, TripTransactionType } from '../types';
import { CurrencyPicker } from './CurrencyPicker';

interface Props {
  transaction: TripTransaction | null;
  onClose: () => void;
  onSave: (
    id: string,
    type: TripTransactionType,
    amount: number,
    note: string,
    originalAmount: number | null,
    originalCurrency: Currency | null
  ) => void;
}

const TYPE_OPTIONS: { key: TripTransactionType; label: string }[] = [
  { key: 'expense', label: 'הוצאה' },
  { key: 'reimbursement', label: 'החזר' },
  { key: 'fee', label: 'עמלה' },
];

export function EditTripTransactionModal({ transaction, onClose, onSave }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [type, setType] = useState<TripTransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [currency, setCurrency] = useState<Currency | 'ILS'>('ILS');
  const [rate, setRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      const hasOriginal = !!transaction.originalCurrency && transaction.originalAmount != null;
      setType(transaction.type);
      setAmount(String(hasOriginal ? transaction.originalAmount : transaction.amount));
      setNote(transaction.note);
      setCurrency(hasOriginal ? (transaction.originalCurrency as Currency) : 'ILS');
    }
  }, [transaction]);

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
    if (!transaction) return;
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (currency !== 'ILS') {
      if (!rate) return;
      onSave(transaction.id, type, parsedAmount * rate, note.trim(), parsedAmount, currency);
    } else {
      onSave(transaction.id, type, parsedAmount, note.trim(), null, null);
    }
    onClose();
  };

  return (
    <Modal visible={!!transaction} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, SHADOW]}>
          <Text style={styles.title}>עריכת תנועה</Text>

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
      color: '#FFFFFF',
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
