import { StyleSheet, Platform } from 'react-native';

export default StyleSheet.create( {
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 32,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    overflow: 'visible',
  },
  keyboardDimOverlay: {
    position: 'absolute',
    left: -24,
    right: -24,
    top: -2000,
    bottom: -24,
    backgroundColor: '#000',
    zIndex: 0,
  },
  inputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  inputWrapper: {
    flex: 1,
    minHeight: 49,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.92)',
  },
  input: {
    flex: 1,
    minHeight: 49,
    paddingLeft: 18,
    paddingRight: 54,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    color: '#FFF',
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  sendWrapper: {
    width: 40,
    height: 49,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  iconSlot: {
    width: 49,
    overflow: 'hidden',
  },
  sendSlot: {
    width: 49,
    overflow: 'visible',
  },
  heartWrapper: {
    width: 49,
    height: 49,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  sendIcon: {
    zIndex: 1,
  },
} );
