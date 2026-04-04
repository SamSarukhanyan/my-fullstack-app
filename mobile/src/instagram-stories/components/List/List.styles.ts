import { StyleSheet } from 'react-native';
import { WIDTH } from '../../core/constants';

const CARD_BORDER_RADIUS = 14;

export default StyleSheet.create( {
  container: {
    width: WIDTH,
    position: 'relative' as const,
    overflow: 'visible' as const,
  },
  cardInner: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CARD_BORDER_RADIUS,
    overflow: 'hidden',
  },
  cardInnerGap: {
    bottom: 56,
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 3,
    borderRadius: CARD_BORDER_RADIUS,
    overflow: 'hidden',
  },
} );
