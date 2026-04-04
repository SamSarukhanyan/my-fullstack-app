/**
 * Единая палитра приложения. Только эти 10 цветов (от самого тёмного к самому светлому):
 * #1C232C #2E3948 #404F64 #516580 #637C9C #7F93AD #9BABBF #B7C3D1 #D3DAE3 #EFF2F5
 */

const P = {
  1: '#1C232C',
  2: '#2E3948',
  3: '#404F64',
  4: '#516580',
  5: '#637C9C',
  6: '#7F93AD',
  7: '#9BABBF',
  8: '#B7C3D1',
  9: '#D3DAE3',
  10: '#EFF2F5',
};
const SKELETON_BASE = '#2c2f36';
const INPUT_BG_BASE = '#25282d';
const INPUT_PLACEHOLDER_BASE = '#8f9299';
const LIGHT_INPUT_SURFACE = '#e2e2e2';
const LIGHT_PLACEHOLDER = '#7f848c';
const DARK_APP_BG = '#0d1015';

/** Светлая тема: фоны из светлой части палитры, текст из тёмной. */
export const lightColors = {
  background: '#f4f5f7',
  surface: '#f4f5f7',
  surfaceElevated: '#eef1f6',
  primary: '#5A5CFF',
  text: P[1],
  textSecondary: P[2],
  textMuted: P[4],
  border: 'rgba(28,35,44,0.10)',
  borderLight: 'rgba(28,35,44,0.08)',
  inputBg: LIGHT_INPUT_SURFACE,
  inputBorder: 'transparent',
  cardBg: '#f4f5f7',
  postCardBg: '#efefef',
  postCardBorder: 'transparent',
  tabBarBg: '#f4f5f7',
  tabBarBorder: 'rgba(28,35,44,0.12)',
  tabBarOverlay: 'rgba(255,255,255,0.10)',
  iconActive: P[4],
  iconInactive: P[5],
  skeletonBg: LIGHT_INPUT_SURFACE,
  skeletonShimmerColors: ['#e8e8e8', LIGHT_INPUT_SURFACE, '#d6d6d6', LIGHT_INPUT_SURFACE, '#e8e8e8', LIGHT_INPUT_SURFACE],
  skeletonTones: {
    root: LIGHT_INPUT_SURFACE,
    avatar: LIGHT_INPUT_SURFACE,
    name: LIGHT_INPUT_SURFACE,
    time: LIGHT_INPUT_SURFACE,
    desc1: LIGHT_INPUT_SURFACE,
    desc2: LIGHT_INPUT_SURFACE,
    image: LIGHT_INPUT_SURFACE,
    likedCircle: LIGHT_INPUT_SURFACE,
    likedCircleDark: LIGHT_INPUT_SURFACE,
    actionBar: LIGHT_INPUT_SURFACE,
    likedBy: LIGHT_INPUT_SURFACE,
    viewComments: LIGHT_INPUT_SURFACE,
  },
  placeholder: LIGHT_PLACEHOLDER,
  searchPlaceholder: LIGHT_PLACEHOLDER,
  overlay: P[1] + '99',
  divider: P[2] + '26',
  gridSkeleton: P[2] + '14',
  refreshSpinner: '#465fff',
  buttonPrimaryBg: '#465fff',
  buttonPrimaryGradientStart: '#33445E',
  buttonPrimaryGradientEnd: '#4A6386',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondaryBg: '#465fff',
  buttonSecondaryText: '#FFFFFF',
  buttonSecondaryBorder: 'transparent',
  buttonGhostText: '#5A5CFF',
};

/** Тёмная тема: фоны из тёмной части палитры, текст из светлой. */
export const darkColors = {
  background: DARK_APP_BG,
  surface: DARK_APP_BG,
  surfaceElevated: P[2],
  primary: '#7B88FF',
  text: P[10],
  textSecondary: P[8],
  textMuted: P[6],
  border: 'rgba(255,255,255,0.06)',
  borderLight: 'rgba(255,255,255,0.06)',
  inputBg: INPUT_BG_BASE,
  inputBorder: 'transparent',
  cardBg: DARK_APP_BG,
  postCardBg: 'transparent',
  postCardBorder: 'transparent',
  tabBarBg: DARK_APP_BG,
  tabBarBorder: P[10] + '1F',
  tabBarOverlay: P[10] + '0D',
  iconActive: P[10],
  iconInactive: P[8],
  skeletonBg: SKELETON_BASE,
  skeletonShimmerColors: ['#23262d', SKELETON_BASE, '#30343c', SKELETON_BASE, '#23262d', SKELETON_BASE],
  skeletonTones: {
    root: SKELETON_BASE,
    avatar: '#353942',
    name: SKELETON_BASE,
    time: SKELETON_BASE,
    desc1: SKELETON_BASE,
    desc2: SKELETON_BASE,
    image: '#353942',
    likedCircle: '#353942',
    likedCircleDark: '#252830',
    actionBar: '#353942',
    likedBy: SKELETON_BASE,
    viewComments: '#353942',
  },
  placeholder: INPUT_PLACEHOLDER_BASE,
  searchPlaceholder: INPUT_PLACEHOLDER_BASE,
  overlay: P[1] + 'cc',
  divider: P[4] + '26',
  gridSkeleton: P[3] + '14',
  refreshSpinner: '#FFFFFF',
  buttonPrimaryBg: '#465fff',
  buttonPrimaryGradientStart: '#2A364A',
  buttonPrimaryGradientEnd: '#405979',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondaryBg: '#465fff',
  buttonSecondaryText: P[10],
  buttonSecondaryBorder: 'transparent',
  buttonGhostText: '#7B88FF',
};

export function getRefreshSpinnerColor(theme) {
  if (theme === 'dark') return darkColors.refreshSpinner;
  if (theme === 'light') return lightColors.refreshSpinner;
  return darkColors.refreshSpinner;
}
