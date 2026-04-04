import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  PanResponder,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FixedBottomBar } from '../components/FixedBottomBar';
import GradientButton from '../components/GradientButton';
import { BOTTOM_BAR_CONTENT_HEIGHT, BACK_BUTTON_TOP, BACK_BUTTON_LEFT, BACK_BUTTON_AREA_HEIGHT } from '../constants/bottomBar';
import { useTheme } from '../context/ThemeContext';
import { useViewport } from '../context/ViewportContext';

/**
 * Figma: ONBOARDING 02 (87-1132)
 * Swipe-back with rubber animation (Instagram-like).
 */
const SWIPE_EDGE_WIDTH = 0.15;
const SWIPE_MIN_DX = 55;
const SWIPE_DRAG_FACTOR = 0.52;
const SWIPE_BACK_DURATION = 320;
const DARK_BG = '#0d1015';
const DARK_PANEL = '#151c26';
const ACCENT = '#465fff';
const TITLE_TEXT = '#f3f6fb';
const MUTED_TEXT = '#98a3b3';

export default function Onboarding02Screen({ onBack, onNext, onSkip, onSignIn }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { width: screenWidth, height: screenHeight, isFrameMode } = useViewport();
  const effectiveInsets = isFrameMode ? { top: 0, bottom: 0, left: 0, right: 0 } : insets;
  const minContentHeight = Math.max(screenHeight - effectiveInsets.top - effectiveInsets.bottom - 60, 420);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { moveX, dx } = gestureState;
        return moveX < screenWidth * SWIPE_EDGE_WIDTH && dx > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        const dx = gestureState.dx;
        const capped = Math.min(Math.max(dx * SWIPE_DRAG_FACTOR, 0), screenWidth * 0.85);
        slideAnim.setValue(capped);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_MIN_DX && onBack) {
          Animated.timing(slideAnim, {
            toValue: screenWidth,
            duration: SWIPE_BACK_DURATION,
            useNativeDriver: true,
          }).start(() => {
            slideAnim.setValue(0);
            onBack();
          });
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View
      style={[styles.container, { width: screenWidth, height: screenHeight, backgroundColor: DARK_BG }]}
      {...(onBack ? panResponder.panHandlers : {})}
    >
      <Animated.View
        style={[
          styles.screenContent,
          {
            width: screenWidth,
            height: screenHeight,
            backgroundColor: DARK_BG,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={[styles.innerFixed, { height: screenHeight }]}>
        {onBack ? (
          <>
            <View style={styles.backButtonWrap}>
              <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
                <Ionicons name="chevron-back" size={isFrameMode ? 24 : 28} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.backButtonSpacer} />
          </>
        ) : null}
        <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          isFrameMode && styles.scrollContentFrame,
          {
            minHeight: minContentHeight,
            paddingTop: isFrameMode ? 0 : 16,
            paddingBottom: BOTTOM_BAR_CONTENT_HEIGHT + effectiveInsets.bottom + 52,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        decelerationRate="fast"
        scrollEventThrottle={16}
      >
        <View style={[styles.contentBlock, isFrameMode && styles.contentBlockFrame]}>
          <View style={[styles.archCard, { backgroundColor: DARK_PANEL }]}>
            <Text style={[styles.archTitle, { color: TITLE_TEXT }]}>Architecture Overview</Text>
            <Text style={[styles.archLine, { color: MUTED_TEXT }]}>Mobile: React Native (iOS / Android)</Text>
            <Text style={[styles.archLine, { color: MUTED_TEXT }]}>API: Node.js + Express.js</Text>
            <Text style={[styles.archLine, { color: MUTED_TEXT }]}>Runtime: PM2 process manager</Text>
            <Text style={[styles.archLine, { color: MUTED_TEXT }]}>Gateway: Nginx reverse proxy</Text>
            <Text style={[styles.archLine, { color: MUTED_TEXT }]}>Infrastructure: AWS EC2</Text>
          </View>

          <Text style={[styles.title, { color: TITLE_TEXT }, isFrameMode && styles.titleFrame]}>Built for Scale</Text>
          <Text style={[styles.titleLine2, { color: TITLE_TEXT }, isFrameMode && styles.titleFrame]}>and Reliability</Text>
          <Text style={[styles.description, { color: MUTED_TEXT }]}>
            Clean architecture, production backend and deployment tooling in one React Native project.
          </Text>
        </View>
      </ScrollView>

        <FixedBottomBar
          insets={effectiveInsets}
          skipButton={null}
          primaryButton={
            <GradientButton style={[styles.nextBtn, isFrameMode && styles.primaryBtnFrame]} onPress={onNext}>
              <Text style={[styles.nextBtnText, { color: colors.buttonPrimaryText }]}>Continue</Text>
            </GradientButton>
          }
          signInRow={
            <TouchableOpacity style={styles.signInWrap} onPress={onSignIn}>
              <Text style={[styles.signInText, { color: colors.text }]}>Already have an account? </Text>
              <Text style={[styles.signInLink, { color: colors.primary }]}>Sign In</Text>
            </TouchableOpacity>
          }
          backgroundColor={DARK_BG}
          bottomLine={null}
        />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  screenContent: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: DARK_BG,
    overflow: 'hidden',
  },
  innerFixed: {
    width: '100%',
  },
  scroll: {
    flex: 1,
  },
  backButtonWrap: {
    position: 'absolute',
    top: BACK_BUTTON_TOP,
    left: BACK_BUTTON_LEFT,
    zIndex: 10,
  },
  backButtonSpacer: {
    height: BACK_BUTTON_AREA_HEIGHT,
  },
  backBtn: {},
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
    justifyContent: 'center',
    flexGrow: 1,
  },
  scrollContentFrame: {
    justifyContent: 'center',
  },
  contentBlock: {
    width: '100%',
  },
  contentBlockFrame: {
    marginTop: -18,
  },
  archCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 20,
    gap: 8,
  },
  archTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  archLine: {
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: TITLE_TEXT,
    textAlign: 'left',
    marginBottom: 2,
  },
  titleLine2: {
    fontSize: 26,
    fontWeight: '700',
    color: TITLE_TEXT,
    textAlign: 'left',
    marginBottom: 12,
  },
  titleFrame: {
    fontSize: 22,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: MUTED_TEXT,
    textAlign: 'left',
    marginBottom: 24,
  },
  nextBtn: {
    width: '100%',
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  skipBtn: {
    width: '100%',
    height: 52,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: ACCENT,
  },
  signInWrap: {
    flexDirection: 'row',
    alignSelf: 'center',
  },
  signInText: {
    fontSize: 14,
    color: MUTED_TEXT,
  },
  signInLink: {
    fontSize: 14,
    color: '#465fff',
    opacity: 0.8,
  },
  primaryBtnFrame: {
    height: 48,
  },
  homeIndicator: {
    width: 118,
    height: 5,
    borderRadius: 2.5,
    marginBottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
