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
 * Figma: Pick a new Password / PASSWORD RESET (87-1239).
 * Back 73/27, title "Pick a new Password" 215×30, subtitle "Help secure your account" 255×24 opacity 0.7,
 * 2 inputs (New Password, Confirm new Password), Done 321×49 #5A5CFF (text 18px),
 * "Do not have an Account? Sign up".
 */
const TEAL = '#5A5CFF';
const INPUT_BG = '#F2F2F2';
const INPUT_BORDER_DEFAULT = 'rgba(0,0,0,0.08)';
const INPUT_BORDER_FOCUSED = TEAL;
const SWIPE_EDGE_WIDTH = 0.15;
const SWIPE_MIN_DX = 55;
const SWIPE_DRAG_FACTOR = 0.52;
const SWIPE_BACK_DURATION = 320;

export default function PickNewPasswordScreen({ onBack, onDone, onSignUp }) {
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const { width: screenWidth, height: screenHeight, isFrameMode } = useViewport();
  const effectiveInsets = isFrameMode ? { top: 0, bottom: 0, left: 0, right: 0 } : insets;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
                <Text style={[styles.title, { color: colors.text }, isFrameMode && styles.titleFrame]} numberOfLines={1}>
                  Pick a new Password
                </Text>
              </View>
              <View style={styles.subtitleWrap}>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Help secure your account</Text>
              </View>

              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.text }]}>New Password</Text>
                <TextInput
                  style={[
                    styles.input,
                    { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text },
                    theme !== 'dark' && styles.inputSoft,
                    focusedInput === 'newPassword' && theme === 'dark' && styles.inputFocused,
                  ]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="New Password"
                  placeholderTextColor={colors.placeholder}
                  onFocus={() => setFocusedInput('newPassword')}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry
                />
              </View>
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.text }]}>Confirm new Password</Text>
                <TextInput
                  style={[
                    styles.input,
                    { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text },
                    theme !== 'dark' && styles.inputSoft,
                    focusedInput === 'confirmPassword' && theme === 'dark' && styles.inputFocused,
                  ]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new Password"
                  placeholderTextColor={colors.placeholder}
                  onFocus={() => setFocusedInput('confirmPassword')}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry
                />
              </View>
            </Pressable>
          </ScrollView>

          <FixedBottomBar
            insets={effectiveInsets}
            primaryButton={
              <GradientButton
                style={[styles.doneBtn, isFrameMode && styles.primaryBtnFrame]}
                onPress={() => onDone?.({ newPassword, confirmPassword })}
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
    marginTop: 136 - BACK_BUTTON_AREA_HEIGHT,
    width: 215,
    height: 30,
    justifyContent: 'center',
    marginBottom: 5,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 20,
    letterSpacing: 0,
    color: '#000000',
  },
  titleFrame: {
    fontSize: 18,
  },
  subtitleWrap: {
    width: 255,
    height: 24,
    opacity: 0.7,
    justifyContent: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 16,
    letterSpacing: 0,
    color: '#000000',
  },
  fieldWrap: {
    marginBottom: 20,
  },
  label: {
    minHeight: 21,
    opacity: 0.7,
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 14,
    letterSpacing: 0,
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
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 18,
    letterSpacing: 0,
    color: '#FFFFFF',
  },
  bottomContentWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  bottomContentText: {
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 14,
    letterSpacing: 0,
    color: '#000000',
  },
  signUpLink: {
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 14,
    letterSpacing: 0,
    color: TEAL,
  },
  primaryBtnFrame: {
    height: 48,
  },
  homeIndicator: {
    width: 134,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
});
