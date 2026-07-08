import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { guessCategoryFromMerchant, ParsedBankNotification, parseBankNotification } from '../bankNotificationParser';
import { SHADOW } from '../constants';
import { isFirebaseConfigured } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useCategories } from '../hooks/useCategories';
import { useDemoBudgetData } from '../hooks/useDemoBudgetData';
import { ThemeColors, useTheme } from '../theme';
import { formatCurrency } from '../utils';

interface Props {
  onBack: () => void;
}

const EXAMPLES = [
  'עדכון חיוב: חויב חשבונך ב-89.50 ש"ח בבית העסק שופרסל דיל',
  'התבצעה עסקה בכרטיסך המסתיים ב-1234 בסך 45.90 ש"ח אצל סופר פארם',
  'קיבלת 200 ש"ח מדני כהן בביט',
  'התקבלה העברה לחשבונך בסך 500 ש"ח מרונית לוי',
  'מחכים לך 75 ש"ח מדני כהן בביט',
  'היי, ביקשת שנעדכן אותך על עסקאות בסכום גבוה: היום 06/07 בית עסקKING MEAT חייב את כרטיסך בסך155.0 שח כדאי לעקוב אחר החיובים כאן:',
];

export function ParseTestScreen({ onBack }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const uid = isFirebaseConfigured ? user?.uid ?? null : null;
  const firestoreCategories = useCategories(uid);
  const demo = useDemoBudgetData();
  const categories = isFirebaseConfigured ? firestoreCategories.categories : demo.categories;

  const [text, setText] = useState('');
  const [result, setResult] = useState<ParsedBankNotification | null | 'notChecked'>('notChecked');

  // This screen tests the text-parsing logic only — it always parses whatever is pasted below,
  // with no source-app filtering. isNotificationSourceApproved (src/notificationFilter.ts) gates
  // the real (future) NotificationListenerService, which has no equivalent here since there's no
  // "sending app" in a manually-pasted test string, only text typed in by hand.
  const handleCheck = () => {
    setResult(parseBankNotification(text));
  };

  const guessedCategory =
    result && result !== 'notChecked' && result.kind === 'charge'
      ? guessCategoryFromMerchant(result.merchant, categories)
      : null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.header}>בדיקת פענוח</Text>
        </View>

        <Text style={styles.notice}>
          כלי פיתוח זמני: הדביקו כאן טקסט של התראה אמיתית מאפליקציית הבנק/כרטיס האשראי שלכם כדי
          לבדוק מה המערכת מזהה ממנה — לפני שיש הרשאה אמיתית לקרוא התראות במכשיר.
        </Text>

        <View style={styles.examplesWrap}>
          {EXAMPLES.map((example, index) => (
            <Pressable key={index} style={styles.exampleChip} onPress={() => setText(example)}>
              <Text style={styles.exampleChipText} numberOfLines={1}>
                {example}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          style={styles.textarea}
          placeholder="הדביקו כאן את טקסט ההתראה..."
          placeholderTextColor={colors.subtext}
          value={text}
          onChangeText={setText}
          multiline
          numberOfLines={5}
          textAlign="right"
        />

        <Pressable style={[styles.checkButton, SHADOW]} onPress={handleCheck} disabled={!text.trim()}>
          <Text style={styles.checkButtonText}>בדוק</Text>
        </Pressable>

        {result !== 'notChecked' && (
          <View style={[styles.resultCard, SHADOW]}>
            {result === null ? (
              <Text style={styles.resultFail}>לא זוהתה התראת בנק מוכרת בטקסט הזה</Text>
            ) : (
              <>
                <ResultRow label="סוג" value={result.kind === 'charge' ? 'חיוב' : 'זיכוי'} />
                <ResultRow label="סכום" value={formatCurrency(result.amount)} />
                <ResultRow
                  label={result.kind === 'charge' ? 'בית עסק' : 'שולח'}
                  value={result.merchant ?? 'לא זוהה'}
                />
                {result.kind === 'charge' && (
                  <ResultRow label="קטגוריה מוצעת" value={guessedCategory ?? 'לא זוהתה — יש לבחור ידנית'} />
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultValue}>{value}</Text>
      <Text style={styles.resultLabel}>{label}</Text>
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
      marginBottom: 16,
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
    notice: {
      color: colors.subtext,
      fontSize: 13,
      textAlign: 'right',
      lineHeight: 19,
      marginBottom: 18,
    },
    examplesWrap: {
      gap: 8,
      marginBottom: 16,
    },
    exampleChip: {
      backgroundColor: colors.chipBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingVertical: 9,
      paddingHorizontal: 14,
    },
    exampleChipText: {
      color: colors.text,
      fontSize: 12,
      textAlign: 'right',
    },
    textarea: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.chipBackground,
      borderRadius: 14,
      padding: 14,
      fontSize: 14,
      color: colors.text,
      minHeight: 110,
      textAlignVertical: 'top',
      marginBottom: 16,
    },
    checkButton: {
      backgroundColor: colors.turquoise,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 20,
    },
    checkButtonText: {
      color: '#0A0A0F',
      fontWeight: '700',
      fontSize: 15,
    },
    resultCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    resultFail: {
      color: colors.danger,
      fontSize: 14,
      textAlign: 'right',
    },
    resultRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    resultLabel: {
      color: colors.subtext,
      fontSize: 13,
    },
    resultValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
  });
}
