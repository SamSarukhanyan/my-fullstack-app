import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BOTTOM_BAR_CONTENT_HEIGHT } from '../constants/bottomBar';

/**
 * Fixed-height bottom block shared across 4 screens (Splash, Onboarding02, Phone, Verification).
 * Keeps the same vertical position for the Next/Continue button, the "Already have an account? Sign In" row, and the bottom line.
 */
export function FixedBottomBar({ insets, skipButton, primaryButton, signInRow, bottomLine, backgroundColor }) {
  const barHeight = BOTTOM_BAR_CONTENT_HEIGHT + (insets?.bottom ?? 0);

  return (
    <View style={[styles.bar, { height: barHeight, paddingBottom: insets?.bottom ?? 0, backgroundColor: backgroundColor ?? '#FFFFFF' }]}>
      {/* 0–80: area for Skip (Onboarding02) or empty space */}
      <View style={styles.topArea}>
        {skipButton ? <View style={styles.skipWrap}>{skipButton}</View> : null}
      </View>
      {/* 80–132: Next/Continue button */}
      <View style={styles.primaryWrap}>{primaryButton}</View>
      {/* 148–172: Sign In row or a height placeholder */}
      <View style={styles.signInArea}>{signInRow ?? <View style={styles.signInPlaceholder} />}</View>
      {/* 180–200: indicator or progress bar */}
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
