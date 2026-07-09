import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SHADOW } from '../constants';
import { ThemeColors, useTheme } from '../theme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

// Alert.alert is a no-op stub on react-native-web (no native dialog exists there),
// so any confirm flow that needs to work in the web preview goes through this
// custom modal instead — it renders identically on native and web.
export function ConfirmDialog({ visible, title, message, confirmLabel, onCancel, onConfirm }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.card, SHADOW]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonsRow}>
            <Pressable style={[styles.button, styles.confirmButton]} onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onCancel}>
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
      marginBottom: 10,
    },
    message: {
      fontSize: 14,
      color: colors.subtext,
      textAlign: 'right',
      lineHeight: 20,
      marginBottom: 20,
    },
    buttonsRow: {
      flexDirection: 'row-reverse',
      gap: 12,
    },
    button: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    confirmButton: {
      backgroundColor: colors.danger,
    },
    confirmButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    cancelButton: {
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
