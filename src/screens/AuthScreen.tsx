import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GRADIENTS, SHADOW } from '../constants';
import { isFirebaseConfigured } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { ThemeColors, useTheme } from '../theme';

function translateAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'כתובת המייל לא תקינה';
    case 'auth/missing-password':
      return 'יש להזין סיסמה';
    case 'auth/weak-password':
      return 'הסיסמה חייבת להכיל לפחות 6 תווים';
    case 'auth/email-already-in-use':
      return 'כתובת המייל הזו כבר רשומה — נסו להתחבר במקום';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'מייל או סיסמה שגויים';
    case 'auth/too-many-requests':
      return 'יותר מדי ניסיונות — נסו שוב בעוד כמה דקות';
    default:
      return 'משהו השתבש, נסו שוב';
  }
}

interface Props {
  embedded?: boolean;
}

export function AuthScreen({ embedded = false }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('יש למלא מייל וסיסמה');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'signIn') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      setError(translateAuthError(code));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isFirebaseConfigured) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageTitle}>Firebase לא מוגדר</Text>
        <Text style={styles.messageSubtitle}>הוסיפו את פרטי ה-Firebase לקובץ .env</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!embedded && <Text style={styles.header}>הכסף של בוקי</Text>}

        <View style={[styles.card, SHADOW]}>
          <Text style={styles.title}>{mode === 'signIn' ? 'התחברות' : 'הרשמה'}</Text>

          <TextInput
            style={styles.input}
            placeholder="אימייל"
            placeholderTextColor={colors.subtext}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            textAlign="right"
          />

          <TextInput
            style={styles.input}
            placeholder="סיסמה"
            placeholderTextColor={colors.subtext}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            textAlign="right"
          />

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable onPress={handleSubmit} disabled={submitting}>
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButton}
            >
              {submitting ? (
                <ActivityIndicator color="#0A0A0F" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === 'signIn' ? 'התחברות' : 'הרשמה'}
                </Text>
              )}
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => {
              setError(null);
              setMode((m) => (m === 'signIn' ? 'signUp' : 'signIn'));
            }}
            style={styles.switchModeButton}
          >
            <Text style={styles.switchModeText}>
              {mode === 'signIn' ? 'משתמשים חדשים — הרשמה' : 'כבר יש לכם חשבון? התחברות'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 22,
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
      borderRadius: 24,
      padding: 22,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    title: {
      fontSize: 20,
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
    errorText: {
      color: colors.danger,
      fontSize: 13,
      textAlign: 'right',
      marginBottom: 14,
    },
    submitButton: {
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
    },
    submitButtonText: {
      color: '#0A0A0F',
      fontWeight: '700',
      fontSize: 15,
    },
    switchModeButton: {
      marginTop: 16,
      alignItems: 'center',
    },
    switchModeText: {
      color: colors.turquoise,
      fontSize: 13,
      fontWeight: '600',
    },
  });
}
