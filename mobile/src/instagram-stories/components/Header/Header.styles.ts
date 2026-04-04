import { StyleSheet } from 'react-native';

export default StyleSheet.create( {
  container: {
    position: 'absolute',
    left: 16,
    top: 32,
  },
  containerFlex: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  glassWrapper: {
    overflow: 'hidden',
    borderRadius: 24,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  avatar: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    overflow: 'hidden',
  },
  avatarSkeleton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  nameSkeleton: {
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  closeWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
} );
