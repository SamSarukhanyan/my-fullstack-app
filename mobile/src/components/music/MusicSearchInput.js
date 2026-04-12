import React from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const SEARCH_ICON_SIZE = 20;

/**
 * Search input with an icon inside and rounded corners.
 * glassBackground: frosted transparent glass background (BlurView).
 */
export default function MusicSearchInput({
  searchValue,
  onSearchChange,
  placeholder = 'Search music',
  glassBackground = false,
}) {
  const { colors, theme } = useTheme();
  const tint = theme === 'dark' ? 'dark' : 'light';

  return (
    <View
      style={[
        styles.inputWrap,
        {
          overflow: 'hidden',
          backgroundColor: glassBackground ? 'transparent' : colors.inputBg,
          shadowOpacity: theme === 'dark' ? 0.14 : 0,
          shadowRadius: theme === 'dark' ? 10 : 0,
          shadowOffset: theme === 'dark' ? { width: 0, height: 4 } : { width: 0, height: 0 },
          elevation: theme === 'dark' ? 3 : 0,
        },
      ]}
    >
      {glassBackground && (
        <BlurView
          intensity={Platform.OS === 'ios' ? 40 : 80}
          tint={tint}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
      {glassBackground && (
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.glassOverlay,
            {
              backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.16)' : 'transparent',
            },
          ]}
          pointerEvents="none"
        />
      )}
      <Ionicons
        name="search"
        size={SEARCH_ICON_SIZE}
        color={colors.textMuted}
        style={styles.searchIcon}
      />
      <TextInput
        value={searchValue}
        onChangeText={onSearchChange}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder || colors.textMuted}
        style={[
          styles.input,
          {
            color: colors.text,
          },
        ]}
      />
    </View>
  );
}

const INPUT_BORDER_RADIUS = 22;

const styles = StyleSheet.create({
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: INPUT_BORDER_RADIUS,
    paddingLeft: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  glassOverlay: {
    borderRadius: INPUT_BORDER_RADIUS,
    borderWidth: 0,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    paddingRight: 16,
  },
});
