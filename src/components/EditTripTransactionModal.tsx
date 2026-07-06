import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GRADIENTS, SHADOW } from '../constants';
import { ThemeColors, useTheme } from '../theme';
import { TripTransaction, TripTransactionType } from '../types';

interface Props {
  transaction: TripTransaction | null;
  onClose: () => void;
  onSave: (id: string, type: TripTransactionType, amount: number, note: string) => void;
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

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(String(transaction.amount));
      setNote(transaction.note);
    }
  }, [transaction]);

  const handleSave = () => {
    if (!transaction) return;
    const parsed = Number(amount.replace(',', '.'));
    if (!amount || isNaN(parsed) || parsed <= 0) return;
    onSave(transaction.id, type, parsed, note.trim());
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
            placeholder="סכום (₪)"
            placeholderTextColor={colors.subtext}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            textAlign="right"
          />

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
      color: '#0A0A0F',
      fontWeight: '700',
      fontSize: 13,
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
