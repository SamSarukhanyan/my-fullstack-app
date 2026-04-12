import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Pressable,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SkeletonBox, SkeletonGroup } from '../components/SkeletonBox';
import { getRefreshSpinnerColor } from '../theme';
import { useEarlyRefresh } from '../hooks/useEarlyRefresh';
import { useViewport } from '../context/ViewportContext';
import { frameModeStyles } from '../components/DeviceFrameWrapper';

const { width: FALLBACK_WIDTH } = Dimensions.get('window');
const DRAG_CLOSE_THRESHOLD = 80;
const UNDERLAY_OFFSET_LEFT_PX = 44;
const UNDERLAY_FOLLOW_FACTOR = 0.28;
/** Fast smooth open/close animation (like Chat/Settings). */
const PANEL_ANIMATION_DURATION_MS = 180;

const NOTIFICATIONS_SECTIONS = [
  { dateLabel: 'Today', itemCount: 4 },
  { dateLabel: '', itemCount: 4 },
];

/**
 * Notifications screen: header (back | Notifications | trash), list grouped by date.
 * The MainPager underlay shifts 44px to the left and moves back in sync while closing, like Chat/Settings.
 */
export default function NotificationsScreen({ visible, onClose, onClearAll, onTranslateX, onAnimateUnderlayToZero }) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, isFrameMode } = useViewport();
  const panelWidth = screenWidth ?? FALLBACK_WIDTH;
  const { colors, theme } = useTheme();
  const refreshIndicatorColor = theme === 'dark' ? '#F4F7FF' : '#465fff';
  const spinnerColor = colors.refreshSpinner || getRefreshSpinnerColor(theme);
  const [sections, setSections] = useState(NOTIFICATIONS_SECTIONS);
  const [panKey, setPanKey] = useState(0);
  const translateX = useSharedValue(panelWidth);
  const backdropOpacity = useSharedValue(0);
  const entranceDone = useSharedValue(false);
  const isClosing = useSharedValue(false);

  const refreshCallback = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 600));
    setSections((prev) => prev);
  }, []);
  const { refreshing, onRefresh } = useEarlyRefresh(refreshCallback, 10);

  const runCloseAnimation = useCallback(() => {
    isClosing.value = true;
    onAnimateUnderlayToZero?.(200);
    const d = 200;
    backdropOpacity.value = withTiming(0, { duration: d });
    translateX.value = withTiming(panelWidth, { duration: d }, (finished) => {
      if (finished) runOnJS(onClose)?.();
    });
  }, [translateX, backdropOpacity, onClose, onAnimateUnderlayToZero, isClosing]);

  const runOpenAnimation = useCallback(() => {
    entranceDone.value = false;
    isClosing.value = false;
    translateX.value = panelWidth;
    backdropOpacity.value = 0;
    setPanKey((k) => k + 1);
    const d = PANEL_ANIMATION_DURATION_MS;
    requestAnimationFrame(() => {
      translateX.value = withTiming(0, { duration: d });
      backdropOpacity.value = withTiming(1, { duration: d }, (finished) => {
        if (finished) {
          entranceDone.value = true;
          runOnJS(onTranslateX)?.(-UNDERLAY_OFFSET_LEFT_PX);
        }
      });
    });
  }, [translateX, backdropOpacity, onTranslateX, entranceDone, isClosing]);

  useEffect(() => {
    if (visible) runOpenAnimation();
  }, [visible, runOpenAnimation]);

  const panGesture = useRef(
    Gesture.Pan()
      .activeOffsetX([-20, 20])
      .failOffsetY([-15, 15])
      .onUpdate((e) => {
        if (e.translationX > 0) {
          translateX.value = e.translationX;
          if (entranceDone.value && !isClosing.value) {
            const ux = Math.min(0, -UNDERLAY_OFFSET_LEFT_PX + e.translationX * UNDERLAY_FOLLOW_FACTOR);
            runOnJS(onTranslateX)?.(ux);
          }
        }
      })
      .onEnd(() => {
        const x = translateX.value;
        if (x > DRAG_CLOSE_THRESHOLD) {
          runOnJS(runCloseAnimation)();
        } else {
          translateX.value = withTiming(0, { duration: PANEL_ANIMATION_DURATION_MS });
          runOnJS(onTranslateX)?.(-UNDERLAY_OFFSET_LEFT_PX);
        }
      })
  ).current;

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const panelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleBackdropPress = useCallback(() => {
    runCloseAnimation();
  }, [runCloseAnimation]);

  const handleCloseButton = useCallback(() => {
    runCloseAnimation();
  }, [runCloseAnimation]);

  if (!visible) return null;

  const headerHeight = isFrameMode ? frameModeStyles.header?.height : 48;
  const headerBtnStyle = isFrameMode ? frameModeStyles.headerBtn : undefined;
  const headerTitleStyle = isFrameMode ? frameModeStyles.headerTitle : undefined;
  const content = (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.background, width: panelWidth }]}>
      <View style={[styles.header, { height: headerHeight, borderBottomColor: colors.borderLight, backgroundColor: colors.surface }]}>
        <TouchableOpacity style={[styles.headerBtn, headerBtnStyle]} onPress={handleCloseButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={isFrameMode ? 22 : 28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, headerTitleStyle, { color: colors.text }]}>Notifications</Text>
        <TouchableOpacity
          style={[styles.headerBtn, headerBtnStyle]}
          onPress={() => onClearAll?.()}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={isFrameMode ? 18 : 24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24, paddingLeft: isFrameMode ? 14 : 16, paddingRight: 16 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={refreshIndicatorColor}
            colors={[refreshIndicatorColor]}
            progressBackgroundColor={Platform.OS === 'android' ? colors.surface : undefined}
            progressViewOffset={insets.top + headerHeight + 24}
          />
        }
      >
        {sections.map((section, si) => (
          <View key={si} style={styles.section}>
            {section.dateLabel ? (
              <Text style={[styles.sectionTitle, isFrameMode && frameModeStyles.text, { color: colors.text }]}>{section.dateLabel}</Text>
            ) : (
              <SkeletonGroup show={true}>
                <SkeletonBox style={styles.sectionTitleSkeleton} backgroundColor={colors.skeletonBg} />
              </SkeletonGroup>
            )}
            {Array.from({ length: section.itemCount }).map((_, i) => (
              <View key={i} style={[styles.row, { borderBottomColor: colors.borderLight, marginBottom: isFrameMode ? 12 : 18, alignItems: 'flex-start', alignSelf: 'flex-start', width: '100%' }]}>
                <SkeletonGroup show={true}>
                  <View style={[styles.avatarWrap, isFrameMode && { width: 36, height: 36, borderRadius: 18 }]}>
                    <SkeletonBox style={[styles.avatarPlaceholder, isFrameMode && { width: 36, height: 36, borderRadius: 18 }]} backgroundColor={colors.skeletonBg} radius="round" />
                  </View>
                  <View style={[styles.textBlock, isFrameMode && { flex: 1, maxWidth: '100%', alignSelf: 'stretch' }]}>
                    <SkeletonBox style={[styles.notifBodySkeleton, isFrameMode && { width: '75%', height: 12 }]} backgroundColor={colors.skeletonBg} />
                    <SkeletonBox style={[styles.notifTimeSkeleton, isFrameMode && { width: 40, height: 10 }]} backgroundColor={colors.skeletonBg} />
                  </View>
                </SkeletonGroup>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress} pointerEvents="box-only">
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]} pointerEvents="none" />
      </Pressable>
      <GestureDetector key={panKey} gesture={panGesture}>
        <Animated.View
          style={[
            styles.panel,
            { backgroundColor: colors.surface, width: panelWidth },
            panelAnimatedStyle,
          ]}
        >
          {content}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  panel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: FALLBACK_WIDTH,
  },
  root: {
    flex: 1,
    width: FALLBACK_WIDTH,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
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
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionTitleSkeleton: {
    width: 100,
    height: 16,
    borderRadius: 8,
    marginBottom: 14,
  },
  notifBodySkeleton: {
    width: '80%',
    height: 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  notifTimeSkeleton: {
    width: 50,
    height: 12,
    borderRadius: 8,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    marginRight: 14,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '600',
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  bodyText: {
    fontSize: 15,
    marginBottom: 2,
  },
  userName: {
    fontWeight: '700',
  },
  actionText: {
    fontWeight: '400',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '400',
  },
});
