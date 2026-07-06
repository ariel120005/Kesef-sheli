import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CATEGORIES, COLORS, GRADIENTS, SHADOW } from '../constants';
import { Category } from '../types';

interface Props {
  onAdd: (amount: number, category: Category, note: string) => void;
}

export function AddExpenseForm({ onAdd }: Props) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    const parsed = Number(amount.replace(',', '.'));
    if (!amount || isNaN(parsed) || parsed <= 0) return;
    onAdd(parsed, category, note.trim());
    setAmount('');
    setNote('');
  };

  return (
    <View style={[styles.card, SHADOW]}>
      <Text style={styles.title}>הוספת הוצאה</Text>

      <TextInput
        style={styles.input}
        placeholder="סכום (₪)"
        placeholderTextColor={COLORS.subtext}
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        textAlign="right"
      />

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
        placeholderTextColor={COLORS.subtext}
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'right',
    marginBottom: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 16,
  },
  categoryWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.chipBackground,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  categoryChipSelected: {
    borderWidth: 0,
  },
  categoryChipText: {
    color: COLORS.text,
    fontSize: 13,
  },
  categoryChipTextSelected: {
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
