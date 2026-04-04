import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getUploadsUrl } from '../api/client';
import { useEarlyRefresh } from '../hooks/useEarlyRefresh';
import { useTheme } from '../context/ThemeContext';
import { getRefreshSpinnerColor } from '../theme';
import { SkeletonBox, SkeletonGroup } from '../components/SkeletonBox';
import CircularLoader from '../components/CircularLoader';
import GradientButton from '../components/GradientButton';
import { useViewport } from '../context/ViewportContext';
import { frameModeStyles } from '../components/DeviceFrameWrapper';
const HEADER_HEIGHT = 48;
const AVATAR_SIZE = 88;
const GRID_GAP = 1;
const GRID_COLUMNS = 3;
const GRID_ROWS = 3;


/**
 * Контент последней вкладки (My Profile): листаешь до неё, отступ между 4-й и 5-й страницей.
 * Шапка (назад | My Profile | Settings), профиль, Edit Profile, статистика, сетка постов.
 */
export default function MyProfileTabScreen({ onBack, onOpenSettings }) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, isFrameMode } = useViewport();
  const { theme, setTheme, colors, themeSwitching } = useTheme();
  const refreshIndicatorColor = theme === 'dark' ? '#F4F7FF' : '#465fff';
  const spinnerColor = colors.refreshSpinner || getRefreshSpinnerColor(theme);
  const headerBorderColor = theme === 'dark' ? colors.divider : colors.borderLight;
  const headerBackgroundColor = colors.surfaceElevated;
  const headerBorderWidth = StyleSheet.hairlineWidth;
  const profile = { avatar: null, picture_url: null };

  const gridPaddingH = 0;
  const gridWidth = screenWidth;
  const gridItemSize = (gridWidth - (GRID_COLUMNS - 1) * GRID_GAP) / GRID_COLUMNS;
  const gridItemCount = GRID_COLUMNS * GRID_ROWS;
  const profileAvatarSize = isFrameMode ? frameModeStyles.profileAvatarSize : AVATAR_SIZE;

  const refreshCallback = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 400));
  }, []);
  const { refreshing, onRefresh } = useEarlyRefresh(refreshCallback, 10);

  const openSettings = useCallback(() => {
    onOpenSettings?.();
  }, [onOpenSettings]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const iconOpacity = useSharedValue(1);
  const loaderOpacity = useSharedValue(0);

  useEffect(() => {
    const duration = 180;
    if (themeSwitching) {
      iconOpacity.value = withTiming(0, { duration });
      loaderOpacity.value = withTiming(1, { duration });
    } else {
      iconOpacity.value = withTiming(1, { duration });
      loaderOpacity.value = withTiming(0, { duration });
    }
  }, [themeSwitching, iconOpacity, loaderOpacity]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
  }));
  const loaderAnimatedStyle = useAnimatedStyle(() => ({
    opacity: loaderOpacity.value,
  }));

  const loaderColor = spinnerColor;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View
        style={[
          styles.header,
          isFrameMode && frameModeStyles.header,
          {
            height: isFrameMode ? 32 : HEADER_HEIGHT,
            borderBottomColor: headerBorderColor,
            backgroundColor: headerBackgroundColor,
            borderBottomWidth: headerBorderWidth,
          },
        ]}
      >
        <TouchableOpacity style={[styles.headerBtn, isFrameMode && frameModeStyles.headerBtn]} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={isFrameMode ? 22 : 28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isFrameMode && frameModeStyles.headerTitle, { color: colors.text }]}>My Profile</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.headerBtn, isFrameMode && frameModeStyles.headerBtn]} onPress={toggleTheme} activeOpacity={0.7} disabled={themeSwitching}>
            <View style={styles.themeToggleWrap}>
              <Animated.View style={[styles.themeToggleInner, iconAnimatedStyle]}>
                <Ionicons name={theme === 'dark' ? 'sunny' : 'moon-outline'} size={isFrameMode ? 18 : 22} color={colors.text} />
              </Animated.View>
              <Animated.View style={[styles.themeToggleInner, loaderAnimatedStyle]}>
                <CircularLoader color={loaderColor} loop={themeSwitching} />
              </Animated.View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerBtn, isFrameMode && frameModeStyles.headerBtn]} onPress={openSettings} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={isFrameMode ? 20 : 24} color={colors.text} />
          </TouchableOpacity>
        </View>
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
        </View>

        <View style={styles.postsSectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Posts</Text>
        </View>
        <View style={[styles.postsGridWrap, { width: screenWidth }]}>
          <View style={[styles.grid, { gap: GRID_GAP, width: gridWidth }]}>
            {Array.from({ length: gridItemCount }).map((_, i) => (
              <View
                key={i}
                style={[styles.gridItem, styles.gridItemNoRadius, { width: gridItemSize, height: gridItemSize }]}
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
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    minWidth: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeToggleWrap: {
    minWidth: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  themeToggleInner: {
    ...StyleSheet.absoluteFillObject,
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
  },
  avatarSkeleton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  location: {
    fontSize: 14,
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  profileNameSkeleton: {
    width: 120,
    height: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  profileLocationSkeleton: {
    width: 90,
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
  editProfileBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
    marginBottom: 16,
  },
  editProfileBtnText: {
    fontSize: 14,
    fontWeight: '600',
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
  postsSectionHeader: {
    paddingLeft: 16,
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
