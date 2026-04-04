import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientButton from '../components/GradientButton';
import { useViewport } from '../context/ViewportContext';

/**
 * Figma: SPLASH (87:9)
 * No status bar image (time/battery/antennas removed per request).
 * Нижний блок — фиксированная высота (как на Onboarding02, Phone, Verification).
 */
const DARK_BG = '#0d1015';
const DARK_PANEL = '#141a22';
const DARK_PANEL_SOFT = '#1a212c';
const MUTED_TEXT = '#9aa4b2';
const TITLE_TEXT = '#f3f6fb';

export default function SplashScreen({ onFinish }) {
  const insets = useSafeAreaInsets();
  const { isFrameMode } = useViewport();
  const effectiveInsets = isFrameMode ? { top: 0, bottom: 0, left: 0, right: 0 } : insets;
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const stackItems = [
    'React Native',
    'Web Client',
    'Node.js',
    'Express.js',
    'PM2',
    'Nginx',
    'Amazon EC2',
    'Amazon S3',
    'GitHub Actions',
    'CI/CD',
  ];

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, {
          toValue: 1,
          duration: 520,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(arrowAnim, {
          toValue: 0,
          duration: 520,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [arrowAnim]);

  return (
    <View style={[styles.container, { paddingTop: effectiveInsets.top, backgroundColor: DARK_BG }]}>
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={[
          styles.contentWrap,
          isFrameMode ? styles.contentWrapFrame : null,
          { paddingBottom: isFrameMode ? 10 : 16 },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={!isFrameMode}
      >
        <View style={styles.heroWrap}>
          <Text style={styles.badge} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
            React Native iOS application
          </Text>
          <Text style={[styles.heroTitle, { color: MUTED_TEXT }, isFrameMode && styles.heroTitleFrame]}>
            Full-Stack Mobile Platform
          </Text>
          <Text style={[styles.heroSub, { color: TITLE_TEXT }]}>
            Production-ready application with a React Native client, secure backend services, and cloud-first delivery.
          </Text>
        </View>

        <View style={[styles.stackCard, isFrameMode && styles.stackCardFrame, { backgroundColor: DARK_PANEL }]}>
          <Text style={[styles.stackTitle, { color: TITLE_TEXT }]}>Stack</Text>
          <View style={[styles.stackRow, isFrameMode && styles.stackRowFrame]}>
            {stackItems.map((item) => (
              <View key={item} style={[styles.stackTag, isFrameMode && styles.stackTagFrame, { backgroundColor: DARK_PANEL_SOFT }]}>
                <Text style={[styles.stackTagText, isFrameMode && styles.stackTagTextFrame, { color: MUTED_TEXT }]} numberOfLines={1}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
          <Text style={[styles.stackFoot, isFrameMode && styles.stackFootFrame, { color: MUTED_TEXT }]}>
            Backend services run on Amazon EC2 behind Nginx with PM2 process management. Static media (images and videos)
            is delivered from Amazon S3. GitHub Actions powers CI/CD and automated deployments.
          </Text>
          <Text style={[styles.authorNote, isFrameMode && styles.authorNoteFrame, { color: MUTED_TEXT }]}>
            Built by <Text style={styles.authorName}>Sam Sarukhanian</Text>, a software engineer focused on reliability, clear
            architecture, and production execution.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomCtaArea, { paddingBottom: effectiveInsets.bottom || 0 }]}>
        <GradientButton
          style={[styles.continueBtn, isFrameMode && styles.primaryBtnFrame]}
          onPress={() => onFinish?.()}
        >
          <View style={styles.ctaRow}>
            <Text style={styles.continueBtnText}>Go to Authentication Steps</Text>
            <Animated.Text
              style={[
                styles.ctaArrow,
                {
                  transform: [
                    {
                      translateX: arrowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 8],
                      }),
                    },
                  ],
                },
              ]}
            >
              {'\u2192'}
            </Animated.Text>
          </View>
        </GradientButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  contentScroll: {
    flex: 1,
  },
  bottomCtaArea: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 10,
    marginBottom: 60,
    backgroundColor: DARK_BG,
  },
  contentWrap: {
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  contentWrapFrame: {
    justifyContent: 'flex-start',
  },
  heroWrap: {
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 62,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingVertical: 14,
    marginHorizontal: 24,
  },
  badge: {
    fontSize: 18,
    letterSpacing: 0.8,
    fontWeight: '700',
    color: '#465fff',
    marginBottom: 8,
    textAlign: 'center',
    
  },
  heroTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 8,
  },
  heroTitleFrame: {
    fontSize: 13,
  },
  heroSub: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  stackCard: {
    marginHorizontal: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
    paddingBottom: 12,
  },
  stackCardFrame: {
    borderRadius: 16,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    height: 310,
  },
  stackTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  stackRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  stackRowFrame: {
    gap: 6,
    marginBottom: 8,
  },
  stackTag: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexShrink: 0,
  },
  stackTagFrame: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  stackTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stackTagTextFrame: {
    fontSize: 11,
  },
  stackFoot: {
    fontSize: 12,
    lineHeight: 18,
  },
  stackFootFrame: {
    fontSize: 11,
    lineHeight: 16,
    
  },
  continueBtn: {
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  primaryBtnFrame: {
    height: 48,
  },
  authorNote: {
    marginTop: 10,
    fontSize: 11.5,
    lineHeight: 16,
    opacity: 0.9,
  },
  authorName: {
    color: '#465fff',
    fontWeight: '700',
  },
  authorNoteFrame: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 15,
  },
});
