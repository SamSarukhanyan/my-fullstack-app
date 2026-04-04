import React, { useRef, useCallback, useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Animated, InteractionManager } from 'react-native';
import { triggerTabHaptic } from '../../utils/haptics';
import { useViewport } from '../../context/ViewportContext';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const NUM_PAGES = 3;
const PAGE_GAP = 8;

/**
 * Горизонтальный pager с 3 страницами.
 * Поведение как у MainPager: snap, gap, haptics, без скругления углов.
 */
export default function MusicPager({
  currentIndex,
  onIndexChange,
  renderPage0,
  renderPage1,
  renderPage2,
  pageBackgroundColor,
}) {
  const { width: SCREEN_WIDTH } = useViewport();
  const PAGE_STEP = SCREEN_WIDTH + PAGE_GAP;
  const CONTENT_WIDTH = NUM_PAGES * SCREEN_WIDTH + (NUM_PAGES - 1) * PAGE_GAP;
  const SNAP_OFFSETS = useMemo(
    () => Array.from({ length: NUM_PAGES }, (_, i) => i * PAGE_STEP),
    [PAGE_STEP]
  );
  const scrollRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [pagerScrollEnabled, setPagerScrollEnabled] = useState(true);
  const lastChangeWasTap = useRef(false);
  const lastHapticForIndex = useRef(-1);
  const lastDisplayedIndexRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);

  const releaseScrollResponder = useCallback(() => {
    scrollRef.current?.setNativeProps?.({ scrollEnabled: false });
    requestAnimationFrame(() => {
      scrollRef.current?.setNativeProps?.({ scrollEnabled: true });
    });
  }, []);

  const getIndexFromOffset = useCallback((x) => {
    const index = Math.round(x / PAGE_STEP);
    return Math.min(Math.max(0, index), NUM_PAGES - 1);
  }, [PAGE_STEP]);

  const onScroll = useCallback(
    (e) => {
      const x = e.nativeEvent.contentOffset.x;
      scrollX.setValue(x);
      if (isProgrammaticScrollRef.current) return;
      if (lastChangeWasTap.current) return;
      const newIndex = getIndexFromOffset(x);
      if (newIndex !== lastDisplayedIndexRef.current) {
        lastDisplayedIndexRef.current = newIndex;
        lastHapticForIndex.current = newIndex;
        onIndexChange?.(newIndex);
        triggerTabHaptic();
      }
    },
    [getIndexFromOffset, scrollX, onIndexChange],
  );

  const onScrollEndDrag = useCallback((e) => {
    if (isProgrammaticScrollRef.current) return;
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

    if (Math.abs(x - targetX) > 0.5) {
      scrollRef.current?.scrollTo({ x: targetX, animated: false });
      scrollX.setValue(targetX);
    }

    lastDisplayedIndexRef.current = newIndex;
    if (!isProgrammaticScrollRef.current) {
      onIndexChange?.(newIndex);
    }
    isProgrammaticScrollRef.current = false;
    setPagerScrollEnabled(true);
    if (!lastChangeWasTap.current && lastHapticForIndex.current !== newIndex) {
      lastHapticForIndex.current = newIndex;
      triggerTabHaptic();
    }
    lastChangeWasTap.current = false;
    releaseScrollResponder();
  }, [getIndexFromOffset, onIndexChange, releaseScrollResponder, scrollX, PAGE_STEP]);

  const goToPage = useCallback((index, animate = false) => {
    lastChangeWasTap.current = true;
    lastHapticForIndex.current = index;
    lastDisplayedIndexRef.current = index;
    onIndexChange?.(index);
    setPagerScrollEnabled(true);
    scrollRef.current?.scrollTo({
      x: index * PAGE_STEP,
      animated: animate,
    });
  }, [onIndexChange, PAGE_STEP]);

  React.useEffect(() => {
    if (PAGE_STEP <= 0 || !Number.isFinite(PAGE_STEP)) return;
    const targetX = currentIndex * PAGE_STEP;
    const task = InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          isProgrammaticScrollRef.current = true;
          lastChangeWasTap.current = true;
          lastDisplayedIndexRef.current = currentIndex;
          lastHapticForIndex.current = currentIndex;
          scrollRef.current.scrollTo({ x: targetX, animated: true });
        }
      });
    });
    return () => task.cancel();
  }, [currentIndex, PAGE_STEP]);

  const renderPage = [renderPage0, renderPage1, renderPage2][currentIndex];
  const bg = pageBackgroundColor || '#ffffff';

  return (
    <View style={styles.container}>
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
        scrollEventThrottle={16}
        bounces={false}
        scrollEnabled={pagerScrollEnabled}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { width: CONTENT_WIDTH }]}
      >
        <View style={[styles.page, { width: SCREEN_WIDTH, minWidth: SCREEN_WIDTH, backgroundColor: bg }]}>
          <View style={[styles.pageCard, { backgroundColor: bg }]}>{renderPage0?.()}</View>
        </View>
        <View style={[styles.gap, { width: PAGE_GAP, backgroundColor: bg }]} />
        <View style={[styles.page, { width: SCREEN_WIDTH, minWidth: SCREEN_WIDTH, backgroundColor: bg }]}>
          <View style={[styles.pageCard, { backgroundColor: bg }]}>{renderPage1?.()}</View>
        </View>
        <View style={[styles.gap, { width: PAGE_GAP, backgroundColor: bg }]} />
        <View style={[styles.page, { width: SCREEN_WIDTH, minWidth: SCREEN_WIDTH, backgroundColor: bg }]}>
          <View style={[styles.pageCard, { backgroundColor: bg }]}>{renderPage2?.()}</View>
        </View>
      </AnimatedScrollView>
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
  pageCard: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
});
