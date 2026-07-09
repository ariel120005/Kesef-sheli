import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppLogo } from '../components/AppLogo';
import { SHADOW } from '../constants';
import { ThemeColors, useTheme } from '../theme';

interface Props {
  onBack: () => void;
}

// Keep in sync with the "version" field in package.json/app.json.
const APP_VERSION = '1.0.0';

const TABS = [
  {
    icon: 'home-outline' as const,
    label: 'בית',
    description: 'מד תקציב חודשי, הוספת הוצאות, פירוט לפי קטגוריות ורשימת ההוצאות האחרונות.',
  },
  {
    icon: 'map-outline' as const,
    label: 'מפה',
    description: 'מפה אינטראקטיבית עם המיקומים של ההוצאות שלכם, חיפוש מקומות ומעבר בין שכבות תצוגה.',
  },
  {
    icon: 'bulb-outline' as const,
    label: 'תובנות',
    description:
      'תובנות מבוססות-כללים על ההוצאות שלכם, גרף התפלגות לפי קטגוריה, וקיצורים ליעד חיסכון ולטיולים.',
  },
];

const FEATURES = [
  'ניהול תקציב חודשי עם מד ויזואלי שמשנה צבע ככל שמתקרבים אליו',
  'קטגוריות הוצאה מותאמות אישית — הוספה, שינוי שם וצבע, מחיקה',
  'הוצאות קבועות שמתחדשות אוטומטית מדי חודש',
  'הזנת הוצאות במטבע זר עם המרה אוטומטית לשקלים, במגוון רחב של מטבעות',
  'מצב טיול נפרד עם תקציב משלו, החזרים ועמלות, וסיכום בסיום הטיול',
  'יעד חיסכון חודשי',
  'ייצוא נתונים לקובץ CSV',
  'זיהוי אוטומטי (בפיתוח) של הוצאות מתוך התראות בנק, עם רשימת אפליקציות מאושרות',
  'התאמת יום תחילת החודש למחזור התקציב שלכם',
  'מצב תצוגה כהה/בהיר',
  'התחברות מאובטחת וסנכרון נתונים בין מכשירים',
];

export function AboutScreen({ onBack }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.header}>אודות</Text>
        </View>

        <View style={styles.identityCard}>
          <AppLogo size={104} />
          <Text style={styles.version}>גרסה {APP_VERSION}</Text>
        </View>

        <Text style={styles.sectionTitle}>מה כל טאב עושה</Text>
        {TABS.map((tab) => (
          <View key={tab.label} style={[styles.tabRow, SHADOW]}>
            <View style={styles.tabIconWrap}>
              <Ionicons name={tab.icon} size={20} color={colors.accent} />
            </View>
            <View style={styles.tabTextWrap}>
              <Text style={styles.tabLabel}>{tab.label}</Text>
              <Text style={styles.tabDescription}>{tab.description}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>פיצ׳רים עיקריים</Text>
        <View style={[styles.featuresCard, SHADOW]}>
          {FEATURES.map((feature, index) => (
            <View
              key={index}
              style={[styles.featureRow, index < FEATURES.length - 1 && styles.featureRowBorder]}
            >
              <Ionicons name="checkmark-circle" size={16} color={colors.safe} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
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
    identityCard: {
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 26,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 10,
    },
    version: {
      fontSize: 13,
      color: colors.subtext,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'right',
      marginBottom: 12,
    },
    tabRow: {
      flexDirection: 'row-reverse',
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    tabIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.chipBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabTextWrap: {
      flex: 1,
    },
    tabLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'right',
    },
    tabDescription: {
      fontSize: 12,
      color: colors.subtext,
      textAlign: 'right',
      lineHeight: 17,
      marginTop: 2,
    },
    featuresCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginTop: 4,
      marginBottom: 12,
    },
    featureRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 11,
    },
    featureRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    featureText: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
      textAlign: 'right',
      lineHeight: 18,
    },
  });
}
