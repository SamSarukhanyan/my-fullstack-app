import { Vibration, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Short haptic feedback when switching tabs (quick, light pulse).
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
