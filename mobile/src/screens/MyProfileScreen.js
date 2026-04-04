import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getUploadsUrl } from '../api/client';
import { useEarlyRefresh } from '../hooks/useEarlyRefresh';
import { useTheme } from '../context/ThemeContext';
import { SkeletonBox, SkeletonGroup } from '../components/SkeletonBox';
import GradientButton from '../components/GradientButton';
import { getRefreshSpinnerColor } from '../theme';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 48;
const AVATAR_SIZE = 88;
const GRID_GAP = 1;
const GRID_COLUMNS = 3;
const GRID_ROWS = 3;
const DRAG_CLOSE_THRESHOLD = 80;
const UNDERLAY_OFFSET_LEFT_PX = 20;
const UNDERLAY_FOLLOW_FACTOR = 0.28;


/**
 * Мой профиль (My Profile): по скриншоту — шапка (назад | My Profile | Settings),
 * аватар, имя, локация, био, кнопка Edit Profile, статистика, сетка постов.
 * Свайп вправо и подложка — как в ChatScreen.
 */
export default function MyProfileScreen({
  visible,
  onClose,
  onTranslateX,
  onAnimateUnderlayToZero,
  onOpenSettings,
}) {
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const refreshIndicatorColor = theme === 'dark' ? '#F4F7FF' : '#465fff';
  const spinnerColor = colors.refreshSpinner || getRefreshSpinnerColor(theme);
  const { width: screenWidth } = useWindowDimensions();
  const profile = { avatar: null, picture_url: null };

  const [panKey, setPanKey] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const dragRef = useRef(0);
  const isClosingRef = useRef(false);

  const gridItemSize = (screenWidth - (GRID_COLUMNS - 1) * GRID_GAP) / GRID_COLUMNS;
  const gridItemCount = GRID_COLUMNS * GRID_ROWS;

  const refreshCallback = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 400));
  }, []);
  const { refreshing, onRefresh } = useEarlyRefresh(refreshCallback, 10);

  const resetTransform = useCallback(() => {
    translateX.setValue(0);
    dragRef.current = 0;
    isClosingRef.current = false;
  }, [translateX]);

  useEffect(() => {
    if (visible) {
      resetTransform();
      setPanKey((k) => k + 1);
      onTranslateX?.(-UNDERLAY_OFFSET_LEFT_PX);
    }
  }, [visible, resetTransform, onTranslateX]);

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
        isClosingRef.current = true;
        onAnimateUnderlayToZero?.(200);
        Animated.timing(translateX, {
          toValue: SCREEN_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onClose?.();
        });
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }).start();
      }
    },
    [translateX, onClose, onAnimateUnderlayToZero]
  );

  useEffect(() => {
    const sub = translateX.addListener(({ value }) => {
      if (value > 0) dragRef.current = value;
      if (isClosingRef.current) return;
      const underlayX = Math.min(0, -UNDERLAY_OFFSET_LEFT_PX + value * UNDERLAY_FOLLOW_FACTOR);
      onTranslateX?.(underlayX);
    });
    return () => translateX.removeListener(sub);
  }, [translateX, onTranslateX]);

  const openSettings = useCallback(() => {
    onOpenSettings?.();
  }, [onOpenSettings]);

  if (!visible) return null;

  const content = (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={[styles.header, { height: HEADER_HEIGHT }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={onClose} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={openSettings} activeOpacity={0.7}>
          <Ionicons name="settings-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={[styles.mainScrollContent, { paddingBottom: 24 + (insets.bottom || 0) }]}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={refreshIndicatorColor}
            colors={[refreshIndicatorColor]}

            progressBackgroundColor={Platform.OS === 'android' ? colors.background : undefined}
            progressViewOffset={insets.top + HEADER_HEIGHT + 24}
          />
        }
      >
        <View style={styles.topContent}>
          <View style={styles.profileRow}>
            <View style={styles.avatarWrap}>
              {profile.avatar || profile.picture_url ? (
                <Image
                  source={{ uri: getUploadsUrl(profile.avatar || profile.picture_url) }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.avatar, styles.avatarSkeleton, { backgroundColor: colors.inputBg }]}>
                  <Ionicons name="person" size={40} color={colors.iconInactive} />
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <SkeletonGroup show={true}>
                <SkeletonBox style={styles.profileNameSkeleton} backgroundColor={colors.skeletonBg} />
                <SkeletonBox style={styles.profileLocationSkeleton} backgroundColor={colors.skeletonBg} />
                <SkeletonBox style={styles.profileBioSkeletonLine1} backgroundColor={colors.skeletonBg} />
                <SkeletonBox style={styles.profileBioSkeletonLine2} backgroundColor={colors.skeletonBg} />
              </SkeletonGroup>
            </View>
          </View>

          <GradientButton style={styles.editProfileBtn} onPress={openSettings}>
            <Text style={[styles.editProfileBtnText, { color: colors.buttonPrimaryText }]}>Edit Profile</Text>
          </GradientButton>

          <View style={styles.statsRow}>
            <SkeletonGroup show={true}>
              <View style={styles.statBlock}>
                <SkeletonBox style={styles.statNumberSkeleton} backgroundColor={colors.skeletonBg} />
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBlock}>
                <SkeletonBox style={styles.statNumberSkeleton} backgroundColor={colors.skeletonBg} />
                <Text style={styles.statLabel}>Following</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBlock}>
                <SkeletonBox style={styles.statNumberSkeleton} backgroundColor={colors.skeletonBg} />
                <Text style={styles.statLabel}>Followers</Text>
              </View>
            </SkeletonGroup>
          </View>
        </View>

        <View style={styles.postsSectionHeader}>
          <Text style={styles.sectionTitle}>Posts</Text>
        </View>
        <View style={[styles.postsGridWrap, { width: screenWidth }]}>
          <View style={[styles.grid, { gap: GRID_GAP, width: screenWidth }]}>
            {Array.from({ length: gridItemCount }).map((_, i) => (
              <View
                key={i}
                style={[styles.gridItem, { width: gridItemSize, height: gridItemSize }]}
              >
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.gridSkeleton }]} />
                <SkeletonGroup show={true}>
                  <SkeletonBox
                    style={{ width: gridItemSize, height: gridItemSize, borderRadius: 8 }}
                    backgroundColor={colors.gridSkeleton}
                  />
                </SkeletonGroup>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
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
          <Animated.View style={[styles.sheetWrap, { transform: [{ translateX }] }]}>
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
    width: SCREEN_WIDTH,
    backgroundColor: '#FFFFFF',
  },
  root: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#fff',
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
    color: '#000',
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    flexGrow: 1,
    paddingTop: 16,
  },
  topContent: {
    paddingHorizontal: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatarWrap: {
    marginRight: 16,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#F2F2F2',
  },
  avatarSkeleton: {},
  profileNameSkeleton: {
    width: 120,
    height: 18,
    borderRadius: 8,
    marginBottom: 10,
  },
  profileLocationSkeleton: {
    width: 100,
    height: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  profileBioSkeletonLine1: {
    width: 136,
    height: 11,
    borderRadius: 8,
    marginBottom: 5,
    alignSelf: 'flex-end',
  },
  profileBioSkeletonLine2: {
    width: 98,
    height: 8,
    borderRadius: 8,
    marginBottom: 7,
    alignSelf: 'flex-end',
  },
  statNumberSkeleton: {
    width: 28,
    height: 16,
    borderRadius: 8,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  location: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
    marginBottom: 12,
  },
  editProfileBtn: {
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
    marginBottom: 16,
  },
  editProfileBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#858bb6',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    marginBottom: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    gap: 8,
  },
  statBlock: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  postsSectionHeader: {
    paddingHorizontal: 16,
  },
  postsGridWrap: {
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  gridItem: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridItemSkeleton: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
});
