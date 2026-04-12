import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { useViewport } from '../context/ViewportContext';
import { frameModeStyles } from './DeviceFrameWrapper';
import { SkeletonBox, SkeletonGroup } from './SkeletonBox';

const BLOCK_PADDING_H = 19;
const AVATAR_SIZE = 46;
const MAIN_IMAGE_HEIGHT = 168;
const LIKED_AVATAR_SIZE = 18;
const POST_CARD_RADIUS = 18;
const POST_GLASS_INTENSITY_IOS = 24;
const POST_GLASS_INTENSITY_ANDROID = 38;
const POST_GLASS_OVERLAY_DARK = 'rgba(18,22,28,0.78)';
const POST_GLASS_OVERLAY_LIGHT = 'transparent';

/**
 * Skeleton for a single post: same sizes and element order as PostBlock.
 * Tapping the circular avatar calls onAvatarPress(null) to open the profile with skeletons.
 */
export default function PostBlockSkeleton({ onAvatarPress }) {
  const { colors, theme } = useTheme();
  const { isFrameMode } = useViewport();
  const TONES = colors.skeletonTones;
  const avatarSize = isFrameMode ? frameModeStyles.postAvatarSize : AVATAR_SIZE;
  const mainImageHeight = isFrameMode ? frameModeStyles.postMainImageHeight : MAIN_IMAGE_HEIGHT;
  const likedAvatarSize = isFrameMode ? frameModeStyles.postSkeletonLikedAvatarSize : LIKED_AVATAR_SIZE;
  const nameBarHeight = isFrameMode ? frameModeStyles.postSkeletonNameBarHeight : 20;
  const timeBarHeight = isFrameMode ? frameModeStyles.postSkeletonTimeBarHeight : 14;
  const descHeight = isFrameMode ? frameModeStyles.postSkeletonDescHeight : 14;

  const avatarEl = (
    <SkeletonBox style={[styles.avatar, isFrameMode && { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]} backgroundColor={TONES.avatar} />
  );

  return (
    <View style={[styles.root, { backgroundColor: theme === 'dark' ? 'transparent' : (colors.postCardBg ?? colors.background) }]}>
      <BlurView
        intensity={Platform.OS === 'ios' ? POST_GLASS_INTENSITY_IOS : POST_GLASS_INTENSITY_ANDROID}
        tint={theme === 'dark' ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.glassOverlay,
          {
            backgroundColor: theme === 'dark' ? POST_GLASS_OVERLAY_DARK : POST_GLASS_OVERLAY_LIGHT,
          },
        ]}
        pointerEvents="none"
      />
      <SkeletonGroup show={true}>
        {/* 1. Row: avatar (tap -> open profile) | name + time */}
        <View style={styles.headerRow}>
          {onAvatarPress ? (
            <TouchableOpacity
              onPress={() => onAvatarPress(null)}
              activeOpacity={0.7}
            >
              {avatarEl}
            </TouchableOpacity>
          ) : (
            avatarEl
          )}
          <View style={styles.nameTimeWrap}>
            <SkeletonBox style={[styles.nameBar, isFrameMode && { height: nameBarHeight }]} backgroundColor={TONES.name} />
            <SkeletonBox style={[styles.timeBar, isFrameMode && { height: timeBarHeight }]} backgroundColor={TONES.time} />
          </View>
        </View>

        {/* 2. Description: two lines */}
        <View style={styles.descLineWrap}>
          <SkeletonBox style={[styles.descLine, isFrameMode && { height: descHeight }]} backgroundColor={TONES.desc1} />
        </View>
        <View style={styles.descLineShortWrap}>
          <SkeletonBox style={[styles.descLineShort, isFrameMode && { height: descHeight }]} backgroundColor={TONES.desc2} />
        </View>

        {/* 3. Main image */}
        <View style={styles.mainImageWrap}>
          <SkeletonBox
            style={StyleSheet.flatten([styles.mainImage, isFrameMode && { height: mainImageHeight }])}
            backgroundColor={TONES.image}
          />
        </View>

        {/* 4. Row: 3 circular skeletons (liked-by avatars) | two blocks (like, comments) */}
        <View style={styles.actionsRow}>
          <View style={[styles.likedAvatars, isFrameMode && { width: likedAvatarSize * 3 - 16, height: likedAvatarSize }]}>
            {[1, 2, 3].map((i) => (
              <SkeletonBox
                key={i}
                style={StyleSheet.flatten([
                  styles.likedAvatar,
                  isFrameMode && { width: likedAvatarSize, height: likedAvatarSize, borderRadius: likedAvatarSize / 2 },
                  { marginLeft: i > 1 ? -8 : 0 },
                ])}
                backgroundColor={TONES.likedCircleDark ?? TONES.likedCircle}
                radius="round"
              />
            ))}
          </View>
          <SkeletonBox style={styles.actionBar} backgroundColor={TONES.actionBar} />
          <SkeletonBox style={styles.actionBarSmall} backgroundColor={TONES.actionBar} />
        </View>

        {/* 5. "Liked by ... and N+ others" */}
        <View style={styles.likedByBarWrap}>
          <SkeletonBox style={styles.likedByBar} backgroundColor={TONES.likedBy} />
        </View>

        {/* 6. "View all N comments" */}
        <View style={styles.viewCommentsBarWrap}>
          <SkeletonBox style={styles.viewCommentsBar} backgroundColor={TONES.viewComments} />
        </View>
      </SkeletonGroup>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    borderRadius: POST_CARD_RADIUS,
    overflow: 'hidden',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
    paddingHorizontal: BLOCK_PADDING_H,
    paddingTop: 8,
    paddingBottom: 10,
    marginBottom: 12,
  },
  glassOverlay: {
    borderRadius: POST_CARD_RADIUS,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    gap: 8,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  nameTimeWrap: {
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
    gap: 4,
  },
  nameBar: {
    width: 93,
    height: 20,
    borderRadius: 6,
  },
  timeBar: {
    width: 44,
    height: 14,
    borderRadius: 6,
  },
  descLineWrap: {
    marginTop: 4,
    marginBottom: 2,
  },
  descLine: {
    width: '100%',
    height: 14,
    borderRadius: 6,
  },
  descLineShortWrap: {
    marginTop: 2,
    marginBottom: 6,
  },
  descLineShort: {
    width: '70%',
    height: 14,
    borderRadius: 6,
  },
  mainImageWrap: {
    marginTop: 4,
    marginBottom: 2,
  },
  mainImage: {
    width: '100%',
    height: MAIN_IMAGE_HEIGHT,
    borderRadius: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 4,
    gap: 8,
  },
  likedAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 42,
    height: LIKED_AVATAR_SIZE,
    marginRight: 8,
    flexShrink: 0,
  },
  likedAvatar: {
    width: LIKED_AVATAR_SIZE,
    height: LIKED_AVATAR_SIZE,
    borderRadius: LIKED_AVATAR_SIZE / 2,
  },
  actionBar: {
    width: 32,
    height: 10,
    borderRadius: 6,
  },
  actionBarSmall: {
    width: 24,
    height: 10,
    borderRadius: 6,
  },
  likedByBarWrap: {
    marginTop: 2,
    marginBottom: 2,
  },
  likedByBar: {
    width: 140,
    height: 10,
    borderRadius: 6,
  },
  viewCommentsBarWrap: {
    marginTop: 2,
    marginBottom: 2,
  },
  viewCommentsBar: {
    width: 88,
    height: 10,
    borderRadius: 6,
  },
});
