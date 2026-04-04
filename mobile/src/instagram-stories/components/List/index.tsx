import React, { FC, memo, useState } from 'react';
import Animated, {
  runOnJS, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming,
} from 'react-native-reanimated';
import StoryAnimation from '../Animation';
import ListStyles from './List.styles';
import StoryImage from '../Image';
import Progress from '../Progress';
import StoryHeader from '../Header';
import { StoryListProps } from '../../core/dto/componentsDTO';
import { HEIGHT } from '../../core/constants';
import StoryContent from '../Content';
import StoryFooter from '../Footer';

const StoryList: FC<StoryListProps> = ( {
  id, stories, index, contentHeight, x, swipeDownY, activeUser, activeStory, progress, seenStories, paused,
  onLoad, videoProps, progressColor, progressActiveColor, mediaContainerStyle, imageStyles,
  imageProps, progressContainerStyle, imageOverlayView, hideElements, hideOverlayViewOnLongPress,
  videoDuration, loaderColor, loaderBackgroundColor, onKeyboardShow, onKeyboardHide, ...props
} ) => {

  const imageHeight = useSharedValue( contentHeight ?? HEIGHT );
  const isActive = useDerivedValue( () => activeUser.value === id );

  const activeStoryIndex = useDerivedValue(
    () => stories.findIndex( ( item ) => item.id === activeStory.value ),
  );

  const animatedStyles = useAnimatedStyle( () => ( { height: imageHeight.value } ) );
  const contentStyles = useAnimatedStyle( () => ( {
    opacity: withTiming( hideElements.value ? 0 : 1 ),
  } ) );

  const [ lastSeenIdState, setLastSeenIdState ] = useState<string | undefined>( undefined );
  useAnimatedReaction( () => seenStories.value[id], ( v ) => runOnJS( setLastSeenIdState )( v ), [] );

  const onImageLayout = ( height: number ) => {

    imageHeight.value = contentHeight != null ? Math.min( height, contentHeight ) : height;

  };

  const lastSeenIndex = stories.findIndex(
    ( item ) => item.id === lastSeenIdState,
  );

  return (
    <StoryAnimation x={x} index={index} contentHeight={contentHeight}>
      <Animated.View style={[ animatedStyles, ListStyles.container ]}>
        <Animated.View style={[ ListStyles.cardInner, ListStyles.cardInnerGap ]}>
          <StoryImage
          stories={stories}
          activeStory={activeStory}
          defaultStory={stories[lastSeenIndex + 1] ?? stories[0]}
          isDefaultVideo={( stories[lastSeenIndex + 1]?.mediaType ?? stories[0]?.mediaType ) === 'video'}
          onImageLayout={onImageLayout}
          onLoad={onLoad}
          paused={paused}
          isActive={isActive}
          videoProps={videoProps}
          mediaContainerStyle={mediaContainerStyle}
          imageStyles={imageStyles}
          imageProps={imageProps}
          videoDuration={videoDuration}
          loaderColor={loaderColor}
          loaderBackgroundColor={loaderBackgroundColor}
        />
        <Animated.View
          style={[
            hideOverlayViewOnLongPress ? contentStyles : {},
            ListStyles.content,
          ]}
          pointerEvents="auto"
        >
          {imageOverlayView}
          <Animated.View style={[ contentStyles, ListStyles.content ]} pointerEvents="box-none">
            <Progress
              active={isActive}
              activeStory={activeStoryIndex}
              progress={progress}
              length={stories.length}
              progressColor={progressColor}
              progressActiveColor={progressActiveColor}
              progressContainerStyle={progressContainerStyle}
            />
            <StoryHeader {...props} />
            <StoryContent stories={stories} active={isActive} activeStory={activeStory} />
          </Animated.View>
        </Animated.View>
        </Animated.View>
      </Animated.View>
      <StoryFooter
        stories={stories}
        active={isActive}
        activeStory={activeStory}
        onKeyboardShow={onKeyboardShow}
        onKeyboardHide={onKeyboardHide}
        swipeDownY={swipeDownY}
      />
    </StoryAnimation>
  );

};

export default memo( StoryList );
