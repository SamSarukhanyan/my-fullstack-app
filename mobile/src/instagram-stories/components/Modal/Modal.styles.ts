import { StyleSheet } from 'react-native';
import { HEIGHT, WIDTH } from '../../core/constants';

export default StyleSheet.create( {
  container: {
    flex: 1,
    overflow: 'visible' as const,
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: WIDTH,
    height: HEIGHT,
    overflow: 'visible',
  },
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'visible' as const,
  },
  bgAnimation: StyleSheet.absoluteFillObject,
} );
