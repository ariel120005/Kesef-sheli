import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CATEGORIES, COLORS } from '../constants';
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
    <View style={styles.card}>
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
          return (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.categoryChip, selected && styles.categoryChipSelected]}
            >
              <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>
                {cat}
              </Text>
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

      <Pressable style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>הוספה</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'right',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 12,
  },
  categoryWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    color: COLORS.text,
    fontSize: 13,
  },
  categoryChipTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
