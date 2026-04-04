import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const BAR_WIDTH = 3;
const BAR_GAP = 1;
const BAR_HEIGHTS = [4, 6, 8, 10];
const BATTERY_WIDTH = 26;
const BATTERY_HEIGHT = 13;
const BATTERY_BORDER_RADIUS = 3;
const BATTERY_PADDING_H = 6;
const BATTERY_PADDING_V = 2;
const BATTERY_CAP_WIDTH = 2;
const BATTERY_CAP_HEIGHT = 4;
const BATTERY_CAP_GAP = 2;
const BATTERY_CAP_RADIUS = 2;

/**
 * Правая часть статус-бара iPhone: антенна (4 столбца), 5G, батарея с процентом.
 * Только для режима рамки. Цвета от темы: светлая — тёмные иконки, тёмная — светлые.
 */
export default function StatusBarRight({ batteryPercent = 83 }) {
  const { colors, theme } = useTheme();
  const color = colors.text;
  const batteryBg = theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)';
  const batteryFillColor = theme === 'dark' ? '#fff' : '#000';
  const batteryPercentColor = theme === 'dark' ? colors.background : '#fff';

  const clampedPercent = Math.min(100, Math.max(0, batteryPercent));

  return (
    <View style={styles.row}>
      {/* Сигнал — 4 столбца с уклоном вправо, как на iPhone */}
      <View style={styles.signalWrap}>
        {BAR_HEIGHTS.map((h, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                width: BAR_WIDTH,
                height: h,
                marginRight: i < BAR_HEIGHTS.length - 1 ? BAR_GAP : 0,
                backgroundColor: color,
                borderRadius: BAR_WIDTH / 2,
              },
            ]}
          />
        ))}
      </View>

      {/* 5G */}
      <Text style={[styles.cellularLabel, { color }]}>5G</Text>

      {/* Батарея: заливка белым = ровно clampedPercent% от ширины блока (математически). */}
      <View style={styles.batteryWrap}>
        <View style={[styles.batteryBody, { backgroundColor: batteryBg }]}>
          <View style={styles.batteryFillTrack} pointerEvents="none">
            <View
              style={[
                styles.batteryFill,
                {
                  width: `${clampedPercent}%`,
                  backgroundColor: batteryFillColor,
                  borderTopLeftRadius: BATTERY_BORDER_RADIUS,
                  borderBottomLeftRadius: BATTERY_BORDER_RADIUS,
                },
              ]}
            />
          </View>
          <View style={styles.batteryPercentCenter} pointerEvents="none">
            <Text style={[styles.batteryPercentInside, { color: batteryPercentColor }]}>{clampedPercent}</Text>
          </View>
        </View>
        <View style={[styles.batteryCap, { backgroundColor: clampedPercent >= 100 ? batteryFillColor : batteryBg, marginLeft: BATTERY_CAP_GAP }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 70,
    height: 30,
    gap: 4.4,
    borderRadius: 10,
    marginRight: 6,
  },
  signalWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 9,
  },
  bar: {
    borderWidth: 0.1,
  },
  cellularLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  batteryWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryBody: {
    minWidth: BATTERY_WIDTH-4,
    height: BATTERY_HEIGHT-2,
    paddingHorizontal: BATTERY_PADDING_H,
    paddingVertical: BATTERY_PADDING_V,
    borderRadius: BATTERY_BORDER_RADIUS+1,
    overflow: 'hidden',
    marginRight: -1.3,


  },
  /** Полная ширина блока (left–right) — от неё считается процент заливки. */
  batteryFillTrack: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  },
  batteryFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  batteryPercentCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  
    
  },
  batteryPercentInside: {
    fontSize: 9.2,
    fontWeight: '700',
  },
  batteryCap: {
    width: BATTERY_CAP_WIDTH-0.5,
    height: BATTERY_CAP_HEIGHT,
   borderTopRightRadius: 40,
   borderBottomRightRadius: 40,
   

  },
});
