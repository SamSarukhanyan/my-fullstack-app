import React, { useState, useEffect, useRef } from 'react';
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

import PostBlock from '../components/PostBlock';
import PostBlockSkeleton from '../components/PostBlockSkeleton';
import { SkeletonBox, SkeletonGroup } from '../components/SkeletonBox';
import { apiFetch, apiFetchWithAuth } from '../api/client';
import { POSTS } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useEarlyRefresh } from '../hooks/useEarlyRefresh';
import { useViewport } from '../context/ViewportContext';
import { frameModeStyles } from '../components/DeviceFrameWrapper';

const DESIGN_WIDTH = 390;
const SEARCH_TOP = 70;
const SEARCH_LEFT = 20;
const SEARCH_WIDTH = 299;
const SEARCH_HEIGHT = 34;
const BELL_LEFT = 337;
const BELL_WIDTH = 28;
const BELL_HEIGHT = 34;
const STORIES_TOP = 127;
const STORY_ITEM_WIDTH = 70;
const STORY_GAP = 16.5;
const STORY_CIRCLE_SIZE = 70;
const STORY_NAME_TOP_OFFSET = 113;
const STORY_BLOCK_HEIGHT = 115;
const STORY_COUNT = 5;
const STORY_RING_WIDTH = 2;
const STORY_RING_INSET = 2;

/**
 * HOME SCREEN — Figma 87-139.
 * Root: flex 1, 100% width (auto responsive).
 * Block 1: Search input 299×34 (top 70, left 20) + notification icon (18×24, top 75, left 337, #006175).
 * Block 2: Stories horizontal slider — 4 full + 1/3 peek; skeletons; first = my story with + in circle.
 */
export default function HomeScreen({ onOpenStory, onOpenNotifications, onOpenUserProfile }) {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, isFrameMode } = useViewport();
  const scale = SCREEN_WIDTH / DESIGN_WIDTH;
  const reduce = isFrameMode ? (frameModeStyles.homeReduce || 8) : 0;
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { colors, theme } = useTheme();
  const refreshIndicatorColor = theme === 'dark' ? '#F4F7FF' : '#465fff';
  const [searchFocused, setSearchFocused] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const storiesMarginTop = (STORIES_TOP - SEARCH_TOP - SEARCH_HEIGHT) * scale;
  const storyItemRefs = useRef({});
  const layout = React.useMemo(() => {
    const paddingH = SEARCH_LEFT * scale;
    const storyGap = STORY_GAP * scale;
    const visibleCount = 4;
    let storyItemWidth;
    let storyCircleSize;
    if (isFrameMode) {
      storyItemWidth = (SCREEN_WIDTH - 2 * paddingH - (visibleCount - 1) * storyGap) / visibleCount;
      storyCircleSize = storyItemWidth;
    } else {
      storyItemWidth = Math.max(0, STORY_ITEM_WIDTH * scale - reduce);
      storyCircleSize = Math.max(0, STORY_CIRCLE_SIZE * scale - reduce);
    }
    const baseSearchHeight = Math.max(0, SEARCH_HEIGHT * scale - reduce);
    const searchHeight = isFrameMode ? baseSearchHeight * 2 : baseSearchHeight;
    const topRowHeight = isFrameMode ? baseSearchHeight * 2 : baseSearchHeight;
    const gapBetweenSearchAndBell = isFrameMode ? 0 : (BELL_LEFT - SEARCH_LEFT - SEARCH_WIDTH - BELL_WIDTH) * scale;
    const searchWidth = isFrameMode
      ? Math.max(0, SCREEN_WIDTH - 2 * paddingH - 32 - gapBetweenSearchAndBell)
      : Math.max(0, SEARCH_WIDTH * scale - reduce);
    const bellWidth = isFrameMode ? 32 : Math.max(0, BELL_WIDTH * scale - reduce);
    return {
      searchLeft: paddingH,
      searchWidth,
      searchHeight,
      bellWidth,
      bellHeight: Math.max(0, BELL_HEIGHT * scale - reduce),
      storyItemWidth,
      storyGap,
      storyCircleSize,
      topRowHeight,
      topRowPaddingH: paddingH,
      topRowGap: gapBetweenSearchAndBell,
    };
  }, [scale, reduce, isFrameMode, SCREEN_WIDTH]);

  const loadPosts = React.useCallback(async () => {
    try {
      const res = token
        ? await apiFetchWithAuth(POSTS.list, token)
        : await apiFetch(POSTS.list);
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data?.payload) ? data.payload : (Array.isArray(data) ? data : []);
      setPosts(list);
    } catch (_) {
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, [token]);

  // Same as on the other pages: 200 ms spinner, posts load in the background
  const refreshCallback = React.useCallback(async () => {
    loadPosts();
    await new Promise((r) => setTimeout(r, 400));
  }, [loadPosts]);
  const { refreshing, onRefresh } = useEarlyRefresh(refreshCallback, 10);


  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const spinOffset = Platform.OS === 'ios' ? 30 : 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.scrollWrap, { paddingTop: spinOffset }]}>
      <ScrollView
        style={[styles.scroll, Platform.OS === 'android' && { elevation: 2 }]}
        contentContainerStyle={[
          styles.scrollContent,
          {
            minHeight: SCREEN_HEIGHT - insets.top - (insets.bottom || 0) + 80,
            flexGrow: 1,
            paddingTop: insets.top + 16 - spinOffset,
            paddingBottom: 24 + (insets.bottom || 0),
          },
        ]}
        showsVerticalScrollIndicator={false}
        decelerationRate="normal"
        bounces={true}
        alwaysBounceVertical={true}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={refreshIndicatorColor}
            colors={[refreshIndicatorColor]}

            progressBackgroundColor={Platform.OS === 'android' ? colors.background : undefined}
            progressViewOffset={insets.top + 24}
          />
        }
      >
        {/* Block 1: Search + Notification */}
        <View style={[styles.topRow, { paddingHorizontal: layout.topRowPaddingH, height: layout.topRowHeight, gap: layout.topRowGap }]}>
          <View
            style={[
              styles.searchWrap,
              {
                width: layout.searchWidth,
                height: layout.searchHeight,
                backgroundColor: colors.inputBg,
                borderColor: theme === 'dark' ? (searchFocused ? colors.primary : colors.border) : 'transparent',
                shadowOpacity: theme === 'dark' ? 0.14 : 0,
                shadowRadius: theme === 'dark' ? 10 : 0,
                shadowOffset: theme === 'dark' ? { width: 0, height: 4 } : { width: 0, height: 0 },
                elevation: theme === 'dark' ? 3 : 0,
              },
              isFrameMode && { borderRadius: 999 },
            ]}
          >
            <Ionicons
              name="search"
              size={isFrameMode ? 8 : 10}
              color={colors.iconActive}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { height: layout.searchHeight, color: colors.text }]}
              placeholder="Type something..."
              placeholderTextColor={colors.searchPlaceholder}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </View>
          <TouchableOpacity
            style={[styles.bellWrap, { width: layout.bellWidth, height: layout.bellHeight }, isFrameMode && { marginRight: 6 }]}
            activeOpacity={0.7}
            onPress={() => onOpenNotifications?.()}
          >
            <Ionicons name="notifications-outline" size={isFrameMode ? 22 : 24} color={colors.iconActive} />
          </TouchableOpacity>
        </View>

        {/* Block 2: Stories slider — 4 full + 1/3 visible */}
        <View style={[styles.storiesSection, { marginTop: storiesMarginTop }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.storiesScrollContent, { paddingLeft: layout.searchLeft, paddingRight: layout.searchLeft }]}
            snapToInterval={layout.storyItemWidth + layout.storyGap}
            snapToAlignment="start"
            decelerationRate="fast"
            scrollEventThrottle={16}
          >
            {Array.from({ length: STORY_COUNT }).map((_, index) => {
              const isMyStory = index === 0;
              const innerStorySize = Math.max(0, layout.storyCircleSize - (STORY_RING_WIDTH + STORY_RING_INSET) * 2);
              const Wrapper = isMyStory ? View : TouchableOpacity;
              const onPress = isMyStory
                ? undefined
                : () => {
                    const ref = storyItemRefs.current[index];
                    const storyUsers = Array.from({ length: STORY_COUNT - 1 }).map((_, i) => ({
                      userName: `User ${i + 1}`,
                      storiesCount: 2,
                      timeAgo: '1hr ago',
                    }));
                    const initialIndex = index - 1;
                    if (ref && ref.measureInWindow) {
                      ref.measureInWindow((x, y, width, height) => {
                        onOpenStory?.({
                          users: storyUsers,
                          initialUserIndex: initialIndex,
                          user: storyUsers[initialIndex],
                          layout: { x, y, width, height },
                        });
                      });
                    } else {
                      onOpenStory?.({ users: storyUsers, initialUserIndex: initialIndex, user: storyUsers[initialIndex] });
                    }
                  };
              return (
                <Wrapper
                  key={index}
                  ref={(r) => { if (r) storyItemRefs.current[index] = r; }}
                  collapsable={false}
                  style={[styles.storyItem, { width: layout.storyItemWidth, marginRight: layout.storyGap }]}
                  onPress={onPress}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.storyRing,
                      {
                        width: layout.storyCircleSize,
                        height: layout.storyCircleSize,
                        borderRadius: layout.storyCircleSize / 2,
                        borderColor: colors.skeletonBg,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.storyImage,
                        {
                          width: innerStorySize,
                          height: innerStorySize,
                          borderRadius: innerStorySize / 2,
                          backgroundColor: colors.inputBg,
                          borderColor: colors.borderLight,
                        },
                      ]}
                    >
                      {isMyStory ? (
                        <Ionicons name="add" size={isFrameMode ? 22 : 28} color={colors.text} />
                      ) : (
                        <SkeletonGroup show={true}>
                          <SkeletonBox
                            style={[styles.storyImageSkeleton, { width: innerStorySize, height: innerStorySize, borderRadius: innerStorySize / 2 }]}
                            backgroundColor={colors.skeletonBg}
                            radius="round"
                          />
                        </SkeletonGroup>
                      )}
                    </View>
                  </View>
                  <View style={styles.storyNameSkeletonWrap}>
                    <SkeletonGroup show={true}>
                      <SkeletonBox style={styles.storyNameSkeleton} backgroundColor={colors.skeletonBg} />
                    </SkeletonGroup>
                  </View>
                </Wrapper>
              );
            })}
          </ScrollView>
        </View>

        {/* Feed: on loading or with no posts, show skeletons (same sizes/order as posts); otherwise render posts */}
        <View style={styles.feedSection}>
          {postsLoading || posts.length === 0 ? (
            <>
              <PostBlockSkeleton onAvatarPress={onOpenUserProfile} />
              <PostBlockSkeleton onAvatarPress={onOpenUserProfile} />
              <PostBlockSkeleton onAvatarPress={onOpenUserProfile} />
            </>
          ) : (
            posts.map((post) => (
              <PostBlock
                key={post.id}
                post={post}
                onPress={() => {}}
                onLikePress={() => {}}
                onCommentsPress={() => {}}
                onAuthorPress={onOpenUserProfile}
              />
            ))
          )}
        </View>
      </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
  },
  scrollWrap: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {},
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SEARCH_LEFT,
    height: SEARCH_HEIGHT,
    gap: BELL_LEFT - SEARCH_LEFT - SEARCH_WIDTH - BELL_WIDTH,
  },
  searchWrap: {
    width: SEARCH_WIDTH,
    height: SEARCH_HEIGHT,
    borderRadius: 10,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 19,
  },
  searchIcon: {
    marginRight: 11,
    fontSize: 17,
  },
  searchInput: {
    flex: 1,
    height: SEARCH_HEIGHT,
    paddingVertical: 0,
    fontSize: 14,
    fontWeight: '500',
    paddingRight: 12,
  },

  bellWrap: {
    width: BELL_WIDTH,
    height: BELL_HEIGHT,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    // borderWidth: 1.5,
    // borderColor: 'rgb(236, 139, 20)',
  },
  storiesSection: {
    marginBottom: 8,
    // borderWidth: 1.5,
    // borderColor: 'rgb(236, 20, 193)',
  },
  storiesScrollContent: {
    paddingLeft: SEARCH_LEFT,
    paddingRight: SEARCH_LEFT,
    flexDirection: 'row',
    // borderWidth: 1.5,
    // borderColor: 'rgb(42, 236, 20)',
  },
  storyItem: {
    width: STORY_ITEM_WIDTH,
    marginRight: STORY_GAP,
    alignItems: 'center',
    // borderWidth: 1.5,
    // borderColor: 'rgb(236, 20, 110)',
  },
  storyRing: {
    borderWidth: STORY_RING_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    padding: STORY_RING_INSET,
  },
  storyImage: {
    width: STORY_CIRCLE_SIZE,
    height: STORY_CIRCLE_SIZE,
    borderRadius: STORY_CIRCLE_SIZE / 2,
    borderWidth: 0.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  storyImageSkeleton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyName: {
    marginTop: 10,
    width: '100%',
    height: 18,
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 12,
    letterSpacing: 0,
    textAlign: 'center',
  },
  storyNameSkeletonWrap: {
    marginTop: 6,
    marginBottom: 4,
  },
  storyNameSkeleton: {
    width: 44,
    height: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  feedSection: {
    paddingTop: 14,
    paddingBottom: 24,
    paddingHorizontal: 14,
  },
  feedLoading: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 12,
  },
  feedPlaceholder: {
    paddingHorizontal: 20,
    paddingTop: 24,
    alignItems: 'center',
  },
  feedPlaceholderText: {
    fontSize: 14,
  },
});
