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
import { BOTTOM_BAR_CONTENT_HEIGHT, BACK_BUTTON_TOP, BACK_BUTTON_LEFT, BACK_BUTTON_AREA_HEIGHT } from '../constants/bottomBar';
import { useTheme } from '../context/ThemeContext';
import { useViewport } from '../context/ViewportContext';

/**
 * Figma: Select a Username (87-1221) matches the design exactly.
 * Fields: 321x49 (per design), 10px radius, #F2F2F2 fill, thin light border.
 */
const INPUT_BG = '#F2F2F2';
const TEAL = '#5A5CFF';
const INPUT_BORDER = '#E5E7EB';
const SIGN_IN_LINK_BLUE = '#2563EB';
const SWIPE_EDGE_WIDTH = 0.15;
const SWIPE_MIN_DX = 55;
const SWIPE_DRAG_FACTOR = 0.52;
const SWIPE_BACK_DURATION = 320;

export default function SelectUsernameScreen({ onBack, onNext, onSignIn }) {
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const { width: screenWidth, height: screenHeight, isFrameMode } = useViewport();
  const effectiveInsets = isFrameMode ? { top: 0, bottom: 0, left: 0, right: 0 } : insets;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const handleDone = () => {
    onNext?.({ username, password, confirmPassword });
  };

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
                paddingHorizontal: isFrameMode ? 18 : 24,
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            decelerationRate="fast"
            scrollEventThrottle={16}
          >
            <Pressable onPress={Keyboard.dismiss} style={styles.scrollPressable}>
              <Text style={[styles.title, { color: colors.text }, isFrameMode && styles.titleFrame]}>Select a Username</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Help secure your account</Text>

              <Text style={[styles.label, { color: colors.text }]}>Username</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text }, theme !== 'dark' && styles.inputSoft]}
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={[styles.label, { color: colors.text }]}>Password</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text }, theme !== 'dark' && styles.inputSoft]}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={colors.placeholder}
                secureTextEntry
              />

              <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text }, theme !== 'dark' && styles.inputSoft]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm Password"
                placeholderTextColor={colors.placeholder}
                secureTextEntry
              />
            </Pressable>
          </ScrollView>

          <FixedBottomBar
            insets={effectiveInsets}
            primaryButton={
              <GradientButton style={[styles.doneBtn, isFrameMode && styles.primaryBtnFrame]} onPress={handleDone}>
                <Text style={[styles.doneBtnText, { color: colors.buttonPrimaryText }]}>Done</Text>
              </GradientButton>
            }
            signInRow={
              <TouchableOpacity style={styles.signInWrap} onPress={onSignIn}>
                <Text style={[styles.signInText, { color: colors.text }]}>Already have an account? </Text>
                <Text style={[styles.signInLink, { color: colors.primary }]}>Sign In</Text>
              </TouchableOpacity>
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
    paddingTop: 4,
    flexGrow: 1,
  },
  scrollPressable: {
    flexGrow: 1,
  },
  titleFrame: {
    fontSize: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 49,
    borderWidth: 0,
    borderColor: INPUT_BORDER,
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
  inputSoft: {
    borderWidth: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  doneBtn: {
    width: '100%',
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
  signInWrap: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '500',
    color: SIGN_IN_LINK_BLUE,
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
