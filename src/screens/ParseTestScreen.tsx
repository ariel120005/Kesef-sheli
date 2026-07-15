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
  // Real templates collected from Pepper, the bank, and Bit — see CLAUDE.md's bank-notification
  // bullet for the exact patterns each one exercises (Pepper's "הוצאת" wording + a glued-on Latin
  // merchant name, a generic bank credit with no sender, a credit with no amount at all, Bit's
  // outgoing "העברה שביצעת" charge, and a sender-less "מחכים לך" credit).
  'PEPPER\nהיי אריאל הוצאת עכשיו בכרטיס האשראי 13.8 ש"ח בSHUK HAIIM HATOVIM',
  'היי אריאל נכנסו לך 500 ש"ח',
  'היי אריאל נכנסה לך משכורת',
  'היי אריאל קיבלת 1200 ש"ח מהפועלים',
  'העברה שביצעת לשלמה בסך 75 ש"ח הושלמה בהצלחה',
  'מחכים לך 150 ש"ח בביט נא אשר בתוך 3 ימי עסקים',
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
  const [creationMessage, setCreationMessage] = useState<string | null>(null);

  // This screen tests the text-parsing logic only — it always parses whatever is pasted below,
  // with no source-app filtering. isNotificationSourceApproved (src/notificationFilter.ts) gates
  // the real (future) NotificationListenerService, which has no equivalent here since there's no
  // "sending app" in a manually-pasted test string, only text typed in by hand.
  const handleCheck = () => {
    setResult(parseBankNotification(text));
    setCreationMessage(null);
  };

  const guessedCategory =
    result && result !== 'notChecked' && result.kind === 'charge'
      ? guessCategoryFromMerchant(result.merchant, categories)
      : null;

  // Not just a preview — actually writes the record (demo mode only), the same way the future
  // native listener would: routed to whichever trip is currently open (not yet ended), or to the
  // regular general expenses if no trip is open. Picks the most recently created open trip if
  // more than one happens to be open at once.
  const handleCreate = () => {
    if (!result || result === 'notChecked' || isFirebaseConfigured) return;
    if (result.amount === null) {
      setCreationMessage(
        'לא ניתן ליצור רשומה אוטומטית — הסכום לא זוהה בהתראה זו, יש להוסיף אותו ידנית דרך הוצאה/תנועה רגילה.'
      );
      return;
    }
    const activeTrip = [...demo.trips]
      .filter((t) => !t.endedAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const merchantSuffix = result.merchant ? ` ${result.kind === 'charge' ? 'ב' : 'מ'}${result.merchant}` : '';

    if (result.kind === 'charge') {
      const category = guessedCategory ?? categories[0]?.name ?? 'אחר';
      if (activeTrip) {
        demo.addTripTransaction(activeTrip.id, 'expense', result.amount, result.merchant ?? '');
        setCreationMessage(
          `נוצרה הוצאה: ${formatCurrency(result.amount)}${merchantSuffix}, שויכה לטיול: ${activeTrip.name}`
        );
      } else {
        demo.addExpense(result.amount, category, result.merchant ?? '', false);
        setCreationMessage(
          `נוצרה הוצאה: ${formatCurrency(result.amount)}${merchantSuffix}, קטגוריה ${category}, שויכה להוצאות כלליות`
        );
      }
    } else {
      if (activeTrip) {
        demo.addTripTransaction(activeTrip.id, 'reimbursement', result.amount, result.merchant ?? '');
        setCreationMessage(
          `נוצר החזר: ${formatCurrency(result.amount)}${merchantSuffix}, שויך לטיול: ${activeTrip.name}`
        );
      } else {
        setCreationMessage(
          `זוהה זיכוי בסך ${formatCurrency(result.amount)}, אך אין טיול פעיל כרגע — זיכויים/החזרים נתמכים רק בתוך טיול, ולכן לא נוצרה רשומה`
        );
      }
    }
  };

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
                <ResultRow
                  label="סכום"
                  value={result.amount !== null ? formatCurrency(result.amount) : 'לא ידוע — נדרשת השלמה ידנית'}
                />
                <ResultRow
                  label={result.kind === 'charge' ? 'בית עסק' : 'שולח'}
                  value={result.merchant ?? 'לא זוהה'}
                />
                {result.kind === 'charge' && (
                  <ResultRow label="קטגוריה מוצעת" value={guessedCategory ?? 'לא זוהתה — יש לבחור ידנית'} />
                )}

                {!isFirebaseConfigured && (
                  <Pressable style={styles.createButton} onPress={handleCreate}>
                    <Text style={styles.createButtonText}>צור רשומה בפועל (מצב הדגמה)</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        )}

        {creationMessage && (
          <View style={[styles.creationBanner, SHADOW]}>
            <Text style={styles.creationBannerText}>{creationMessage}</Text>
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
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 20,
    },
    checkButtonText: {
      color: '#FFFFFF',
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
    createButton: {
      backgroundColor: colors.chipBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingVertical: 13,
      alignItems: 'center',
      marginTop: 14,
    },
    createButtonText: {
      color: colors.accent,
      fontWeight: '700',
      fontSize: 14,
    },
    creationBanner: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.accent,
      padding: 14,
      marginTop: 16,
    },
    creationBannerText: {
      color: colors.text,
      fontSize: 13,
      textAlign: 'right',
      lineHeight: 19,
    },
  });
}
