import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEarlyRefresh } from '../hooks/useEarlyRefresh';
import { useTheme } from '../context/ThemeContext';
import { getRefreshSpinnerColor } from '../theme';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = 48;
const TOTAL_ROWS = 6;
const TRACK_COVER_SIZE = 52;

export default function MusicScreen({ onBack }) {
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const refreshIndicatorColor = theme === 'dark' ? '#F4F7FF' : '#465fff';
  const spinnerColor = colors.refreshSpinner || getRefreshSpinnerColor(theme);
  const headerBorderColor = theme === 'dark' ? colors.divider : colors.borderLight;
  const headerBackgroundColor = colors.surfaceElevated;
  const headerBorderWidth = StyleSheet.hairlineWidth;
  const [addedTracks, setAddedTracks] = useState([]);

  const refreshCallback = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 400));
  }, []);
  const { refreshing, onRefresh } = useEarlyRefresh(refreshCallback, 10);

  const onAddTrack = useCallback(() => {
    setAddedTracks((prev) => [...prev, { id: Date.now(), title: `Track ${prev.length + 1}`, artist: 'Artist' }]);
  }, []);

  return (
    <View style={[styles.rootWrap, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            height: HEADER_HEIGHT,
            borderBottomColor: headerBorderColor,
            backgroundColor: headerBackgroundColor,
            borderBottomWidth: headerBorderWidth,
          },
        ]}
      >
        <TouchableOpacity style={styles.headerBtn} onPress={() => onBack?.()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Music</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={onAddTrack} activeOpacity={0.7}>
          <Ionicons name="add" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: 16,
            paddingBottom: 24 + (insets.bottom || 0),
            minHeight: SCREEN_HEIGHT - insets.top - HEADER_HEIGHT - (insets.bottom || 0) + 80,
            flexGrow: 1,
            backgroundColor: colors.background,
          },
        ]}
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
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
        <Text style={[styles.title, { color: colors.text }]}>Music</Text>
        <View style={styles.list}>
          {Array.from({ length: TOTAL_ROWS }).map((_, i) =>
            i < addedTracks.length ? (
              <View key={addedTracks[i].id} style={[styles.trackRow, { borderBottomColor: colors.borderLight }]}>
                <View style={[styles.trackCover, { backgroundColor: colors.skeletonBg }]}>
                  <Ionicons name="musical-notes" size={24} color={colors.textMuted} />
                </View>
                <View style={styles.trackInfo}>
                  <Text style={[styles.trackTitle, { color: colors.text }]} numberOfLines={1}>
                    {addedTracks[i].title}
                  </Text>
                  <Text style={[styles.trackArtist, { color: colors.textSecondary }]} numberOfLines={1}>
                    {addedTracks[i].artist}
                  </Text>
                </View>
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
              </View>
            ) : (
              <View key={`skel-${i}`} style={[styles.trackRow, styles.trackRowSkeleton, { borderBottomColor: colors.borderLight }]}>
                <View style={[styles.trackCoverSkeleton, { backgroundColor: colors.skeletonBg }]} />
                <View style={styles.trackInfoSkeleton}>
                  <View style={[styles.trackTitleSkeleton, { backgroundColor: colors.skeletonBg }]} />
                  <View style={[styles.trackArtistSkeleton, { backgroundColor: colors.skeletonBg }]} />
                </View>
              </View>
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootWrap: { flex: 1 },
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
  scroll: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  list: {
    marginTop: 20,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  trackRowSkeleton: {
    minHeight: TRACK_COVER_SIZE + 24,
  },
  trackCover: {
    width: TRACK_COVER_SIZE,
    height: TRACK_COVER_SIZE,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  trackCoverSkeleton: {
    width: TRACK_COVER_SIZE,
    height: TRACK_COVER_SIZE,
    borderRadius: 8,
    marginRight: 14,
  },
  trackInfo: {
    flex: 1,
    minWidth: 0,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 14,
    opacity: 0.8,
  },
  trackInfoSkeleton: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  trackTitleSkeleton: {
    width: 140,
    height: 16,
    borderRadius: 4,
  },
  trackArtistSkeleton: {
    width: 90,
    height: 14,
    borderRadius: 4,
  },
});
