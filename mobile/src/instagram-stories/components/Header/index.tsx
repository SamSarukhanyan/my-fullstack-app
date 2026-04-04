import React, { FC, memo } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  Pressable, StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { WIDTH } from '../../core/constants';
import HeaderStyles from './Header.styles';
import { StoryHeaderProps } from '../../core/dto/componentsDTO';
import Close from '../Icon/close';

const StoryHeader: FC<StoryHeaderProps> = ( {
  avatarSource, name, onClose, avatarSize, textStyle, closeColor, headerStyle,
  headerContainerStyle, renderStoryHeader, onStoryHeaderPress,
} ) => {

  const styles = { width: avatarSize, height: avatarSize, borderRadius: avatarSize };
  const width = WIDTH - HeaderStyles.container.left * 2;

  if ( renderStoryHeader ) {

    return (
      <View
        style={[ HeaderStyles.container, { width }, headerContainerStyle ]}
      >
        {renderStoryHeader()}
      </View>
    );

  }

  return (
    <View style={[
      HeaderStyles.container, HeaderStyles.containerFlex,
      { width }, headerContainerStyle,
    ]}
    >
      <View style={[ HeaderStyles.glassWrapper, headerStyle ]}>
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
        <Pressable style={HeaderStyles.left} onPress={() => onStoryHeaderPress?.()}>
          <View style={[ HeaderStyles.avatar, { borderRadius: styles.borderRadius } ]}>
            {( avatarSource && ( avatarSource as { uri?: string } )?.uri ) ? (
              <Image source={avatarSource} style={styles} />
            ) : (
              <View style={[ styles, HeaderStyles.avatarSkeleton ]} />
            )}
          </View>
          {name ? (
            <Text style={[ textStyle, { color: '#FFF' } ]}>{name}</Text>
          ) : (
            <View style={[ HeaderStyles.nameSkeleton, { width: 72, height: 14 } ]} />
          )}
        </Pressable>
      </View>
      <TouchableOpacity
        onPress={onClose}
        hitSlop={16}
        testID="storyCloseButton"
        style={HeaderStyles.closeWrapper}
      >
        <Close color={closeColor} />
      </TouchableOpacity>
    </View>
  );

};

export default memo( StoryHeader );
