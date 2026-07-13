import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemeColors, useTheme } from '../theme';

interface Props {
  visible: boolean;
  onScanned: (code: string) => void;
  onClose: () => void;
}

// Native QR scanner for the "הצטרף לטיול" flow — expo-camera's CameraView with barcode
// scanning. See QRScannerModal.web.tsx for the browser fallback: reliably decoding a live camera
// feed in a generic browser needs another dependency, so web just points back to manual entry.
export function QRScannerModal({ visible, onScanned, onClose }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) setScanned(false);
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {!permission ? null : !permission.granted ? (
          <View style={styles.permissionWrap}>
            <Ionicons name="camera-outline" size={40} color={colors.subtext} />
            <Text style={styles.permissionText}>נדרשת גישה למצלמה כדי לסרוק קוד QR</Text>
            <Pressable style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>אפשר גישה למצלמה</Text>
            </Pressable>
          </View>
        ) : (
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={
              scanned
                ? undefined
                : ({ data }) => {
                    setScanned(true);
                    onScanned(data);
                  }
            }
          />
        )}
        <Pressable style={styles.closeButton} onPress={onClose} hitSlop={10}>
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </Pressable>
      </View>
    </Modal>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000',
    },
    permissionWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 32,
    },
    permissionText: {
      color: colors.subtext,
      fontSize: 15,
      textAlign: 'center',
    },
    permissionButton: {
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    permissionButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    closeButton: {
      position: 'absolute',
      top: 50,
      left: 20,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 20,
      padding: 8,
    },
  });
}
