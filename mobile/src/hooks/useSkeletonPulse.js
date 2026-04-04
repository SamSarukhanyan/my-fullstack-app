import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/** Пульсирующая анимация для скелетонов. Возвращает Animated.Value (0.5..1). */
export function useSkeletonPulse() {
  const pulse = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.5,
          duration: 550,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return pulse;
}
