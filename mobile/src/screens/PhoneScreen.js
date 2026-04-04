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
 * Figma: Phone screen (92-76) — signup phone entry.
 * Tap outside input closes keyboard. Swipe-back with rubber animation.
 */
const TEAL = '#5A5CFF';
const SWIPE_EDGE_WIDTH = 0.15;
const SWIPE_MIN_DX = 55;
const SWIPE_DRAG_FACTOR = 0.52;
const SWIPE_BACK_DURATION = 320;

const COUNTRIES = [
  { name: 'Armenia', code: '+374', flag: '🇦🇲' },
  { name: 'Ghana', code: '+233', flag: '🇬🇭' },
  { name: 'Cameroon', code: '+237', flag: '🇨🇲' },
  { name: 'Niger', code: '+227', flag: '🇳🇪' },
  { name: 'Nigeria', code: '+234', flag: '🇳🇬' },
  { name: 'America', code: '+1', flag: '🇺🇸' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
];

const DEFAULT_COUNTRY = COUNTRIES.find((c) => c.code === '+374') || COUNTRIES[0];

export default function PhoneScreen({ onBack, onNext, onSignIn }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { width: screenWidth, height: screenHeight, isFrameMode } = useViewport();
  const effectiveInsets = isFrameMode ? { top: 0, bottom: 0, left: 0, right: 0 } : insets;
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState('');
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
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
            <Ionicons name="chevron-back" size={isFrameMode ? 24 : 28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }, isFrameMode && styles.headerTitleFrame]}>Phone</Text>
        </View>
        <View style={styles.backButtonSpacer} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: BOTTOM_BAR_CONTENT_HEIGHT + effectiveInsets.bottom + 40, paddingHorizontal: isFrameMode ? 18 : 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          decelerationRate="fast"
          scrollEventThrottle={16}
        >
          <Pressable onPress={Keyboard.dismiss} style={styles.scrollPressable}>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>Enter your phone number</Text>

        <View style={[styles.inputRow, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
          <TouchableOpacity style={[styles.countrySelector, { borderRightColor: colors.inputBorder }]}>
            <Text style={styles.flag}>{selectedCountry.flag}</Text>
            <Text style={[styles.countryCode, { color: colors.text }]}>{selectedCountry.code}</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.phoneInput, { color: colors.text }]}
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            placeholderTextColor={colors.placeholder}
            keyboardType="phone-pad"
            maxLength={15}
          />
        </View>

        <View style={styles.countryList}>
          {COUNTRIES.map((country) => {
            const isSelected = selectedCountry.code === country.code && selectedCountry.name === country.name;
            return (
              <TouchableOpacity
                key={`${country.name}-${country.code}`}
                style={[
                  styles.countryRow,
                  { backgroundColor: isSelected ? colors.buttonPrimaryBg : 'transparent' },
                  isFrameMode && styles.countryRowFrame,
                ]}
                onPress={() => setSelectedCountry(country)}
                activeOpacity={0.7}
              >
                <Text style={styles.countryRowFlag}>{country.flag}</Text>
                <Text style={[styles.countryRowName, { color: isSelected ? colors.buttonPrimaryText : colors.text }, isSelected && styles.countryRowTextSelected]}>
                  {country.name}
                </Text>
                <Text style={[styles.countryRowCode, { color: isSelected ? colors.buttonPrimaryText : colors.text }, isSelected && styles.countryRowTextSelected]}>
                  {country.code}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
          </Pressable>
        </ScrollView>

        <FixedBottomBar
          insets={effectiveInsets}
          primaryButton={
            <GradientButton
              style={[styles.nextBtn, isFrameMode && styles.primaryBtnFrame]}
              onPress={() => onNext?.({ country: selectedCountry, phone })}
            >
              <Text style={[styles.nextBtnText, { color: colors.buttonPrimaryText }]}>Next</Text>
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
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backButtonSpacer: {
    height: BACK_BUTTON_AREA_HEIGHT,
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  headerTitleFrame: {
    fontSize: 22,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    flexGrow: 1,
  },
  scrollPressable: {
    flexGrow: 1,
  },
  hint: {
    fontSize: 15,
    color: '#000',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 49,
    borderWidth: 1,
    borderColor: TEAL,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#FFF',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,97,117,0.3)',
  },
  flag: {
    fontSize: 22,
    marginRight: 6,
  },
  countryCode: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 0,
  },
  countryList: {
    marginBottom: 24,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 2,
  },
  countryRowFrame: {
    paddingVertical: 10,
  },
  countryRowSelected: {
    backgroundColor: TEAL,
  },
  countryRowFlag: {
    fontSize: 20,
    marginRight: 10,
  },
  countryRowName: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  countryRowCode: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  countryRowTextSelected: {
    color: '#FFFFFF',
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
  signInWrap: {
    flexDirection: 'row',
    alignSelf: 'center',
  },
  signInText: {
    fontSize: 14,
    color: '#000',
  },
  signInLink: {
    fontSize: 14,
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
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
