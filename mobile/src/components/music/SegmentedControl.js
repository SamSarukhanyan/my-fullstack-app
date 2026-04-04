import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { triggerTabHaptic } from '../../utils/haptics';

const INTERNAL_PADDING = 20;
const ANIMATION_DURATION = 200;
/** Внутренний отступ текста от краёв ячейки (слева и справа), чтобы не прилипал к активному фону. */
const LABEL_PADDING_H = 8;

/**
 * Segmented control — переключатель вкладок с анимированным ползунком.
 * Синхронизируется с внешним pager (tap → страница, swipe → индикатор).
 * Если передан width — используется он (для frame mode); иначе useWindowDimensions.
 */
export default function SegmentedControl({
  options,
  selectedIndex,
  onIndexChange,
  width: controlledWidth,
  labelFontSize,
  height,
  borderRadius,
}) {
  const { width: windowWidth } = useWindowDimensions();
  const { colors } = useTheme();

  const segmentedControlWidth = controlledWidth ?? windowWidth;
  const itemWidth = (segmentedControlWidth - INTERNAL_PADDING) / options.length;
  const controlHeight = height ?? 48;
  const controlBorderRadius = borderRadius ?? 12;

  const rStyle = useAnimatedStyle(() => {
    return {
      left: withTiming(
        itemWidth * selectedIndex + INTERNAL_PADDING / 2,
        { duration: ANIMATION_DURATION },
      ),
    };
  }, [selectedIndex, itemWidth]);

  const handlePress = (index) => {
    if (index === selectedIndex) return;
    triggerTabHaptic();
    onIndexChange?.(index);
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: segmentedControlWidth,
          height: controlHeight,
          backgroundColor: colors.surfaceElevated || colors.inputBg,
          borderRadius: controlBorderRadius,
        },
      ]}
    >
      <View style={[styles.row, { paddingHorizontal: INTERNAL_PADDING / 2 }]}>
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.activeBox,
            {
              width: itemWidth,
              backgroundColor: colors.surface,
              borderRadius: Math.max(4, controlBorderRadius - 2),
            },
            rStyle,
          ]}
        />
        {options.map((label, index) => (
          <View key={label} style={[styles.segmentCell, { width: itemWidth }]}>
            <TouchableOpacity
              onPress={() => handlePress(index)}
              activeOpacity={0.7}
              style={[styles.segmentTouch, { minHeight: controlHeight, paddingHorizontal: LABEL_PADDING_H }]}
            >
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.label,
                  labelFontSize != null && { fontSize: labelFontSize },
                  {
                    color: index === selectedIndex ? colors.iconActive : colors.textMuted,
                    fontWeight: index === selectedIndex ? '600' : '500',
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 48,
    alignSelf: 'center',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    position: 'relative',
  },
  activeBox: {
    position: 'absolute',
    height: '80%',
    top: '10%',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentCell: {
    flex: 1,
    alignSelf: 'stretch',
  },
  segmentTouch: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  label: {
    fontSize: 14,
  },
});
