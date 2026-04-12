import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import PostBlock from '../components/PostBlock';
import { apiFetchWithAuth } from '../api/client';
import { POSTS } from '../api/endpoints';
import { getUploadsUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getRefreshSpinnerColor } from '../theme';

// According to the screenshot: 15-20 px spacing, comment avatar about 30-35 px, fonts 12/14
const SCREEN_PADDING_H = 16;
const COMMENT_AVATAR_SIZE = 32;
const COMMENT_SPACING = 16;

function getCommentAuthorName(author) {
  if (!author) return 'User';
  if (author.username) return author.username;
  const name = [author.name, author.surname].filter(Boolean).join(' ').trim();
  return name || 'User';
}

/**
 * Comments screen: header (back | Comment), the same post block as in the feed at the top,
 * and below it a comments list (avatar, name, time, text, likes).
 */
export default function PostCommentsScreen({ visible, post: initialPost, onClose }) {
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const spinnerColor = colors.refreshSpinner || getRefreshSpinnerColor(theme);
  const { token } = useAuth();
  const [post, setPost] = useState(initialPost || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPostWithComments = useCallback(async () => {
    const postId = initialPost?.id;
    if (!postId || !token) {
      setPost(initialPost || null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetchWithAuth(POSTS.getById(postId), token);
      if (!res.ok) {
        setPost(initialPost || null);
        return;
      }
      const data = await res.json();
      const payload = data?.payload ?? data;
      setPost(payload || initialPost);
    } catch (e) {
      setError(e?.message || 'Failed to load');
      setPost(initialPost || null);
    } finally {
      setLoading(false);
    }
  }, [initialPost?.id, token, initialPost]);

  useEffect(() => {
    if (!visible) return;
    setPost(initialPost || null);
    if (initialPost?.id && token) {
      loadPostWithComments();
    }
  }, [visible, initialPost?.id, token, loadPostWithComments]);

  if (!visible) return null;

  const comments = post?.comments ?? [];
  const headerHeight = 48;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        {/* Header: back | Comment, about 48 px by the screenshot, white background */}
        <View style={[styles.header, { height: headerHeight }]}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Comment</Text>
          <View style={styles.headerBtn} />
        </View>

        {loading && !post ? (
          <View style={[styles.centered, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={spinnerColor} />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: (insets.bottom || 0) + 24 },
            ]}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top content: the same post block as on the main feed */}
            {post && (
              <View style={styles.postWrap}>
                <PostBlock
                  post={post}
                  onPress={() => {}}
                  onLikePress={() => {}}
                  onCommentsPress={() => {}}
                />
              </View>
            )}

            {/* Comments list: avatar, name + time, text, likes */}
            <View style={styles.commentsList}>
              {comments.length === 0 && post && !loading && (
                <Text style={styles.noComments}>No comments yet</Text>
              )}
              {comments.map((comment) => {
                const author = comment.author || {};
                const name = getCommentAuthorName(author);
                const picture = author.picture_url || author.avatar;
                const timeLabel = comment.createdAt ? formatTimeAgo(comment.createdAt) : '';

                return (
                  <View key={comment.id} style={styles.commentRow}>
                    <View style={styles.commentAvatarWrap}>
                      {picture ? (
                        <Image
                          source={{ uri: getUploadsUrl(picture) }}
                          style={styles.commentAvatar}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.commentAvatar, styles.commentAvatarPlaceholder]}>
                          <Ionicons name="person" size={18} color="#9CA3AF" />
                        </View>
                      )}
                    </View>
                    <View style={styles.commentBody}>
                      <View style={styles.commentHeaderRow}>
                        <Text style={styles.commentName} numberOfLines={1}>
                          {name}
                        </Text>
                        {timeLabel ? (
                          <Text style={styles.commentTime}>{timeLabel}</Text>
                        ) : null}
                      </View>
                      <Text style={styles.commentText}>{comment.text}</Text>
                      <View style={styles.commentLikesRow}>
                        <Ionicons name="heart" size={14} color="rgba(236, 28, 36, 1)" />
                        <Text style={styles.commentLikesCount}>
                          {comment.likesCount ?? 25}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function formatTimeAgo(createdAt) {
  if (!createdAt) return '';
  const date = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return diffMins <= 1 ? 'Just now' : `${diffMins}mins ago`;
  if (diffHours < 24) return `${diffHours}hr${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
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
    backgroundColor: '#FFFFFF',
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
    color: '#000',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: 16,
  },
  postWrap: {
    marginBottom: 8,
  },
  commentsList: {
    paddingTop: 8,
  },
  noComments: {
    fontSize: 14,
    color: '#9CA3AF',
    marginVertical: 16,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: COMMENT_SPACING,
  },
  commentAvatarWrap: {
    marginRight: 12,
  },
  commentAvatar: {
    width: COMMENT_AVATAR_SIZE,
    height: COMMENT_AVATAR_SIZE,
    borderRadius: COMMENT_AVATAR_SIZE / 2,
    overflow: 'hidden',
  },
  commentAvatarPlaceholder: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentBody: {
    flex: 1,
    minWidth: 0,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.5)',
  },
  commentText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000',
    lineHeight: 20,
  },
  commentLikesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  commentLikesCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
});
