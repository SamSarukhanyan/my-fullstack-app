import React, { useRef, useCallback, useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AnimatedTabBar, { TAB_BAR_FIXED_HEIGHT } from './AnimatedTabBar';
import MusicPlayer from './music/MusicPlayer';
import { triggerTabHaptic } from '../utils/haptics';
import { useTheme } from '../context/ThemeContext';
import { useMusicPlayerContext } from '../context/MusicPlayerContext';
import { useViewport } from '../context/ViewportContext';
import { frameModeStyles } from './DeviceFrameWrapper';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const NUM_PAGES = 5;
const PAGE_GAP = 8;
const PAGE_RADIUS_TOP = 0;
const PAGE_CARD_TOP_RADIUS = PAGE_RADIUS_TOP + 45;
const TAB_BAR_BOTTOM_PADDING = 12;
const DARK_MAIN_PAGES_BG = '#0d1015';
const LIGHT_MAIN_PAGES_BG = '#f5f5f5';
const DARK_MAIN_GAP_BG = '#000000';
// Дополнительная ширина страницы в режиме рамки,
// чтобы красный бордер page совпадал с зелёным контейнером в DeviceFrameWrapper
const FRAME_PAGE_EXTRA_WIDTH = 0;

/**
 * Instagram-like horizontal pager. Страницы — ровно на всю ширину экрана.
 * Зазор — отдельные чёрные блоки между ними, при свайпе видна полоска.
 */
export default function MainPager({
  renderHome,
  renderMusic,
  renderCreate,
  renderMessages,
  renderProfile,
  hideTabBar = false,
  homeExtraProps = {},
  createExtraProps = {},
  messagesExtraProps = {},
  musicExtraProps = {},
  profileExtraProps = {},
}) {
  const { width: SCREEN_WIDTH, isFrameMode } = useViewport();
  const PAGE_WIDTH = isFrameMode ? SCREEN_WIDTH + FRAME_PAGE_EXTRA_WIDTH : SCREEN_WIDTH;
  const tabBarFixedHeight = isFrameMode ? frameModeStyles.tabBarHeight : TAB_BAR_FIXED_HEIGHT;
  const playerWrapperHeight = isFrameMode ? frameModeStyles.playerWrapperHeight : 70;
  const PAGE_STEP = PAGE_WIDTH + PAGE_GAP;
  const CONTENT_WIDTH = NUM_PAGES * PAGE_WIDTH + (NUM_PAGES - 1) * PAGE_GAP;
  const SNAP_OFFSETS = useMemo(
    () => Array.from({ length: NUM_PAGES }, (_, i) => i * PAGE_STEP),
    [PAGE_STEP]
  );
  const scrollRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const mainPagesBg = theme === 'dark' ? DARK_MAIN_PAGES_BG : LIGHT_MAIN_PAGES_BG;
  const mainGapBg = DARK_MAIN_GAP_BG;
  const { state: musicPlayerState } = useMusicPlayerContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pagerScrollEnabled, setPagerScrollEnabled] = useState(true);
  const lastChangeWasTap = useRef(false);
  const lastHapticForIndex = useRef(-1);
  const lastDisplayedIndexRef = useRef(0);

  const releaseScrollResponder = useCallback(() => {
    // Force-release residual responder lock after momentum so taps work instantly.
    scrollRef.current?.setNativeProps?.({ scrollEnabled: false });
    requestAnimationFrame(() => {
      scrollRef.current?.setNativeProps?.({ scrollEnabled: true });
    });
  }, [PAGE_STEP]);

  const getIndexFromOffset = useCallback((x) => {
    const index = Math.round(x / PAGE_STEP);
    return Math.min(Math.max(0, index), NUM_PAGES - 1);
  }, [PAGE_STEP]);

  const onScroll = useCallback(
    (e) => {
      const x = e.nativeEvent.contentOffset.x;
      scrollX.setValue(x);
      if (lastChangeWasTap.current) return;
      const newIndex = getIndexFromOffset(x);
      if (newIndex !== lastDisplayedIndexRef.current) {
        lastDisplayedIndexRef.current = newIndex;
        lastHapticForIndex.current = newIndex;
        setCurrentIndex(newIndex);
        triggerTabHaptic();
      }
    },
    [getIndexFromOffset, scrollX]
  );

  const onScrollEndDrag = useCallback((e) => {
    if (lastChangeWasTap.current) return;
    const x = e.nativeEvent.contentOffset.x;
    const newIndex = getIndexFromOffset(x);
    if (lastHapticForIndex.current !== newIndex) {
      lastHapticForIndex.current = newIndex;
      triggerTabHaptic();
    }
  }, [getIndexFromOffset]);

  const onMomentumScrollEnd = useCallback((e) => {
    const x = e.nativeEvent.contentOffset.x;
    const newIndex = getIndexFromOffset(x);
    const targetX = newIndex * PAGE_STEP;

    // Hard-align only at the very end to avoid visual jerk while swiping.
    if (Math.abs(x - targetX) > 0.5) {
      scrollRef.current?.scrollTo({ x: targetX, animated: false });
      scrollX.setValue(targetX);
    }

    lastDisplayedIndexRef.current = newIndex;
    setCurrentIndex(newIndex);
    setPagerScrollEnabled(true);
    if (!lastChangeWasTap.current && lastHapticForIndex.current !== newIndex) {
      lastHapticForIndex.current = newIndex;
      triggerTabHaptic();
    }
    lastChangeWasTap.current = false;
    releaseScrollResponder();
  }, [getIndexFromOffset, releaseScrollResponder, scrollX, PAGE_STEP]);

  const goToPage = useCallback((index, animate = false) => {
    lastChangeWasTap.current = true;
    lastHapticForIndex.current = index;
    lastDisplayedIndexRef.current = index;
    setCurrentIndex(index);
    setPagerScrollEnabled(true);
    scrollRef.current?.scrollTo({
      x: index * PAGE_STEP,
      animated: animate,
    });
  }, [PAGE_STEP]);

  const goBackOnePage = useCallback(() => {
    const prevIndex = Math.max(0, currentIndex - 1);
    goToPage(prevIndex, true);
  }, [currentIndex, goToPage]);

  const createProps = { ...createExtraProps, onBack: createExtraProps.onBack ?? goBackOnePage };
  const messagesProps = { ...messagesExtraProps, onBack: messagesExtraProps.onBack ?? goBackOnePage };
  const musicProps = {
    ...musicExtraProps,
    onBack: musicExtraProps.onBack ?? goBackOnePage,
  };
  const profileProps = { ...profileExtraProps, onBack: goBackOnePage };

  return (
    <View style={[styles.container, { backgroundColor: mainGapBg, paddingTop: PAGE_RADIUS_TOP }]}>
      <AnimatedScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        snapToOffsets={SNAP_OFFSETS}
        snapToAlignment="start"
        decelerationRate={0.82}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={0}
        bounces={false}
        scrollEnabled={pagerScrollEnabled}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { width: CONTENT_WIDTH }]}
      >
        <View style={[styles.page, isFrameMode && frameModeStyles.page, { width: PAGE_WIDTH, minWidth: PAGE_WIDTH }]}>
          <View style={[styles.pageCard, isFrameMode && frameModeStyles.pageCard, { backgroundColor: mainPagesBg }]}>{renderHome?.(homeExtraProps)}</View>
        </View>
          <View style={[styles.gap, isFrameMode && frameModeStyles.pageGap, { width: PAGE_GAP, backgroundColor: mainGapBg }]} />
        <View style={[styles.page, isFrameMode && frameModeStyles.page, { width: PAGE_WIDTH, minWidth: PAGE_WIDTH }]}>
          <View style={[styles.pageCard, isFrameMode && frameModeStyles.pageCard, { backgroundColor: mainPagesBg }]}>{renderMusic?.(musicProps)}</View>
        </View>
        <View style={[styles.gap, isFrameMode && frameModeStyles.pageGap, { width: PAGE_GAP, backgroundColor: mainGapBg }]} />
        <View style={[styles.page, isFrameMode && frameModeStyles.page, { width: PAGE_WIDTH, minWidth: PAGE_WIDTH }]}>
          <View style={[styles.pageCard, isFrameMode && frameModeStyles.pageCard, { backgroundColor: mainPagesBg }]}>{renderCreate?.(createProps)}</View>
        </View>
        <View style={[styles.gap, isFrameMode && frameModeStyles.pageGap, { width: PAGE_GAP, backgroundColor: mainGapBg }]} />
        <View style={[styles.page, isFrameMode && frameModeStyles.page, { width: PAGE_WIDTH, minWidth: PAGE_WIDTH }]}>
          <View style={[styles.pageCard, isFrameMode && frameModeStyles.pageCard, { backgroundColor: mainPagesBg }]}>{renderMessages?.(messagesProps)}</View>
        </View>
        <View style={[styles.gap, isFrameMode && frameModeStyles.pageGap, { width: PAGE_GAP, backgroundColor: mainGapBg }]} />
        <View style={[styles.page, isFrameMode && frameModeStyles.page, { width: PAGE_WIDTH, minWidth: PAGE_WIDTH }]}>
          <View style={[styles.pageCard, isFrameMode && frameModeStyles.pageCard, { backgroundColor: mainPagesBg }]}>{renderProfile?.(profileProps)}</View>
        </View>
      </AnimatedScrollView>
      {musicPlayerState && (
        <View
          style={[
            styles.playerWrapper,
            {
              height: playerWrapperHeight,
              bottom: isFrameMode
                ? tabBarFixedHeight + (frameModeStyles.tabBarBottomPadding ?? 8) + 1 + (insets.bottom || 0)
                : tabBarFixedHeight + TAB_BAR_BOTTOM_PADDING + 1 + (insets.bottom || 0),
              left: isFrameMode ? 2 : 4,
              right: isFrameMode ? 2 : 4,
            },
          ]}
          pointerEvents="box-none"
        >
          <MusicPlayer
            visible={true}
            track={musicPlayerState.track}
            isPlaying={musicPlayerState.isPlaying}
            positionMs={musicPlayerState.positionMs}
            durationMs={musicPlayerState.durationMs || musicPlayerState.track?.durationMs || 0}
            onTogglePlay={musicPlayerState.onTogglePlay}
            onClose={musicPlayerState.onClose}
            onNextTrack={musicPlayerState.onNextTrack}
            onSeek={musicPlayerState.onSeek}
            palette={musicPlayerState.palette}
          />
        </View>
      )}
      <View
        style={[
          styles.tabBarWrapper,
          {
            opacity: hideTabBar ? 0 : 1,
            pointerEvents: hideTabBar ? 'none' : 'auto',
            paddingHorizontal: isFrameMode ? (frameModeStyles.tabBarHorizontalPadding ?? 12) : 14,
            paddingBottom: isFrameMode ? (frameModeStyles.tabBarBottomPadding ?? 8) : 12,
          },
        ]}
      >
        <AnimatedTabBar
          pageWidth={PAGE_WIDTH}
          onTabPress={goToPage}
          currentIndex={currentIndex}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  page: {
    flex: 1,
  },
  gap: {
    flex: 0,
  },
  playerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 12,
  },
  pageCard: {
    flex: 1,
    width: '100%',
  
    borderTopLeftRadius: PAGE_CARD_TOP_RADIUS,
    borderTopRightRadius: PAGE_CARD_TOP_RADIUS,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
  },
});
