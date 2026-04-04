export type DeviceTrack = {
  id: string;
  uri: string;
  title: string;
  artist: string;
  durationMs: number;
  filename: string;
};

export type MusicPalette = {
  screenBg: string;
  cardBg: string;
  coverBg: string;
  coverOverlay: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  activeRowBg: string;
  progressTrack: string;
  progressFill: string;
  actionBg: string;
  actionText: string;
  ripple: string;
};

export const formatMs = ( ms: number ): string => {

  const totalSeconds = Math.max( 0, Math.floor( ms / 1000 ) );
  const minutes = Math.floor( totalSeconds / 60 );
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart( 2, '0' )}`;

};
