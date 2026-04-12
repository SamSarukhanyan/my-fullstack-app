import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEarlyRefresh } from '../hooks/useEarlyRefresh';
import { SkeletonBox, SkeletonGroup } from '../components/SkeletonBox';
import { useTheme } from '../context/ThemeContext';
import { getRefreshSpinnerColor } from '../theme';
import { useViewport } from '../context/ViewportContext';
import { frameModeStyles } from '../components/DeviceFrameWrapper';
// Styles match NotificationsScreen: header 48, padding 16, avatar 44
const HEADER_HEIGHT = 48;
const CONTENT_PADDING_H = 16;
const SEARCH_HEIGHT = 44;
const AVATAR_SIZE = 44;
const FREQUENT_AVATAR_SIZE = 52;
const STATUS_DOT_SIZE = 12;
const UNREAD_BADGE_MIN = 20;

const FREQUENT_CHATS_COUNT = 4;
const ALL_MESSAGES_COUNT = 7;

/**
 * Chat List (Chats): according to the screenshot it includes the header (back | Chats), search, Frequently chatted, All Messages.
 * Dimensions are aligned with NotificationsScreen (header 48, padding 16, avatar 44).
 */
export default function MessagesScreen({ onBack, onOpenChat, onOpenUserProfile }) {
  const insets = useSafeAreaInsets();
  const { width, isFrameMode } = useViewport();
  const { colors, theme } = useTheme();
  const refreshIndicatorColor = theme === 'dark' ? '#F4F7FF' : '#465fff';
  const spinnerColor = colors.refreshSpinner || getRefreshSpinnerColor(theme);
  const headerBorderColor = theme === 'dark' ? colors.divider : colors.borderLight;
  const headerBackgroundColor = colors.surfaceElevated;
  const headerBorderWidth = StyleSheet.hairlineWidth;
  const skel = colors.skeletonBg || colors.inputBg;
  const [search, setSearch] = useState('');
  const refreshCallback = React.useCallback(async () => {
    await new Promise((r) => setTimeout(r, 400));
  }, []);
  const { refreshing, onRefresh } = useEarlyRefresh(refreshCallback, 28);

  const headerHeight = isFrameMode ? frameModeStyles.header?.height : HEADER_HEIGHT;
  const headerBtnStyle = isFrameMode ? frameModeStyles.headerBtn : undefined;
  const headerTitleStyle = isFrameMode ? frameModeStyles.headerTitle : undefined;
  const searchHeight = isFrameMode ? 36 : SEARCH_HEIGHT;
  const avatarSize = isFrameMode ? 36 : AVATAR_SIZE;
  const frequentAvatarSize = isFrameMode ? 42 : FREQUENT_AVATAR_SIZE;
  const contentPaddingH = isFrameMode ? 12 : CONTENT_PADDING_H;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
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
        <TouchableOpacity style={[styles.headerBtn, headerBtnStyle]} onPress={() => onBack?.()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={isFrameMode ? 22 : 28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, headerTitleStyle, { color: colors.text }]}>Chats</Text>
        <View style={[styles.headerBtn, headerBtnStyle]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: (insets.bottom || 0) + 24, paddingHorizontal: contentPaddingH }]}
        showsVerticalScrollIndicator={true}
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
        <View style={[styles.searchWrap, { backgroundColor: colors.inputBg, height: searchHeight }]}>
          <Ionicons name="search" size={isFrameMode ? 16 : 20} color={colors.iconInactive} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search chat here....."
            placeholderTextColor={colors.placeholder}
          />
        </View>

        <Text style={[styles.sectionTitle, isFrameMode && frameModeStyles.text, { color: colors.text }]}>Frequently chatted</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.frequentScrollContent}
        >
          {Array.from({ length: FREQUENT_CHATS_COUNT }).map((_, i) => (
            <View key={`f${i}`} style={[styles.frequentItem, isFrameMode && { width: frequentAvatarSize + 8 }]}>
              <TouchableOpacity
                style={styles.frequentAvatarWrap}
                onPress={() => onOpenUserProfile?.({ id: `freq-${i}`, name: '', lastMessage: '', time: '', unread: 0 })}
                activeOpacity={0.8}
              >
                <SkeletonGroup show={true}>
                  <SkeletonBox style={[styles.frequentAvatar, isFrameMode && { width: frequentAvatarSize, height: frequentAvatarSize, borderRadius: frequentAvatarSize / 2 }]} backgroundColor={skel} radius="round" />
                </SkeletonGroup>
                <View
                  style={[
                    styles.statusDot,
                    isFrameMode && { width: 10, height: 10, borderRadius: 5 },
                    { backgroundColor: colors.skeletonBg, borderColor: colors.skeletonBg },
                  ]}
                />
              </TouchableOpacity>
              <SkeletonGroup show={true}>
                <SkeletonBox style={styles.frequentNameSkeleton} backgroundColor={skel} />
              </SkeletonGroup>
            </View>
          ))}
        </ScrollView>

        <Text style={[styles.sectionTitle, isFrameMode && frameModeStyles.text, { color: colors.text }]}>All Messages</Text>
        <View style={styles.list}>
          {Array.from({ length: ALL_MESSAGES_COUNT }).map((_, i) => (
            <View key={i} style={[styles.chatRow, { borderBottomColor: colors.borderLight, paddingVertical: isFrameMode ? 10 : 14 }]}>
              <SkeletonGroup show={true}>
                <TouchableOpacity
                  style={[styles.chatAvatarWrap, { width: avatarSize, height: avatarSize }]}
                  onPress={() => onOpenUserProfile?.({ id: String(i), name: '', lastMessage: '', time: '', unread: 0 })}
                  activeOpacity={0.8}
                >
                  <SkeletonBox style={[styles.chatAvatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]} backgroundColor={skel} radius="round" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.chatMainPress}
                  activeOpacity={0.7}
                  onPress={() => onOpenChat?.({ id: String(i), name: '', lastMessage: '', time: '', unread: 0 })}
                >
                  <View style={styles.chatBody}>
                    <SkeletonBox style={styles.chatNameSkeleton} backgroundColor={skel} />
                    <SkeletonBox style={styles.chatMessageSkeleton} backgroundColor={skel} />
                  </View>
                  <View style={styles.chatRight}>
                    <SkeletonBox style={styles.chatTimeSkeleton} backgroundColor={skel} />
                  </View>
                </TouchableOpacity>
              </SkeletonGroup>
            </View>
          ))}
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
    paddingTop: 16,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: SEARCH_HEIGHT,
    borderRadius: 10,
    paddingLeft: 12,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 14,
    paddingRight: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  frequentScrollContent: {
    flexDirection: 'row',
    paddingBottom: 20,
    gap: 16,
  },
  frequentItem: {
    alignItems: 'center',
    width: FREQUENT_AVATAR_SIZE + 8,
    marginRight: 16,
    gap: 4,
  },
  frequentAvatarWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  frequentAvatar: {
    width: FREQUENT_AVATAR_SIZE,
    height: FREQUENT_AVATAR_SIZE,
    borderRadius: FREQUENT_AVATAR_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: STATUS_DOT_SIZE,
    height: STATUS_DOT_SIZE,
    borderRadius: STATUS_DOT_SIZE / 2,
    borderWidth: 2,
  },
  frequentName: {
    fontSize: 12,
    fontWeight: '500',
    maxWidth: FREQUENT_AVATAR_SIZE + 16,
  },
  frequentNameSkeleton: {
    width: 36,
    height: 12,
    borderRadius: 8,
  },
  chatNameSkeleton: {
    width: 90,
    height: 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  chatMessageSkeleton: {
    width: 140,
    height: 12,
    borderRadius: 8,
    marginTop: 2,
  },
  chatTimeSkeleton: {
    width: 36,
    height: 12,
    borderRadius: 8,
  },
  list: {
    paddingBottom: 8,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chatMainPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatAvatarWrap: {
    marginRight: 14,
  },
  chatAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatarLetter: {
    fontSize: 18,
    fontWeight: '600',
  },
  avatarPlaceholder: {},
  chatBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  chatName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  chatLastMessage: {
    fontSize: 14,
    fontWeight: '400',
  },
  chatRight: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  chatTime: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  unreadBadge: {
    minWidth: UNREAD_BADGE_MIN,
    height: UNREAD_BADGE_MIN,
    borderRadius: UNREAD_BADGE_MIN / 2,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  readBadge: {
    width: UNREAD_BADGE_MIN,
    height: UNREAD_BADGE_MIN,
    borderRadius: UNREAD_BADGE_MIN / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
