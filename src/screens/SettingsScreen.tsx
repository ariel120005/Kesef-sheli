import { Ionicons } from '@expo/vector-icons';
import { collection, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { AmountInputModal } from '../components/AmountInputModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CurrencyPicker } from '../components/CurrencyPicker';
import { SHADOW } from '../constants';
import { exportExpensesCSV } from '../csvExport';
import { db, isFirebaseConfigured } from '../firebase';
import { useAppSettings } from '../hooks/useAppSettings';
import { useAuth } from '../hooks/useAuth';
import { useDemoBudgetData } from '../hooks/useDemoBudgetData';
import { useExpenses } from '../hooks/useExpenses';
import { ThemeColors, useTheme } from '../theme';

interface Props {
  onBack: () => void;
  onOpenCategories: () => void;
  onOpenParseTest: () => void;
  onOpenNotificationSources: () => void;
}

export function SettingsScreen({
  onBack,
  onOpenCategories,
  onOpenParseTest,
  onOpenNotificationSources,
}: Props) {
  const { colors, mode, toggleTheme } = useTheme();
  const styles = getStyles(colors);
  const { user, signOut } = useAuth();
  const uid = isFirebaseConfigured ? user?.uid ?? null : null;
  const firestoreExpenses = useExpenses(uid);
  const firestoreSettings = useAppSettings(uid);
  const demo = useDemoBudgetData();
  const [deleting, setDeleting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingResetStep1, setConfirmingResetStep1] = useState(false);
  const [confirmingResetStep2, setConfirmingResetStep2] = useState(false);
  const [monthStartModalVisible, setMonthStartModalVisible] = useState(false);

  // Categories/default currency/month-start-day/export/reset are per-account features — in real
  // (non-demo) mode they only make sense once actually signed in; in demo mode there's no
  // sign-in concept at all, so they stay available like every other demo feature.
  const showAccountFeatures = !isFirebaseConfigured || !!user;

  const { expenses, defaultCurrency, monthStartDay, updateDefaultCurrency, updateMonthStartDay } =
    isFirebaseConfigured
      ? {
          expenses: firestoreExpenses.expenses,
          defaultCurrency: firestoreSettings.defaultCurrency,
          monthStartDay: firestoreSettings.monthStartDay,
          updateDefaultCurrency: firestoreSettings.updateDefaultCurrency,
          updateMonthStartDay: firestoreSettings.updateMonthStartDay,
        }
      : {
          expenses: demo.expenses,
          defaultCurrency: demo.defaultCurrency,
          monthStartDay: demo.monthStartDay,
          updateDefaultCurrency: demo.updateDefaultCurrency,
          updateMonthStartDay: demo.updateMonthStartDay,
        };

  const handleDeleteData = async () => {
    if (!user || !db) return;
    setDeleting(true);
    try {
      const expensesSnapshot = await getDocs(collection(db, 'users', user.uid, 'expenses'));
      const batch = writeBatch(db);
      expensesSnapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();
      await deleteDoc(doc(db, 'users', user.uid));
    } finally {
      setDeleting(false);
    }
  };

  const handleResetExpenses = async () => {
    if (!isFirebaseConfigured) {
      demo.resetAllData();
      return;
    }
    if (!user || !db) return;
    setResetting(true);
    try {
      const expensesSnapshot = await getDocs(collection(db, 'users', user.uid, 'expenses'));
      const batch = writeBatch(db);
      expensesSnapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();
    } finally {
      setResetting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.header}>הגדרות</Text>
      </View>

      <View style={[styles.card, SHADOW]}>
        <View style={styles.row}>
          <Switch
            value={mode === 'light'}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.chipBackground, true: colors.turquoise }}
            thumbColor="#FFFFFF"
          />
          <View style={styles.rowLabel}>
            <Ionicons
              name={mode === 'dark' ? 'moon-outline' : 'sunny-outline'}
              size={20}
              color={colors.text}
            />
            <Text style={styles.rowText}>מצב תצוגה בהיר</Text>
          </View>
        </View>
      </View>

      {showAccountFeatures && (
        <>
          <View style={[styles.card, SHADOW]}>
            <View style={styles.row}>
              <CurrencyPicker value={defaultCurrency} onChange={updateDefaultCurrency} />
              <View style={styles.rowLabel}>
                <Ionicons name="cash-outline" size={20} color={colors.text} />
                <Text style={styles.rowText}>מטבע ברירת מחדל</Text>
              </View>
            </View>
          </View>

          <Pressable
            style={[styles.card, styles.actionCard, SHADOW]}
            onPress={() => setMonthStartModalVisible(true)}
          >
            <Text style={styles.dayValue}>{monthStartDay}</Text>
            <View style={styles.rowLabel}>
              <Ionicons name="calendar-outline" size={20} color={colors.text} />
              <Text style={styles.rowText}>יום תחילת חודש</Text>
            </View>
          </Pressable>

          <Pressable style={[styles.card, styles.actionCard, SHADOW]} onPress={onOpenCategories}>
            <Ionicons name="chevron-back" size={18} color={colors.subtext} />
            <View style={styles.rowLabel}>
              <Ionicons name="pricetags-outline" size={20} color={colors.text} />
              <Text style={styles.rowText}>ניהול קטגוריות</Text>
            </View>
          </Pressable>

          <Pressable style={[styles.card, styles.actionCard, SHADOW]} onPress={onOpenParseTest}>
            <Ionicons name="chevron-back" size={18} color={colors.subtext} />
            <View style={styles.rowLabel}>
              <Ionicons name="flask-outline" size={20} color={colors.text} />
              <Text style={styles.rowText}>בדיקת פענוח התראות (פיתוח)</Text>
            </View>
          </Pressable>

          <Pressable style={[styles.card, styles.actionCard, SHADOW]} onPress={onOpenNotificationSources}>
            <Ionicons name="chevron-back" size={18} color={colors.subtext} />
            <View style={styles.rowLabel}>
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
              <Text style={styles.rowText}>אילו אפליקציות לעקוב אחריהן</Text>
            </View>
          </Pressable>

          <Pressable
            style={[styles.card, styles.actionCard, SHADOW]}
            onPress={() => exportExpensesCSV(expenses)}
          >
            <Text style={styles.actionText}>ייצוא נתונים (CSV)</Text>
            <Ionicons name="download-outline" size={20} color={colors.text} />
          </Pressable>

          <Pressable
            style={[styles.card, styles.actionCard, SHADOW]}
            onPress={() => setConfirmingResetStep1(true)}
            disabled={resetting}
          >
            <Text style={[styles.actionText, styles.dangerText]}>איפוס נתונים</Text>
            {resetting ? (
              <ActivityIndicator color={colors.danger} />
            ) : (
              <Ionicons name="refresh-outline" size={20} color={colors.danger} />
            )}
          </Pressable>
        </>
      )}

      {user && (
        <>
          <Pressable
            style={[styles.card, styles.actionCard, SHADOW]}
            onPress={() => setConfirmingLogout(true)}
          >
            <Text style={styles.actionText}>התנתקות</Text>
            <Ionicons name="log-out-outline" size={20} color={colors.text} />
          </Pressable>

          <Pressable
            style={[styles.card, styles.actionCard, SHADOW]}
            onPress={() => setConfirmingDelete(true)}
            disabled={deleting}
          >
            <Text style={[styles.actionText, styles.dangerText]}>מחיקת החשבון</Text>
            {deleting ? (
              <ActivityIndicator color={colors.danger} />
            ) : (
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            )}
          </Pressable>
        </>
      )}
      </ScrollView>

      <AmountInputModal
        visible={monthStartModalVisible}
        title="יום תחילת החודש"
        placeholder="לדוגמה: 1"
        initialValue={monthStartDay}
        onClose={() => setMonthStartModalVisible(false)}
        onSave={(value) => updateMonthStartDay(Math.min(28, Math.max(1, Math.round(value))))}
      />

      <ConfirmDialog
        visible={confirmingLogout}
        title="התנתקות"
        message="להתנתק מהחשבון?"
        confirmLabel="התנתקות"
        onCancel={() => setConfirmingLogout(false)}
        onConfirm={() => {
          setConfirmingLogout(false);
          signOut();
        }}
      />

      <ConfirmDialog
        visible={confirmingDelete}
        title="מחיקת החשבון"
        message="פעולה זו תמחק לצמיתות את כל הנתונים שלכם, כולל התקציב והקטגוריות. לא ניתן לבטל."
        confirmLabel="מחיקה"
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => {
          setConfirmingDelete(false);
          handleDeleteData();
        }}
      />

      <ConfirmDialog
        visible={confirmingResetStep1}
        title="איפוס נתונים"
        message="פעולה זו תמחק את כל ההוצאות וההיסטוריה שלכם. להמשיך?"
        confirmLabel="המשך"
        onCancel={() => setConfirmingResetStep1(false)}
        onConfirm={() => {
          setConfirmingResetStep1(false);
          setConfirmingResetStep2(true);
        }}
      />

      <ConfirmDialog
        visible={confirmingResetStep2}
        title="אזהרה אחרונה"
        message="האם אתה בטוח? פעולה זו בלתי הפיכה."
        confirmLabel="איפוס"
        onCancel={() => setConfirmingResetStep2(false)}
        onConfirm={() => {
          setConfirmingResetStep2(false);
          handleResetExpenses();
        }}
      />
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
    headerRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
      marginBottom: 24,
    },
    backButton: {
      borderRadius: 10,
      padding: 4,
    },
    header: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'right',
      letterSpacing: 0.2,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    row: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowLabel: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
    },
    rowText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    dayValue: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.turquoise,
    },
    actionCard: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    actionText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    dangerText: {
      color: colors.danger,
    },
  });
}
