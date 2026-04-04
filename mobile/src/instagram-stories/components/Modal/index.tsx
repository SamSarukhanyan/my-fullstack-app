import React, {
  forwardRef, memo, useEffect, useImperativeHandle, useMemo, useRef, useState,
} from 'react';
import { GestureResponderEvent, Keyboard, Modal, Pressable, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation, interpolate, runOnJS, useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue, useSharedValue, withTiming,
} from 'react-native-reanimated';
import {
  HEIGHT, LONG_PRESS_DURATION, STORY_ANIMATION_DURATION, WIDTH,
} from '../../core/constants';
import { StoryModalProps, StoryModalPublicMethods } from '../../core/dto/componentsDTO';
import StoryList from '../List';
import ModalStyles from './Modal.styles';

const StoryModal = forwardRef<StoryModalPublicMethods, StoryModalProps>( ( {
  stories, seenStories, duration, videoDuration, storyAvatarSize, textStyle, containerStyle,
  backgroundColor, videoProps, closeIconColor, modalAnimationDuration = STORY_ANIMATION_DURATION,
  storyAnimationDuration = STORY_ANIMATION_DURATION, hideElementsOnLongPress, loopingStories = 'none',
  statusBarTranslucent, loaderColor, loaderBackgroundColor, onLoad, onShow, onHide,
  onSeenStoriesChange, onSwipeUp, onStoryStart, onStoryEnd, footerComponent, ...props
}, ref ) => {
  const contentHeight = HEIGHT;

  const cardWrapperStyle = {
    flex: 1,
  };
  const modalOuterStyle = {
    flex: 1,
  };

  const [ visible, setVisible ] = useState( false );

  const x = useSharedValue( 0 );
  const y = useSharedValue( 0 );
  const opacity = useSharedValue( 0 );
  const animation = useSharedValue( 0 );
  const currentStory = useSharedValue<string | undefined>( stories[0]?.stories[0]?.id );
  const paused = useSharedValue( false );
  const durationValue = useSharedValue( duration );
  const isLongPress = useSharedValue( false );
  const hideElements = useSharedValue( false );
  const lastViewed = useSharedValue<{ [key: string]:number }>( {} );
  const firstRender = useSharedValue( true );
  const gestureStartX = useSharedValue( 0 );
  const gestureVertical = useSharedValue( false );
  const gestureMoving = useSharedValue( false );
  const gestureUserId = useSharedValue<string | undefined>( undefined );

  const SWIPE_SENSITIVITY = 1.28;
  const SWIPE_DOWN_SENSITIVITY = 0.85;
  const AUTO_NEXT_USER_ROTATION_DURATION = 280;
  const FADE_DURATION = 300;
  const userIndex = useDerivedValue( () => Math.round( x.value / WIDTH ) );
  const storyIndex = useDerivedValue( () => stories[userIndex.value]?.stories.findIndex(
    ( story ) => story.id === currentStory.value,
  ) );
  const userId = useDerivedValue<string | undefined>( () => stories[userIndex.value]?.id );
  const previousUserId = useDerivedValue<string | undefined>( () => stories[userIndex.value - 1]?.id );
  const nextUserId = useDerivedValue<string | undefined>( () => stories[userIndex.value + 1]?.id );
  const previousStory = useDerivedValue<string | undefined>( () => ( storyIndex.value !== undefined
    ? stories[userIndex.value]?.stories[storyIndex.value - 1]?.id
    : undefined ) );
  const nextStory = useDerivedValue<string | undefined>( () => ( storyIndex.value !== undefined
    ? stories[userIndex.value]?.stories[storyIndex.value + 1]?.id
    : undefined ) );

  const animatedStyles = useAnimatedStyle( () => ( {
    top: y.value,
    opacity: opacity.value,
  } ) );
  const backgroundAnimatedStyles = useAnimatedStyle( () => ( {
    opacity: opacity.value * interpolate( y.value, [ 0, HEIGHT ], [ 1, 0 ] ),
    backgroundColor,
  } ) );

  const onClose = () => {

    'worklet';

    cancelAnimation( animation );
    lastViewed.value = {};
    opacity.value = withTiming(
      0,
      { duration: FADE_DURATION },
      () => runOnJS( setVisible )( false ),
    );

  };

  const stopAnimation = () => {

    'worklet';

    cancelAnimation( animation );

  };

  const startAnimation = ( resume = false, newDuration?: number ) => {

    'worklet';

    if ( newDuration ) {

      durationValue.value = newDuration;

    } else {

      newDuration = durationValue.value;

    }

    if ( resume ) {

      newDuration -= animation.value * newDuration;

    } else {

      animation.value = 0;

      if ( userId.value !== undefined && currentStory.value !== undefined ) {

        runOnJS( onSeenStoriesChange )( userId.value, currentStory.value );

      }

      if ( userId.value !== undefined && storyIndex.value! >= 0 ) {

        lastViewed.value = { ...lastViewed.value, [userId.value]: storyIndex.value ?? 0 };

      }

    }

    animation.value = withTiming( 1, { duration: newDuration } );

  };

  const scrollTo = (
    id: string,
    animated = true,
    sameUser = false,
    previousUser?: string,
    index?: number,
    animationDuration = 220,
  ) => {

    'worklet';

    const newUserIndex = stories.findIndex( ( story ) => story.id === id );
    const newX = newUserIndex * WIDTH;

    x.value = animated
      ? withTiming( newX, { duration: animationDuration } )
      : newX;

    if ( sameUser ) {

      startAnimation( true );

      return;

    }

    if ( onStoryEnd && animated ) {

      runOnJS( onStoryEnd )( previousUser ?? userId.value, currentStory.value );

    }

    const newStoryIndex = lastViewed.value[id] !== undefined
      ? lastViewed.value[id]!
      : ( ( stories[newUserIndex]?.stories.findIndex(
        ( story ) => story.id === seenStories.value[id],
      ) ?? 0 ) + 1 );
    const userStories = stories[newUserIndex]?.stories;
    const newStory = userStories?.[index ?? newStoryIndex]?.id ?? userStories?.[0]?.id;
    currentStory.value = newStory;

    if ( onStoryStart ) {

      runOnJS( onStoryStart )( id, newStory );

    }

  };

  const toNextStory = ( value = true ) => {

    'worklet';

    if ( !value ) {

      return;

    }

    if ( !nextStory.value ) {

      if ( nextUserId.value ) {

        scrollTo( nextUserId.value, true, false, undefined, undefined, AUTO_NEXT_USER_ROTATION_DURATION );

      } else if ( stories[0]?.id && loopingStories === 'all' ) {

        scrollTo( stories[0].id, false );

      } else if ( userId.value && loopingStories === 'onlyLast' ) {

        scrollTo( userId.value, false, undefined, undefined, 0 );

      } else {

        onClose();

      }

    } else {

      if ( onStoryEnd ) {

        runOnJS( onStoryEnd )( userId.value, currentStory.value );

      }

      if ( onStoryStart ) {

        runOnJS( onStoryStart )( userId.value, nextStory.value );

      }

      animation.value = 0;
      currentStory.value = nextStory.value;

    }

  };

  const toPreviousStory = () => {

    'worklet';

    if ( !previousStory.value ) {

      if ( previousUserId.value ) {

        scrollTo( previousUserId.value );

      } else {

        return false;

      }

    } else {

      if ( onStoryEnd ) {

        runOnJS( onStoryEnd )( userId.value, currentStory.value );

      }

      if ( onStoryStart ) {

        runOnJS( onStoryStart )( userId.value, previousStory.value );

      }

      animation.value = 0;
      currentStory.value = previousStory.value;

    }

    return true;

  };

  const show = ( id: string ) => {

    setVisible( true );
    scrollTo( id, false );

  };

  const panGesture = useMemo( () => Gesture.Pan()
    .onBegin( () => {

      gestureStartX.value = x.value;
      gestureUserId.value = userId.value;
      paused.value = true;

    } )
    .onUpdate( ( e ) => {

      if ( gestureStartX.value === x.value
        && ( gestureVertical.value || ( Math.abs( e.velocityX ) < Math.abs( e.velocityY ) ) ) ) {

        gestureVertical.value = true;
        y.value = e.translationY * SWIPE_DOWN_SENSITIVITY;

      } else {

        gestureMoving.value = true;
        x.value = Math.max(
          0,
          Math.min( gestureStartX.value + -e.translationX * SWIPE_SENSITIVITY, WIDTH * ( stories.length - 1 ) ),
        );

      }

    } )
    .onEnd( ( e ) => {

      if ( gestureVertical.value ) {

        if ( e.translationY > 100 ) {

          onClose();

        } else {

          if ( e.translationY < -100 && onSwipeUp ) {

            runOnJS( onSwipeUp )(
              stories[userIndex.value]?.id,
              stories[userIndex.value]?.stories[storyIndex.value ?? 0]?.id,
            );

          }

          y.value = withTiming( 0 );
          startAnimation( true );

        }

      } else if ( gestureMoving.value ) {

        const diff = x.value - gestureStartX.value;
        let newX;

        if ( Math.abs( diff ) < WIDTH / 4 ) {

          newX = gestureStartX.value;

        } else {

          newX = diff > 0
            ? Math.ceil( x.value / WIDTH ) * WIDTH
            : Math.floor( x.value / WIDTH ) * WIDTH;

        }

        const newUserId = stories[Math.round( newX / WIDTH )]?.id;
        if ( newUserId !== undefined ) {

          scrollTo( newUserId, true, newUserId === gestureUserId.value, gestureUserId.value );

        }

      }

      gestureMoving.value = false;
      gestureVertical.value = false;
      gestureUserId.value = undefined;
      hideElements.value = false;
      paused.value = false;

    } ), [ stories ] );

  const onPressIn = () => {

    stopAnimation();
    paused.value = true;

  };

  const onLongPress = () => {

    isLongPress.value = true;
    hideElements.value = hideElementsOnLongPress ?? false;

  };

  const onPressOut = () => {

    if ( !isLongPress.value ) {

      return;

    }

    hideElements.value = false;
    isLongPress.value = false;
    paused.value = false;
    startAnimation( true );

  };

  const onPress = ( { nativeEvent: { locationX } }: GestureResponderEvent ) => {

    Keyboard.dismiss();

    if ( keyboardVisibleRef.current ) {
      return;
    }

    hideElements.value = false;

    if ( isLongPress.value ) {

      onPressOut();

      return;

    }

    if ( locationX < WIDTH / 2 ) {

      const success = toPreviousStory();

      if ( !success ) {

        startAnimation( true );

      }

    } else {

      toNextStory();

    }

    paused.value = false;

  };

  const [ currentStoryIdState, setCurrentStoryIdState ] = useState<string | undefined>( undefined );
  useAnimatedReaction( () => currentStory.value, ( v ) => runOnJS( setCurrentStoryIdState )( v ), [] );

  useImperativeHandle( ref, () => ( {
    show,
    hide: onClose,
    pause: () => {

      stopAnimation();
      paused.value = true;

    },
    resume: () => {

      startAnimation( true );
      paused.value = false;

    },
    isPaused: () => paused.value,
    getCurrentStory: () => ( { userId: userId.value, storyId: currentStory.value } ),
    goToPreviousStory: toPreviousStory,
    goToNextStory: toNextStory,
    goToSpecificStory: ( newUserId, index ) => scrollTo( newUserId, true, false, undefined, index ),
  } ), [] );

  const hasRenderedOnce = useRef( false );
  const pausedStoryRef = useRef<{ userId: string; storyId: string } | null>( null );
  const pausedAnimValueRef = useRef<number>( 0 );
  const lastLoadDurationRef = useRef<number | undefined>( undefined );
  const isResumingFromKeyboardRef = useRef( false );
  const keyboardVisibleRef = useRef( false );

  useEffect( () => {

    if ( visible ) {

      if ( currentStoryIdState !== undefined ) {

        onShow?.( currentStoryIdState );

      }
      onLoad?.();

      y.value = 0;
      opacity.value = withTiming( 1, { duration: FADE_DURATION } );

    } else if ( currentStoryIdState !== undefined && hasRenderedOnce.current ) {

      onHide?.( currentStoryIdState );

    }

    firstRender.value = false;
    hasRenderedOnce.current = true;

  }, [ visible, currentStoryIdState ] );

  useAnimatedReaction(
    () => animation.value,
    ( res, prev ) => res !== prev && toNextStory( res === 1 ),
    [],
  );

  return (
    <View>
      <Modal statusBarTranslucent={statusBarTranslucent} visible={visible} transparent animationType="none" testID="storyRNModal" onRequestClose={onClose}>
        <View style={modalOuterStyle}>
          <SafeAreaProvider>
            <GestureDetector gesture={panGesture}>
              <Animated.View style={ModalStyles.container} testID="storyModal">
                <Pressable
                  onPressIn={onPressIn}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  onPressOut={onPressOut}
                  delayLongPress={LONG_PRESS_DURATION}
                  style={ModalStyles.container}
                >
                  <Animated.View style={[ ModalStyles.bgAnimation, backgroundAnimatedStyles ]} />
                  <Animated.View style={[ ModalStyles.absoluteFill, animatedStyles, containerStyle, { zIndex: 1 } ]}>
                    <View style={cardWrapperStyle}>
                      {stories?.map( ( story, index ) => (
                      <StoryList
                        {...story}
                        index={index}
                        contentHeight={contentHeight}
                        x={x}
                        swipeDownY={y}
                        activeUser={userId}
                        activeStory={currentStory}
                        progress={animation}
                        seenStories={seenStories}
                        onClose={onClose}
                        onLoad={( value ) => {

                          onLoad?.();
                          const d = value !== undefined ? value : duration;
                          lastLoadDurationRef.current = d;
                          if ( !paused.value && !isResumingFromKeyboardRef.current ) {
                            startAnimation( undefined, d );
                          }

                        }}
                        avatarSize={storyAvatarSize}
                        textStyle={textStyle}
                        paused={paused}
                        videoProps={videoProps}
                        closeColor={closeIconColor}
                        hideElements={hideElements}
                        onKeyboardShow={() => {
                          keyboardVisibleRef.current = true;
                          stopAnimation();
                          pausedAnimValueRef.current = animation.value;
                          paused.value = true;
                          const uid = stories[Math.round( x.value / WIDTH )]?.id;
                          const sid = currentStory.value;
                          if ( uid && sid ) {
                            pausedStoryRef.current = { userId: uid, storyId: sid };
                          }
                        }}
                        onKeyboardHide={() => {
                          keyboardVisibleRef.current = false;
                          isResumingFromKeyboardRef.current = true;
                          const uid = stories[Math.round( x.value / WIDTH )]?.id;
                          const sid = currentStory.value;
                          const pausedData = pausedStoryRef.current;
                          pausedStoryRef.current = null;
                          const wasSame = pausedData
                            && pausedData.userId === uid
                            && pausedData.storyId === sid;
                          if ( wasSame ) {
                            const v = Math.min( 0.999, Math.max( 0, pausedAnimValueRef.current ) );
                            animation.value = v;
                            startAnimation( true );
                          } else {
                            startAnimation( false, lastLoadDurationRef.current ?? duration );
                          }
                          paused.value = false;
                          setTimeout( () => {
                            isResumingFromKeyboardRef.current = false;
                          }, 300 );
                        }}
                        videoDuration={videoDuration}
                        loaderColor={loaderColor}
                        loaderBackgroundColor={loaderBackgroundColor}
                        key={story.id}
                        {...props}
                      />
                      ) )}
                    </View>
                  </Animated.View>
                </Pressable>
                {footerComponent && footerComponent}
              </Animated.View>
            </GestureDetector>
          </SafeAreaProvider>
        </View>
      </Modal>
    </View>
  );

} );

export default memo( StoryModal );
