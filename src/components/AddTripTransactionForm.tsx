import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GRADIENTS, SHADOW } from '../constants';
import { ThemeColors, useTheme } from '../theme';
import { TripTransactionType } from '../types';

interface Props {
  onAdd: (type: TripTransactionType, amount: number, note: string) => void;
}

const TYPE_OPTIONS: { key: TripTransactionType; label: string }[] = [
  { key: 'expense', label: 'הוצאה' },
  { key: 'reimbursement', label: 'החזר' },
  { key: 'fee', label: 'עמלה' },
];

export function AddTripTransactionForm({ onAdd }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [type, setType] = useState<TripTransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    const parsed = Number(amount.replace(',', '.'));
    if (!amount || isNaN(parsed) || parsed <= 0) return;
    onAdd(type, parsed, note.trim());
    setAmount('');
    setNote('');
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
      color: '#0A0A0F',
      fontWeight: '700',
      fontSize: 13,
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
