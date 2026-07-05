import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS } from '../constants';

interface Props {
  visible: boolean;
  initialValue: number | null;
  onClose: () => void;
  onSave: (value: number) => void;
}

export function SetBudgetModal({ visible, initialValue, onClose, onSave }: Props) {
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
        <View style={styles.card}>
          <Text style={styles.title}>הגדרת תקציב חודשי</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="לדוגמה: 5000"
            placeholderTextColor={COLORS.subtext}
            value={value}
            onChangeText={setValue}
            textAlign="right"
            autoFocus
          />
          <View style={styles.buttonsRow}>
            <Pressable style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Text style={styles.saveButtonText}>שמירה</Text>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'right',
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 16,
  },
  buttonsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontWeight: '600',
  },
});
