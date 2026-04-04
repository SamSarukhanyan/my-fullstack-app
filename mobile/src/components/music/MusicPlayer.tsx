import React, { memo, useState, useEffect, useRef } from 'react';
import {
  LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View, Animated, Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { DeviceTrack, formatMs, MusicPalette } from './types';
import { useTheme } from '../../context/ThemeContext';
import { useViewport } from '../../context/ViewportContext';
import { frameModeStyles } from '../DeviceFrameWrapper';

const SLIDE_DURATION_MS = 260;
const PLAYER_HEIGHT_EST = 70;
/** Фиксированный отступ для открытия: не зависим от onLayout, чтобы не было дёргания при первом измерении. */
const SLIDE_OFFSET_OPEN = 120;

type MusicPlayerProps = {
  visible: boolean;
  track: DeviceTrack | null;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  onTogglePlay: () => void;
  onClose: () => void;
  onNextTrack?: () => void;
  onSeek: ( positionMs: number ) => void;
  palette: MusicPalette;
};

const MusicPlayer = ( {
  visible,
  track,
  isPlaying,
  positionMs,
  durationMs,
  onTogglePlay,
  onClose,
  onNextTrack,
  onSeek,
  palette,
}: MusicPlayerProps ) => {

  const { colors, theme } = useTheme();
  const { isFrameMode } = useViewport();
  const isIOS = Platform.OS === 'ios';
  const iconSize = isFrameMode ? frameModeStyles.playerIconSize : 26;
  const iconBtnStyle = isFrameMode ? frameModeStyles.playerIconBtn : { width: 36, height: 36 };
  const trackTitleFs = isFrameMode ? frameModeStyles.playerTrackTitleFontSize : 13;
  const timeFs = isFrameMode ? frameModeStyles.playerTimeFontSize : 11;
  const blurTint = isIOS
    ? (theme === 'dark' ? 'systemThinMaterialDark' : 'systemThinMaterialLight')
    : theme === 'dark'
      ? 'dark'
      : 'light';
  const blurIntensity = isIOS ? 70 : 0;
  const overlayBg = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.12)';
  const borderColor = theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)';
  const [ progressWidth, setProgressWidth ] = useState( 0 );
  const [ measuredHeight, setMeasuredHeight ] = useState( PLAYER_HEIGHT_EST );
  const [ displayPlaying, setDisplayPlaying ] = useState( isPlaying );
  const translateY = useRef( new Animated.Value( SLIDE_OFFSET_OPEN ) ).current;

  useEffect( () => {
    setDisplayPlaying( isPlaying );
  }, [ isPlaying ] );

  useEffect( () => {
    if ( visible && track ) {
      translateY.setValue( SLIDE_OFFSET_OPEN );
      Animated.timing( translateY, {
        toValue: 0,
        duration: SLIDE_DURATION_MS,
        useNativeDriver: true,
        easing: Easing.bezier( 0.25, 0.1, 0.25, 1 ),
      } ).start();
    }
  }, [ visible, !!track, translateY ] );

  const handleClose = () => {
    Animated.timing( translateY, {
      toValue: measuredHeight,
      duration: SLIDE_DURATION_MS,
      useNativeDriver: true,
      easing: Easing.bezier( 0.25, 0.1, 0.25, 1 ),
    } ).start( () => onClose() );
  };

  const handleRightAction = () => {
    if ( displayPlaying && onNextTrack ) onNextTrack();
    else handleClose();
  };

  const safeDuration = Math.max( durationMs, 1 );
  const safePosition = Math.min( Math.max( 0, positionMs ), safeDuration );
  const progressRatio = safePosition / safeDuration;
  const progressFillWidth = progressWidth > 0 ? progressWidth * progressRatio : 0;

  const onProgressLayout = ( e: LayoutChangeEvent ) => {

    const width = e.nativeEvent.layout.width;
    if ( width > 0 && width !== progressWidth ) {
      setProgressWidth( width );
    }

  };

  const onProgressPress = ( x: number ) => {

    if ( progressWidth <= 0 || durationMs <= 0 ) {
      return;
    }

    const ratio = Math.max( 0, Math.min( 1, x / progressWidth ) );
    onSeek( Math.floor( ratio * durationMs ) );

  };

  if ( !visible || !track ) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          transform: [ { translateY } ],
        },
      ]}
      onLayout={( e ) => {
        const h = e.nativeEvent.layout.height;
        if ( h > 0 ) setMeasuredHeight( h );
      }}
    >
      <View style={[ styles.playerCard, { overflow: 'hidden' } ]}>
        <BlurView
          intensity={blurIntensity}
          tint={blurTint}
          style={[ StyleSheet.absoluteFill, styles.blur ]}
          pointerEvents="none"
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: overlayBg, borderWidth: 1, borderColor },
            styles.overlay,
          ]}
          pointerEvents="none"
        />
        <View style={styles.playerContent}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => { /* add to playlist - future */ }} hitSlop={8} style={[styles.iconBtn, iconBtnStyle]}>
            <Ionicons name="add" size={iconSize} color={colors.text} />
          </Pressable>
          <View style={styles.trackMeta}>
            <Text numberOfLines={1} style={[ styles.trackTitle, { color: colors.text, fontSize: trackTitleFs } ]}>{track.title}</Text>
          </View>
          <View style={styles.controls}>
            <Pressable
              onPress={() => {
                setDisplayPlaying( ( p ) => !p );
                onTogglePlay();
              }}
              hitSlop={8}
              style={[styles.iconBtn, iconBtnStyle]}
            >
              <Ionicons name={displayPlaying ? 'pause' : 'play'} size={iconSize} color={colors.text} />
            </Pressable>
            <Pressable onPress={handleRightAction} hitSlop={8} style={[styles.iconBtn, iconBtnStyle]}>
              <Ionicons
                name={displayPlaying && onNextTrack ? 'play-skip-forward' : 'close'}
                size={iconSize}
                color={colors.text}
              />
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.progressTouch} onLayout={onProgressLayout} onPress={( e ) => onProgressPress( e.nativeEvent.locationX )}>
          <View style={[ styles.progressTrack, { backgroundColor: colors.border } ]}>
            <View style={[ styles.progressFill, { width: progressFillWidth, backgroundColor: colors.primary } ]} />
          </View>
        </Pressable>

        <View style={styles.timeRow}>
          <Text style={[ styles.timeText, { color: colors.textMuted, fontSize: timeFs } ]}>{formatMs( safePosition )}</Text>
          <Text style={[ styles.timeText, { color: colors.textMuted, fontSize: timeFs } ]}>{formatMs( durationMs )}</Text>
        </View>
        </View>
      </View>
    </Animated.View>
  );

};

const styles = StyleSheet.create( {
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  playerCard: {
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  blur: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  overlay: {
    zIndex: 0,
    borderRadius: 999,
  },
  playerContent: {
    position: 'relative',
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackMeta: {
    flex: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  trackTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTouch: {
    marginTop: 4,
  },
  progressTrack: {
    height: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    borderRadius: 999,
  },
  timeRow: {
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
  },
} );

export default memo( MusicPlayer );
