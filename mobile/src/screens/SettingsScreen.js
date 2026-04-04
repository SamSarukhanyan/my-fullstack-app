import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Easing,
  Modal,
  Pressable,
  Switch,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getRefreshSpinnerColor } from '../theme';
import { getUploadsUrl, apiFetchWithAuth, apiFetchWithAuthFormData } from '../api/client';
import { AUTH, ACCOUNT } from '../api/endpoints';
import { useViewport } from '../context/ViewportContext';
import { frameModeStyles } from '../components/DeviceFrameWrapper';
import GradientButton from '../components/GradientButton';

const { width: FALLBACK_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 48;
const AVATAR_SIZE = 88;
const DRAG_CLOSE_THRESHOLD = 80;
/** Подложка смещена влево — край экрана в середине avatar. */
const UNDERLAY_OFFSET_LEFT_PX = 44;
const UNDERLAY_FOLLOW_FACTOR = 0.28;
const BOTTOM_SHEET_HEIGHT = 140;
/** Отступ выбранного инпута над клавиатурой (px). */
const INPUT_KEYBOARD_GAP_PX = 5;

/**
 * Settings: открывается справа налево, закрытие свайпом вправо с синхронной подложкой (как Chat).
 * Поля: аватар (change picture → bottom sheet), name, surname, username, password, isPrivate.
 */
export default function SettingsScreen({
  visible,
  onClose,
  onTranslateX,
  onAnimateUnderlayToZero,
}) {
  const insets = useSafeAreaInsets();
  const { width: viewportWidth, isFrameMode } = useViewport();
  const panelWidth = viewportWidth ?? FALLBACK_WIDTH;
  const headerHeight = isFrameMode ? frameModeStyles.header?.height : HEADER_HEIGHT;
  const headerBtnStyle = isFrameMode ? frameModeStyles.headerBtn : undefined;
  const headerTitleStyle = isFrameMode ? frameModeStyles.headerTitle : undefined;
  const avatarSize = isFrameMode ? (frameModeStyles.profileAvatarSize ?? 72) : AVATAR_SIZE;
  const { token } = useAuth();
  const { colors, theme } = useTheme();
  const spinnerColor = colors.refreshSpinner || getRefreshSpinnerColor(theme);

  const [panKey, setPanKey] = useState(0);
  const translateX = useRef(new Animated.Value(panelWidth)).current;
  const dragRef = useRef(0);
  const isClosingRef = useRef(false);
  const entranceDoneRef = useRef(false);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [pictureUri, setPictureUri] = useState(null);

  const [pictureSheetVisible, setPictureSheetVisible] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const keyboardSpacerHeight = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const scrollViewHeightRef = useRef(0);
  const scrollOffsetYRef = useRef(0);
  const fieldLayoutsRef = useRef({});
  const focusedFieldRef = useRef(null);
  const nameFieldRef = useRef(null);
  const surnameFieldRef = useRef(null);
  const usernameFieldRef = useRef(null);
  const passwordFieldRef = useRef(null);
  const focusedFieldViewRef = useRef(null);

  const resetTransform = useCallback(() => {
    translateX.setValue(panelWidth);
    dragRef.current = 0;
    isClosingRef.current = false;
  }, [translateX, panelWidth]);

  useEffect(() => {
    if (visible) {
      entranceDoneRef.current = false;
      resetTransform();
      setPanKey((k) => k + 1);
      translateX.setValue(panelWidth);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          entranceDoneRef.current = true;
          onTranslateX?.(-UNDERLAY_OFFSET_LEFT_PX);
        }
      });
    } else {
      translateX.setValue(panelWidth);
      dragRef.current = 0;
      isClosingRef.current = false;
    }
  }, [visible, resetTransform, onTranslateX, translateX, panelWidth]);

  useEffect(() => {
    if (!visible) {
      setLoading(false);
      return;
    }
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const minDelayId = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 200);
    const maxDelayId = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 15000);
    (async () => {
      try {
        const res = await apiFetchWithAuth(AUTH.user, token);
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        const user = data?.payload ?? data?.user ?? data;
        if (cancelled) return;
        setProfile(user);
        setName(user?.name ?? '');
        setSurname(user?.surname ?? '');
        setUsername(user?.username ?? '');
        setIsPrivate(!!user?.isPrivate);
        setPictureUri(user?.picture_url ? getUploadsUrl(user.picture_url) : null);
      } catch (_) {
        if (!cancelled) {
          setName('');
          setSurname('');
          setUsername('');
          setIsPrivate(false);
          setPictureUri(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
        clearTimeout(minDelayId);
        clearTimeout(maxDelayId);
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(minDelayId);
      clearTimeout(maxDelayId);
      setLoading(false);
    };
  }, [visible, token]);

  const closeWithAnimation = useCallback(() => {
    isClosingRef.current = true;
    onAnimateUnderlayToZero?.(200);
    Animated.timing(translateX, {
      toValue: panelWidth,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose?.());
  }, [translateX, onClose, onAnimateUnderlayToZero, panelWidth]);

  const onGestureEvent = useCallback(
    Animated.event([{ nativeEvent: { translationX: translateX } }], { useNativeDriver: true }),
    [translateX]
  );

  const onHandlerStateChange = useCallback(
    (e) => {
      if (e.nativeEvent.oldState !== State.ACTIVE) return;
      const x = typeof e.nativeEvent.translationX === 'number' ? e.nativeEvent.translationX : dragRef.current;
      dragRef.current = 0;
      if (x > DRAG_CLOSE_THRESHOLD) {
        closeWithAnimation();
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }).start();
      }
    },
    [translateX, closeWithAnimation]
  );

  useEffect(() => {
    const sub = translateX.addListener(({ value }) => {
      if (value > 0) dragRef.current = value;
      if (isClosingRef.current) return;
      if (!entranceDoneRef.current) return;
      if (value > panelWidth * 0.85) return;
      const underlayX = Math.min(0, -UNDERLAY_OFFSET_LEFT_PX + value * UNDERLAY_FOLLOW_FACTOR);
      onTranslateX?.(underlayX);
    });
    return () => translateX.removeListener(sub);
  }, [translateX, onTranslateX, panelWidth]);

  const scrollToFocusedInputAboveKeyboard = useCallback(
    (keyboardTopScreenY) => {
      const field = focusedFieldRef.current;
      if (field !== 'username' && field !== 'password') return;
      const layout = fieldLayoutsRef.current[field];
      if (!layout || !scrollViewRef.current) return;
      const visibleAboveKb = keyboardTopScreenY - insets.top - headerHeight;
      if (visibleAboveKb <= 0) return;
      const inputBottom = layout.y + layout.height;
      const scrollY = Math.max(0, inputBottom - visibleAboveKb + INPUT_KEYBOARD_GAP_PX);
      scrollViewRef.current.scrollTo({ y: scrollY, animated: true });
      scrollOffsetYRef.current = scrollY;
    },
    [insets.top, headerHeight]
  );

  const handleScroll = useCallback((ev) => {
    scrollOffsetYRef.current = ev.nativeEvent.contentOffset.y;
  }, []);

  useEffect(() => {
    const getHeight = (e) => e.endCoordinates?.height ?? 0;
    const getDurationMs = (e) => {
      const d = e.duration;
      if (d == null || d === 0) return 200;
      const ms = d < 20 ? Math.round(d * 1000) : d;
      return Math.max(120, Math.round(ms * 0.72));
    };
    const keyEasing = Easing.out(Easing.cubic);
    const showSub = Keyboard.addListener('keyboardWillShow', (e) => {
      const kbH = getHeight(e);
      const h = kbH + INPUT_KEYBOARD_GAP_PX;
      const durationMs = getDurationMs(e);
      const keyboardTopScreenY = e.endCoordinates?.screenY ?? (Dimensions.get('window').height - kbH);
      Animated.timing(keyboardSpacerHeight, {
        toValue: h,
        duration: durationMs,
        easing: keyEasing,
        useNativeDriver: false,
      }).start(() => {
        scrollToFocusedInputAboveKeyboard(keyboardTopScreenY);
      });
    });
    const hideSub = Keyboard.addListener('keyboardWillHide', (e) => {
      const durationMs = getDurationMs(e) || 200;
      Animated.timing(keyboardSpacerHeight, {
        toValue: 0,
        duration: durationMs,
        easing: keyEasing,
        useNativeDriver: false,
      }).start();
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardSpacerHeight, scrollToFocusedInputAboveKeyboard]);

  const saveFieldLayout = useCallback((name) => (e) => {
    const { y, height } = e.nativeEvent.layout;
    fieldLayoutsRef.current[name] = { y, height };
  }, []);

  const openPictureSheet = useCallback(() => {
    setPictureSheetVisible(true);
    Animated.timing(sheetAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [sheetAnim]);

  const closePictureSheet = useCallback(() => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setPictureSheetVisible(false));
  }, [sheetAnim]);

  const pickFromLibrary = useCallback(async () => {
    closePictureSheet();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri && token) {
      const uri = result.assets[0].uri;
      setPictureUri(uri);
      const formData = new FormData();
      formData.append('avatar', { uri, name: 'avatar.jpg', type: 'image/jpeg' });
      try {
        await apiFetchWithAuthFormData(ACCOUNT.avatar, token, formData);
      } catch (_) {}
    }
  }, [closePictureSheet, token]);

  const takePhoto = useCallback(async () => {
    closePictureSheet();
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri && token) {
      const uri = result.assets[0].uri;
      setPictureUri(uri);
      const formData = new FormData();
      formData.append('avatar', { uri, name: 'photo.jpg', type: 'image/jpeg' });
      try {
        await apiFetchWithAuthFormData(ACCOUNT.avatar, token, formData);
      } catch (_) {}
    }
  }, [closePictureSheet, token]);

  const handleSave = useCallback(async () => {
    if (!token) return;
    Keyboard.dismiss();
    setSaving(true);
    try {
      if (username !== (profile?.username ?? '')) {
        const res = await apiFetchWithAuth(AUTH.userUsername, token, {
          method: 'PATCH',
          body: JSON.stringify({ username, password: password || undefined }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d?.message || 'Username update failed');
        }
      }
      const resPrivacy = await apiFetchWithAuth(AUTH.userPrivacy, token, {
        method: 'PATCH',
        body: JSON.stringify({ isPrivate }),
      });
      if (!resPrivacy.ok) throw new Error('Privacy update failed');
      closeWithAnimation();
    } catch (e) {
      setSaving(false);
    } finally {
      setSaving(false);
    }
  }, [token, username, password, isPrivate, profile?.username, closeWithAnimation]);

  if (!visible) return null;

  const content = (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.background, width: panelWidth }]}>
      <View style={[styles.header, { height: headerHeight, borderBottomColor: colors.borderLight, backgroundColor: colors.surface }]}>
        <TouchableOpacity style={[styles.headerBtn, headerBtnStyle]} onPress={closeWithAnimation} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={isFrameMode ? 22 : 28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, headerTitleStyle, { color: colors.text }]}>Settings</Text>
        <View style={[styles.headerBtn, headerBtnStyle]} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        onLayout={(e) => { scrollViewHeightRef.current = e.nativeEvent.layout.height; }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + (insets.bottom || 0), paddingHorizontal: isFrameMode ? 12 : 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {loading ? (
          <View style={[styles.loadingWrap, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={spinnerColor} />
          </View>
        ) : (
        <>
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={openPictureSheet} activeOpacity={0.9} style={styles.avatarTouch}>
            {pictureUri ? (
              <Image source={{ uri: pictureUri }} style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]} resizeMode="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarSkeleton, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, backgroundColor: colors.inputBg }]}>
                <Ionicons name="person" size={isFrameMode ? 32 : 40} color={colors.iconInactive} />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={openPictureSheet} activeOpacity={0.7} style={styles.changePictureBtn}>
            <Text style={[styles.changePictureText, isFrameMode && frameModeStyles.text, { color: colors.buttonPrimaryBg }]}>Change picture</Text>
          </TouchableOpacity>
        </View>

        <View ref={nameFieldRef} onLayout={saveFieldLayout('name')}>
          <Text style={[styles.label, isFrameMode && frameModeStyles.textSmall, { color: colors.textSecondary }]}>Name</Text>
          <View>
            <TextInput
              style={[styles.input, isFrameMode && { fontSize: 12, paddingVertical: 8 }, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder="Name"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="words"
              onFocus={() => {
                focusedFieldRef.current = 'name';
                focusedFieldViewRef.current = nameFieldRef.current;
              }}
            />
          </View>
        </View>
        <View ref={surnameFieldRef} onLayout={saveFieldLayout('surname')}>
          <Text style={[styles.label, isFrameMode && frameModeStyles.textSmall, { color: colors.textSecondary }]}>Surname</Text>
          <View>
            <TextInput
              style={[styles.input, isFrameMode && { fontSize: 12, paddingVertical: 8 }, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              value={surname}
              onChangeText={setSurname}
              placeholder="Surname"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="words"
              onFocus={() => {
                focusedFieldRef.current = 'surname';
                focusedFieldViewRef.current = surnameFieldRef.current;
              }}
            />
          </View>
        </View>
        <View ref={usernameFieldRef} onLayout={saveFieldLayout('username')}>
          <Text style={[styles.label, isFrameMode && frameModeStyles.textSmall, { color: colors.textSecondary }]}>Username</Text>
          <View>
            <TextInput
              style={[styles.input, isFrameMode && { fontSize: 12, paddingVertical: 8 }, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => {
                focusedFieldRef.current = 'username';
                focusedFieldViewRef.current = usernameFieldRef.current;
              }}
            />
          </View>
        </View>
        <View ref={passwordFieldRef} onLayout={saveFieldLayout('password')}>
          <Text style={[styles.label, isFrameMode && frameModeStyles.textSmall, { color: colors.textSecondary }]}>Password (leave blank to keep current)</Text>
          <View>
            <TextInput
              style={[styles.input, isFrameMode && { fontSize: 12, paddingVertical: 8 }, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              value={password}
              onChangeText={setPassword}
              placeholder="New password"
              placeholderTextColor={colors.placeholder}
              secureTextEntry
              autoCapitalize="none"
              onFocus={() => {
                focusedFieldRef.current = 'password';
                focusedFieldViewRef.current = passwordFieldRef.current;
              }}
            />
          </View>
        </View>

        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, isFrameMode && frameModeStyles.text, { color: colors.text }]}>Private profile</Text>
          <View style={styles.toggleWrap}>
            <Text style={[styles.toggleHint, { color: colors.textMuted }, isPrivate && [styles.toggleHintActive, { color: colors.text }]]}>
              {isPrivate ? 'Closed' : 'Open'}
            </Text>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: colors.border, true: colors.buttonPrimaryBg }}
              thumbColor={colors.surface}
            />
          </View>
        </View>

        <GradientButton
          style={[
            styles.saveBtn,
            isFrameMode && { paddingVertical: 10, paddingHorizontal: 20 },
            saving && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={spinnerColor} />
          ) : (
            <Text style={[styles.saveBtnText, isFrameMode && frameModeStyles.text, { color: colors.buttonPrimaryText }]}>Save</Text>
          )}
        </GradientButton>
        <Animated.View style={[styles.keyboardSpacer, { height: keyboardSpacerHeight, backgroundColor: colors.background }]} />
        </>
        )}
      </ScrollView>

      <Modal
        visible={pictureSheetVisible}
        transparent
        animationType="none"
        onRequestClose={closePictureSheet}
      >
        <View style={styles.sheetOverlay}>
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.sheetBackdrop, { opacity: sheetAnim }]}
            pointerEvents="none"
          />
          <Pressable style={StyleSheet.absoluteFill} onPress={closePictureSheet} />
          <Animated.View
            style={[
              styles.sheetBox,
              { backgroundColor: colors.surface },
              {
                transform: [
                  {
                    translateY: sheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [BOTTOM_SHEET_HEIGHT, 0],
                    }),
                  },
                ],
              },
            ]}
            pointerEvents="box-none"
          >
            <TouchableOpacity style={styles.sheetOption} onPress={pickFromLibrary} activeOpacity={0.7}>
              <Ionicons name="images-outline" size={22} color={colors.text} />
              <Text style={[styles.sheetOptionText, { color: colors.text }]}>Choose from library</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetOption} onPress={takePhoto} activeOpacity={0.7}>
              <Ionicons name="camera-outline" size={22} color={colors.text} />
              <Text style={[styles.sheetOptionText, { color: colors.text }]}>Take photo</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <GestureHandlerRootView style={styles.gestureRoot}>
        <PanGestureHandler
          key={panKey}
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          minPointers={1}
          activeOffsetX={[-20, 20]}
          failOffsetY={[-15, 15]}
        >
          <Animated.View style={[styles.sheetWrap, { width: panelWidth, backgroundColor: colors.surface, transform: [{ translateX }] }]}>
            {content}
          </Animated.View>
        </PanGestureHandler>
      </GestureHandlerRootView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  gestureRoot: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  sheetWrap: {
    flex: 1,
    width: FALLBACK_WIDTH,
  },
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    minWidth: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarTouch: {
    marginBottom: 8,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarSkeleton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePictureBtn: {
    paddingVertical: 4,
  },
  changePictureText: {
    fontSize: 14,
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleHint: {
    fontSize: 14,
  },
  toggleHintActive: {
    fontWeight: '500',
  },
  saveBtn: {
    height: 50,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  keyboardSpacer: {
    width: '100%',
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetBox: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
    paddingHorizontal: 24,
    paddingTop: 16,
    minHeight: BOTTOM_SHEET_HEIGHT,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  sheetOptionText: {
    fontSize: 16,
  },
});
