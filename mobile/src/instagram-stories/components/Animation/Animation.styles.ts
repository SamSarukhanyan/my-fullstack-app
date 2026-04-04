import { StyleSheet } from 'react-native';

export default StyleSheet.create( {
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'visible',
    marginTop: -20,
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cube: {
    justifyContent: 'center',
  },
} );
