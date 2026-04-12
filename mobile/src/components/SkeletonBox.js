import React from 'react';
import { StyleSheet } from 'react-native';
import { Skeleton } from 'moti/skeleton';
import { useTheme } from '../context/ThemeContext';

/** Skeleton.Group keeps multiple skeleton animations synchronized. */
export const SkeletonGroup = Skeleton.Group;

/**
 * Shared skeleton props. translateX.duration controls the moving gradient speed
 * (the moti build uses translateX with duration: 3000; 1000 here is about 3x faster).
 */
const SKELETON_TRANSITION = {
  translateX: {
    type: 'timing',
    loop: true,
    delay: 200,
    duration: 1500,
  },
};

/**
 * Wrapper around moti Skeleton with theme support and shared styles.
 * Must be wrapped in SkeletonGroup for synchronized animation.
 */
export function SkeletonBox({ style, backgroundColor, radius, children, ...rest }) {
  const { theme, colors } = useTheme();
  const bg = backgroundColor ?? colors.skeletonBg;
  const colorMode = theme === 'dark' ? 'dark' : 'light';

  const flat = style != null ? StyleSheet.flatten(style) : {};
  const w = flat.width;
  const h = flat.height;
  const br = flat.borderRadius;
  const isRound = typeof w === 'number' && typeof h === 'number' && w === h && (br >= w / 2 || radius === 'round');
  const r = radius ?? (isRound ? 'round' : (typeof br === 'number' ? br : 8));

  return (
    <Skeleton
      colorMode={colorMode}
      colors={colors.skeletonShimmerColors}
      backgroundColor={bg}
      transition={SKELETON_TRANSITION}
      radius={r}
      width={typeof w === 'number' ? w : undefined}
      height={typeof h === 'number' ? h : undefined}
      style={style}
      {...rest}
    >
      {children ?? <></>}
    </Skeleton>
  );
}
