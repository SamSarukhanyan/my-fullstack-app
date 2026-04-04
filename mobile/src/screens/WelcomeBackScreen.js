import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientButton from '../components/GradientButton';
import { useViewport } from '../context/ViewportContext';

/**
 * Figma: WELCOME BACK (92-416). После Pick a new Password. БЕЗ стрелки назад.
 * Круг 183×183 #F2F2F2, mini ellipses (пузырьки) 14×14, mini stars 21×21 — в случайных местах вокруг круга.
 */
const DARK_BG = '#0d1015';
const DARK_PANEL = '#151c26';
const TITLE_TEXT = '#f3f6fb';
const MUTED_TEXT = '#98a3b3';

export default function WelcomeBackScreen({ onFinish }) {
  const insets = useSafeAreaInsets();
  const { isFrameMode } = useViewport();
  const effectiveInsets = isFrameMode ? { top: 0, bottom: 0, left: 0, right: 0 } : insets;

  return (
    <View style={[styles.container, { paddingTop: effectiveInsets.top, backgroundColor: DARK_BG }]}>
      <View style={styles.contentWrap}>
        <View style={styles.hero}>
          <Text style={[styles.kicker, { color: MUTED_TEXT }]}>READY</Text>
          <Text style={[styles.title, { color: TITLE_TEXT }, isFrameMode && styles.titleFrame]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: MUTED_TEXT }]}>
            Your workspace is synced. Continue to your production-ready social app.
          </Text>
        </View>

        <View style={[styles.statusCard, { backgroundColor: DARK_PANEL }]}>
          <View style={styles.statusRow}>
            <Text style={[styles.statusKey, { color: MUTED_TEXT }]}>Session</Text>
            <Text style={[styles.statusVal, { color: TITLE_TEXT }]}>Authenticated</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={[styles.statusKey, { color: MUTED_TEXT }]}>Environment</Text>
            <Text style={[styles.statusVal, { color: TITLE_TEXT }]}>Mobile + API</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={[styles.statusKey, { color: MUTED_TEXT }]}>Deployment</Text>
            <Text style={[styles.statusVal, { color: TITLE_TEXT }]}>PM2 / Nginx / EC2</Text>
          </View>
        </View>
      </View>

      <GradientButton
        style={[styles.continueBtn, isFrameMode && styles.primaryBtnFrame]}
        onPress={() => onFinish?.()}
      >
        <Text style={styles.continueBtnText}>Continue</Text>
      </GradientButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  contentWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 72,
  },
  hero: {
    paddingHorizontal: 24,
    marginBottom: 18,
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: 0,
    marginBottom: 8,
  },
  titleFrame: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  statusCard: {
    marginHorizontal: 24,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusKey: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  continueBtn: {
    position: 'absolute',
    left: 27,
    right: 27,
    bottom: 34,
    height: 49,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 18,
    letterSpacing: 0,
    color: '#FFFFFF',
  },
  primaryBtnFrame: {
    height: 48,
  },
});
