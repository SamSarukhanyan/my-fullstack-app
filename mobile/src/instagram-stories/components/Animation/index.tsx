import React, { FC, memo } from 'react';
import { Platform } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { HEIGHT, WIDTH } from '../../core/constants';
import { AnimationProps } from '../../core/dto/componentsDTO';
import AnimationStyles from './Animation.styles';

const StoryAnimation: FC<AnimationProps> = ( { children, x, index, contentHeight } ) => {

  const angleMax = Math.PI / 7;
  const angleMin = Math.PI / 7;
  const ratio = Platform.OS === 'ios' ? 2 : 1.2;
  const offset = WIDTH * index;
  const inputRange = [ offset - WIDTH, offset + WIDTH ];
  const maskInputRange = [ offset - WIDTH, offset, offset + WIDTH ];

  const animatedStyle = useAnimatedStyle( () => {
    const base = Math.floor( x.value / WIDTH ) * WIDTH;
    const progress = ( x.value - base ) / WIDTH;
    const currentAngle = interpolate(
      progress,
      [ 0, 0.5, 1 ],
      [ angleMax, angleMin, angleMax ],
      Extrapolation.CLAMP,
    );

    const translateX = interpolate(
      x.value,
      inputRange,
      [ WIDTH / ratio, -WIDTH / ratio ],
      Extrapolation.CLAMP,
    );

    const rotateY = interpolate( x.value, inputRange, [ currentAngle, -currentAngle ], Extrapolation.CLAMP );

    const alpha = Math.abs( rotateY );
    const gamma = currentAngle - alpha;
    const beta = Math.PI - alpha - gamma;
    const w = WIDTH / 2 - ( WIDTH / 2 * ( Math.sin( gamma ) / Math.sin( beta ) ) );
    const translateX1 = rotateY > 0 ? w : -w;
    return {
      transform: [
        { perspective: WIDTH },
        { translateX },
        { rotateY: `${rotateY}rad` },
        { translateX: translateX1 },
      ],
    };

  } );

  const maskAnimatedStyles = useAnimatedStyle( () => ( {
    opacity: interpolate( x.value, maskInputRange, [ 0.5, 0, 0.5 ], Extrapolation.CLAMP ),
  } ) );

  return (
    <Animated.View style={[ animatedStyle, AnimationStyles.container, AnimationStyles.cube ]}>
      {children}
      <Animated.View style={[ maskAnimatedStyles, AnimationStyles.absolute, { width: WIDTH, height: contentHeight ?? HEIGHT } ]} pointerEvents="none" />
    </Animated.View>
  );

};

export default memo( StoryAnimation );
