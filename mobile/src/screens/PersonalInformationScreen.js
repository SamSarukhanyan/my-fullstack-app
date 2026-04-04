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
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FixedBottomBar } from '../components/FixedBottomBar';
import GradientButton from '../components/GradientButton';
import { BOTTOM_BAR_CONTENT_HEIGHT, BACK_BUTTON_TOP, BACK_BUTTON_LEFT, BACK_BUTTON_AREA_HEIGHT } from '../constants/bottomBar';
import { useTheme } from '../context/ThemeContext';
import { useViewport } from '../context/ViewportContext';

/**
 * Personal Information (87-1193). Только поля ввода — фон #F2F2F2. Экран — белый.
 */
const INPUT_BG = '#F2F2F2';
const TEAL = '#5A5CFF';
const INPUT_BORDER = '#D1D5DB';
const SIGN_IN_LINK_BLUE = '#2563EB';
const SWIPE_EDGE_WIDTH = 0.15;
const SWIPE_MIN_DX = 55;
const SWIPE_DRAG_FACTOR = 0.52;
const SWIPE_BACK_DURATION = 320;

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

export default function PersonalInformationScreen({ onBack, onNext, onSignIn }) {
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const { width: screenWidth, height: screenHeight, isFrameMode } = useViewport();
  const effectiveInsets = isFrameMode ? { top: 0, bottom: 0, left: 0, right: 0 } : insets;
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [about, setAbout] = useState('');
  const [genderModalVisible, setGenderModalVisible] = useState(false);
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
              { paddingBottom: BOTTOM_BAR_CONTENT_HEIGHT + effectiveInsets.bottom + 40, paddingHorizontal: isFrameMode ? 18 : 24 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            decelerationRate="fast"
            scrollEventThrottle={16}
          >
            <Pressable onPress={Keyboard.dismiss} style={styles.scrollPressable}>
              <Text style={[styles.title, { color: colors.text }, isFrameMode && styles.titleFrame]}>Personal Information</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Please fill the following</Text>

              <Text style={[styles.label, { color: colors.text }]}>Full name</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text }, theme !== 'dark' && styles.inputSoft]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Full name"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="words"
              />

              <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text }, theme !== 'dark' && styles.inputSoft]}
                value={email}
                onChangeText={setEmail}
                placeholder="Email Address"
                placeholderTextColor={colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={[styles.label, { color: colors.text }]}>Date of birth</Text>
                  <View style={[styles.inputDropdownWrap, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }, theme !== 'dark' && styles.inputDropdownSoft]}>
                    <TextInput
                      style={[styles.inputDropdownInput, { color: colors.text }]}
                      value={dateOfBirth}
                      onChangeText={setDateOfBirth}
                      placeholder="Select date"
                      placeholderTextColor={colors.placeholder}
                    />
                    <Ionicons name="chevron-down" size={20} color={colors.placeholder} />
                  </View>
                </View>
                <View style={styles.half}>
                  <Text style={[styles.label, { color: colors.text }]}>Gender</Text>
                  <TouchableOpacity
                    style={[styles.inputDropdownWrap, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }, theme !== 'dark' && styles.inputDropdownSoft]}
                    onPress={() => setGenderModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dropdownText, { color: colors.text }, !gender && [styles.placeholderText, { color: colors.placeholder }]]} numberOfLines={1}>
                      {gender || 'Select'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={colors.placeholder} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.label, { color: colors.text }]}>About</Text>
              <TextInput
                style={[styles.input, styles.aboutInput, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.text }, theme !== 'dark' && styles.inputSoft]}
                value={about}
                onChangeText={setAbout}
                placeholder="About"
                placeholderTextColor={colors.placeholder}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </Pressable>
          </ScrollView>

          <FixedBottomBar
            insets={effectiveInsets}
            primaryButton={
              <GradientButton
                style={[styles.nextBtn, isFrameMode && styles.primaryBtnFrame]}
                onPress={() => onNext?.({ fullName, email, dateOfBirth, gender, about })}
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

      {isFrameMode ? (
        genderModalVisible ? (
          <View style={styles.inlineModalLayer}>
            <Pressable style={[styles.modalOverlay, { backgroundColor: colors.overlay }]} onPress={() => setGenderModalVisible(false)}>
              <View style={[styles.modalContent, { backgroundColor: colors.surfaceElevated }]}>
                {GENDER_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={styles.modalOption}
                    onPress={() => {
                      setGender(opt);
                      setGenderModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalOptionText, { color: colors.text }]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Pressable>
          </View>
        ) : null
      ) : (
        <Modal
          visible={genderModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setGenderModalVisible(false)}
        >
          <Pressable style={[styles.modalOverlay, { backgroundColor: colors.overlay }]} onPress={() => setGenderModalVisible(false)}>
            <View style={[styles.modalContent, { backgroundColor: colors.surfaceElevated }]}>
              {GENDER_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.modalOption}
                  onPress={() => {
                    setGender(opt);
                    setGenderModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalOptionText, { color: colors.text }]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>
      )}
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
    paddingHorizontal: 24,
    paddingTop: 4,
    flexGrow: 1,
  },
  scrollPressable: {
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
  },
  titleFrame: {
    fontSize: 24,
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
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 0,
    borderColor: INPUT_BORDER,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
    paddingHorizontal: 14,
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
  aboutInput: {
    minHeight: 96,
    paddingTop: 14,
    paddingBottom: 14,
    marginBottom: 0,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  half: {
    flex: 1,
  },
  inputDropdownWrap: {
    height: 48,
    borderWidth: 0,
    borderColor: INPUT_BORDER,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: INPUT_BG,
  },
  inputDropdownSoft: {
    borderWidth: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  inputDropdownInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
    paddingVertical: 0,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
  },
  placeholderText: {
    color: '#9CA3AF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  inlineModalLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#000',
  },
});
