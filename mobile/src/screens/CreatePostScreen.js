import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';

import { POSTS } from '../api/endpoints';
import { apiFetchWithAuthFormData } from '../api/client';
import { assetToFormFile } from '../utils/formDataFile';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getRefreshSpinnerColor } from '../theme';
import { useEarlyRefresh } from '../hooks/useEarlyRefresh';
import { useViewport } from '../context/ViewportContext';
import { frameModeStyles } from '../components/DeviceFrameWrapper';
import GradientButton from '../components/GradientButton';

/** Порог движения пальца (px): горизонтальный свайп — инпут не фокусируем. */
const SWIPE_THRESHOLD_PX = 14;
/** Порог тяги вниз (px): вертикальный рефреш — инпут не фокусируем, клавиатура не открываем. */
const PULL_DOWN_THRESHOLD_PX = 14;

/**
 * Обёртка над TextInput: при касании во время горизонтального свайпа или вертикального
 * pull-to-refresh не открывает клавиатуру; фокус только при явном тапе.
 */
function SwipeAwareInput({ style, ...textInputProps }) {
  const inputRef = useRef(null);
  const [overlayActive, setOverlayActive] = useState(true);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const wasSwipeRef = useRef(false);

  const onOverlayTouchStart = useCallback((e) => {
    startXRef.current = e.nativeEvent.pageX;
    startYRef.current = e.nativeEvent.pageY;
    wasSwipeRef.current = false;
  }, []);

  const onOverlayTouchMove = useCallback((e) => {
    const dx = Math.abs(e.nativeEvent.pageX - startXRef.current);
    const dy = e.nativeEvent.pageY - startYRef.current;
    if (dx > SWIPE_THRESHOLD_PX) wasSwipeRef.current = true;
    if (dy > PULL_DOWN_THRESHOLD_PX) wasSwipeRef.current = true;
  }, []);

  const onOverlayTouchEnd = useCallback(() => {
    if (!wasSwipeRef.current && inputRef.current) {
      inputRef.current.focus();
      setOverlayActive(false);
    }
  }, []);

  const onInputBlur = useCallback(() => {
    setOverlayActive(true);
  }, []);

  const inputStyle = [style, { marginBottom: 0 }];
  return (
    <View style={[styles.swipeAwareWrap, style]}>
      <TextInput
        ref={inputRef}
        style={inputStyle}
        {...textInputProps}
        onBlur={textInputProps.onBlur ? (e) => { onInputBlur(); textInputProps.onBlur(e); } : onInputBlur}
      />
      {overlayActive && (
        <View
          style={StyleSheet.absoluteFill}
          pointerEvents="auto"
          onTouchStart={onOverlayTouchStart}
          onTouchMove={onOverlayTouchMove}
          onTouchEnd={onOverlayTouchEnd}
        />
      )}
    </View>
  );
}

const CONTENT_PADDING_H = 20;
const IMAGE_AREA_MIN_HEIGHT = 160;
const LABEL_MARGIN_BOTTOM = 6;
const FIELD_MARGIN_BOTTOM = 12;
const SECTION_MARGIN_BOTTOM = 16;
const MAX_PHOTOS = 10;

/**
 * Экран создания поста (Post): шапка (назад | Post), Select Image(s), Add caption, Add hashtags, Upload.
 * По макету Figma: 375×812, белый фон, единые отступы, кнопка Upload — teal.
 */
export default function CreatePostScreen({ onBack }) {
  const insets = useSafeAreaInsets();
  const { isFrameMode } = useViewport();
  const { colors, theme } = useTheme();
  const { token } = useAuth();
  const refreshIndicatorColor = theme === 'dark' ? '#F4F7FF' : '#465fff';
  const spinnerColor = colors.refreshSpinner || getRefreshSpinnerColor(theme);
  const headerBorderColor = theme === 'dark' ? colors.divider : colors.borderLight;
  const headerBackgroundColor = colors.surfaceElevated;
  const headerBorderWidth = StyleSheet.hairlineWidth;
  const [images, setImages] = useState([]);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [uploading, setUploading] = useState(false);
  const refreshCallback = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 400));
  }, []);
  const { refreshing, onRefresh } = useEarlyRefresh(refreshCallback, 10);

  const headerHeight = isFrameMode ? frameModeStyles.header?.height : 48;
  const headerBtnStyle = isFrameMode ? frameModeStyles.headerBtn : undefined;
  const headerTitleStyle = isFrameMode ? frameModeStyles.headerTitle : undefined;
  const imageAreaMinHeight = isFrameMode ? 160 : IMAGE_AREA_MIN_HEIGHT;
  const contentPaddingH = isFrameMode ? 14 : CONTENT_PADDING_H;

  const pickImages = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Доступ к медиа', 'Разрешите доступ к галерее, чтобы выбрать фото или видео.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - images.length,
      quality: 0.9,
    });
    if (!result.canceled && result.assets?.length) {
      const newUris = result.assets.map((a) => ({ uri: a.uri, mimeType: a.mimeType, fileName: a.fileName }));
      setImages((prev) => {
        const next = [...prev, ...newUris].slice(0, MAX_PHOTOS);
        return next;
      });
    }
  }, [images.length]);

  const removeImage = useCallback((index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const uploadPost = useCallback(async () => {
    if (!token) {
      Alert.alert('Вход', 'Войдите в аккаунт, чтобы публиковать посты.');
      return;
    }
    const title = (caption || '').trim() || ' ';
    const description = (hashtags || '').trim() || '';

    if (images.length === 0) {
      Alert.alert('Выберите медиа', 'Добавьте хотя бы одно изображение или видео.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);

      for (let i = 0; i < images.length; i++) {
        const asset = images[i];
        const file = await assetToFormFile({
          uri: asset.uri,
          mimeType: asset.mimeType || 'image/jpeg',
          name: asset.fileName || asset.name || `image-${i}.jpg`,
        });
        formData.append('photos', file);
      }

      const res = await apiFetchWithAuthFormData(POSTS.create, token, formData, { timeoutMs: 60000 });
      if (!res.ok) {
        const errText = await res.text();
        Alert.alert('Ошибка', errText || 'Не удалось опубликовать пост.');
        return;
      }
      setImages([]);
      setCaption('');
      setHashtags('');
      if (typeof onBack === 'function') onBack();
    } catch (e) {
      Alert.alert('Ошибка', e?.message || 'Не удалось опубликовать пост.');
    } finally {
      setUploading(false);
    }
  }, [token, images, caption, hashtags, onBack]);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View
        style={[
          styles.header,
          {
            height: headerHeight,
            borderBottomColor: headerBorderColor,
            backgroundColor: headerBackgroundColor,
            borderBottomWidth: headerBorderWidth,
          },
        ]}
      >
        <TouchableOpacity style={[styles.headerBtn, headerBtnStyle]} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={isFrameMode ? 22 : 28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, headerTitleStyle, { color: colors.text }]}>Post</Text>
        <View style={[styles.headerBtn, headerBtnStyle]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 16, paddingHorizontal: contentPaddingH, paddingTop: 12, flexGrow: 0 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={refreshIndicatorColor}
            colors={[refreshIndicatorColor]}

            progressBackgroundColor={Platform.OS === 'android' ? colors.background : undefined}
            progressViewOffset={insets.top + headerHeight + 24}
          />
        }
      >
        <Text style={[styles.label, isFrameMode && frameModeStyles.text, { color: colors.text }]}>Select Image / Video</Text>
        <TouchableOpacity
          style={[styles.imageArea, { minHeight: imageAreaMinHeight, backgroundColor: colors.inputBg, borderColor: colors.border }]}
          onPress={pickImages}
          activeOpacity={0.9}
        >
          {images.length > 0 ? (
            <View style={styles.thumbnailsRow}>
              {images.map((img, i) => (
                <View key={i} style={styles.thumbWrap}>
                  <Image source={{ uri: img.uri }} style={styles.thumb} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.removeThumb}
                    onPress={() => removeImage(i)}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < MAX_PHOTOS && (
                <TouchableOpacity style={[styles.addMoreBtn, { borderColor: colors.border }]} onPress={pickImages}>
                  <Ionicons name="add" size={32} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.placeholderWrap}>
              <Ionicons name="images-outline" size={isFrameMode ? 36 : 48} color={colors.iconInactive} />
              <Text style={[styles.placeholderText, { color: colors.textMuted }]}>Tap to select photos or videos</Text>
            </View>
          )}
          {images.length > 0 && images.length < MAX_PHOTOS && (
            <TouchableOpacity style={[styles.plusCircle, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={pickImages}>
              <Ionicons name="add" size={28} color={colors.primary} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <Text style={[styles.label, isFrameMode && frameModeStyles.text, { color: colors.text }]}>Add caption</Text>
        <SwipeAwareInput
          style={[styles.input, isFrameMode && { fontSize: 12, minHeight: 72 }, { backgroundColor: colors.inputBg, color: colors.text }]}
          value={caption}
          onChangeText={setCaption}
          placeholder="Caption..."
          placeholderTextColor={colors.placeholder}
          multiline
          maxLength={500}
        />

        <Text style={[styles.label, isFrameMode && frameModeStyles.text, { color: colors.text }]}>Add hashtags</Text>
        <SwipeAwareInput
          style={[styles.input, isFrameMode && { fontSize: 12, minHeight: 40 }, { backgroundColor: colors.inputBg, color: colors.text }]}
          value={hashtags}
          onChangeText={setHashtags}
          placeholder="#tag1 #tag2"
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
        />

        <GradientButton
          style={[
            styles.uploadBtn,
            uploading && styles.uploadBtnDisabled,
          ]}
          onPress={uploadPost}
          disabled={uploading}
        >
          <BlurView
            intensity={0}
            tint={theme === 'dark' ? 'dark' : 'light'}
            style={styles.uploadBtnBlur}
          />
          {uploading ? (
            <ActivityIndicator size="small" color={spinnerColor} />
          ) : (
            <Text style={[styles.uploadBtnText, isFrameMode && frameModeStyles.text, { color: colors.buttonPrimaryText }]}>Upload</Text>
          )}
        </GradientButton>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
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
    fontSize: 18,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: CONTENT_PADDING_H,
    paddingTop: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: LABEL_MARGIN_BOTTOM,
  },
  imageArea: {
    minHeight: IMAGE_AREA_MIN_HEIGHT,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: FIELD_MARGIN_BOTTOM,
    overflow: 'hidden',
    position: 'relative',
  },
  placeholderWrap: {
    flex: 1,
    minHeight: IMAGE_AREA_MIN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  placeholderText: {
    fontSize: 14,
    marginTop: 6,
  },
  thumbnailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 6,
  },
  thumbWrap: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  removeThumb: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  addMoreBtn: {
    width: 64,
    height: 64,
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusCircle: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeAwareWrap: {
    position: 'relative',
    marginBottom: FIELD_MARGIN_BOTTOM,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 44,
    ...(Platform.OS === 'android' && { textAlignVertical: 'top' }),
  },
  uploadBtn: {
    width: '100%',
    height: 49,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 15,
    elevation: 2,
  },
  uploadBtnBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  uploadBtnDisabled: {
    opacity: 0.7,
  },
  uploadBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
