import { StyleSheet } from 'react-native';

const CARD_BORDER_RADIUS = 14;

export default StyleSheet.create( {
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderRadius: CARD_BORDER_RADIUS,
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CARD_BORDER_RADIUS,
    overflow: 'hidden',
  },
  imageSkeleton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
} );
