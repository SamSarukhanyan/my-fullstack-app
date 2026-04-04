import React from 'react';
import { StyleSheet } from 'react-native';
import { Skeleton } from 'moti/skeleton';
import { useTheme } from '../context/ThemeContext';

/** Skeleton.Group — для синхронной анимации нескольких скелетонов */
export const SkeletonGroup = Skeleton.Group;

/**
 * Общие props скелетона. translateX.duration — скорость бегущего градиента
 * (в moti build используется translateX с duration: 3000, тут 1000 = ~3× быстрее).
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
 * Обёртка над moti Skeleton с темой и общими стилями.
 * Обязательно оборачивать в SkeletonGroup для синхронной анимации.
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
