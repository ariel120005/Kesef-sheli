import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { ThemeColors, useTheme } from '../theme';

// react-native-web doesn't support the native animation driver.
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface FloatingCoinProps {
  delay: number;
  style: object;
  colors: ThemeColors;
}

function FloatingCoin({ delay, style, colors }: FloatingCoinProps) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -10,
          duration: 1100,
          delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [delay, translateY]);

  return (
    <Animated.View
      style={[
        coinStyles.coin,
        { backgroundColor: colors.chipBackground, borderColor: colors.cardBorder },
        style,
        { transform: [{ translateY }] },
      ]}
    >
      <Text style={[coinStyles.coinText, { color: colors.accent }]}>₪</Text>
    </Animated.View>
  );
}

const coinStyles = StyleSheet.create({
  coin: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinText: {
    fontSize: 14,
    fontWeight: '800',
  },
});

export function EmptyExpensesState() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.illustration}>
        <FloatingCoin delay={0} style={styles.coinTopLeft} colors={colors} />
        <FloatingCoin delay={350} style={styles.coinTopRight} colors={colors} />
        <FloatingCoin delay={700} style={styles.coinBottom} colors={colors} />
        <View style={styles.walletCircle}>
          <Ionicons name="wallet-outline" size={40} color={colors.accent} />
        </View>
      </View>
      <Text style={styles.title}>עדיין לא הוספתם הוצאות</Text>
      <Text style={styles.subtitle}>בואו נתחיל!</Text>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    illustration: {
      width: 120,
      height: 100,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    walletCircle: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: colors.chipBackground,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    coinTopLeft: {
      top: 0,
      left: 8,
    },
    coinTopRight: {
      top: 6,
      right: 4,
    },
    coinBottom: {
      bottom: 4,
      left: 44,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: colors.subtext,
      textAlign: 'center',
      marginTop: 4,
    },
  });
}
