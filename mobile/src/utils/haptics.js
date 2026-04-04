import { Vibration, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Короткий тактильный отклик при переключении табов (быстрый, лёгкий импульс).
 */
export function triggerTabHaptic() {
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8);
    return;
  }
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
    try {
      Vibration.vibrate(5);
    } catch (_) {}
  });
}
