import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { getUploadsUrl } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { useViewport } from '../context/ViewportContext';
import { frameModeStyles } from './DeviceFrameWrapper';

// POST BLOCK: layout order from top to bottom according to the design
const BLOCK_PADDING_H = 19;
const AVATAR_SIZE = 46;
const MAIN_IMAGE_HEIGHT = 186;
const LIKED_AVATAR_SIZE = 22;
const LIKE_RED = 'rgba(236, 28, 36, 1)';
const POST_CARD_RADIUS = 18;
const POST_GLASS_INTENSITY_IOS = 24;
const POST_GLASS_INTENSITY_ANDROID = 38;
const POST_GLASS_OVERLAY_DARK = 'rgba(18,22,28,0.78)';
const POST_GLASS_OVERLAY_LIGHT = 'transparent';

/**
 * Single post block. Element order from top to bottom:
 * 1. Row: author avatar (46x46) | name (Poppins 600, 15px) + time (Poppins 500, 12px)
 * 2. Post description text
 * 3. Main image (298x186, border-radius 10)
 * 4. Row: 3 avatars of users who liked it | like icon + count | comment icon + count
 * 5. "Liked by {username} and N+ others"
 * 6. "View all N comments"
 */
export default function PostBlock({
  post,
  onPress,
  onLikePress,
  onCommentsPress,
  onAuthorPress,
}) {
  const { colors, theme } = useTheme();
  const { isFrameMode } = useViewport();
  const avatarSize = isFrameMode ? frameModeStyles.postAvatarSize : AVATAR_SIZE;
  const mainImageHeight = isFrameMode ? frameModeStyles.postMainImageHeight : MAIN_IMAGE_HEIGHT;
  const likedAvatarSize = isFrameMode ? frameModeStyles.postLikedAvatarSize : LIKED_AVATAR_SIZE;
  const cardBorder = colors.postCardBorder ?? colors.borderLight;
  const author = post?.author || {};
  const authorName = author.userName || author.username || 'User';
  const authorPicture = author.picture_url || author.avatar;
  const images = post?.images || [];
  const firstImage = images[0]?.image_url || images[0]?.imageUrl;
  const description = post?.description || post?.title || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pharetra';
  const likesCount = post?.likesCount ?? 247;
  const commentsCount = post?.commentsCount ?? 57;
  const liked = post?.liked ?? false;
  const likedByUsername = 'Blazinshado';
  const timeAgo = '1hr ago';

  const imageUrl = firstImage ? getUploadsUrl(firstImage) : null;

  return (
    <TouchableOpacity
      style={[
        styles.root,
        {
          backgroundColor: theme === 'dark' ? 'transparent' : (colors.postCardBg ?? colors.background),
        },
      ]}
      onPress={onPress}
      activeOpacity={1}
    >
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
      {/* 1. Row: avatar | name + time (tap opens the author's profile) */}
      <View style={styles.headerRow}>
        {onAuthorPress ? (
          <TouchableOpacity
            style={styles.headerRowInner}
            onPress={(e) => {
              e?.stopPropagation?.();
              onAuthorPress(author);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.avatarWrap, isFrameMode && { width: avatarSize, height: avatarSize }]}>
              {authorPicture ? (
                <Image
                  source={{ uri: getUploadsUrl(authorPicture) }}
                  style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, backgroundColor: colors.inputBg }]}>
                  <Ionicons name="person" size={isFrameMode ? 18 : 24} color={colors.iconInactive} />
                </View>
              )}
            </View>
            <View style={styles.nameTimeWrap}>
              <Text style={[styles.userName, { color: colors.text }, isFrameMode && { fontSize: 13 }]} numberOfLines={1}>{authorName}</Text>
              <Text style={[styles.timeAgo, { color: colors.textMuted }, isFrameMode && { fontSize: 11 }]}>{timeAgo}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRowInner}>
            <View style={[styles.avatarWrap, isFrameMode && { width: avatarSize, height: avatarSize }]}>
              {authorPicture ? (
                <Image
                  source={{ uri: getUploadsUrl(authorPicture) }}
                  style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, backgroundColor: colors.inputBg }]}>
                  <Ionicons name="person" size={isFrameMode ? 18 : 24} color={colors.iconInactive} />
                </View>
              )}
            </View>
            <View style={styles.nameTimeWrap}>
              <Text style={[styles.userName, { color: colors.text }, isFrameMode && { fontSize: 13 }]} numberOfLines={1}>{authorName}</Text>
              <Text style={[styles.timeAgo, { color: colors.textMuted }, isFrameMode && { fontSize: 11 }]}>{timeAgo}</Text>
            </View>
          </View>
        )}
      </View>

      <Text style={[styles.description, { color: colors.text }, isFrameMode && { fontSize: 12 }]} numberOfLines={2}>{description}</Text>

      <View style={styles.mainImageWrap}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={[styles.mainImage, { height: mainImageHeight, borderColor: cardBorder }]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.mainImage, styles.mainImagePlaceholder, { height: mainImageHeight, borderColor: cardBorder, backgroundColor: colors.inputBg }]} />
        )}
      </View>

      <View style={styles.actionsRow}>
        <View style={[styles.likedAvatars, isFrameMode && { width: likedAvatarSize * 3 - 16, height: likedAvatarSize }]}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.likedAvatar, { width: likedAvatarSize, height: likedAvatarSize, borderRadius: likedAvatarSize / 2, marginLeft: i > 1 ? -8 : 0, backgroundColor: colors.inputBg, borderColor: colors.surfaceElevated }]} />
          ))}
        </View>
        <TouchableOpacity style={styles.actionItem} onPress={() => onLikePress?.(post)}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={isFrameMode ? 11 : 13}
            color={liked ? LIKE_RED : colors.text}
          />
          <Text style={[styles.actionCount, { color: colors.text }, isFrameMode && { fontSize: 9 }]}>{likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem} onPress={() => onCommentsPress?.(post)}>
          <Ionicons name="chatbubble-outline" size={isFrameMode ? 11 : 13} color={colors.text} />
          <Text style={[styles.actionCount, { color: colors.text }, isFrameMode && { fontSize: 9 }]}>{commentsCount}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.likedByText, { color: colors.text }]}>
        <Text style={styles.likedByBold}>Liked by {likedByUsername} and </Text>
        <Text style={styles.likedByBold}>{likesCount >= 100 ? '100+' : likesCount} others</Text>
      </Text>

      <Text style={[styles.viewComments, { color: colors.text }, isFrameMode && { fontSize: 9 }]} onPress={() => onCommentsPress?.(post)}>
        View all {commentsCount} comments
      </Text>
    </TouchableOpacity>
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
    paddingTop: 10,
    paddingBottom: 12,
    marginBottom: 16,
  },
  glassOverlay: {
    borderRadius: POST_CARD_RADIUS,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrap: {},
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameTimeWrap: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  userName: {
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 23,
  },
  timeAgo: {
    fontFamily: 'Poppins',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 18,
  },
  description: {
    fontFamily: 'Poppins',
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  mainImageWrap: {
    width: '100%',
    marginBottom: 12,
  },
  mainImage: {
    width: '100%',
    height: MAIN_IMAGE_HEIGHT,
    borderRadius: 10,
    borderWidth: 0,
  },
  mainImagePlaceholder: {},
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  likedAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 46,
    height: LIKED_AVATAR_SIZE,
  },
  likedAvatar: {
    width: LIKED_AVATAR_SIZE,
    height: LIKED_AVATAR_SIZE,
    borderRadius: LIKED_AVATAR_SIZE / 2,
    borderWidth: 1.5,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 4,
  },
  actionCount: {
    fontFamily: 'Roboto',
    fontWeight: '700',
    fontSize: 10,
    lineHeight: 10,
  },
  likedByText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: 10,
    lineHeight: 12,
    marginBottom: 4,
  },
  likedByBold: {
    fontWeight: '600',
  },
  viewComments: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: 10,
    lineHeight: 12,
    opacity: 0.5,
  },
});
