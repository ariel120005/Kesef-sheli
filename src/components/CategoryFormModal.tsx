import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CATEGORY_COLOR_SWATCHES, GRADIENTS, SHADOW } from '../constants';
import { ThemeColors, useTheme } from '../theme';
import { CategoryDef } from '../types';

interface Props {
  visible: boolean;
  initial: CategoryDef | null;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
}

// Shared by "add category" and "edit category" — a null `initial` means add.
export function CategoryFormModal({ visible, initial, onClose, onSave }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [name, setName] = useState('');
  const [color, setColor] = useState(CATEGORY_COLOR_SWATCHES[0]);

  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setColor(initial?.color ?? CATEGORY_COLOR_SWATCHES[0]);
    }
  }, [visible, initial]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, color);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, SHADOW]}>
          <Text style={styles.title}>{initial ? 'עריכת קטגוריה' : 'קטגוריה חדשה'}</Text>

          <TextInput
            style={styles.input}
            placeholder="שם הקטגוריה"
            placeholderTextColor={colors.subtext}
            value={name}
            onChangeText={setName}
            textAlign="right"
            autoFocus
          />

          <View style={styles.swatchWrap}>
            {CATEGORY_COLOR_SWATCHES.map((swatch) => {
              const selected = swatch === color;
              return (
                <Pressable
                  key={swatch}
                  onPress={() => setColor(swatch)}
                  style={[styles.swatch, { backgroundColor: swatch }, selected && styles.swatchSelected]}
                >
                  {selected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </Pressable>
              );
            })}
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
      marginBottom: 18,
    },
    swatchWrap: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 22,
    },
    swatch: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    swatchSelected: {
      borderWidth: 3,
      borderColor: colors.text,
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
