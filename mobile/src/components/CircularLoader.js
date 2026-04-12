import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  withRepeat,
  useAnimatedStyle,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

const SIZE = 22;
const STROKE_WIDTH = 2.5;
const R = (SIZE - STROKE_WIDTH) / 2;
const CX = SIZE / 2;
const CIRCLE_LENGTH = 2 * Math.PI * R;

/** Head (solid segment) plus tail (small cut segments): head gap piece gap piece... */
const HEAD_LEN = CIRCLE_LENGTH * 0.4;
const GAP_LEN = 5;
const PIECE_LEN = 3;
const TAIL = [GAP_LEN, PIECE_LEN, GAP_LEN, PIECE_LEN, GAP_LEN, PIECE_LEN];
const DASH_ARRAY = [HEAD_LEN, ...TAIL].join(' ');

export default function CircularLoader({ color, loop = false }) {
  const { colors } = useTheme();
  const resolvedColor = color ?? colors.refreshSpinner;
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (loop) {
      rotation.value = 0;
      rotation.value = withRepeat(
        withTiming(360, { duration: 600 }),
        -1,
        false
      );
    }
  }, [rotation, loop]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[styles.wrap, { width: SIZE, height: SIZE }]}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={CX}
            cy={CX}
            r={R}
            stroke={resolvedColor}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={DASH_ARRAY}
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
