import React, { useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import { triggerTabHaptic } from '../utils/haptics';
import { useTheme } from '../context/ThemeContext';
import { useViewport } from '../context/ViewportContext';
import { frameModeStyles } from './DeviceFrameWrapper';

const TABS = [
  { key: 'home', icon: 'home', iconOutline: 'home-outline' },
  { key: 'music', icon: 'musical-notes', iconOutline: 'musical-notes-outline' },
  { key: 'create', icon: 'add-circle', iconOutline: 'add-circle-outline' },
  { key: 'messages', icon: 'chatbubbles', iconOutline: 'chatbubbles-outline' },
  { key: 'profile', icon: 'person', iconOutline: 'person-outline' },
];

const TAB_BAR_HEIGHT = 28;
const ICON_SIZE = 22;
const ICON_SIZE_CENTER = 26;

const isIOS = Platform.OS === 'ios';

/** Fixed tab bar content height, excluding insets. */
export const TAB_BAR_FIXED_HEIGHT = TAB_BAR_HEIGHT;

/**
 * Bottom tab bar with 5 tabs. On iOS it uses native UIVisualEffectView blur (system materials).
 */
export default function AnimatedTabBar({ pageWidth, onTabPress, currentIndex }) {
  const insets = useSafeAreaInsets();
  const { theme, colors } = useTheme();
  const { isFrameMode } = useViewport();
  const activeIndex = Math.min(Math.max(0, currentIndex ?? 0), TABS.length - 1);
  const insetsBottom = insets.bottom || 0;

  const barHeight = isFrameMode ? frameModeStyles.tabBarHeight : TAB_BAR_HEIGHT;
  const iconSize = isFrameMode ? frameModeStyles.tabBarIconSize : ICON_SIZE;
  const iconSizeCenter = isFrameMode ? frameModeStyles.tabBarIconSizeCenter : ICON_SIZE_CENTER;

  // Scale used for the smooth active-icon animation
  const scalesRef = useRef(
    TABS.map((_, i) => new Animated.Value(i === activeIndex ? 1.14 : 1))
  );

  useEffect(() => {
    scalesRef.current.forEach((value, i) => {
      Animated.spring(value, {
        toValue: i === activeIndex ? 1.14 : 1,
        useNativeDriver: true,
        friction: 7,
        tension: 140,
      }).start();
    });
  }, [activeIndex]);

  // iOS: native blur materials (like the tab bar and Control Center)
  const blurTint = isIOS
    ? (theme === 'dark' ? 'systemThinMaterialDark' : 'systemThinMaterialLight')
    : theme === 'dark'
      ? 'dark'
      : 'light';
  const blurIntensity = isIOS ? 56 : 0;

  const overlayBg = colors.tabBarOverlay ?? (theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.12)');
  const borderColor = colors.tabBarBorder;
  const iconActiveColor = colors.iconActive;
  const iconInactiveColor = colors.iconInactive;

  const handleTabPress = (index) => {
    triggerTabHaptic();
    onTabPress(index);
  };

  return (
    <View
      style={[
        styles.container,
        isFrameMode && frameModeStyles.tabBar,
        {
          height: barHeight + insetsBottom,
          overflow: 'hidden',
        },
      ]}
    >
      <BlurView
        intensity={blurIntensity}
        tint={blurTint}
        style={[StyleSheet.absoluteFill, styles.blur]}
        pointerEvents="none"
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: overlayBg,
            borderWidth: 0.8,
            borderColor,
          },
          styles.overlay,
        ]}
        pointerEvents="none"
      />
      <View style={styles.contentWrap}>
        <View style={styles.tabRow}>
          {TABS.map((tab, index) => (
            <Pressable
              key={tab.key}
              style={[styles.tab, { flex: 1 }]}
              onPress={() => handleTabPress(index)}
              hitSlop={8}
            >
              <Animated.View
                style={{
                  transform: [{ scale: scalesRef.current[index] ?? 1 }],
                }}
              >
                <Ionicons
                  name={index === activeIndex ? tab.icon : tab.iconOutline}
                  size={index === 2 ? iconSizeCenter : iconSize}
                  color={index === activeIndex ? iconActiveColor : iconInactiveColor}
                />
              </Animated.View>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'stretch',
    justifyContent: 'center',
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  blur: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  overlay: {
    zIndex: 0,
    borderRadius: 999,
  },
  contentWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    zIndex: 1,
  },
  tabRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  tab: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
