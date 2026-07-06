import { Ionicons } from '@expo/vector-icons';
import { collection, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SHADOW } from '../constants';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { ThemeColors, useTheme } from '../theme';

export function SettingsScreen() {
  const { colors, mode, toggleTheme } = useTheme();
  const styles = getStyles(colors);
  const { user, signOut } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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

  return (
    <View style={styles.container}>
      <Text style={styles.header}>הגדרות</Text>

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
            <Text style={[styles.actionText, styles.dangerText]}>מחיקת כל הנתונים</Text>
            {deleting ? (
              <ActivityIndicator color={colors.danger} />
            ) : (
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            )}
          </Pressable>
        </>
      )}

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
        title="מחיקת כל הנתונים"
        message="פעולה זו תמחק לצמיתות את כל ההוצאות ואת התקציב שלכם. לא ניתן לבטל."
        confirmLabel="מחיקה"
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => {
          setConfirmingDelete(false);
          handleDeleteData();
        }}
      />
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 22,
    },
    header: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'right',
      marginBottom: 24,
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
