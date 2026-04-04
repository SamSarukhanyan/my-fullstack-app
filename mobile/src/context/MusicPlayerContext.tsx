import React, { createContext, useCallback, useContext, useState } from 'react';
import { DeviceTrack, MusicPalette } from '../components/music/types';

export type MusicPlayerState = {
  track: DeviceTrack | null;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  onTogglePlay: () => void;
  onClose: () => void;
  onNextTrack?: () => void;
  onSeek: ( ms: number ) => void;
  palette: MusicPalette;
};

const MusicPlayerContext = createContext<{
  state: MusicPlayerState | null;
  setPlayerState: ( s: MusicPlayerState | null ) => void;
} | null>( null );

export function MusicPlayerProvider( { children }: { children: React.ReactNode } ) {
  const [ state, setState ] = useState<MusicPlayerState | null>( null );
  const setPlayerState = useCallback( ( s: MusicPlayerState | null ) => setState( s ), [] );
  return (
    <MusicPlayerContext.Provider value={{ state, setPlayerState }}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayerContext() {
  const ctx = useContext( MusicPlayerContext );
  if ( !ctx ) throw new Error( 'useMusicPlayerContext must be used within MusicPlayerProvider' );
  return ctx;
}
