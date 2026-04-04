import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
  PanResponder,
  Keyboard,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FixedBottomBar } from '../components/FixedBottomBar';
import GradientButton from '../components/GradientButton';
import {
  BOTTOM_BAR_CONTENT_HEIGHT,
  BACK_BUTTON_TOP,
  BACK_BUTTON_LEFT,
  BACK_BUTTON_AREA_HEIGHT,
} from '../constants/bottomBar';
import { useTheme } from '../context/ThemeContext';
import { useViewport } from '../context/ViewportContext';

/**
 * Figma: Sign In (87-1255).
 * Back 73/27, title Sign In 215×30 top 136 left 27, inputs 321×49 #F2F2F2, focused border #5A5CFF,
 * Done 321×49 #5A5CFF, "Do not have an Account? Sign up".
 */
const TEAL = '#5A5CFF';
const INPUT_BG = '#F2F2F2';
const INPUT_BORDER_DEFAULT = 'rgba(0,0,0,0.08)';
const INPUT_BORDER_FOCUSED = TEAL;
const SWIPE_EDGE_WIDTH = 0.15;
const SWIPE_MIN_DX = 55;
const SWIPE_DRAG_FACTOR = 0.52;
const SWIPE_BACK_DURATION = 320;

export default function SignInScreen({ onBack, onDone, onSignUp, onForgotPassword }) {
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const { width: screenWidth, height: screenHeight, isFrameMode } = useViewport();
  const effectiveInsets = isFrameMode ? { top: 0, bottom: 0, left: 0, right: 0 } : insets;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);
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

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom: BOTTOM_BAR_CONTENT_HEIGHT + effectiveInsets.bottom + 40,
                paddingLeft: isFrameMode ? 18 : 27,
                paddingRight: isFrameMode ? 18 : 27,
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            decelerationRate="fast"
            scrollEventThrottle={16}
          >
            <Pressable onPress={Keyboard.dismiss} style={styles.scrollPressable}>
              <View style={styles.titleWrap}>
                <Text style={[styles.titleSignIn, { color: colors.text }, isFrameMode && styles.titleFrame]} numberOfLines={1}>
                  Sign In
                </Text>
              </View>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Enter your credentials</Text>

              <Text style={[styles.label, { color: colors.text }]}>Username</Text>
              <TextInput
                style={[
                  styles.input,
                  { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text },
                  theme !== 'dark' && styles.inputSoft,
                  focusedInput === 'username' && theme === 'dark' && styles.inputFocused,
                ]}
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                placeholderTextColor={colors.placeholder}
                onFocus={() => setFocusedInput('username')}
                onBlur={() => setFocusedInput(null)}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={[styles.label, { color: colors.text }]}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text },
                  theme !== 'dark' && styles.inputSoft,
                  focusedInput === 'password' && theme === 'dark' && styles.inputFocused,
                ]}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={colors.placeholder}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                secureTextEntry
              />
              <TouchableOpacity style={styles.forgotWrap} onPress={onForgotPassword} activeOpacity={0.7}>
                <Text style={[styles.forgotLink, { color: colors.primary }]}>Forgot Password?</Text>
              </TouchableOpacity>
            </Pressable>
          </ScrollView>

          <FixedBottomBar
            insets={effectiveInsets}
            primaryButton={
              <GradientButton
                style={[styles.doneBtn, isFrameMode && styles.primaryBtnFrame]}
                onPress={() => onDone?.({ username, password })}
              >
                <Text style={[styles.doneBtnText, { color: colors.buttonPrimaryText }]}>Done</Text>
              </GradientButton>
            }
            signInRow={
              <View style={styles.bottomContentWrap}>
                <Text style={[styles.bottomContentText, { color: colors.text }]}>Do not have an Account? </Text>
                <TouchableOpacity onPress={onSignUp} activeOpacity={0.7}>
                  <Text style={[styles.signUpLink, { color: colors.primary }]}>Sign up</Text>
                </TouchableOpacity>
              </View>
            }
            backgroundColor={colors.background}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
    flexGrow: 1,
  },
  scrollPressable: {
    flexGrow: 1,
  },
  titleWrap: {
    marginTop: 16,
    width: 215,
    minHeight: 34,
    justifyContent: 'center',
    marginBottom: 6,
  },
  titleSignIn: {
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 0,
    color: '#000000',
  },
  titleFrame: {
    fontSize: 18,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
    opacity: 0.7,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    maxWidth: 321,
    height: 49,
    borderWidth: 0,
    borderColor: INPUT_BORDER_DEFAULT,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
    paddingHorizontal: 14,
    paddingVertical: 0,
    marginBottom: 20,
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
    backgroundColor: INPUT_BG,
  },
  inputFocused: {
    borderColor: INPUT_BORDER_FOCUSED,
    borderWidth: 0,
  },
  inputSoft: {
    borderWidth: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  forgotWrap: {
    width: 125,
    height: 21,
    opacity: 0.7,
    alignSelf: 'flex-end',
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  forgotLink: {
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 14,
    letterSpacing: 0,
    color: TEAL,
  },
  doneBtn: {
    width: '100%',
    maxWidth: 321,
    alignSelf: 'center',
    height: 49,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomContentWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    minHeight: 26,
    paddingTop: 2,
  },
  bottomContentText: {
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0,
    color: '#000000',
  },
  signUpLink: {
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0,
    color: TEAL,
  },
  primaryBtnFrame: {
    height: 48,
  },
  homeIndicator: {
    width: 118,
    height: 5,
    borderRadius: 2.5,
    marginBottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
});
