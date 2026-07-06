import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { CATEGORIES, GRADIENTS, SHADOW } from '../constants';
import { ThemeColors, useTheme } from '../theme';
import { Category, Expense } from '../types';

interface Props {
  expense: Expense | null;
  onClose: () => void;
  onSave: (id: string, amount: number, category: Category, note: string, recurring: boolean) => void;
}

export function EditExpenseModal({ expense, onClose, onSave }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [note, setNote] = useState('');
  const [recurring, setRecurring] = useState(false);

  useEffect(() => {
    if (expense) {
      setAmount(String(expense.amount));
      setCategory(expense.category);
      setNote(expense.note);
      setRecurring(!!expense.recurring);
    }
  }, [expense]);

  const handleSave = () => {
    if (!expense) return;
    const parsed = Number(amount.replace(',', '.'));
    if (!amount || isNaN(parsed) || parsed <= 0) return;
    onSave(expense.id, parsed, category, note.trim(), recurring);
    onClose();
  };

  return (
    <Modal visible={!!expense} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, SHADOW]}>
          <Text style={styles.title}>עריכת הוצאה</Text>

          <TextInput
            style={styles.input}
            placeholder="סכום (₪)"
            placeholderTextColor={colors.subtext}
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
