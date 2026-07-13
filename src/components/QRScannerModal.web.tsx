import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemeColors, useTheme } from '../theme';

interface Props {
  visible: boolean;
  onScanned: (code: string) => void;
  onClose: () => void;
}

// Reliably decoding a live camera QR feed needs a native camera module (see QRScannerModal.tsx)
// — the web preview has no such thing, so this just explains that manual code entry is the way
// to join a trip from a browser, instead of silently doing nothing.
export function QRScannerModal({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Ionicons name="qr-code-outline" size={40} color={colors.subtext} />
          <Text style={styles.text}>
            סריקת QR זמינה רק באפליקציה הניידת. יש להזין את הקוד בן 6 הספרות ידנית.
          </Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>סגירה</Text>
          </Pressable>
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
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 28,
      alignItems: 'center',
      gap: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      maxWidth: 320,
    },
    text: {
      color: colors.subtext,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    closeButton: {
      backgroundColor: colors.chipBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 24,
    },
    closeButtonText: {
      color: colors.text,
      fontWeight: '700',
    },
  });
}
