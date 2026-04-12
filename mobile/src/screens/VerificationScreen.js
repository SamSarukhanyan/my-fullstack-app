import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  PanResponder,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BACK_BUTTON_TOP, BACK_BUTTON_LEFT, BACK_BUTTON_AREA_HEIGHT } from '../constants/bottomBar';
import GradientButton from '../components/GradientButton';
import { useTheme } from '../context/ThemeContext';
import { useViewport } from '../context/ViewportContext';

/**
 * Figma: VERIFICATION (87-1149) — OTP entry.
 * No status bar (time, signal, and battery are hidden). Includes a back button and swipe-back gesture.
 */
const SWIPE_EDGE_WIDTH = 0.15;
const SWIPE_MIN_DX = 55;
const SWIPE_DRAG_FACTOR = 0.52;
const SWIPE_BACK_DURATION = 320;
const RESEND_COOLDOWN_SEC = 60;
const VERIFY_CHECKING_MS = 1200;
const VERIFY_SUCCESS_HOLD_MS = 720;
const VERIFY_MODAL_FADE_MS = 180;

const KEYPAD_LAYOUT = [
  [{ key: '1', sub: '' }, { key: '2', sub: 'ABC' }, { key: '3', sub: 'DEF' }],
  [{ key: '4', sub: 'GHI' }, { key: '5', sub: 'JKL' }, { key: '6', sub: 'MNO' }],
  [{ key: '7', sub: 'PQRS' }, { key: '8', sub: 'TUV' }, { key: '9', sub: 'WXYZ' }],
];

export default function VerificationScreen({ onBack, onNext }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { width: screenWidth, height: screenHeight, isFrameMode } = useViewport();
  const effectiveInsets = isFrameMode ? { top: 0, bottom: 0, left: 0, right: 0 } : insets;

  const [otp, setOtp] = useState(['', '', '', '']);
  const [activeIndex, setActiveIndex] = useState(0);
  const [resendSec, setResendSec] = useState(0);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [verifyModalStep, setVerifyModalStep] = useState('checking');

  const slideAnim = useRef(new Animated.Value(0)).current;
  const verifySpinnerAnim = useRef(new Animated.Value(0)).current;
  const verifySuccessAnim = useRef(new Animated.Value(0)).current;
  const verifyModalOpacityAnim = useRef(new Animated.Value(1)).current;
  const verifyTimerRef = useRef(null);
  const verifyTokenRef = useRef(0);
  const pendingOtpRef = useRef('');

  useEffect(() => {
    if (resendSec <= 0) return;
    const t = setInterval(() => setResendSec((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendSec]);

  useEffect(() => () => {
    verifySpinnerAnim.stopAnimation();
    verifySuccessAnim.stopAnimation();
    verifyModalOpacityAnim.stopAnimation();
    if (verifyTimerRef.current) {
      clearTimeout(verifyTimerRef.current);
      verifyTimerRef.current = null;
    }
  }, [verifyModalOpacityAnim, verifySpinnerAnim, verifySuccessAnim]);

  useEffect(() => {
    if (!verifyModalVisible || verifyModalStep !== 'checking') {
      verifySpinnerAnim.stopAnimation();
      verifySpinnerAnim.setValue(0);
      return;
    }
    verifySpinnerAnim.setValue(0);
    const loop = Animated.loop(
      Animated.timing(verifySpinnerAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => {
      loop.stop();
      verifySpinnerAnim.stopAnimation();
    };
  }, [verifyModalVisible, verifyModalStep, verifySpinnerAnim]);

  useEffect(() => {
    if (!verifyModalVisible || verifyModalStep !== 'success') return undefined;
    const token = verifyTokenRef.current;
    verifySuccessAnim.stopAnimation();
    verifySuccessAnim.setValue(0);

    Animated.sequence([
      Animated.timing(verifySuccessAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(VERIFY_SUCCESS_HOLD_MS),
      Animated.timing(verifyModalOpacityAnim, {
        toValue: 0,
        duration: VERIFY_MODAL_FADE_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished || token !== verifyTokenRef.current) return;
      setVerifyModalVisible(false);
      onNext?.(pendingOtpRef.current);
    });

    return () => {
      verifySuccessAnim.stopAnimation();
    };
  }, [onNext, verifyModalOpacityAnim, verifyModalStep, verifyModalVisible, verifySuccessAnim]);

  const handleDigitPress = (digit) => {
    setOtp((prev) => {
      const next = [...prev];
      let idx = activeIndex;
      if (next[idx] && idx < 3) idx += 1;
      next[idx] = digit;
      setActiveIndex(Math.min(idx + 1, 3));
      return next;
    });
  };

  const handleBackspacePress = () => {
    setOtp((prev) => {
      const next = [...prev];
      let idx = activeIndex;
      if (next[idx]) {
        next[idx] = '';
        setActiveIndex(idx);
        return next;
      }
      idx = Math.max(idx - 1, 0);
      next[idx] = '';
      setActiveIndex(idx);
      return next;
    });
  };

  const handleResend = () => {
    if (resendSec > 0) return;
    setResendSec(RESEND_COOLDOWN_SEC);
    // TODO: call API to resend OTP
  };

  const otpString = otp.join('');
  const canNext = otpString.length === 4;
  const verifyCheckingVisible = verifyModalVisible && verifyModalStep === 'checking';
  const verifySuccessVisible = verifyModalVisible && verifyModalStep === 'success';

  const renderVerifyModalCard = (step, animatedCardStyle) => (
    <Animated.View style={[styles.verifyModalCard, animatedCardStyle]}>
      <View style={styles.verifyModalTitleSlot}>
        <Text style={styles.verifyModalTitle}>
          {step === 'checking' ? 'Verifying code' : 'Code verified'}
        </Text>
      </View>
      <View style={styles.verifyModalSubtitleSlot}>
        <Text style={styles.verifyModalSubtitle}>
          {step === 'checking'
            ? 'Please wait while we confirm your code.'
            : 'Verification successful. Redirecting...'}
        </Text>
      </View>
      <View style={styles.verifyModalIconSlot}>
        {step === 'checking' ? (
          <Animated.View
            style={[
              styles.verifySpinner,
              {
                transform: [
                  {
                    rotate: verifySpinnerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          />
        ) : (
          <Animated.View
            style={[
              styles.verifySuccessBadge,
              {
                opacity: verifySuccessAnim,
                transform: [
                  {
                    scale: verifySuccessAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.86, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.verifySuccessIcon}>✓</Text>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );

  const handleVerifyPress = () => {
    if (!canNext) return;

    verifyTokenRef.current += 1;
    const token = verifyTokenRef.current;
    pendingOtpRef.current = otpString;

    if (verifyTimerRef.current) {
      clearTimeout(verifyTimerRef.current);
      verifyTimerRef.current = null;
    }

    verifyModalOpacityAnim.stopAnimation();
    verifySuccessAnim.stopAnimation();
    verifyModalOpacityAnim.setValue(1);
    verifySuccessAnim.setValue(0);
    setVerifyModalStep('checking');
    setVerifyModalVisible(true);

    verifyTimerRef.current = setTimeout(() => {
      if (token !== verifyTokenRef.current) return;
      setVerifyModalStep('success');
      verifyTimerRef.current = null;
    }, VERIFY_CHECKING_MS);
  };

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
      style={[styles.container, { width: screenWidth, height: screenHeight, backgroundColor: colors.background }]}
      {...(onBack ? panResponder.panHandlers : {})}
    >
      <Animated.View
        style={[
          styles.screenContent,
          {
            width: screenWidth,
            height: screenHeight,
            backgroundColor: colors.background,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={[styles.innerFixed, { height: screenHeight }]}> 
          <View style={styles.backButtonWrap}>
            <TouchableOpacity
              onPress={onBack}
              style={styles.backBtn}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            >
              <Ionicons name="chevron-back" size={isFrameMode ? 24 : 28} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.backButtonSpacer} />

          <View
            style={[
              styles.content,
              {
                paddingHorizontal: isFrameMode ? 18 : 24,
                paddingBottom: Math.max(8, effectiveInsets.bottom + 2),
              },
            ]}
          >
            <View style={styles.mainArea}>
              <View>
                <View style={styles.titleRow}>
                  <Ionicons name="shield-checkmark" size={isFrameMode ? 26 : 30} color="#465fff" />
                  <Text style={[styles.title, styles.titleInRow, { color: colors.text }, isFrameMode && styles.titleFrame]}>OTP sent</Text>
                </View>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Enter the OTP sent to you</Text>

                <View style={styles.otpRow}>
                  {[0, 1, 2, 3].map((i) => (
                    <Pressable
                      key={i}
                      style={[
                        styles.otpBox,
                        {
                          backgroundColor: otp[i] ? colors.surfaceElevated : colors.inputBg,
                          borderColor: i === activeIndex ? colors.primary : colors.inputBorder,
                        },
                        isFrameMode && styles.otpBoxFrame,
                      ]}
                      onPress={() => setActiveIndex(i)}
                    >
                      <Text style={[styles.otpDigit, { color: colors.textSecondary }]}>{otp[i]}</Text>
                    </Pressable>
                  ))}
                </View>

                <GradientButton
                  style={[
                    styles.sendCodeBtn,
                    !canNext && styles.sendCodeBtnDisabled,
                    isFrameMode && styles.sendCodeBtnFrame,
                  ]}
                  onPress={handleVerifyPress}
                  disabled={!canNext}
                >
                  <Text style={[styles.sendCodeText, { color: colors.buttonPrimaryText }]}>Verify code</Text>
                </GradientButton>

                <View style={styles.resendRow}>
                  <Text style={[styles.resendLabel, { color: colors.text }]}>Didn't get the code?</Text>
                  <TouchableOpacity onPress={handleResend} disabled={resendSec > 0} activeOpacity={0.8}>
                    <Text style={[styles.resendBtn, { color: colors.primary }, resendSec > 0 && styles.resendBtnDisabled]}>
                      {resendSec > 0
                        ? `Resend in ${String(Math.floor(resendSec / 60)).padStart(2, '0')}:${String(resendSec % 60).padStart(2, '0')}`
                        : 'Resend it.'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.numpadWrap}>
                {KEYPAD_LAYOUT.map((row, rowIndex) => (
                  <View key={`row-${rowIndex}`} style={styles.numpadRow}>
                    {row.map((item) => (
                      <TouchableOpacity
                        key={item.key}
                        style={[styles.numpadKey, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                        onPress={() => handleDigitPress(item.key)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.numpadKeyText, { color: colors.text }]}>{item.key}</Text>
                        {item.sub ? <Text style={[styles.numpadKeySub, { color: colors.textSecondary }]}>{item.sub}</Text> : null}
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
                <View style={styles.numpadRow}>
                  <View style={styles.numpadKeyGhost} />
                  <TouchableOpacity
                    style={[styles.numpadKey, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                    onPress={() => handleDigitPress('0')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.numpadKeyText, { color: colors.text }]}>0</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.numpadKey, styles.numpadKeyBackspace]}
                    onPress={handleBackspacePress}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="backspace-outline" size={22} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
        {verifyCheckingVisible ? (
          <View style={styles.inlineModalLayer}>
            <Animated.View style={[styles.verifyModalBackdrop, { opacity: 1 }]}>
              {renderVerifyModalCard('checking')}
            </Animated.View>
          </View>
        ) : null}
        {verifySuccessVisible ? (
          <View style={styles.inlineModalLayer}>
            <Animated.View style={[styles.verifyModalBackdrop, { opacity: 1 }]}>
              {renderVerifyModalCard('success', { opacity: verifyModalOpacityAnim })}
            </Animated.View>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screenContent: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  innerFixed: {
    width: '100%',
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
  content: {
    flex: 1,
  },
  mainArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 34,
    marginBottom: 8,
  },
  titleInRow: {
    marginBottom: 0,
  },
  titleFrame: {
    fontSize: 23,
  },
  subtitle: {
    fontSize: 15,
    color: '#000',
    opacity: 0.85,
    marginBottom: 24,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  otpBox: {
    flex: 1,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFrame: {
    height: 48,
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 6,
    gap: 6,
  },
  resendLabel: {
    fontSize: 14,
    color: '#000',
  },
  resendBtn: {
    fontSize: 14,
    color: '#E53935',
    fontWeight: '600',
  },
  resendBtnDisabled: {
    opacity: 0.7,
  },
  sendCodeBtn: {
    width: '100%',
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  sendCodeBtnFrame: {
    height: 48,
  },
  sendCodeBtnDisabled: {
    opacity: 0.5,
  },
  sendCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  numpadWrap: {
    marginTop: 22,
    marginBottom: 50,
    gap: 8,
  },
  numpadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  numpadKey: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numpadKeyGhost: {
    flex: 1,
  },
  numpadKeyBackspace: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  numpadKeyText: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 24,
  },
  numpadKeySub: {
    fontSize: 9,
    marginTop: 1,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  verifyModalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(4,9,16,0.46)',
    paddingHorizontal: 24,
  },
  inlineModalLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  verifyModalCard: {
    width: '100%',
    maxWidth: 300,
    minHeight: 190,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 18,
    backgroundColor: '#151b24',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  verifyModalTitleSlot: {
    minHeight: 24,
    justifyContent: 'center',
  },
  verifyModalTitle: {
    color: '#f3f6fb',
    fontSize: 16,
    fontWeight: '700',
  },
  verifyModalSubtitleSlot: {
    minHeight: 44,
    justifyContent: 'center',
    marginTop: 8,
  },
  verifyModalSubtitle: {
    color: '#9aa4b2',
    fontSize: 13,
    lineHeight: 18,
  },
  verifyModalIconSlot: {
    minHeight: 64,
    marginTop: 14,
    justifyContent: 'center',
  },
  verifySpinner: {
    alignSelf: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.18)',
    borderTopColor: '#4d66ff',
    borderRightColor: '#4d66ff',
  },
  verifySuccessBadge: {
    alignSelf: 'center',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22a45a',
  },
  verifySuccessIcon: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 28,
  },
});
