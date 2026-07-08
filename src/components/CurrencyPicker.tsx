import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SHADOW } from '../constants';
import { CURRENCIES } from '../currency';
import { ThemeColors, useTheme } from '../theme';
import { Currency } from '../types';

interface Props {
  value: Currency | 'ILS';
  onChange: (value: Currency | 'ILS') => void;
}

const OPTIONS: { code: Currency | 'ILS'; label: string; symbol: string }[] = [
  { code: 'ILS', label: 'שקל', symbol: '₪' },
  ...CURRENCIES,
];

// Collapses the amount field's currency choice into a small toggle showing just the currently
// selected currency (e.g. "₪"), instead of a row of every option shown openly — tapping it opens
// a dropdown with the rest.
export function CurrencyPicker({ value, onChange }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [open, setOpen] = useState(false);
  const selected = OPTIONS.find((option) => option.code === value) ?? OPTIONS[0];

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => setOpen(true)} style={styles.toggle}>
        <Text style={styles.toggleText}>{selected.symbol}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.text} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.menu, SHADOW]} onPress={() => {}}>
            <ScrollView>
              {OPTIONS.map((option, index) => {
                const isSelected = option.code === value;
                return (
                  <Pressable
                    key={option.code}
                    onPress={() => {
                      onChange(option.code);
                      setOpen(false);
                    }}
                    style={[styles.menuItem, index < OPTIONS.length - 1 && styles.menuItemBorder]}
                  >
                    <Text style={[styles.menuItemText, isSelected && styles.menuItemTextSelected]}>
                      {option.symbol} {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      alignItems: 'flex-end',
      marginBottom: 8,
    },
    toggle: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.chipBackground,
      borderRadius: 20,
      paddingVertical: 7,
      paddingHorizontal: 14,
    },
    toggleText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    backdrop: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    menu: {
      minWidth: 180,
      maxHeight: 360,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      overflow: 'hidden',
      paddingVertical: 4,
    },
    menuItem: {
      paddingVertical: 13,
      paddingHorizontal: 18,
    },
    menuItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuItemText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'right',
    },
    menuItemTextSelected: {
      color: colors.turquoise,
      fontWeight: '800',
    },
  });
}
