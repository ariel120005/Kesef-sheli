import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SHADOW } from '../constants';
import { isFirebaseConfigured } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useDemoBudgetData } from '../hooks/useDemoBudgetData';
import { useNotificationSources } from '../hooks/useNotificationSources';
import { ThemeColors, useTheme } from '../theme';

interface Props {
  onBack: () => void;
}

export function NotificationSourcesScreen({ onBack }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const uid = isFirebaseConfigured ? user?.uid ?? null : null;
  const firestoreSources = useNotificationSources(uid);
  const demo = useDemoBudgetData();

  const { sources, toggleSource, addSource, removeSource } = isFirebaseConfigured
    ? {
        sources: firestoreSources.sources,
        toggleSource: firestoreSources.toggleSource,
        addSource: firestoreSources.addSource,
        removeSource: firestoreSources.removeSource,
      }
    : {
        sources: demo.notificationSources,
        toggleSource: demo.toggleNotificationSource,
        addSource: demo.addNotificationSource,
        removeSource: demo.removeNotificationSource,
      };

  const [addFormOpen, setAddFormOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newPackageName, setNewPackageName] = useState('');

  const handleAdd = () => {
    const label = newLabel.trim();
    const packageName = newPackageName.trim();
    if (!label || !packageName) return;
    addSource(packageName, label);
    setNewLabel('');
    setNewPackageName('');
    setAddFormOpen(false);
  };

  if (isFirebaseConfigured && !user) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.header}>אילו אפליקציות לעקוב אחריהן</Text>
        </View>
        <View style={styles.messageContainer}>
          <Ionicons name="lock-closed-outline" size={44} color={colors.subtext} />
          <Text style={styles.messageTitle}>יש להתחבר כדי לראות את הנתונים</Text>
          <Text style={styles.messageSubtitle}>לחצו על אייקון הפרופיל כדי להתחבר או להירשם</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.header}>אילו אפליקציות לעקוב אחריהן</Text>
        </View>

        <View style={[styles.noticeCard, SHADOW]}>
          <Text style={styles.noticeText}>
            הרשאת אנדרואיד למאזין התראות היא כללית ומאפשרת גישה טכנית לכל ההתראות במכשיר, אך
            האפליקציה שלנו מסננת ומתעלמת לחלוטין מכל התראה שאינה מהאפליקציות שסימנתם למטה — אין
            שמירה, לוג, או עיבוד של תוכן מהתראות אחרות. כברירת מחדל הכל כבוי; יש לבחור באופן אקטיבי
            אילו אפליקציות (למשל אפליקציית הבנק, Bit) מותר להאזין להן.
          </Text>
        </View>

        {sources.length === 0 && (
          <Text style={styles.emptyText}>עדיין לא נוספו אפליקציות — הוסיפו אחת למטה</Text>
        )}

        {sources.map((source) => (
          <View key={source.id} style={[styles.row, SHADOW]}>
            <Switch
              value={source.enabled}
              onValueChange={(value) => toggleSource(source.id, value)}
              trackColor={{ false: colors.chipBackground, true: colors.accent }}
              thumbColor="#FFFFFF"
            />
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowLabel}>{source.label}</Text>
              <Text style={styles.rowPackage}>{source.packageName}</Text>
            </View>
            {!source.isPreset && (
              <Pressable onPress={() => removeSource(source.id)} style={styles.deleteButton} hitSlop={6}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            )}
          </View>
        ))}

        {addFormOpen ? (
          <View style={[styles.addForm, SHADOW]}>
            <TextInput
              style={styles.input}
              placeholder="שם לתצוגה (למשל: בנק הפועלים)"
              placeholderTextColor={colors.subtext}
              value={newLabel}
              onChangeText={setNewLabel}
              textAlign="right"
            />
            <TextInput
              style={styles.input}
              placeholder="שם החבילה (package name), למשל com.example.app"
              placeholderTextColor={colors.subtext}
              value={newPackageName}
              onChangeText={setNewPackageName}
              textAlign="right"
              autoCapitalize="none"
            />
            <Text style={styles.tipText}>
              איך למצוא את שם החבילה: חפשו את האפליקציה בחנות Google Play מהדפדפן — שם החבילה
              מופיע בכתובת ה-URL אחרי "id=" (לדוגמה: play.google.com/store/apps/details?id=
              com.example.app).
            </Text>
            <View style={styles.addFormButtonsRow}>
              <Pressable style={styles.addFormButton} onPress={handleAdd}>
                <Text style={styles.addFormButtonText}>הוספה</Text>
              </Pressable>
              <Pressable
                style={[styles.addFormButton, styles.addFormCancelButton]}
                onPress={() => setAddFormOpen(false)}
              >
                <Text style={styles.addFormCancelText}>ביטול</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={[styles.addRow, SHADOW]} onPress={() => setAddFormOpen(true)}>
            <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
            <Text style={styles.addRowText}>הוספת אפליקציה ידנית</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: 22,
      paddingBottom: 40,
    },
    messageContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      gap: 12,
    },
    messageTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    messageSubtitle: {
      fontSize: 14,
      color: colors.subtext,
      textAlign: 'center',
    },
    headerRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
      marginBottom: 20,
    },
    backButton: {
      borderRadius: 10,
      padding: 4,
    },
    header: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'right',
      letterSpacing: 0.2,
      flex: 1,
    },
    noticeCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    noticeText: {
      color: colors.subtext,
      fontSize: 13,
      textAlign: 'right',
      lineHeight: 19,
    },
    emptyText: {
      color: colors.subtext,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 16,
    },
    row: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    rowTextWrap: {
      flex: 1,
    },
    rowLabel: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
      textAlign: 'right',
    },
    rowPackage: {
      color: colors.subtext,
      fontSize: 12,
      textAlign: 'right',
      marginTop: 2,
    },
    deleteButton: {
      padding: 4,
    },
    addRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    addRowText: {
      color: colors.accent,
      fontSize: 15,
      fontWeight: '700',
    },
    addForm: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.chipBackground,
      borderRadius: 14,
      padding: 14,
      fontSize: 14,
      color: colors.text,
      marginBottom: 12,
    },
    tipText: {
      color: colors.subtext,
      fontSize: 11,
      textAlign: 'right',
      lineHeight: 16,
      marginBottom: 14,
    },
    addFormButtonsRow: {
      flexDirection: 'row-reverse',
      gap: 12,
    },
    addFormButton: {
      flex: 1,
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: 'center',
    },
    addFormButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    addFormCancelButton: {
      backgroundColor: colors.chipBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    addFormCancelText: {
      color: colors.text,
      fontWeight: '600',
    },
  });
}
