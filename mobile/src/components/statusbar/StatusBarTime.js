import React, { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

/**
 * Time styled like the iPhone top status bar.
 * Used only in frame mode. Color follows the theme: dark text for light theme, light text for dark theme.
 */
export default function StatusBarTime() {
  const { theme, colors } = useTheme();
  const [time, setTime] = useState(() => getTimeString());

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeString()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Text style={[styles.time, { color: colors.text }]} numberOfLines={1}>
      {time}
    </Text>
  );
}

function getTimeString() {
  const d = new Date();
  const h = d.getHours();
  const m = d.getMinutes();
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  time: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginLeft: 25,
  },
});
