import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BOTTOM_BAR_CONTENT_HEIGHT } from '../constants/bottomBar';

/**
 * Нижний блок фиксированной высоты на всех 4 экранах (Splash, Onboarding02, Phone, Verification).
 * Одинаковая вертикальная позиция кнопки Next/Continue, строки «Already have an account? Sign In» и нижней линии.
 */
export function FixedBottomBar({ insets, skipButton, primaryButton, signInRow, bottomLine, backgroundColor }) {
  const barHeight = BOTTOM_BAR_CONTENT_HEIGHT + (insets?.bottom ?? 0);

  return (
    <View style={[styles.bar, { height: barHeight, paddingBottom: insets?.bottom ?? 0, backgroundColor: backgroundColor ?? '#FFFFFF' }]}>
      {/* 0–80: область под Skip (Onboarding02) или пустое место */}
      <View style={styles.topArea}>
        {skipButton ? <View style={styles.skipWrap}>{skipButton}</View> : null}
      </View>
      {/* 80–132: кнопка Next/Continue */}
      <View style={styles.primaryWrap}>{primaryButton}</View>
      {/* 148–172: строка Sign In или заглушка по высоте */}
      <View style={styles.signInArea}>{signInRow ?? <View style={styles.signInPlaceholder} />}</View>
      {/* 180–200: индикатор или progress bar */}
      <View style={styles.bottomLineWrap}>{bottomLine}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
  },
  topArea: {
    height: 80,
    justifyContent: 'flex-end',
  },
  skipWrap: {
    marginBottom: 12,
  },
  primaryWrap: {
    height: 52,
    marginBottom: 3,
  },
  signInArea: {
    minHeight: 30,
    marginBottom: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInPlaceholder: {
    height: 30,
  },
  bottomLineWrap: {
    height: 20,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
});
