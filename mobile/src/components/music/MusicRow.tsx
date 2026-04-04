import React, { memo } from 'react';
import {
  Image, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DeviceTrack, formatMs, MusicPalette } from './types';

type MusicRowProps = {
  track: DeviceTrack;
  isActive: boolean;
  isPlaying: boolean;
  onPress: ( track: DeviceTrack ) => void;
  onLongPress?: ( track: DeviceTrack ) => void;
  showDeleteAction?: boolean;
  onDeletePress?: ( track: DeviceTrack ) => void;
  palette: MusicPalette;
};

const COVER_SIZE = 44;

const MusicRow = ( {
  track, isActive, isPlaying, onPress, onLongPress, showDeleteAction, onDeletePress, palette,
}: MusicRowProps ) => (
  <Pressable
    style={[ styles.row, { borderColor: palette.border }, isActive ? { backgroundColor: palette.activeRowBg } : undefined ]}
    android_ripple={{ color: palette.ripple }}
    onPress={() => onPress( track )}
    onLongPress={() => onLongPress?.( track )}
    delayLongPress={320}
  >
    <View style={[ styles.coverWrap, { backgroundColor: palette.coverBg } ]}>
      <Image source={{ uri: track.uri }} style={styles.cover} />
      <View style={[ styles.coverFallback, { backgroundColor: palette.coverOverlay } ]}>
        <Ionicons name="musical-notes" size={18} color={palette.textPrimary} />
      </View>
    </View>

    <View style={styles.meta}>
      <Text numberOfLines={1} style={[ styles.title, { color: palette.textPrimary } ]}>
        {track.title}
      </Text>
      <Text numberOfLines={1} style={[ styles.artist, { color: palette.textSecondary } ]}>
        {track.artist}
      </Text>
    </View>

    <View style={styles.rightBlock}>
      {showDeleteAction ? (
        <Pressable
          hitSlop={8}
          style={styles.deleteBtn}
          onPress={( e ) => {
            e.stopPropagation?.();
            onDeletePress?.( track );
          }}
        >
          <Ionicons name="trash-outline" size={18} color={palette.textPrimary} />
        </Pressable>
      ) : null}
      {isActive ? (
        <Ionicons
          name={isPlaying ? 'pause-circle' : 'play-circle'}
          size={18}
          color={palette.textPrimary}
          style={styles.playStateIcon}
        />
      ) : null}
      <Text style={[ styles.duration, { color: palette.textMuted } ]}>{formatMs( track.durationMs )}</Text>
    </View>
  </Pressable>
);

const styles = StyleSheet.create( {
  row: {
    height: 54,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  coverWrap: {
    width: COVER_SIZE,
    height: COVER_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1A1B1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cover: {
    ...StyleSheet.absoluteFillObject,
    width: COVER_SIZE,
    height: COVER_SIZE,
  },
  coverFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5,6,8,0.45)',
  },
  meta: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  title: {
    color: '#F5F6F8',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  artist: {
    marginTop: 2,
    color: '#9BA0A8',
    fontSize: 11,
    fontWeight: '500',
  },
  rightBlock: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 48,
  },
  deleteBtn: {
    marginBottom: 2,
  },
  playStateIcon: {
    marginBottom: 2,
  },
  duration: {
    color: '#B8BDC5',
    fontSize: 11,
    fontWeight: '600',
  },
} );

export default memo( MusicRow );
