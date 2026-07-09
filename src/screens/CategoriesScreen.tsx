import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CategoryFormModal } from '../components/CategoryFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SHADOW } from '../constants';
import { isFirebaseConfigured } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useCategories } from '../hooks/useCategories';
import { useDemoBudgetData } from '../hooks/useDemoBudgetData';
import { useExpenses } from '../hooks/useExpenses';
import { ThemeColors, useTheme } from '../theme';
import { CategoryDef } from '../types';

interface Props {
  onBack: () => void;
}

export function CategoriesScreen({ onBack }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const uid = isFirebaseConfigured ? user?.uid ?? null : null;
  const firestoreCategories = useCategories(uid);
  const firestoreExpenses = useExpenses(uid);
  const demo = useDemoBudgetData();

  const { categories, expenses, addCategory, updateCategory, deleteCategory } = isFirebaseConfigured
    ? {
        categories: firestoreCategories.categories,
        expenses: firestoreExpenses.expenses,
        addCategory: firestoreCategories.addCategory,
        updateCategory: firestoreCategories.updateCategory,
        deleteCategory: firestoreCategories.deleteCategory,
      }
    : {
        categories: demo.categories,
        expenses: demo.expenses,
        addCategory: demo.addCategory,
        updateCategory: demo.updateCategory,
        deleteCategory: demo.deleteCategory,
      };

  const [formVisible, setFormVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDef | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CategoryDef | null>(null);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  const openAddForm = () => {
    setBlockedMessage(null);
    setEditingCategory(null);
    setFormVisible(true);
  };

  const openEditForm = (category: CategoryDef) => {
    setBlockedMessage(null);
    setEditingCategory(category);
    setFormVisible(true);
  };

  const requestDelete = (category: CategoryDef) => {
    const inUse = expenses.some((e) => e.category === category.name);
    if (inUse) {
      setBlockedMessage(`לא ניתן למחוק את "${category.name}" — יש הוצאות בקטגוריה הזו`);
      return;
    }
    setBlockedMessage(null);
    setPendingDelete(category);
  };

  if (isFirebaseConfigured && !user) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.header}>קטגוריות</Text>
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
          <Text style={styles.header}>קטגוריות</Text>
        </View>

        <Pressable style={[styles.addRow, SHADOW]} onPress={openAddForm}>
          <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
          <Text style={styles.addRowText}>קטגוריה חדשה</Text>
        </Pressable>

        {blockedMessage && (
          <View style={styles.blockedBanner}>
            <Text style={styles.blockedText}>{blockedMessage}</Text>
          </View>
        )}

        {categories.map((category) => (
          <View key={category.id} style={[styles.row, SHADOW]}>
            <Pressable onPress={() => requestDelete(category)} style={styles.iconButton} hitSlop={6}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
            <Pressable onPress={() => openEditForm(category)} style={styles.iconButton} hitSlop={6}>
              <Ionicons name="pencil-outline" size={18} color={colors.subtext} />
            </Pressable>
            <Text style={styles.rowText}>{category.name}</Text>
            <View style={[styles.colorDot, { backgroundColor: category.color }]} />
          </View>
        ))}
      </ScrollView>

      <CategoryFormModal
        visible={formVisible}
        initial={editingCategory}
        onClose={() => setFormVisible(false)}
        onSave={(name, color) => {
          if (editingCategory) updateCategory(editingCategory.id, name, color);
          else addCategory(name, color);
          setFormVisible(false);
        }}
      />

      <ConfirmDialog
        visible={!!pendingDelete}
        title="מחיקת קטגוריה"
        message={pendingDelete ? `למחוק את הקטגוריה "${pendingDelete.name}"?` : ''}
        confirmLabel="מחיקה"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteCategory(pendingDelete.id);
          setPendingDelete(null);
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
      fontSize: 30,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'right',
      letterSpacing: 0.2,
    },
    addRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    addRowText: {
      color: colors.accent,
      fontSize: 15,
      fontWeight: '700',
    },
    blockedBanner: {
      backgroundColor: colors.deleteBackground,
      borderRadius: 14,
      padding: 12,
      marginBottom: 14,
    },
    blockedText: {
      color: colors.danger,
      fontSize: 13,
      textAlign: 'right',
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
    colorDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
    },
    rowText: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
      textAlign: 'right',
    },
    iconButton: {
      padding: 4,
    },
  });
}
