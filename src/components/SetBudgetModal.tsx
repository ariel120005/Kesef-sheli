import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GRADIENTS, SHADOW } from '../constants';
import { ThemeColors, useTheme } from '../theme';

interface Props {
  visible: boolean;
  initialValue: number | null;
  onClose: () => void;
  onSave: (value: number) => void;
}

export function SetBudgetModal({ visible, initialValue, onClose, onSave }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [value, setValue] = useState('');

  useEffect(() => {
    if (visible) setValue(initialValue !== null ? String(initialValue) : '');
  }, [visible, initialValue]);

  const handleSave = () => {
    const parsed = Number(value.replace(',', '.'));
    if (!value || isNaN(parsed) || parsed <= 0) return;
    onSave(parsed);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, SHADOW]}>
          <Text style={styles.title}>הגדרת תקציב חודשי</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="לדוגמה: 5000"
            placeholderTextColor={colors.subtext}
            value={value}
            onChangeText={setValue}
            textAlign="right"
            autoFocus
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
      fontSize: 16,
      color: colors.text,
      marginBottom: 20,
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
