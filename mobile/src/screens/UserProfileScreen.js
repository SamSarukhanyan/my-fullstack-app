import React, { useCallback, useRef, useEffect } from 'react';
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
  Easing,
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getUploadsUrl } from '../api/client';
import { useEarlyRefresh } from '../hooks/useEarlyRefresh';
import { useTheme } from '../context/ThemeContext';
import { SkeletonBox, SkeletonGroup } from '../components/SkeletonBox';
import { getRefreshSpinnerColor } from '../theme';
import GradientButton from '../components/GradientButton';
import { useViewport } from '../context/ViewportContext';
import { frameModeStyles } from '../components/DeviceFrameWrapper';

const { width: FALLBACK_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 48;
const DRAG_CLOSE_THRESHOLD = 80;
const UNDERLAY_OFFSET_LEFT_PX = 44;
const UNDERLAY_FOLLOW_FACTOR = 0.28;
const AVATAR_SIZE = 88;
const GRID_GAP = 1;
const GRID_COLUMNS = 3;
const GRID_ROWS = 3;
const FOLLOWER_AVATAR_SIZE = 52;
const FOLLOWER_ITEM_WIDTH = 72;
const PANEL_OPEN_DURATION_MS = 260;
const PANEL_CLOSE_DURATION_MS = 260;

const FOLLOWERS_SKELETON_COUNT = 5;
/**
 * Another user's profile (based on Figma PROFILE 87-357).
 * Header (back | Profile), avatar + name + location + bio, Follow + chat, stats, Followers, 99x99 post grid.
 */
export default function UserProfileScreen({
  visible,
  user,
  onClose,
  onOpenChat,
  onTranslateX,
  onAnimateUnderlayTo,
  onAnimateUnderlayToZero,
}) {
  const insets = useSafeAreaInsets();
  const { width: viewportWidth, isFrameMode } = useViewport();
  const { width: windowWidth } = useWindowDimensions();
  const screenWidth = viewportWidth ?? windowWidth;
  const panelWidth = viewportWidth ?? FALLBACK_WIDTH;
  const { colors, theme } = useTheme();
  const refreshIndicatorColor = theme === 'dark' ? '#F4F7FF' : '#465fff';
  const spinnerColor = colors.refreshSpinner || getRefreshSpinnerColor(theme);
  const profile = user || {};

  const translateX = useRef(new Animated.Value(panelWidth)).current;
  const panelAnimationRef = useRef(null);
  const dragRef = useRef(0);
  const isClosingRef = useRef(false);
  const entranceDoneRef = useRef(false);
  const onTranslateXRef = useRef(onTranslateX);
  const onAnimateUnderlayToZeroRef = useRef(onAnimateUnderlayToZero);
  const onAnimateUnderlayToRef = useRef(onAnimateUnderlayTo);

  const gridPaddingH = 0;
  const gridWidth = screenWidth;
  const gridItemSize = (gridWidth - (GRID_COLUMNS - 1) * GRID_GAP) / GRID_COLUMNS;
  const gridItemCount = GRID_COLUMNS * GRID_ROWS;
  const profileAvatarSize = isFrameMode ? frameModeStyles.profileAvatarSize : AVATAR_SIZE;
  const headerHeight = isFrameMode ? frameModeStyles.header?.height : HEADER_HEIGHT;
  const headerBtnStyle = isFrameMode ? frameModeStyles.headerBtn : undefined;
  const headerTitleStyle = isFrameMode ? frameModeStyles.headerTitle : undefined;

  const refreshCallback = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 400));
  }, []);
  const { refreshing, onRefresh } = useEarlyRefresh(refreshCallback, 10);

  useEffect(() => {
    onTranslateXRef.current = onTranslateX;
  }, [onTranslateX]);

  useEffect(() => {
    onAnimateUnderlayToZeroRef.current = onAnimateUnderlayToZero;
  }, [onAnimateUnderlayToZero]);

  useEffect(() => {
    onAnimateUnderlayToRef.current = onAnimateUnderlayTo;
  }, [onAnimateUnderlayTo]);

  const resetTransform = useCallback(() => {
    if (panelAnimationRef.current) {
      panelAnimationRef.current.stop();
      panelAnimationRef.current = null;
    }
    translateX.setValue(panelWidth);
    dragRef.current = 0;
    isClosingRef.current = false;
  }, [translateX, panelWidth]);

  useEffect(() => {
    if (visible) {
      entranceDoneRef.current = false;
      resetTransform();
      translateX.setValue(panelWidth);
      onAnimateUnderlayToRef.current?.(-UNDERLAY_OFFSET_LEFT_PX, PANEL_OPEN_DURATION_MS);
      const animation = Animated.timing(translateX, {
        toValue: 0,
        duration: PANEL_OPEN_DURATION_MS,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      });
      panelAnimationRef.current = animation;
      animation.start(({ finished }) => {
        if (panelAnimationRef.current === animation) panelAnimationRef.current = null;
        if (finished) {
          entranceDoneRef.current = true;
        }
      });
    } else {
      if (panelAnimationRef.current) {
        panelAnimationRef.current.stop();
        panelAnimationRef.current = null;
      }
      translateX.setValue(panelWidth);
      dragRef.current = 0;
      isClosingRef.current = false;
    }
  }, [visible, resetTransform, translateX, panelWidth]);

  const closeWithAnimation = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    if (panelAnimationRef.current) {
      panelAnimationRef.current.stop();
      panelAnimationRef.current = null;
    }
    onAnimateUnderlayToZeroRef.current?.(PANEL_CLOSE_DURATION_MS);
    const animation = Animated.timing(translateX, {
      toValue: panelWidth,
      duration: PANEL_CLOSE_DURATION_MS,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    });
    panelAnimationRef.current = animation;
    animation.start(() => {
      if (panelAnimationRef.current === animation) panelAnimationRef.current = null;
      onClose?.();
    });
  }, [translateX, onClose, panelWidth]);

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
          tension: 72,
          friction: 14,
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
      if (value < 0) return;
      if (value > panelWidth * 0.85) return;
      const underlayX = Math.min(0, -UNDERLAY_OFFSET_LEFT_PX + value * UNDERLAY_FOLLOW_FACTOR);
      onTranslateXRef.current?.(underlayX);
    });
    return () => translateX.removeListener(sub);
  }, [translateX, panelWidth]);

  if (!visible) return null;

  const content = (
    <View style={[styles.sheetInner, { paddingTop: insets.top, backgroundColor: colors.background, width: panelWidth }]}>
      <View style={[styles.header, { height: headerHeight, borderBottomColor: colors.borderLight, backgroundColor: colors.surface }]}>
        <TouchableOpacity style={[styles.headerBtn, headerBtnStyle]} onPress={closeWithAnimation} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={isFrameMode ? 22 : 28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, headerTitleStyle, { color: colors.text }]}>Profile</Text>
        <View style={[styles.headerBtn, headerBtnStyle]} />
      </View>

      {/* One scroll for the whole page: a single spinner at the top; swiping over the posts area moves the whole page, and pulling at the top triggers refresh */}
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
            progressViewOffset={insets.top + headerHeight + 24}
          />
        }
      >
        <View style={styles.topContent}>
          {/* Top block: avatar + bold name; the second field is the same username in a smaller regular style; message + Follow */}
          <View style={styles.profileRow}>
          <View style={[styles.avatarWrap, isFrameMode && { marginRight: 12 }]}>
            {profile.avatar || profile.picture_url ? (
              <Image
                source={{ uri: getUploadsUrl(profile.avatar || profile.picture_url) }}
                style={[styles.avatar, isFrameMode && { width: profileAvatarSize, height: profileAvatarSize, borderRadius: profileAvatarSize / 2 }]}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatar, styles.avatarSkeleton, isFrameMode && { width: profileAvatarSize, height: profileAvatarSize, borderRadius: profileAvatarSize / 2 }, { backgroundColor: colors.inputBg }]}>
                <Ionicons name="person" size={isFrameMode ? 32 : 40} color={colors.iconInactive} />
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <SkeletonGroup show={true}>
              <SkeletonBox style={styles.profileUserNameSkeleton} backgroundColor={colors.skeletonBg} />
              <SkeletonBox style={styles.profileUserNameSecondarySkeleton} backgroundColor={colors.skeletonBg} />
            </SkeletonGroup>
            {/* Message + Follow */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.chatBtn, { borderColor: colors.borderLight }]}
                onPress={() => onOpenChat?.(profile)}
                activeOpacity={0.7}
              >
                <Ionicons name="chatbubble-outline" size={isFrameMode ? 18 : 22} color={colors.primary} />
              </TouchableOpacity>
              <GradientButton
                style={[
                  styles.followBtn,
                  isFrameMode && { paddingVertical: 8, paddingHorizontal: 16 },
                ]}
              >
                <Text style={[styles.followBtnText, isFrameMode && frameModeStyles.text, { color: colors.buttonPrimaryText }]}>Follow</Text>
              </GradientButton>
            </View>
          </View>
          {/* Three dots: top-right corner of the upper block */}
          <TouchableOpacity style={[styles.moreBtnTop, isFrameMode && headerBtnStyle]} activeOpacity={0.7}>
            <Ionicons name="ellipsis-vertical" size={isFrameMode ? 16 : 20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { borderColor: colors.borderLight }]}>
          <SkeletonGroup show={true}>
            <View style={styles.statBlock}>
              <SkeletonBox style={styles.statNumberSkeleton} backgroundColor={colors.skeletonBg} />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Posts</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.statBlock}>
              <SkeletonBox style={styles.statNumberSkeleton} backgroundColor={colors.skeletonBg} />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Following</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.statBlock}>
              <SkeletonBox style={styles.statNumberSkeleton} backgroundColor={colors.skeletonBg} />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
            </View>
          </SkeletonGroup>
        </View>

        {/* Followers: title and slider with the same inset as "Posts" (16px on the left) */}
        <View style={styles.followersWrap}>
          <Text style={[styles.sectionTitle, styles.followersTitleIndent, isFrameMode && frameModeStyles.text, { color: colors.text }]}>Followers</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.followersScrollContent}
          >
          {Array.from({ length: FOLLOWERS_SKELETON_COUNT }).map((_, i) => (
            <View key={i} style={styles.followerItem}>
              <SkeletonGroup show={true}>
                <SkeletonBox style={styles.followerAvatar} backgroundColor={colors.skeletonBg} radius="round" />
                <SkeletonBox style={styles.followerNameSkeleton} backgroundColor={colors.skeletonBg} />
              </SkeletonGroup>
            </View>
          ))}
          </ScrollView>
        </View>
        </View>

        {/* Posts block: part of the shared scroll with no separate spinner; swiping here moves the whole page, with a single refresh at the top */}
        <View style={styles.postsSectionHeader}>
          <Text style={[styles.sectionTitle, isFrameMode && frameModeStyles.text, { color: colors.text }]}>Posts</Text>
        </View>
        <View style={[styles.postsGridWrap, { width: screenWidth }]}>
          <View style={[styles.grid, { gap: GRID_GAP, width: gridWidth }]}>
            {Array.from({ length: gridItemCount }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.gridItem,
                  styles.gridItemNoRadius,
                  {
                    width: gridItemSize,
                    height: gridItemSize,
                  },
                ]}
              >
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.gridSkeleton }]} />
                <SkeletonGroup show={true}>
                  <SkeletonBox
                    style={{ width: gridItemSize, height: gridItemSize, borderRadius: 0 }}
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
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          minPointers={1}
          activeOffsetX={[-20, 20]}
          failOffsetY={[-15, 15]}
        >
          <Animated.View
            style={[
              styles.sheetWrap,
              { width: panelWidth, backgroundColor: colors.background, transform: [{ translateX }] },
            ]}
          >
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
  sheetInner: {
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
  postsGridWrap: {
    width: '100%',
  },
  postsSectionHeader: {
    paddingLeft: 16,
    paddingRight: 0,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatarWrap: {
    marginRight: 16,
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
  profileInfo: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  userNameSecondary: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  followBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  moreBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBtnTop: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    marginBottom: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  statBlock: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  profileUserNameSkeleton: {
    width: 100,
    height: 20,
    borderRadius: 8,
    marginBottom: 8,
  },
  profileUserNameSecondarySkeleton: {
    width: 80,
    height: 14,
    borderRadius: 8,
    marginBottom: 14,
  },
  statNumberSkeleton: {
    width: 28,
    height: 16,
    borderRadius: 8,
  },
  followerNameSkeleton: {
    width: 40,
    height: 12,
    borderRadius: 8,
    marginTop: 2,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  followersWrap: {},
  followersTitleIndent: {
    paddingLeft: 0,
  },
  followersScrollContent: {
    paddingBottom: 16,
    paddingRight: 16,
    paddingLeft: 0,
  },
  followerItem: {
    width: FOLLOWER_ITEM_WIDTH,
    marginRight: 18,
    alignItems: 'center',
    gap: 6,
  },
  followerAvatar: {
    width: FOLLOWER_AVATAR_SIZE,
    height: FOLLOWER_AVATAR_SIZE,
    borderRadius: FOLLOWER_AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  followerAvatarSkeleton: {},
  followerAvatarImg: {
    width: FOLLOWER_AVATAR_SIZE,
    height: FOLLOWER_AVATAR_SIZE,
    borderRadius: FOLLOWER_AVATAR_SIZE / 2,
  },
  followerName: {
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  gridItem: {
    overflow: 'hidden',
  },
  gridItemNoRadius: {
    borderRadius: 0,
  },
  gridItemSkeleton: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
});
