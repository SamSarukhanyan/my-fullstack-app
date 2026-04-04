import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FixedBottomBar } from '../components/FixedBottomBar';
import GradientButton from '../components/GradientButton';
import { useViewport } from '../context/ViewportContext';

/**
 * Figma: WELCOME (87-1292).
 * Круг 183×183 (#F2F2F2), top 164, по центру. Текст Welcome. Кнопка Continue 321×49, radius 10, #5A5CFF.
 * Без статус-бара. Нижний блок — FixedBottomBar.
 */
const DARK_BG = '#0d1015';
const DARK_PANEL = '#151c26';
const ACCENT = '#465fff';
const TITLE_TEXT = '#f3f6fb';
const MUTED_TEXT = '#98a3b3';

export default function WelcomeScreen({ onFinish, onSignIn }) {
  const { isFrameMode } = useViewport();
  const insets = useSafeAreaInsets();
  const effectiveInsets = isFrameMode ? { top: 0, bottom: 0, left: 0, right: 0 } : insets;

  return (
    <View style={[styles.container, { paddingTop: effectiveInsets.top, backgroundColor: DARK_BG }]}>
      <View style={styles.contentWrap}>
        <View style={styles.hero}>
          <Text style={[styles.kicker, { color: MUTED_TEXT }]}>WELCOME</Text>
          <Text style={[styles.title, { color: TITLE_TEXT }, isFrameMode && styles.titleFrame]}>Production Mobile Platform</Text>
          <Text style={[styles.subtitle, { color: MUTED_TEXT }]}>
            Cross-platform React Native client with Node.js and Express.js backend,
            deployed via PM2 + Nginx on Amazon EC2.
          </Text>
        </View>

        <View style={[styles.featureCard, { backgroundColor: DARK_PANEL }]}>
          <View style={styles.featureRow}>
            <Text style={[styles.featureLabel, { color: TITLE_TEXT }]}>Frontend</Text>
            <Text style={[styles.featureValue, { color: MUTED_TEXT }]}>React Native</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={[styles.featureLabel, { color: TITLE_TEXT }]}>Backend</Text>
            <Text style={[styles.featureValue, { color: MUTED_TEXT }]}>Node.js + Express.js</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={[styles.featureLabel, { color: TITLE_TEXT }]}>Infrastructure</Text>
            <Text style={[styles.featureValue, { color: MUTED_TEXT }]}>PM2, Nginx, Amazon EC2</Text>
          </View>
        </View>
      </View>

      <FixedBottomBar
        insets={effectiveInsets}
        primaryButton={
          <GradientButton style={[styles.continueBtn, isFrameMode && styles.primaryBtnFrame]} onPress={() => onFinish?.()}>
            <Text style={styles.continueBtnText}>Continue</Text>
          </GradientButton>
        }
        signInRow={
          onSignIn ? (
            <TouchableOpacity style={styles.signInWrap} onPress={onSignIn} activeOpacity={0.7}>
              <Text style={[styles.signInText, { color: MUTED_TEXT }]}>Already have an account? </Text>
              <Text style={[styles.signInLink, { color: ACCENT }]}>Sign In</Text>
            </TouchableOpacity>
          ) : null
        }
        backgroundColor={DARK_BG}
        bottomLine={null}
      />
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
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
    marginBottom: 10,
  },
  titleFrame: {
    fontSize: 26,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  featureCard: {
    marginHorizontal: 24,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 10,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  featureLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  featureValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '500',
  },
  continueBtn: {
    width: '100%',
    height: 49,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  homeIndicator: {
    width: 100,
    height: 5,
    borderRadius: 2.5,
    marginBottom: 2,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  signInWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  signInText: {
    fontSize: 14,
    fontWeight: '500',
    color: MUTED_TEXT,
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '500',
    color: ACCENT,
  },
  primaryBtnFrame: {
    height: 48,
  },
});
