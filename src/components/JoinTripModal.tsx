import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GRADIENTS, SHADOW } from '../constants';
import { ThemeColors, useTheme } from '../theme';
import { QRScannerModal } from './QRScannerModal';

interface Props {
  visible: boolean;
  defaultDisplayName: string;
  onClose: () => void;
  onJoin: (code: string, displayName: string) => Promise<{ success: boolean; message: string }>;
}

export function JoinTripModal({ visible, defaultDisplayName, onClose, onJoin }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [code, setCode] = useState('');
  const [name, setName] = useState(defaultDisplayName);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setCode('');
    setName(defaultDisplayName);
    setMessage(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleJoin = async () => {
    if (code.trim().length !== 6 || !name.trim() || submitting) return;
    setSubmitting(true);
    const result = await onJoin(code.trim(), name.trim());
    setSubmitting(false);
    setMessage({ text: result.message, success: result.success });
    if (result.success) {
      setTimeout(handleClose, 900);
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
        <View style={styles.overlay}>
          <View style={[styles.card, SHADOW]}>
            <Text style={styles.title}>הצטרפות לטיול</Text>

            <TextInput
              style={styles.input}
              placeholder="השם שיוצג למשתתפים האחרים"
              placeholderTextColor={colors.subtext}
              value={name}
              onChangeText={setName}
              textAlign="right"
            />

            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="קוד בן 6 ספרות"
              placeholderTextColor={colors.subtext}
              value={code}
              onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="numeric"
              textAlign="center"
              maxLength={6}
            />

            <Pressable style={styles.scanButton} onPress={() => setScanning(true)}>
              <Ionicons name="qr-code-outline" size={18} color={colors.text} />
              <Text style={styles.scanButtonText}>סרוק QR</Text>
            </Pressable>

            {message && (
              <Text style={[styles.message, { color: message.success ? colors.safe : colors.danger }]}>
                {message.text}
              </Text>
            )}

            <View style={styles.buttonsRow}>
              <Pressable style={styles.flexButton} onPress={handleJoin} disabled={submitting}>
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.joinButton}
                >
                  <Text style={styles.joinButtonText}>{submitting ? 'מצטרפ/ת...' : 'הצטרפות'}</Text>
                </LinearGradient>
              </Pressable>
              <Pressable style={[styles.flexButton, styles.cancelButton]} onPress={handleClose}>
                <Text style={styles.cancelButtonText}>ביטול</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <QRScannerModal
        visible={scanning}
        onClose={() => setScanning(false)}
        onScanned={(scannedCode) => {
          setCode(scannedCode.replace(/[^0-9]/g, '').slice(0, 6));
          setScanning(false);
        }}
      />
    </>
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
      marginBottom: 14,
    },
    codeInput: {
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: 6,
    },
    scanButton: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 14,
      paddingVertical: 12,
      backgroundColor: colors.chipBackground,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
    },
    scanButtonText: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 13,
    },
    message: {
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 12,
    },
    buttonsRow: {
      flexDirection: 'row-reverse',
      gap: 12,
    },
    flexButton: {
      flex: 1,
      borderRadius: 14,
      overflow: 'hidden',
    },
    joinButton: {
      paddingVertical: 14,
      alignItems: 'center',
    },
    joinButtonText: {
      color: '#FFFFFF',
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
