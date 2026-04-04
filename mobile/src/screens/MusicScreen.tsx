import React, {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import * as SecureStore from 'expo-secure-store';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MusicRow from '../components/music/MusicRow';
import { DeviceTrack, MusicPalette } from '../components/music/types';
import { useMusicPlayerContext } from '../context/MusicPlayerContext';
import { useTheme } from '../context/ThemeContext';
import { useViewport } from '../context/ViewportContext';
import { frameModeStyles } from '../components/DeviceFrameWrapper';
import { SkeletonBox, SkeletonGroup } from '../components/SkeletonBox';
import { useEarlyRefresh } from '../hooks/useEarlyRefresh';
import { getRefreshSpinnerColor } from '../theme';

import { Ionicons } from '@expo/vector-icons';
import MusicSearchInput from '../components/music/MusicSearchInput';
import SegmentedControl from '../components/music/SegmentedControl';
import MusicPager from '../components/music/MusicPager';
const PLAYER_HEIGHT_ESTIMATE = 82;
const UNKNOWN_ARTIST = 'Unknown Artist';
const TOTAL_ROWS = 8;
const TRACK_COVER_SIZE = 44;
const SEGMENT_OPTIONS = [ 'My Music', 'Follows', 'Recommendation' ];
/** Компактные размеры скелетонов строк только в frame mode (в рамке iPhone). */
const FRAME_TRACK_ROW_PADDING_V = 5;
const FRAME_TRACK_ROW_MARGIN_B = 3;
const FRAME_TRACK_ROW_MIN_H = 36;
const FRAME_TRACK_COVER_SIZE = 36;
const FRAME_TRACK_COVER_RADIUS = 6;
const FRAME_TRACK_COVER_MARGIN_R = 6;
const FRAME_TRACK_TITLE_W = 96;
const FRAME_TRACK_TITLE_H = 11;
const FRAME_TRACK_ARTIST_W = 64;
const FRAME_TRACK_ARTIST_H = 10;
const FRAME_TRACK_SKEL_RADIUS = 5;
const FRAME_TRACK_INFO_GAP = 4;
const TRACK_RIGHT_BTN_SIZE = 26;
const TRACK_RIGHT_BTN_GAP = 8;
const TRACK_RIGHT_DURATION_W = 32;
const TRACK_RIGHT_DURATION_H = 10;
const TRACK_RIGHT_MARGIN_LEFT = 12;
const FRAME_TRACK_RIGHT_BTN_SIZE = 20;
const FRAME_TRACK_RIGHT_BTN_GAP = 6;
const FRAME_TRACK_RIGHT_DURATION_W = 24;
const FRAME_TRACK_RIGHT_DURATION_H = 8;
const MUSIC_TRACKS_STORAGE_KEY = 'music_tracks_v1';
const MUSIC_TRACKS_STORAGE_CHUNK_COUNT_KEY = `${MUSIC_TRACKS_STORAGE_KEY}_chunk_count`;
const MUSIC_TRACKS_STORAGE_CHUNK_PREFIX = `${MUSIC_TRACKS_STORAGE_KEY}_chunk_`;
const SECURE_STORE_CHUNK_SIZE = 1500;
const isWeb = Platform.OS === 'web';

const toTrackId = ( uri: string, name: string ) => `${uri}::${name}`;

const getTrackTitleFromName = ( name: string ) => name.replace( /\.[^/.]+$/, '' ) || 'Untitled';

function normalizeTrack( item: any ): DeviceTrack | null {
  if ( !item || typeof item !== 'object' ) return null;
  const id = typeof item.id === 'string' ? item.id : null;
  const uri = typeof item.uri === 'string' ? item.uri : null;
  if ( !id || !uri ) return null;
  return {
    id,
    uri,
    filename: typeof item.filename === 'string' ? item.filename : 'track',
    title: typeof item.title === 'string' ? item.title : 'Untitled',
    artist: typeof item.artist === 'string' ? item.artist : UNKNOWN_ARTIST,
    durationMs: Number.isFinite( item.durationMs ) ? Number( item.durationMs ) : 0,
  };
}

async function loadStoredTracks(): Promise<DeviceTrack[]> {
  try {
    const raw = isWeb
      ? ( typeof localStorage !== 'undefined' ? localStorage.getItem( MUSIC_TRACKS_STORAGE_KEY ) : null )
      : await getStoredTracksPayloadNative();
    if ( !raw ) return [];
    const parsed = JSON.parse( raw );
    if ( !Array.isArray( parsed ) ) return [];
    return parsed
      .map( normalizeTrack )
      .filter( ( item ): item is DeviceTrack => !!item );
  } catch {
    return [];
  }
}

async function storeTracks( tracks: DeviceTrack[] ) {
  const payload = JSON.stringify(
    tracks.map( ( item ) => ( {
      id: item.id,
      uri: item.uri,
      filename: item.filename,
      title: item.title,
      artist: item.artist,
      durationMs: item.durationMs || 0,
    } ) ),
  );
  try {
    if ( isWeb && typeof localStorage !== 'undefined' ) {
      localStorage.setItem( MUSIC_TRACKS_STORAGE_KEY, payload );
      return;
    }
    await storeTracksNative( payload );
  } catch {
    // Ignore storage write errors to keep playback UX uninterrupted.
  }
}

async function getStoredTracksPayloadNative(): Promise<string | null> {
  const legacyValue = await SecureStore.getItemAsync( MUSIC_TRACKS_STORAGE_KEY );
  if ( legacyValue ) return legacyValue;

  const chunkCountRaw = await SecureStore.getItemAsync( MUSIC_TRACKS_STORAGE_CHUNK_COUNT_KEY );
  const chunkCount = Number( chunkCountRaw );
  if ( !Number.isInteger( chunkCount ) || chunkCount <= 0 ) return null;

  const chunks = await Promise.all(
    Array.from( { length: chunkCount }, ( _, index ) => SecureStore.getItemAsync( `${MUSIC_TRACKS_STORAGE_CHUNK_PREFIX}${index}` ) ),
  );
  if ( chunks.some( ( chunk ) => typeof chunk !== 'string' ) ) return null;

  return chunks.join( '' );
}

async function clearChunkedTracksStorage() {
  const chunkCountRaw = await SecureStore.getItemAsync( MUSIC_TRACKS_STORAGE_CHUNK_COUNT_KEY );
  const chunkCount = Number( chunkCountRaw );
  if ( !Number.isInteger( chunkCount ) || chunkCount <= 0 ) {
    await SecureStore.deleteItemAsync( MUSIC_TRACKS_STORAGE_CHUNK_COUNT_KEY );
    return;
  }

  await Promise.all(
    Array.from( { length: chunkCount }, ( _, index ) => SecureStore.deleteItemAsync( `${MUSIC_TRACKS_STORAGE_CHUNK_PREFIX}${index}` ) ),
  );
  await SecureStore.deleteItemAsync( MUSIC_TRACKS_STORAGE_CHUNK_COUNT_KEY );
}

async function storeTracksNative( payload: string ) {
  if ( payload.length <= SECURE_STORE_CHUNK_SIZE ) {
    await clearChunkedTracksStorage();
    await SecureStore.setItemAsync( MUSIC_TRACKS_STORAGE_KEY, payload );
    return;
  }

  const previousChunkCountRaw = await SecureStore.getItemAsync( MUSIC_TRACKS_STORAGE_CHUNK_COUNT_KEY );
  const previousChunkCount = Number( previousChunkCountRaw );
  const chunkCount = Math.ceil( payload.length / SECURE_STORE_CHUNK_SIZE );
  await SecureStore.setItemAsync( MUSIC_TRACKS_STORAGE_CHUNK_COUNT_KEY, String( chunkCount ) );

  const chunks = Array.from( { length: chunkCount }, ( _, index ) => {
    const start = index * SECURE_STORE_CHUNK_SIZE;
    const end = start + SECURE_STORE_CHUNK_SIZE;
    return payload.slice( start, end );
  } );
  await Promise.all(
    chunks.map( ( chunk, index ) => SecureStore.setItemAsync( `${MUSIC_TRACKS_STORAGE_CHUNK_PREFIX}${index}`, chunk ) ),
  );

  if ( Number.isInteger( previousChunkCount ) && previousChunkCount > chunkCount ) {
    await Promise.all(
      Array.from( { length: previousChunkCount - chunkCount }, ( _, index ) => (
        SecureStore.deleteItemAsync( `${MUSIC_TRACKS_STORAGE_CHUNK_PREFIX}${chunkCount + index}` )
      ) ),
    );
  }

  await SecureStore.deleteItemAsync( MUSIC_TRACKS_STORAGE_KEY );
}

type MusicScreenProps = {
  onBack?: () => void;
};

export default function MusicScreen( { onBack }: MusicScreenProps ) {
  const { width: VIEWPORT_WIDTH, height: SCREEN_HEIGHT, isFrameMode } = useViewport();
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const refreshIndicatorColor = theme === 'dark' ? '#F4F7FF' : '#465fff';
  const headerBorderColor = theme === 'dark' ? colors.divider : colors.borderLight;
  const headerBackgroundColor = colors.surfaceElevated;
  const headerBorderWidth = StyleSheet.hairlineWidth;
  const { setPlayerState } = useMusicPlayerContext();
  const spinnerColor = colors.refreshSpinner || getRefreshSpinnerColor( theme );
  const player = useAudioPlayer();
  const playerStatus = useAudioPlayerStatus( player );

  const [ tracks, setTracks ] = useState<DeviceTrack[]>( [] );
  const [ importing, setImporting ] = useState( false );
  const [ currentTrackId, setCurrentTrackId ] = useState<string | null>( null );
  const [ deleteArmedTrackId, setDeleteArmedTrackId ] = useState<string | null>( null );
  const [ searchQuery, setSearchQuery ] = useState( '' );
  const [ segmentIndex, setSegmentIndex ] = useState( 0 );
  const [ storageHydrated, setStorageHydrated ] = useState( false );

  const refreshCallback = useCallback( async () => {
    await new Promise( ( resolve ) => setTimeout( resolve, 400 ) );
  }, [] );
  const { refreshing, onRefresh } = useEarlyRefresh( refreshCallback, 28 );

  const palette = useMemo<MusicPalette>( () => {
    const dark = theme === 'dark';
    return {
      screenBg: colors.background,
      cardBg: dark ? '#1B1F27' : '#FFFFFF',
      coverBg: colors.surfaceElevated,
      coverOverlay: dark ? 'rgba(0,0,0,0.34)' : 'rgba(255,255,255,0.42)',
      textPrimary: colors.text,
      textSecondary: colors.textSecondary,
      textMuted: colors.textMuted,
      border: colors.borderLight,
      activeRowBg: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.045)',
      progressTrack: dark ? '#323843' : '#DEE3EA',
      progressFill: colors.primary,
      actionBg: colors.primary,
      actionText: '#FFFFFF',
      ripple: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    };
  }, [ colors, theme ] );

  const currentTrack = useMemo( () => tracks.find( ( item ) => item.id === currentTrackId ) ?? null, [ currentTrackId, tracks ] );
  const isPlaying = !!playerStatus.playing;
  const durationMs = Math.max(
    0,
    Math.floor( ( playerStatus.duration ?? 0 ) * 1000 ) || currentTrack?.durationMs || 0,
  );
  const positionMs = Math.max( 0, Math.floor( ( playerStatus.currentTime ?? 0 ) * 1000 ) );

  const safePause = useCallback( () => {
    try { player.pause(); } catch { /* NativeSharedObjectNotFoundException when player disposed */ }
  }, [ player ] );

  const safeSeekTo = useCallback( ( pos: number ) => {
    try { player.seekTo( pos ); } catch { /* NativeSharedObjectNotFoundException when player disposed */ }
  }, [ player ] );

  const mergeTracks = useCallback( ( incoming: DeviceTrack[] ) => {
    setTracks( ( prev ) => {
      if ( incoming.length === 0 ) return prev;
      const byId = new Map<string, DeviceTrack>();
      prev.forEach( ( item ) => byId.set( item.id, item ) );
      incoming.forEach( ( item ) => byId.set( item.id, item ) );
      return Array.from( byId.values() );
    } );
  }, [] );

  const importTracksFromDevice = useCallback( async () => {
    setImporting( true );
    try {
      const result = await DocumentPicker.getDocumentAsync( {
        type: [ 'audio/*' ],
        multiple: true,
        copyToCacheDirectory: true,
      } );
      if ( result.canceled ) return;
      const imported = result.assets
        .filter( ( asset ) => asset.uri )
        .map( ( asset ) => {
          const title = getTrackTitleFromName( asset.name ?? 'Untitled' );
          return {
            id: toTrackId( asset.uri, asset.name ?? 'track' ),
            uri: asset.uri,
            filename: asset.name ?? title,
            title,
            artist: UNKNOWN_ARTIST,
            durationMs: 0,
          } satisfies DeviceTrack;
        } );
      mergeTracks( imported );
    } catch {
      Alert.alert( 'Import failed', 'Could not open file picker. Please try again.' );
    } finally {
      setImporting( false );
    }
  }, [ mergeTracks ] );

  const playTrack = useCallback( async ( track: DeviceTrack ) => {
    setDeleteArmedTrackId( null );
    try {
      if ( currentTrackId !== track.id ) {
        player.replace( { uri: track.uri } );
        setCurrentTrackId( track.id );
        safeSeekTo( 0 );
        player.play();
        return;
      }
      if ( playerStatus.playing ) {
        safePause();
      } else {
        const ended = playerStatus.duration > 0 && playerStatus.currentTime >= playerStatus.duration;
        if ( ended ) safeSeekTo( 0 );
        player.play();
      }
    } catch {
      Alert.alert( 'Playback error', 'Unable to play this track.' );
    }
  }, [ currentTrackId, player, playerStatus.currentTime, playerStatus.duration, playerStatus.playing, safePause, safeSeekTo ] );

  const togglePlayPause = useCallback( () => {
    if ( !currentTrack ) return;
    try {
      if ( playerStatus.playing ) safePause();
      else player.play();
    } catch { /* ignore */ }
  }, [ currentTrack, player, playerStatus.playing, safePause ] );

  const closePlayer = useCallback( () => {
    if ( currentTrack ) {
      safePause();
      safeSeekTo( 0 );
    }
    setCurrentTrackId( null );
    setPlayerState( null );
  }, [ currentTrack, safePause, safeSeekTo, setPlayerState ] );

  const handleTrackLongPress = useCallback( ( track: DeviceTrack ) => {
    setDeleteArmedTrackId( track.id );
  }, [] );

  const handleDeleteTrack = useCallback( ( track: DeviceTrack ) => {
    setTracks( ( prev ) => prev.filter( ( item ) => item.id !== track.id ) );
    setDeleteArmedTrackId( ( prev ) => ( prev === track.id ? null : prev ) );
    if ( currentTrackId === track.id ) {
      safePause();
      safeSeekTo( 0 );
      setCurrentTrackId( null );
      setPlayerState( null );
    }
  }, [ currentTrackId, safePause, safeSeekTo, setPlayerState ] );

  const playNextTrack = useCallback( () => {
    if ( tracks.length === 0 || !currentTrackId ) return;
    const idx = tracks.findIndex( ( t ) => t.id === currentTrackId );
    if ( idx < 0 || idx >= tracks.length - 1 ) return;
    const next = tracks[idx + 1];
    playTrack( next );
  }, [ tracks, currentTrackId, playTrack ] );

  const seekTo = useCallback( ( nextPositionMs: number ) => {
    if ( !currentTrack ) return;
    safeSeekTo( nextPositionMs / 1000 );
  }, [ currentTrack, safeSeekTo ] );

  useEffect( () => {
    setAudioModeAsync( {
      shouldPlayInBackground: false,
      playsInSilentMode: true,
      shouldRouteThroughEarpiece: false,
    } ).catch( () => undefined );
  }, [] );

  useEffect( () => {
    let mounted = true;
    ( async () => {
      const stored = await loadStoredTracks();
      if ( !mounted ) return;
      setTracks( stored );
      setStorageHydrated( true );
    } )();
    return () => {
      mounted = false;
    };
  }, [] );

  useEffect( () => {
    if ( !storageHydrated ) return;
    storeTracks( tracks );
  }, [ tracks, storageHydrated ] );

  useEffect( () => () => {
    safePause();
    safeSeekTo( 0 );
  }, [ player, safePause, safeSeekTo ] );

  useEffect( () => {
    if ( currentTrackId && currentTrack ) {
      setPlayerState( {
        track: currentTrack,
        isPlaying,
        positionMs,
        durationMs: durationMs || currentTrack.durationMs || 0,
        onTogglePlay: togglePlayPause,
        onClose: closePlayer,
        onNextTrack: playNextTrack,
        onSeek: seekTo,
        palette,
      } );
    } else {
      setPlayerState( null );
    }
  }, [
    currentTrackId,
    currentTrack,
    isPlaying,
    positionMs,
    durationMs,
    togglePlayPause,
    closePlayer,
    playNextTrack,
    seekTo,
    palette,
    setPlayerState,
  ] );

  useEffect( () => {
    if ( !currentTrackId || durationMs <= 0 ) return;
    setTracks( ( prev ) => prev.map(
      ( item ) => ( item.id === currentTrackId && item.durationMs === 0 ? { ...item, durationMs } : item ),
    ) );
  }, [ currentTrackId, durationMs ] );

  useEffect( () => {
    if ( !deleteArmedTrackId ) return;
    if ( tracks.some( ( item ) => item.id === deleteArmedTrackId ) ) return;
    setDeleteArmedTrackId( null );
  }, [ deleteArmedTrackId, tracks ] );

  const playerVisible = !!currentTrackId;
  const contentBottomPadding = playerVisible ? PLAYER_HEIGHT_ESTIMATE + 20 + insets.bottom : ( insets.bottom || 0 ) + 24;

  const filteredTracks = useMemo( () => {
    if ( !searchQuery.trim() ) return tracks;
    const q = searchQuery.trim().toLowerCase();
    return tracks.filter( ( t ) =>
      t.title.toLowerCase().includes( q ) || t.artist?.toLowerCase().includes( q ),
    );
  }, [ tracks, searchQuery ] );

  const renderMyMusic = useCallback( () => (
    <ScrollView
      style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            minHeight: SCREEN_HEIGHT - insets.top - 200 - ( insets.bottom || 0 ) + 80,
            flexGrow: 1,
            paddingBottom: contentBottomPadding,
            paddingTop: isFrameMode ? 10 : 16,
          },
        ]}
      showsVerticalScrollIndicator
      keyboardShouldPersistTaps="handled"
      bounces
      alwaysBounceVertical
      decelerationRate="normal"
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={refreshIndicatorColor}
            colors={[refreshIndicatorColor]}

          progressViewOffset={insets.top + 200}
        />
      }
    >
      <View style={styles.list}>
        {Array.from( { length: TOTAL_ROWS } ).map( ( _, i ) =>
          i < filteredTracks.length ? (
            <View key={filteredTracks[i].id} style={styles.listRow}>
              <MusicRow
                track={filteredTracks[i]}
                isActive={currentTrackId === filteredTracks[i].id}
                isPlaying={currentTrackId === filteredTracks[i].id && isPlaying}
                onPress={playTrack}
                onLongPress={handleTrackLongPress}
                showDeleteAction={deleteArmedTrackId === filteredTracks[i].id}
                onDeletePress={handleDeleteTrack}
                palette={palette}
              />
            </View>
          ) : (
            <View
              key={`skel-${i}`}
              style={[
                styles.trackRowSkeleton,
                { borderBottomColor: palette.border },
                isFrameMode && {
                  paddingVertical: FRAME_TRACK_ROW_PADDING_V,
                  marginBottom: FRAME_TRACK_ROW_MARGIN_B,
                  minHeight: FRAME_TRACK_ROW_MIN_H,
                },
              ]}
            >
              <SkeletonGroup show={true}>
                <View style={[ styles.trackCoverWrap, isFrameMode && { marginRight: FRAME_TRACK_COVER_MARGIN_R } ]}>
                  <SkeletonBox
                    style={[
                      styles.trackCoverSkeleton,
                      isFrameMode && {
                        width: FRAME_TRACK_COVER_SIZE,
                        height: FRAME_TRACK_COVER_SIZE,
                        borderRadius: FRAME_TRACK_COVER_RADIUS,
                      },
                    ]}
                    backgroundColor={colors.skeletonBg}
                  />
                </View>
                <View style={[ styles.trackInfoSkeleton, isFrameMode && { gap: FRAME_TRACK_INFO_GAP } ]}>
                  <SkeletonBox
                    style={[
                      styles.trackTitleSkeleton,
                      isFrameMode && {
                        width: FRAME_TRACK_TITLE_W,
                        height: FRAME_TRACK_TITLE_H,
                        borderRadius: FRAME_TRACK_SKEL_RADIUS,
                      },
                    ]}
                    backgroundColor={colors.skeletonBg}
                  />
                  <SkeletonBox
                    style={[
                      styles.trackArtistSkeleton,
                      isFrameMode && {
                        width: FRAME_TRACK_ARTIST_W,
                        height: FRAME_TRACK_ARTIST_H,
                        borderRadius: FRAME_TRACK_SKEL_RADIUS,
                      },
                    ]}
                    backgroundColor={colors.skeletonBg}
                  />
                </View>
                <View
                  style={[
                    styles.trackRightSkeleton,
                    isFrameMode && {
                      marginLeft: FRAME_TRACK_RIGHT_BTN_GAP,
                      gap: FRAME_TRACK_RIGHT_BTN_GAP,
                    },
                  ]}
                >
                  <SkeletonBox
                    style={[
                      styles.trackRightBtnSkeleton,
                      isFrameMode && {
                        width: FRAME_TRACK_RIGHT_BTN_SIZE,
                        height: FRAME_TRACK_RIGHT_BTN_SIZE,
                        borderRadius: FRAME_TRACK_RIGHT_BTN_SIZE / 2,
                      },
                    ]}
                    backgroundColor={colors.skeletonBg}
                    radius="round"
                  />
                  <SkeletonBox
                    style={[
                      styles.trackRightBtnSkeleton,
                      isFrameMode && {
                        width: FRAME_TRACK_RIGHT_BTN_SIZE,
                        height: FRAME_TRACK_RIGHT_BTN_SIZE,
                        borderRadius: FRAME_TRACK_RIGHT_BTN_SIZE / 2,
                      },
                    ]}
                    backgroundColor={colors.skeletonBg}
                    radius="round"
                  />
                  <SkeletonBox
                    style={[
                      styles.trackRightDurationSkeleton,
                      isFrameMode && {
                        width: FRAME_TRACK_RIGHT_DURATION_W,
                        height: FRAME_TRACK_RIGHT_DURATION_H,
                        borderRadius: FRAME_TRACK_SKEL_RADIUS,
                      },
                    ]}
                    backgroundColor={colors.skeletonBg}
                  />
                </View>
              </SkeletonGroup>
            </View>
          ),
        )}
      </View>
    </ScrollView>
  ), [
    filteredTracks,
    currentTrackId,
    isPlaying,
    deleteArmedTrackId,
    playTrack,
    handleTrackLongPress,
    handleDeleteTrack,
    palette,
    colors.skeletonBg,
    refreshing,
    onRefresh,
    spinnerColor,
    insets,
    contentBottomPadding,
    isFrameMode,
  ] );

  const renderPlaceholderPage = useCallback( ( title: string ) => (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        {
          minHeight: SCREEN_HEIGHT - insets.top - 200 - ( insets.bottom || 0 ) + 80,
          flexGrow: 1,
          paddingBottom: contentBottomPadding,
          paddingTop: isFrameMode ? 10 : 16,
        },
      ]}
      showsVerticalScrollIndicator
      bounces
      alwaysBounceVertical
    >
      <View style={styles.placeholderHeader}>
        <Text style={[ styles.placeholderTitle, { color: colors.textMuted } ]}>{title}</Text>
        <Text style={[ styles.placeholderSub, { color: colors.textMuted } ]}>Coming soon</Text>
      </View>
      <View style={styles.list}>
        {Array.from( { length: TOTAL_ROWS } ).map( ( _, i ) => (
          <View
            key={`skel-${title}-${i}`}
            style={[
              styles.trackRowSkeleton,
              { borderBottomColor: palette.border },
              isFrameMode && {
                paddingVertical: FRAME_TRACK_ROW_PADDING_V,
                marginBottom: FRAME_TRACK_ROW_MARGIN_B,
                minHeight: FRAME_TRACK_ROW_MIN_H,
              },
            ]}
          >
            <SkeletonGroup show={true}>
              <View style={[ styles.trackCoverWrap, isFrameMode && { marginRight: FRAME_TRACK_COVER_MARGIN_R } ]}>
                <SkeletonBox
                  style={[
                    styles.trackCoverSkeleton,
                    isFrameMode && {
                      width: FRAME_TRACK_COVER_SIZE,
                      height: FRAME_TRACK_COVER_SIZE,
                      borderRadius: FRAME_TRACK_COVER_RADIUS,
                    },
                  ]}
                  backgroundColor={colors.skeletonBg}
                />
              </View>
              <View style={[ styles.trackInfoSkeleton, isFrameMode && { gap: FRAME_TRACK_INFO_GAP } ]}>
                <SkeletonBox
                  style={[
                    styles.trackTitleSkeleton,
                    isFrameMode && {
                      width: FRAME_TRACK_TITLE_W,
                      height: FRAME_TRACK_TITLE_H,
                      borderRadius: FRAME_TRACK_SKEL_RADIUS,
                    },
                  ]}
                  backgroundColor={colors.skeletonBg}
                />
                <SkeletonBox
                  style={[
                    styles.trackArtistSkeleton,
                    isFrameMode && {
                      width: FRAME_TRACK_ARTIST_W,
                      height: FRAME_TRACK_ARTIST_H,
                      borderRadius: FRAME_TRACK_SKEL_RADIUS,
                    },
                  ]}
                  backgroundColor={colors.skeletonBg}
                />
              </View>
              <View
                style={[
                  styles.trackRightSkeleton,
                  isFrameMode && {
                    marginLeft: FRAME_TRACK_RIGHT_BTN_GAP,
                    gap: FRAME_TRACK_RIGHT_BTN_GAP,
                  },
                ]}
              >
                <SkeletonBox
                  style={[
                    styles.trackRightBtnSkeleton,
                    isFrameMode && {
                      width: FRAME_TRACK_RIGHT_BTN_SIZE,
                      height: FRAME_TRACK_RIGHT_BTN_SIZE,
                      borderRadius: FRAME_TRACK_RIGHT_BTN_SIZE / 2,
                    },
                  ]}
                  backgroundColor={colors.skeletonBg}
                  radius="round"
                />
                <SkeletonBox
                  style={[
                    styles.trackRightBtnSkeleton,
                    isFrameMode && {
                      width: FRAME_TRACK_RIGHT_BTN_SIZE,
                      height: FRAME_TRACK_RIGHT_BTN_SIZE,
                      borderRadius: FRAME_TRACK_RIGHT_BTN_SIZE / 2,
                    },
                  ]}
                  backgroundColor={colors.skeletonBg}
                  radius="round"
                />
                <SkeletonBox
                  style={[
                    styles.trackRightDurationSkeleton,
                    isFrameMode && {
                      width: FRAME_TRACK_RIGHT_DURATION_W,
                      height: FRAME_TRACK_RIGHT_DURATION_H,
                      borderRadius: FRAME_TRACK_SKEL_RADIUS,
                    },
                  ]}
                  backgroundColor={colors.skeletonBg}
                />
              </View>
            </SkeletonGroup>
          </View>
        ) )}
      </View>
    </ScrollView>
  ), [
    palette.screenBg,
    palette.border,
    colors.textMuted,
    colors.skeletonBg,
    insets,
    contentBottomPadding,
    isFrameMode,
  ] );

  const renderFriendsMusic = useCallback( () => renderPlaceholderPage( 'Follows' ), [ renderPlaceholderPage ] );
  const renderRecommendations = useCallback( () => renderPlaceholderPage( 'Recommendation' ), [ renderPlaceholderPage ] );

  return (
    <View style={[ styles.root, { backgroundColor: palette.screenBg, paddingTop: insets.top } ]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <View
        style={[
          styles.header,
          isFrameMode && frameModeStyles.header,
          {
            height: isFrameMode ? 32 : 48,
            borderBottomColor: headerBorderColor,
            backgroundColor: headerBackgroundColor,
            borderBottomWidth: headerBorderWidth,
          },
        ]}
      >
        <TouchableOpacity style={[ styles.headerBtn, isFrameMode && frameModeStyles.headerBtn ]} onPress={() => onBack?.()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={isFrameMode ? 22 : 28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[ styles.headerTitle, isFrameMode && frameModeStyles.headerTitle, { color: colors.text } ]}>Music</Text>
        <TouchableOpacity style={[ styles.headerBtn, isFrameMode && frameModeStyles.headerBtn ]} onPress={importTracksFromDevice} disabled={importing} activeOpacity={0.7}>
          {importing ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Ionicons name="add" size={24} color={colors.text} />
          )}
        </TouchableOpacity>
      </View>

      <View style={[ styles.searchWrap, { paddingHorizontal: isFrameMode ? 12 : 20, paddingTop: 8, paddingBottom: 4 } ]}>
        <MusicSearchInput
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search music"
          glassBackground
        />
      </View>

      <View style={[ styles.segmentWrap, { paddingTop: 4, paddingBottom: 8 }, isFrameMode && { paddingHorizontal: 8, borderRadius: 20, overflow: 'hidden' } ]}>
        <SegmentedControl
          options={SEGMENT_OPTIONS}
          selectedIndex={segmentIndex}
          onIndexChange={setSegmentIndex}
          width={isFrameMode && VIEWPORT_WIDTH != null ? VIEWPORT_WIDTH - 16 : undefined}
          labelFontSize={isFrameMode ? 11 : undefined}
          height={isFrameMode ? 36 : undefined}
          borderRadius={isFrameMode ? 18 : undefined}
        />
      </View>

      <MusicPager
        currentIndex={segmentIndex}
        onIndexChange={setSegmentIndex}
        renderPage0={renderMyMusic}
        renderPage1={renderFriendsMusic}
        renderPage2={renderRecommendations}
        pageBackgroundColor={palette.screenBg}
      />
    </View>
  );
}

const styles = StyleSheet.create( {
  root: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    minWidth: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  searchWrap: {
    width: '100%',
  },
  segmentWrap: {
    width: '100%',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 16,
  },
  list: {
    paddingBottom: 8,
  },
  listRow: {
    marginBottom: 5,
  },
  trackRowSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: TRACK_COVER_SIZE + 12,
  },
  trackCoverWrap: {
    marginRight: 10,
  },
  trackCoverSkeleton: {
    width: TRACK_COVER_SIZE,
    height: TRACK_COVER_SIZE,
    borderRadius: 8,
  },
  trackInfoSkeleton: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  trackTitleSkeleton: {
    width: 120,
    height: 14,
    borderRadius: 6,
  },
  trackArtistSkeleton: {
    width: 80,
    height: 12,
    borderRadius: 6,
  },
  trackRightSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: TRACK_RIGHT_MARGIN_LEFT,
    gap: TRACK_RIGHT_BTN_GAP,
  },
  trackRightBtnSkeleton: {
    width: TRACK_RIGHT_BTN_SIZE,
    height: TRACK_RIGHT_BTN_SIZE,
    borderRadius: TRACK_RIGHT_BTN_SIZE / 2,
  },
  trackRightDurationSkeleton: {
    width: TRACK_RIGHT_DURATION_W,
    height: TRACK_RIGHT_DURATION_H,
    borderRadius: 6,
  },
  placeholderHeader: {
    paddingTop: 2,
    paddingBottom: 10,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  placeholderSub: {
    fontSize: 14,
  },
} );
