import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { GRADIENTS, MAX_TRIP_PARTICIPANTS, SHADOW } from '../constants';
import { ThemeColors, useTheme } from '../theme';
import { Trip } from '../types';

interface Props {
  trip: Trip;
  currentUid: string;
  defaultDisplayName: string;
  onShare: (displayName: string) => void;
}

// Shows the "הפוך למשותף" prompt for a personal trip, or — once shared — the join code (as
// digits and a QR image), a native share-sheet button, and the participant list.
export function TripShareCard({ trip, currentUid, defaultDisplayName, onShare }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [name, setName] = useState(defaultDisplayName);
  const [confirming, setConfirming] = useState(false);

  if (!trip.isShared) {
    if (trip.endedAt) return null;
    return (
      <View style={[styles.card, SHADOW]}>
        <Text style={styles.title}>טיול משותף</Text>
        <Text style={styles.description}>
          הפכו את הטיול למשותף כדי להזמין חברים, לרשום הוצאות "לכולם" ולראות אוטומטית מי חייב למי.
        </Text>
        {confirming ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="השם שיוצג למשתתפים האחרים"
              placeholderTextColor={colors.subtext}
              value={name}
              onChangeText={setName}
              textAlign="right"
            />
            <View style={styles.buttonsRow}>
              <Pressable
                style={styles.flexButton}
                onPress={() => {
                  if (!name.trim()) return;
                  onShare(name.trim());
                  setConfirming(false);
                }}
              >
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.confirmButton}
                >
                  <Text style={styles.confirmButtonText}>אישור</Text>
                </LinearGradient>
              </Pressable>
              <Pressable style={[styles.flexButton, styles.cancelButton]} onPress={() => setConfirming(false)}>
                <Text style={styles.cancelButtonText}>ביטול</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Pressable onPress={() => setConfirming(true)}>
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shareButton}
            >
              <Ionicons name="people-outline" size={18} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>הפוך למשותף</Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>
    );
  }

  const participants = trip.participants ?? [];

  const shareCode = async () => {
    try {
      await Share.share({
        message: `הצטרפו לטיול "${trip.name}" שלי באפליקציית הכסף של בוקי! קוד ההצטרפות: ${trip.joinCode}`,
      });
    } catch {
      // Best-effort — some browsers have no share sheet at all; the code is already shown below.
    }
  };

  return (
    <View style={[styles.card, SHADOW]}>
      <Text style={styles.title}>טיול משותף</Text>

      <View style={styles.codeRow}>
        <View style={styles.qrWrap}>
          <QRCode value={trip.joinCode ?? ''} size={84} backgroundColor="#FFFFFF" color="#000000" />
        </View>
        <View style={styles.codeInfo}>
          <Text style={styles.codeLabel}>קוד הצטרפות</Text>
          <Text style={styles.code}>{trip.joinCode}</Text>
          <Text style={styles.participantCount}>
            {participants.length}/{MAX_TRIP_PARTICIPANTS} משתתפים
          </Text>
        </View>
      </View>

      <Pressable style={styles.shareCodeButton} onPress={shareCode}>
        <Ionicons name="share-social-outline" size={16} color={colors.text} />
        <Text style={styles.shareCodeButtonText}>שיתוף קוד ההצטרפות</Text>
      </Pressable>

      <View style={styles.participantsList}>
        {participants.map((p) => (
          <View key={p.uid} style={styles.participantRow}>
            <Ionicons name="person-circle-outline" size={18} color={colors.subtext} />
            <Text style={styles.participantName}>
              {p.displayName}
              {p.uid === currentUid ? ' (את/ה)' : ''}
              {p.uid === trip.ownerUid ? ' · מארגנ/ת' : ''}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 22,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'right',
      marginBottom: 10,
    },
    description: {
      color: colors.subtext,
      fontSize: 13,
      textAlign: 'right',
      lineHeight: 19,
      marginBottom: 16,
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
    buttonsRow: {
      flexDirection: 'row-reverse',
      gap: 12,
    },
    flexButton: {
      flex: 1,
      borderRadius: 14,
      overflow: 'hidden',
    },
    confirmButton: {
      paddingVertical: 13,
      alignItems: 'center',
    },
    confirmButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    cancelButton: {
      paddingVertical: 13,
      alignItems: 'center',
      backgroundColor: colors.chipBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      color: colors.text,
      fontWeight: '600',
    },
    shareButton: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 14,
      paddingVertical: 13,
    },
    shareButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 14,
    },
    codeRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 16,
      marginBottom: 14,
    },
    qrWrap: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 8,
    },
    codeInfo: {
      flex: 1,
      alignItems: 'flex-end',
    },
    codeLabel: {
      color: colors.subtext,
      fontSize: 12,
    },
    code: {
      color: colors.text,
      fontSize: 30,
      fontWeight: '800',
      letterSpacing: 4,
      marginVertical: 4,
    },
    participantCount: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: '700',
    },
    shareCodeButton: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 14,
      paddingVertical: 12,
      backgroundColor: colors.chipBackground,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    shareCodeButtonText: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 13,
    },
    participantsList: {
      gap: 10,
    },
    participantRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 8,
    },
    participantName: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'right',
    },
  });
}
