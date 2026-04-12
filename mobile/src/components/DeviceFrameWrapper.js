import React, { useState, useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  Pressable,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ViewportProvider } from '../context/ViewportContext';
import StatusBarTime from './statusbar/StatusBarTime';
import StatusBarRight from './statusbar/StatusBarRight';

const isIOS = Platform.OS === 'ios';

const FRAME_IMAGE = require('../../assets/ramka.png');

const MARGIN = 10;
const INSET = 32;
const BEZEL_COLOR = '#141A22';
/** Extra height for the frame and app container (like a tall iPhone screen), applied vertically only. */
const EXTRA_HEIGHT = 20;
/** How many px to reduce the frame width by (0 = full screen minus MARGIN). The frame stays centered. */
const WIDTH_REDUCE = 10;
/** Even black gap between the frame and the app screen. */
const APP_GAP = 10;
/** How many px to expand the app screen on each side inside the frame. */
const APP_SIDE_EXPAND_PX = 1;
/** Shared corner radius for the screen inside the frame. */
const APP_CORNER_RADIUS = 50;
/** Inner content inset from the appContainer edges so content does not touch the border. */
const APP_CONTENT_INSET = 2;

/** Single app container in frame mode with a single frame color so the boundaries stay visible. */
const APP_CONTAINER_BORDER = 'transparent';
const APP_CONTAINER_BG = 'transparent';

/**
 * Temporary wrapper: on iOS, an "iPhone frame" mode can be enabled for screenshots/videos.
 * The viewport keeps the same aspect ratio as the full screen, so all elements scale proportionally.
 * The frame is drawn on top, and the PNG center must stay transparent.
 */
export default function DeviceFrameWrapper({ children }) {
  const insets = useSafeAreaInsets();
  const [frameOn, setFrameOn] = useState(false);
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const toggleTop = insets.top + 8;

  const toggle = useCallback(() => {
    setFrameOn((v) => !v);
  }, []);

  if (!isIOS) {
    return <View style={styles.passthrough}>{children}</View>;
  }

  if (!frameOn) {
    return (
      <View style={styles.passthrough}>
        {children}
        <Pressable
          style={[styles.toggleBtn, { top: toggleTop }]}
          onPress={toggle}
          hitSlop={12}
          accessibilityLabel="Enable iPhone frame"
        >
          <Text style={styles.toggleLabel}>Frame</Text>
        </Pressable>
      </View>
    );
  }

  const fullWidth = screenWidth - 2 * MARGIN;
  const fullHeight = screenHeight - 2 * MARGIN + EXTRA_HEIGHT;
  const scaleFactor = WIDTH_REDUCE > 0 ? (fullWidth - WIDTH_REDUCE) / fullWidth : 1;
  const rectW = fullWidth - 2 * INSET;
  const rectH = fullHeight - 2 * INSET;
  /** Symmetric screen inside the frame with equal top, bottom, left, and right insets. */
  const contentW = rectW - 2 * APP_GAP + 54 + APP_SIDE_EXPAND_PX * 2;
  const contentH = rectH - 2 * APP_GAP-50;
  const appLeft = INSET + APP_GAP - 27.5 - APP_SIDE_EXPAND_PX;
  const appTop = INSET + APP_GAP+18;
  const appLeftPx = Math.round(appLeft);
  const appTopPx = Math.round(appTop);
  const appWidthPx = Math.round(contentW);
  const appHeightPx = Math.round(contentH);
  const innerW = Math.max(0, appWidthPx - 2 * APP_CONTENT_INSET);
  const innerH = Math.max(0, appHeightPx - 2 * APP_CONTENT_INSET);
  /** iPhone 14 reference (393x852 pt): 44pt status bar, 20pt horizontal insets, ~11pt vertical content padding. The left block (time) is shifted slightly right from the edge, similar to iPhone 17. */
  const REF_IPHONE_W = 393;
  const REF_IPHONE_H = 852;
  const REF_STATUS_BAR_H = 44;
  const REF_STATUS_H_PAD = 20;
  const REF_STATUS_LEFT_EXTRA = 8;
  const REF_STATUS_V_PAD = 11;
  const statusBarPaddingRight = Math.round(innerW * (REF_STATUS_H_PAD / REF_IPHONE_W));
  const statusBarPaddingLeft = Math.round(innerW * ((REF_STATUS_H_PAD + REF_STATUS_LEFT_EXTRA) / REF_IPHONE_W));
  const statusBarHeight = Math.round(innerH * (REF_STATUS_BAR_H / REF_IPHONE_H));
  const statusBarPaddingV = Math.round(innerH * (REF_STATUS_V_PAD / REF_IPHONE_H));
  /** Dynamic Island: width and height are slightly increased, based on the 393x852 reference. */
  const REF_DYNAMIC_ISLAND_W = 56 * 2.05;
  const REF_DYNAMIC_ISLAND_H = 34;
  const dynamicIslandW = Math.round(innerW * (REF_DYNAMIC_ISLAND_W / REF_IPHONE_W));
  const dynamicIslandH = Math.round(innerH * (REF_DYNAMIC_ISLAND_H / REF_IPHONE_H));
  const frameToggleTop = Math.max(2, INSET - 18);

  return (
    <View style={[styles.root, { backgroundColor: BEZEL_COLOR }]}>
      <View
        style={[
          styles.frameWrap,
          {
         
            position: 'absolute',
            left: MARGIN,
            top: MARGIN,
            width: fullWidth,
            height: fullHeight,
            transform: [{ scaleX: scaleFactor }],
          },
        ]}
      >
        <View
          style={[
            styles.appContainer,
            {
              position: 'absolute',
              borderRadius: APP_CORNER_RADIUS,
              left: appLeftPx,
              top: appTopPx,
              width: appWidthPx,
              height: appHeightPx,
              borderColor: APP_CONTAINER_BORDER,
              backgroundColor: APP_CONTAINER_BG,
              zIndex: 2100,
              overflow: 'hidden',
              borderTopLeftRadius: APP_CORNER_RADIUS,
              borderTopRightRadius: APP_CORNER_RADIUS,
              borderBottomLeftRadius: APP_CORNER_RADIUS,
              borderBottomRightRadius: APP_CORNER_RADIUS,
              borderCurve: 'continuous',
            },
          ]}
        >
          <ViewportProvider value={{ width: innerW, height: innerH, isFrameMode: true }}>
            <View
              style={[
                styles.appInner,
                {
                  width: innerW,
                  height: innerH,
                  margin: APP_CONTENT_INSET,
                  borderRadius: Math.max(0, APP_CORNER_RADIUS - APP_CONTENT_INSET),
                  overflow: 'hidden',
                  borderCurve: 'continuous',
                },
              ]}
            >
              <View style={[styles.statusBarContent, { width: innerW, height: innerH, }]}>{children}</View>
              <View
                style={[
                  styles.statusBarRow,
                  {
                    width: innerW,
                    minHeight: statusBarHeight,
                    paddingLeft: statusBarPaddingLeft,
                    paddingRight: statusBarPaddingRight,
                    paddingTop: statusBarPaddingV,
                    paddingBottom: statusBarPaddingV,
                  },
                ]}
                pointerEvents="none"
              >
                <StatusBarTime />
                <View
                  style={[
                    styles.dynamicIsland,
                    { width: dynamicIslandW, height: dynamicIslandH, borderRadius: dynamicIslandH / 2 },
                  ]}
                  pointerEvents="none"
                >
                  <View style={styles.dynamicIslandEyesWrap}>
                    <View style={styles.dynamicIslandLensWrap}>
                      <View style={styles.dynamicIslandLensOuter}>
                        <View style={styles.dynamicIslandLensRing}>
                          <View style={styles.dynamicIslandLensRing2}>
                            <View style={styles.dynamicIslandLensInner} />
                          </View>
                        </View>
                      </View>
                    </View>
                    <View style={styles.dynamicIslandLensWrap}>
                      <View style={styles.dynamicIslandLensOuter}>
                        <View style={styles.dynamicIslandLensRing}>
                          <View style={styles.dynamicIslandLensRing2}>
                            <View style={styles.dynamicIslandLensInner} />
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
                <StatusBarRight />
              </View>
            </View>
          </ViewportProvider>
        </View>
        <View style={[styles.frameOverlay, { width: fullWidth, height: fullHeight }]} pointerEvents="none">
          <Image
            source={FRAME_IMAGE}
            style={[styles.frameImageFill, { width: fullWidth, height: fullHeight }]}
          />
        </View>
        <View style={[styles.toggleBtnWrapFrame, { top: frameToggleTop }]} pointerEvents="box-none">
          <Pressable
            style={[styles.toggleBtn, styles.toggleBtnFrame]}
            onPress={toggle}
            hitSlop={12}
            accessibilityLabel="Disable iPhone frame"
          >
            <Text style={styles.toggleLabel}>Frame ON</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  passthrough: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  frameWrap: {
    overflow: 'hidden',

  },
  appContainer: {
    overflow: 'hidden',
  },
  appInner: {
    flex: 1,
  },
  statusBarRow: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  dynamicIsland: {
    backgroundColor: '#000',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  dynamicIslandEyesWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  dynamicIslandLensWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dynamicIslandLensOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 14, 32, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 22, 48, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dynamicIslandLensRing: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(8, 12, 28, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(14, 20, 42, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dynamicIslandLensRing2: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(6, 10, 24, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(12, 18, 38, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dynamicIslandLensInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(4, 6, 18, 0.16)',
  },
  statusBarContent: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  frameOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 2090,
  },
  frameImageFill: {
    position: 'absolute',
    left: 0,
    top: 0,
  
  },
  toggleBtnWrapFrame: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 8888820,
    elevation: 9999,
  },
  toggleBtn: {
    position: 'absolute',
    right: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 999,
  },
  toggleBtnFrame: {
    position: 'relative',
    right: undefined,
  },
  toggleLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

// Styles used only in "framed" mode (reduced view).
// All elements inside pages are reduced by 6-10 px; the page size itself stays unchanged.
// Used by: MainPager, AnimatedTabBar, HomeScreen, PostBlock, PostBlockSkeleton, MusicPlayer, and screens with headers.
//
// Dark-gray cards (5 pages): frame-only styles live in frameModeStyles.pageCard.
// Tweak borderRadius, backgroundColor (if you want a custom tone), and similar values here.
// -----------------------------------------------------------------------------
const _frameSheet = StyleSheet.create({
  page: {},
  pageGap: {},
  pageCard: {},
  tabBar: {},
  header: { height: 32 },
  headerBtn: { width: 28, height: 28 },
  headerTitle: { fontSize: 12, fontWeight: '600' },
  text: { fontSize: 12 },
  textSmall: { fontSize: 10 },
});

/** Bottom offset of the tab bar from the edge of the green container in frame mode. */
const FRAME_TAB_BAR_BOTTOM_PADDING = 8;
/** Side offsets of the tab bar from the green container boundaries (left and right). */
const FRAME_TAB_BAR_HORIZONTAL_PADDING = 12;

export const frameModeStyles = {
  ..._frameSheet,
  tabBarIconSize: 18,
  tabBarIconSizeCenter: 24,
  tabBarHeight: 16,
  tabBarBottomPadding: FRAME_TAB_BAR_BOTTOM_PADDING,
  tabBarHorizontalPadding: FRAME_TAB_BAR_HORIZONTAL_PADDING,
  playerWrapperHeight: 62,
  playerIconSize: 22,
  playerIconBtn: { width: 28, height: 28 },
  playerTrackTitleFontSize: 11,
  playerTimeFontSize: 10,
  homeReduce: 8,
  postAvatarSize: 38,
  postMainImageHeight: 178,
  postLikedAvatarSize: 14,
  postSkeletonNameBarHeight: 15,
  postSkeletonTimeBarHeight: 12,
  postSkeletonDescHeight: 12,
  postSkeletonLikedAvatarSize: 10,
  profileAvatarSize: 72,
  gridPaddingH: 12,
};
