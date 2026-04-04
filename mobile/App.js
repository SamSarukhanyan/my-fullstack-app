import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, LogBox, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Poppins_600SemiBold, Poppins_500Medium } from '@expo-google-fonts/poppins';

import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { useViewport } from './src/context/ViewportContext';
import DeviceFrameWrapper from './src/components/DeviceFrameWrapper';
import SplashScreen from './src/screens/SplashScreen';

function StatusBarByTheme() {
  const { theme } = useTheme();
  return <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />;
}

const HOME_INDICATOR_SCREENS = new Set([
  'phone',
  'verification',
  'personalInformation',
  'selectUsername',
  'signIn',
  'forgotPassword',
  'pickNewPassword',
]);

function GlobalHomeIndicator({ activeScreen, isTransitioning }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isFrameMode } = useViewport();
  const showForScreen = HOME_INDICATOR_SCREENS.has(activeScreen);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.stopAnimation();

    if (!showForScreen || isTransitioning) {
      anim.setValue(0);
      return;
    }

    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeScreen, anim, isTransitioning, showForScreen]);

  if (!showForScreen) return null;

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });
  const bottom = isFrameMode ? 5 : Math.max(5, insets.bottom + 5);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.globalHomeIndicatorWrap,
        {
          bottom,
          opacity: anim,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.globalHomeIndicator} />
    </Animated.View>
  );
}
import PhoneScreen from './src/screens/PhoneScreen';
import VerificationScreen from './src/screens/VerificationScreen';
import PersonalInformationScreen from './src/screens/PersonalInformationScreen';
import SelectUsernameScreen from './src/screens/SelectUsernameScreen';
import SignInScreen from './src/screens/SignInScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import PickNewPasswordScreen from './src/screens/PickNewPasswordScreen';
import MainPagerScreen from './src/screens/MainPagerScreen';

const INITIAL_SCREEN = 'splash';
const TRANSITION_DURATION_MS = 360;
const PREVIOUS_SCREEN_OFFSET = 0.2;
const AUTH_CHECKING_DURATION_MS = 2500;
const AUTH_SUCCESS_HOLD_MS = 550;
const AUTH_SUCCESS_FADE_OUT_MS = 260;
const AUTH_MODAL_FADE_OUT_MS = 220;
LogBox.ignoreLogs([
  'NativeSharedObjectNotFoundException',
  "Calling the 'pause' function has failed",
]);

export default function App() {
  const { width: windowWidth } = useWindowDimensions();
  const [screen, setScreen] = useState(INITIAL_SCREEN);
  const [verificationFromForgotPassword, setVerificationFromForgotPassword] = useState(false);
  const [authCompletingVisible, setAuthCompletingVisible] = useState(false);
  const [authModalStep, setAuthModalStep] = useState('checking');
  const [prevScreen, setPrevScreen] = useState(null);
  const [transitionDirection, setTransitionDirection] = useState(1);
  const transitionAnim = useRef(new Animated.Value(1)).current;
  const authSpinnerAnim = useRef(new Animated.Value(0)).current;
  const authSuccessAnim = useRef(new Animated.Value(0)).current;
  const authModalOpacityAnim = useRef(new Animated.Value(1)).current;
  const screenRef = useRef(INITIAL_SCREEN);
  const transitioningRef = useRef(false);
  const queuedScreenRef = useRef(null);
  const transitionTokenRef = useRef(0);
  const authCheckingTimerRef = useRef(null);
  const authSequenceTokenRef = useRef(0);
  useFonts({ Poppins_600SemiBold, Poppins_500Medium });

  const screenOrder = useMemo(
    () => ({
      splash: 0,
      phone: 1,
      verification: 2,
      personalInformation: 3,
      selectUsername: 4,
      signIn: 5,
      forgotPassword: 6,
      pickNewPassword: 7,
      main: 8,
    }),
    []
  );

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => () => {
    transitionTokenRef.current += 1;
    transitionAnim.stopAnimation();
    authSpinnerAnim.stopAnimation();
    authSuccessAnim.stopAnimation();
    authModalOpacityAnim.stopAnimation();
    if (authCheckingTimerRef.current) {
      clearTimeout(authCheckingTimerRef.current);
      authCheckingTimerRef.current = null;
    }
  }, [authModalOpacityAnim, authSpinnerAnim, authSuccessAnim, transitionAnim]);

  useEffect(() => {
    if (!authCompletingVisible || authModalStep !== 'checking') {
      authSpinnerAnim.stopAnimation();
      authSpinnerAnim.setValue(0);
      return;
    }
    authSpinnerAnim.setValue(0);
    const loop = Animated.loop(
      Animated.timing(authSpinnerAnim, {
        toValue: 1,
        duration: 920,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => {
      loop.stop();
      authSpinnerAnim.stopAnimation();
    };
  }, [authCompletingVisible, authModalStep, authSpinnerAnim]);

  useEffect(() => {
    if (!authCompletingVisible || authModalStep !== 'success') return undefined;
    const token = authSequenceTokenRef.current;
    authSuccessAnim.stopAnimation();
    authSuccessAnim.setValue(0);

    // Prepare home screen while modal is still visible to avoid post-close delay.
    queuedScreenRef.current = null;
    transitioningRef.current = false;
    setPrevScreen(null);
    setScreen('main');
    screenRef.current = 'main';
    Animated.timing(authSuccessAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished || token !== authSequenceTokenRef.current) return;
      Animated.delay(AUTH_SUCCESS_HOLD_MS).start(({ finished: holdFinished }) => {
        if (!holdFinished || token !== authSequenceTokenRef.current) return;
        Animated.timing(authSuccessAnim, {
          toValue: 0,
          duration: AUTH_SUCCESS_FADE_OUT_MS,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }).start(({ finished: successOutFinished }) => {
          if (!successOutFinished || token !== authSequenceTokenRef.current) return;

          Animated.timing(authModalOpacityAnim, {
            toValue: 0,
            duration: AUTH_MODAL_FADE_OUT_MS,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }).start(({ finished: modalOutFinished }) => {
            if (!modalOutFinished || token !== authSequenceTokenRef.current) return;
            setAuthCompletingVisible(false);
          });
        });
      });
    });

    return () => {
      authSuccessAnim.stopAnimation();
    };
  }, [authCompletingVisible, authModalOpacityAnim, authModalStep, authSuccessAnim]);

  const runScreenTransition = (nextScreen) => {
    const fromScreen = screenRef.current;
    if (!nextScreen || nextScreen === fromScreen) return;
    const from = screenOrder[fromScreen] ?? 0;
    const to = screenOrder[nextScreen] ?? from + 1;
    const direction = to >= from ? 1 : -1;

    transitionTokenRef.current += 1;
    const token = transitionTokenRef.current;
    transitioningRef.current = true;
    setTransitionDirection(direction);
    setPrevScreen(fromScreen);
    setScreen(nextScreen);
    screenRef.current = nextScreen;

    transitionAnim.stopAnimation();
    transitionAnim.setValue(0);

    Animated.timing(transitionAnim, {
      toValue: 1,
      duration: TRANSITION_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (token !== transitionTokenRef.current) return;
      setPrevScreen(null);
      transitioningRef.current = false;

      if (!finished) return;
      const queued = queuedScreenRef.current;
      queuedScreenRef.current = null;
      if (queued && queued !== screenRef.current) {
        runScreenTransition(queued);
      }
    });
  };

  const setScreenWithSlide = (nextScreen) => {
    if (!nextScreen) return;
    if (nextScreen === screenRef.current) {
      queuedScreenRef.current = null;
      return;
    }
    if (transitioningRef.current) {
      queuedScreenRef.current = nextScreen;
      return;
    }
    runScreenTransition(nextScreen);
  };

  const completeAuthWithModal = () => {
    authSequenceTokenRef.current += 1;
    const token = authSequenceTokenRef.current;
    if (authCheckingTimerRef.current) {
      clearTimeout(authCheckingTimerRef.current);
      authCheckingTimerRef.current = null;
    }
    authSuccessAnim.stopAnimation();
    authSuccessAnim.setValue(0);
    authModalOpacityAnim.stopAnimation();
    authModalOpacityAnim.setValue(1);
    setAuthModalStep('checking');
    setAuthCompletingVisible(true);
    authCheckingTimerRef.current = setTimeout(() => {
      if (token !== authSequenceTokenRef.current) return;
      setAuthModalStep('success');
      authCheckingTimerRef.current = null;
    }, AUTH_CHECKING_DURATION_MS);
  };

  const renderScreen = (activeScreen) => {
    if (activeScreen === 'splash') {
      return <SplashScreen onFinish={() => setScreenWithSlide('phone')} />;
    }
    if (activeScreen === 'phone') {
      return (
        <PhoneScreen
          onBack={() => setScreenWithSlide('splash')}
          onNext={() => {
            setVerificationFromForgotPassword(false);
            setScreenWithSlide('verification');
          }}
          onSignIn={() => setScreenWithSlide('signIn')}
        />
      );
    }
    if (activeScreen === 'verification') {
      return (
        <VerificationScreen
          onBack={() => (verificationFromForgotPassword ? setScreenWithSlide('forgotPassword') : setScreenWithSlide('phone'))}
          onNext={() => (verificationFromForgotPassword ? setScreenWithSlide('pickNewPassword') : setScreenWithSlide('personalInformation'))}
          onSignIn={() => setScreenWithSlide('signIn')}
        />
      );
    }
    if (activeScreen === 'personalInformation') {
      return (
        <PersonalInformationScreen
          onBack={() => setScreenWithSlide('verification')}
          onNext={() => setScreenWithSlide('selectUsername')}
          onSignIn={() => setScreenWithSlide('signIn')}
        />
      );
    }
    if (activeScreen === 'selectUsername') {
      return (
        <SelectUsernameScreen
          onBack={() => setScreenWithSlide('personalInformation')}
          onNext={completeAuthWithModal}
          onSignIn={() => setScreenWithSlide('signIn')}
        />
      );
    }
    if (activeScreen === 'signIn') {
      return (
        <SignInScreen
          onBack={() => setScreenWithSlide('phone')}
          onDone={completeAuthWithModal}
          onSignUp={() => setScreenWithSlide('phone')}
          onForgotPassword={() => setScreenWithSlide('forgotPassword')}
        />
      );
    }
    if (activeScreen === 'forgotPassword') {
      return (
        <ForgotPasswordScreen
          onBack={() => setScreenWithSlide('signIn')}
          onDone={() => {
            setVerificationFromForgotPassword(true);
            setScreenWithSlide('verification');
          }}
          onSignUp={() => setScreenWithSlide('phone')}
        />
      );
    }
    if (activeScreen === 'pickNewPassword') {
      return (
        <PickNewPasswordScreen
          onBack={() => setScreenWithSlide('verification')}
          onDone={completeAuthWithModal}
          onSignUp={() => setScreenWithSlide('phone')}
        />
      );
    }
    return <MainPagerScreen />;
  };

  const currentTranslateX = prevScreen
    ? transitionAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [transitionDirection * windowWidth, 0],
      })
    : 0;
  const previousTranslateX = transitionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -transitionDirection * windowWidth * PREVIOUS_SCREEN_OFFSET],
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBarByTheme />
          <AuthProvider>
            <DeviceFrameWrapper>
              <View style={styles.transitionRoot}>
                {prevScreen ? (
                  <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: previousTranslateX }] }]}>
                    {renderScreen(prevScreen)}
                  </Animated.View>
                ) : null}
                <Animated.View style={[styles.currentScreen, { transform: [{ translateX: currentTranslateX }] }]}>
                  {renderScreen(screen)}
                </Animated.View>
                <GlobalHomeIndicator activeScreen={screen} isTransitioning={Boolean(prevScreen)} />
                {authCompletingVisible ? (
                  <View style={styles.authInlineModalLayer}>
                    <Animated.View style={[styles.authModalBackdrop, { opacity: authModalOpacityAnim }]}>
                      <View style={styles.authModalCard}>
                        <View style={styles.authModalTitleSlot}>
                          <Text style={styles.authModalTitle}>
                            {authModalStep === 'checking' ? 'Checking your details' : 'Authentication complete'}
                          </Text>
                        </View>
                        <View style={styles.authModalSubtitleSlot}>
                          <Text style={styles.authModalSubtitle}>
                            {authModalStep === 'checking'
                              ? 'Please wait while we verify your account.'
                              : 'All set. Redirecting you to the home page.'}
                          </Text>
                        </View>
                        <View style={styles.authModalIconSlot}>
                          {authModalStep === 'checking' ? (
                            <Animated.View
                              style={[
                                styles.authSpinner,
                                {
                                  transform: [
                                    {
                                      rotate: authSpinnerAnim.interpolate({
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
                                styles.authSuccessBadge,
                                {
                                  opacity: authSuccessAnim,
                                  transform: [
                                    {
                                      scale: authSuccessAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.86, 1],
                                      }),
                                    },
                                  ],
                                },
                              ]}
                            >
                              <Text style={styles.authSuccessIcon}>✓</Text>
                            </Animated.View>
                          )}
                        </View>
                      </View>
                    </Animated.View>
                  </View>
                ) : null}
              </View>
            </DeviceFrameWrapper>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  transitionRoot: {
    flex: 1,
    overflow: 'hidden',
  },
  currentScreen: {
    flex: 1,
  },
  authInlineModalLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  globalHomeIndicatorWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  globalHomeIndicator: {
    width: 118,
    height: 5,
    borderRadius: 2.5,
    marginBottom: 0,
    backgroundColor: 'rgba(255,255,255,0.30)',
  },
  authModalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(4,9,16,0.46)',
    paddingHorizontal: 24,
  },
  authModalCard: {
    width: '100%',
    maxWidth: 300,
    height: 190,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 18,
    backgroundColor: '#151b24',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  authModalTitleSlot: {
    minHeight: 24,
    justifyContent: 'center',
  },
  authModalTitle: {
    color: '#f3f6fb',
    fontSize: 16,
    fontWeight: '700',
  },
  authModalSubtitleSlot: {
    minHeight: 44,
    justifyContent: 'center',
    marginTop: 8,
  },
  authModalSubtitle: {
    color: '#9aa4b2',
    fontSize: 13,
    lineHeight: 18,
  },
  authModalIconSlot: {
    minHeight: 64,
    marginTop: 14,
    justifyContent: 'center',
  },
  authSpinner: {
    alignSelf: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.18)',
    borderTopColor: '#4d66ff',
    borderRightColor: '#4d66ff',
  },
  authSuccessBadge: {
    alignSelf: 'center',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22a45a',
  },
  authSuccessIcon: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 28,
  },
});
