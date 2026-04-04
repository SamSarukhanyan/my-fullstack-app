import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

export default function GradientButton({
  onPress,
  disabled = false,
  activeOpacity = 0.85,
  style,
  gradientStyle,
  children,
}) {
  const { colors } = useTheme();
  const startColor = colors.buttonPrimaryGradientStart || colors.buttonPrimaryBg;
  const endColor = colors.buttonPrimaryGradientEnd || colors.buttonPrimaryBg;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={activeOpacity}
      style={[styles.root, style, disabled && styles.disabled]}
    >
      <LinearGradient
        colors={[startColor, endColor]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.gradientBg, gradientStyle]}
      />
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cacaca69',
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  disabled: {
    opacity: 0.55,
  },
});
