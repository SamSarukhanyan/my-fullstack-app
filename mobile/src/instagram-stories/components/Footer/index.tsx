import React, {
  FC, memo, useState, useMemo, useCallback, useEffect, useRef,
} from 'react';
import { View, TextInput, Pressable, Platform, Keyboard, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedRN, { runOnJS, useAnimatedReaction, useAnimatedStyle } from 'react-native-reanimated';
import { StoryContentProps } from '../../core/dto/componentsDTO';
import ContentStyles from './Footer.styles';

const KEYBOARD_ANIM_DURATION = 200;
const KEYBOARD_SHOW_INPUT_DURATION = 110;

const StoryFooter: FC<StoryContentProps> = ( { stories, active, activeStory, onKeyboardShow, onKeyboardHide, swipeDownY } ) => {

  const [ storyIndex, setStoryIndex ] = useState( 0 );
  const [ message, setMessage ] = useState( '' );
  const [ likedStories, setLikedStories ] = useState<Record<string, boolean>>( {} );
  const [ isActive, setIsActive ] = useState( false );
  const [ isKeyboardOpen, setIsKeyboardOpen ] = useState( false );
  const GAP_FROM_IMAGE = 40;
  const keyboardOffset = useRef( new Animated.Value( GAP_FROM_IMAGE ) ).current;
  const keyboardDimOpacity = useRef( new Animated.Value( 0 ) ).current;
  const keyboardUiProgress = useRef( new Animated.Value( 0 ) ).current;
  const currentStoryId = stories[storyIndex]?.id;

  const onChange = async () => {

    'worklet';

    const index = stories.findIndex( ( item ) => item.id === activeStory.value );
    if ( active.value && index >= 0 && index !== storyIndex ) {

      runOnJS( setStoryIndex )( index );

    }

  };

  useAnimatedReaction(
    () => active.value,
    ( res, prev ) => res !== prev && onChange(),
    [ onChange ],
  );

  useAnimatedReaction(
    () => activeStory.value,
    ( res, prev ) => res !== prev && onChange(),
    [ onChange ],
  );

  useAnimatedReaction(
    () => active.value,
    ( v ) => runOnJS( setIsActive )( v ),
    [],
  );

  const onSend = useCallback( () => {

    if ( !message.trim() ) return;
    setMessage( '' );

  }, [ message ] );

  const onToggleLike = useCallback( () => {

    if ( !currentStoryId ) return;

    setLikedStories( ( prev ) => ( {
      ...prev,
      [currentStoryId]: !prev[currentStoryId],
    } ) );

  }, [ currentStoryId ] );

  useEffect( () => {

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = ( e: { endCoordinates: { height: number } } ) => {

      if ( !isActive ) {
        return;
      }

      onKeyboardShow?.();
      setIsKeyboardOpen( true );

      const offset = Math.max( 0, e.endCoordinates.height - 16 );

      Animated.timing( keyboardOffset, {
        toValue: offset,
        duration: KEYBOARD_SHOW_INPUT_DURATION,
        useNativeDriver: false,
      } ).start();
      Animated.timing( keyboardDimOpacity, {
        toValue: 0.48,
        duration: KEYBOARD_ANIM_DURATION,
        useNativeDriver: false,
      } ).start();
      Animated.timing( keyboardUiProgress, {
        toValue: 1,
        duration: KEYBOARD_ANIM_DURATION,
        useNativeDriver: false,
      } ).start();

    };

    const onHide = () => {

      if ( !isActive ) {
        return;
      }

      Animated.timing( keyboardOffset, {
        toValue: GAP_FROM_IMAGE,
        duration: KEYBOARD_ANIM_DURATION,
        useNativeDriver: false,
      } ).start();
      Animated.timing( keyboardDimOpacity, {
        toValue: 0,
        duration: KEYBOARD_ANIM_DURATION,
        useNativeDriver: false,
      } ).start();
      Animated.timing( keyboardUiProgress, {
        toValue: 0,
        duration: KEYBOARD_ANIM_DURATION,
        useNativeDriver: false,
      } ).start();
      setIsKeyboardOpen( false );

      setTimeout( () => onKeyboardHide?.(), 120 );

    };

    const subShow = Keyboard.addListener( showEvent, onShow );
    const subHide = Keyboard.addListener( hideEvent, onHide );
    return () => {

      subShow.remove();
      subHide.remove();

    };

  }, [
    GAP_FROM_IMAGE,
    isActive,
    keyboardDimOpacity,
    keyboardOffset,
    keyboardUiProgress,
    onKeyboardHide,
    onKeyboardShow,
  ] );

  useEffect( () => {

    if ( isActive ) {
      return;
    }

    keyboardOffset.setValue( GAP_FROM_IMAGE );
    keyboardDimOpacity.setValue( 0 );
    keyboardUiProgress.setValue( 0 );
    setIsKeyboardOpen( false );

  }, [ GAP_FROM_IMAGE, isActive, keyboardDimOpacity, keyboardOffset, keyboardUiProgress ] );

  const footer = useMemo( () => stories[storyIndex]?.renderFooter?.(), [ storyIndex ] );
  const heartAnimatedStyle = {
    width: keyboardUiProgress.interpolate( {
      inputRange: [ 0, 1 ],
      outputRange: [ 49, 0 ],
    } ),
    marginLeft: keyboardUiProgress.interpolate( {
      inputRange: [ 0, 1 ],
      outputRange: [ 10, 0 ],
    } ),
    opacity: keyboardUiProgress.interpolate( {
      inputRange: [ 0, 1 ],
      outputRange: [ 1, 0 ],
    } ),
    transform: [ {
      scale: keyboardUiProgress.interpolate( {
        inputRange: [ 0, 1 ],
        outputRange: [ 1, 0.85 ],
      } ),
    } ],
  } as const;
  const sendAnimatedStyle = {
    width: keyboardUiProgress.interpolate( {
      inputRange: [ 0, 1 ],
      outputRange: [ 49, 0 ],
    } ),
    transform: [ {
      translateX: keyboardUiProgress.interpolate( {
        inputRange: [ 0, 1 ],
        outputRange: [ 0, -50 ],
      } ),
    } ],
  } as const;

  const swipeDownStyle = useAnimatedStyle(
    () => ( {
      transform: [ { translateY: swipeDownY?.value ?? 0 } ],
    } ),
    [ swipeDownY ],
  );

  return (
    <AnimatedRN.View style={[ ContentStyles.container, swipeDownStyle ]} pointerEvents="box-none">
      <Animated.View
        style={[
          ContentStyles.container,
          {
            bottom: keyboardOffset,
          },
        ]}
        pointerEvents="box-none"
      >
      <Animated.View
        pointerEvents="none"
        style={[ ContentStyles.keyboardDimOverlay, { opacity: keyboardDimOpacity } ]}
      />
      {footer}
      <View style={ContentStyles.inputRow}>
        <View style={ContentStyles.inputWrapper}>
          <TextInput
            style={ContentStyles.input}
            placeholder="Message..."
            placeholderTextColor="#8f9299"
            value={message}
            onChangeText={setMessage}
            editable={isActive}
          />
        </View>
        <Animated.View style={[ ContentStyles.iconSlot, heartAnimatedStyle ]}>
          <Pressable style={ContentStyles.heartWrapper} onPress={onToggleLike} disabled={isKeyboardOpen}>
            <Ionicons
              name={likedStories[currentStoryId ?? ''] ? 'heart' : 'heart-outline'}
              size={32}
              color={likedStories[currentStoryId ?? ''] ? '#FF5A7A' : 'rgba(255,255,255,0.88)'}
            />
          </Pressable>
        </Animated.View>
        <Animated.View style={[ ContentStyles.sendSlot, sendAnimatedStyle ]}>
          <Pressable style={ContentStyles.sendWrapper} onPress={onSend}>
            <Ionicons name="paper-plane" size={21} color="#FFF" style={ContentStyles.sendIcon} />
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
    </AnimatedRN.View>
  );

};

export default memo( StoryFooter );
