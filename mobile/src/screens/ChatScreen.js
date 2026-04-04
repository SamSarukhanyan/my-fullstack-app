import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { SkeletonBox, SkeletonGroup } from '../components/SkeletonBox';
import { useViewport } from '../context/ViewportContext';
import { frameModeStyles } from '../components/DeviceFrameWrapper';

const { width: FALLBACK_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 48;
const CONTENT_PADDING_H = 16;
const FOOTER_INPUT_BAR_HEIGHT = 44;
const INPUT_BORDER_RADIUS = 24;
/** Отступ между нижним краем инпута и верхом клавиатуры (px). */
const KEYBOARD_INPUT_GAP_PX = 5;

/** Размеры и отступы скелетонов — точная копия All Messages (MessagesScreen): две строки — короткая и длинная. */
const CHAT_SKELETON_LINE1_WIDTH = 90;
const CHAT_SKELETON_LINE1_HEIGHT = 14;
const CHAT_SKELETON_LINE1_MARGIN_BOTTOM = 8;
const CHAT_SKELETON_LINE2_WIDTH = 140;
const CHAT_SKELETON_LINE2_HEIGHT = 12;
const CHAT_SKELETON_LINE2_MARGIN_TOP = 2;
const CHAT_SKELETON_BORDER_RADIUS = 8;
const CHAT_SKELETON_BODY_GAP = 4;
const CHAT_SKELETON_MESSAGE_MARGIN_BOTTOM = 14;
/** Фейковые сообщения: у каждого две строки (line1Width, line2Width), isSender — слева/справа. Размеры как в Chats. */
const CHAT_SKELETON_MESSAGES = [
  { isSender: false, line1Width: 90, line2Width: 140 },
  { isSender: true, line1Width: 70, line2Width: 120 },
  { isSender: false, line1Width: 85, line2Width: 130 },
  { isSender: true, line1Width: 75, line2Width: 115 },
  { isSender: false, line1Width: 80, line2Width: 135 },
  { isSender: true, line1Width: 65, line2Width: 110 },
  { isSender: false, line1Width: 88, line2Width: 138 },
  { isSender: true, line1Width: 72, line2Width: 125 },
];

/**
 * Экран одного чата (Conversation): шапка (назад | имя | Last seen), лента сообщений (пока скелетоны), нижняя панель ввода.
 * По макету Figma CHAT 375×812: отправитель слева (teal), получатель справа (светло-серый), даты по центру.
 * Сделано под последующее подключение API: скелетоны — фиксированное место под реальные сообщения.
 */
/** Подложка смещена влево при открытом чате — край экрана в середине avatar (44px). */
const UNDERLAY_OFFSET_LEFT_PX = 44;
const UNDERLAY_FOLLOW_FACTOR = 0.28;
const DRAG_CLOSE_THRESHOLD = 80;
/** Свайп с правого края влево: макс. сдвиг 56px, тугая резина (сложнее тянуть). */
const LEFT_RUBBER_BAND_MAX_PX = 56;
const PANEL_OPEN_DURATION_MS = 260;
const PANEL_CLOSE_DURATION_MS = 260;

export default function ChatScreen({ visible, contact, onClose, onTranslateX, onAnimateUnderlayTo, onAnimateUnderlayToZero }) {
  const insets = useSafeAreaInsets();
  const { width: viewportWidth, isFrameMode } = useViewport();
  const panelWidth = viewportWidth ?? FALLBACK_WIDTH;
  const { colors, theme } = useTheme();
  const skelBg = theme === 'dark' ? (colors.skeletonTones?.desc2 ?? colors.skeletonBg) : colors.skeletonBg;
  const skelSenderBg = theme === 'dark' ? (colors.skeletonTones?.desc1 ?? colors.skeletonBg) : colors.skeletonBg;
  const headerBorderColor = theme === 'dark' ? colors.borderLight : colors.border;
  const headerBackgroundColor = theme === 'dark' ? colors.surface : colors.surfaceElevated;
  const [inputText, setInputText] = useState('');
  const translateX = useRef(new Animated.Value(panelWidth)).current;
  const panelAnimationRef = useRef(null);
  const dragRef = useRef(0);
  const isClosingRef = useRef(false);
  const entranceDoneRef = useRef(false);
  const keyboardFooterTranslateY = useRef(new Animated.Value(0)).current;
  const keyboardSpacerHeight = useRef(new Animated.Value(0)).current;
  const keyboardFooterPaddingBottom = useRef(new Animated.Value(0)).current;

  const displayName = contact?.name || 'Chat';
  const lastSeen = contact?.lastSeen ?? 'Last seen 2hrs ago';

  const resetTransform = useCallback(() => {
    if (panelAnimationRef.current) {
      panelAnimationRef.current.stop();
      panelAnimationRef.current = null;
    }
    translateX.setValue(panelWidth);
    dragRef.current = 0;
    isClosingRef.current = false;
  }, [translateX, panelWidth]);

  useEffect(() => {
    if (visible) {
      entranceDoneRef.current = false;
      resetTransform();
      keyboardFooterPaddingBottom.setValue(insets.bottom || 0);
      translateX.setValue(panelWidth);
      onAnimateUnderlayTo?.(-UNDERLAY_OFFSET_LEFT_PX, PANEL_OPEN_DURATION_MS);
      const animation = Animated.timing(translateX, {
        toValue: 0,
        duration: PANEL_OPEN_DURATION_MS,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      });
      panelAnimationRef.current = animation;
      animation.start(({ finished }) => {
        if (panelAnimationRef.current === animation) panelAnimationRef.current = null;
        if (finished) entranceDoneRef.current = true;
      });
    } else {
      if (panelAnimationRef.current) {
        panelAnimationRef.current.stop();
        panelAnimationRef.current = null;
      }
      translateX.setValue(panelWidth);
      dragRef.current = 0;
      isClosingRef.current = false;
    }
  }, [visible, resetTransform, onAnimateUnderlayTo, insets.bottom, keyboardFooterPaddingBottom, translateX, panelWidth]);

  const closeWithAnimation = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    if (panelAnimationRef.current) {
      panelAnimationRef.current.stop();
      panelAnimationRef.current = null;
    }
    onAnimateUnderlayToZero?.(PANEL_CLOSE_DURATION_MS);
    const animation = Animated.timing(translateX, {
      toValue: panelWidth,
      duration: PANEL_CLOSE_DURATION_MS,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    });
    panelAnimationRef.current = animation;
    animation.start(() => {
      if (panelAnimationRef.current === animation) panelAnimationRef.current = null;
      onClose?.();
    });
  }, [translateX, onClose, onAnimateUnderlayToZero, panelWidth]);

  useEffect(() => {
    const getHeight = (e) => e.endCoordinates?.height ?? 0;
    const getDurationMs = (e) => {
      const d = e.duration;
      if (d == null || d === 0) return 220;
      const ms = d < 20 ? Math.round(d * 1000) : d;
      return Math.max(180, Math.min(280, Math.round(ms * 0.95)));
    };
    const keyEasing = Easing.out(Easing.cubic);
    const showSub =
      Platform.OS === 'ios'
        ? Keyboard.addListener('keyboardWillShow', (e) => {
            const kbH = getHeight(e);
            const h = kbH + KEYBOARD_INPUT_GAP_PX;
            const durationMs = getDurationMs(e);
            Animated.parallel([
              Animated.timing(keyboardFooterTranslateY, {
                toValue: -h,
                duration: durationMs,
                easing: keyEasing,
                useNativeDriver: true,
              }),
              Animated.timing(keyboardSpacerHeight, {
                toValue: h,
                duration: durationMs,
                easing: keyEasing,
                useNativeDriver: false,
              }),
            ]).start();
          })
        : Keyboard.addListener('keyboardDidShow', (e) => {
            const kbH = getHeight(e);
            const h = kbH + KEYBOARD_INPUT_GAP_PX;
            const durationMs = 220;
            Animated.parallel([
              Animated.timing(keyboardFooterTranslateY, {
                toValue: -h,
                duration: durationMs,
                easing: keyEasing,
                useNativeDriver: true,
              }),
              Animated.timing(keyboardSpacerHeight, {
                toValue: h,
                duration: durationMs,
                easing: keyEasing,
                useNativeDriver: false,
              }),
            ]).start();
          });
    const hideSub =
      Platform.OS === 'ios'
        ? Keyboard.addListener('keyboardWillHide', (e) => {
            const durationMs = getDurationMs(e);
            Animated.parallel([
              Animated.timing(keyboardFooterTranslateY, {
                toValue: 0,
                duration: durationMs,
                easing: keyEasing,
                useNativeDriver: true,
              }),
              Animated.timing(keyboardSpacerHeight, {
                toValue: 0,
                duration: durationMs,
                easing: keyEasing,
                useNativeDriver: false,
              }),
            ]).start();
          })
        : Keyboard.addListener('keyboardDidHide', () => {
            const durationMs = 220;
            Animated.parallel([
              Animated.timing(keyboardFooterTranslateY, {
                toValue: 0,
                duration: durationMs,
                easing: keyEasing,
                useNativeDriver: true,
              }),
              Animated.timing(keyboardSpacerHeight, {
                toValue: 0,
                duration: durationMs,
                easing: keyEasing,
                useNativeDriver: false,
              }),
            ]).start();
          });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardFooterTranslateY, keyboardSpacerHeight]);

  const onGestureEvent = useCallback(
    Animated.event([{ nativeEvent: { translationX: translateX } }], { useNativeDriver: true }),
    [translateX]
  );

  const onHandlerStateChange = useCallback(
    (e) => {
      if (e.nativeEvent.oldState !== State.ACTIVE) return;
      const x = typeof e.nativeEvent.translationX === 'number' ? e.nativeEvent.translationX : dragRef.current;
      dragRef.current = 0;
      if (x > DRAG_CLOSE_THRESHOLD) {
        closeWithAnimation();
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 72,
          friction: 14,
        }).start();
      }
    },
    [translateX, closeWithAnimation]
  );

  useEffect(() => {
    const sub = translateX.addListener(({ value }) => {
      if (value > 0) dragRef.current = value;
      if (isClosingRef.current) return;
      if (!entranceDoneRef.current) return;
      if (value < 0) return;
      if (value > panelWidth * 0.85) return;
      const underlayX = Math.min(0, -UNDERLAY_OFFSET_LEFT_PX + value * UNDERLAY_FOLLOW_FACTOR);
      onTranslateX?.(underlayX);
    });
    return () => translateX.removeListener(sub);
  }, [translateX, onTranslateX, panelWidth]);

  const sheetTranslateX = translateX.interpolate({
    inputRange: [-Math.max(panelWidth * 0.65, 320), 0, 500],
    outputRange: [-LEFT_RUBBER_BAND_MAX_PX, 0, 500],
  });

  const headerHeight = isFrameMode ? frameModeStyles.header?.height : HEADER_HEIGHT;
  const headerBtnStyle = isFrameMode ? frameModeStyles.headerBtn : undefined;
  const headerTitleStyle = isFrameMode ? frameModeStyles.headerTitle : undefined;
  const footerBarHeight = isFrameMode ? 44 : FOOTER_INPUT_BAR_HEIGHT;

  if (!visible) return null;

  const content = (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.background, width: panelWidth }]}
      behavior={undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { height: headerHeight, borderBottomColor: headerBorderColor, backgroundColor: headerBackgroundColor }]}>
        <TouchableOpacity style={[styles.headerBtn, headerBtnStyle]} onPress={closeWithAnimation} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={isFrameMode ? 22 : 28} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, headerTitleStyle, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
          <Text style={[styles.headerSubtitle, isFrameMode && frameModeStyles.textSmall, { color: colors.textMuted }]} numberOfLines={1}>{lastSeen}</Text>
        </View>
        <View style={[styles.headerBtn, headerBtnStyle]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 6 + footerBarHeight + 16 + (insets.bottom || 0) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.dateSeparator, isFrameMode && frameModeStyles.textSmall, { color: colors.textMuted }]}>Yesterday</Text>
        <SkeletonGroup show={true}>
          {CHAT_SKELETON_MESSAGES.map((msg, i) => (
            <View
              key={i}
              style={[
                styles.chatSkeletonMessageRow,
                msg.isSender ? styles.chatSkeletonRowLeft : styles.chatSkeletonRowRight,
              ]}
            >
              <View style={[styles.chatSkeletonBody, { alignItems: msg.isSender ? 'flex-start' : 'flex-end' }]}>
                <SkeletonBox
                  style={[
                    styles.chatSkeletonLine1,
                    {
                      width: msg.line1Width,
                      height: CHAT_SKELETON_LINE1_HEIGHT,
                      marginBottom: CHAT_SKELETON_LINE1_MARGIN_BOTTOM,
                    },
                  ]}
                  backgroundColor={msg.isSender ? skelSenderBg : skelBg}
                  radius={CHAT_SKELETON_BORDER_RADIUS}
                />
                <SkeletonBox
                  style={[
                    styles.chatSkeletonLine2,
                    {
                      width: msg.line2Width,
                      height: CHAT_SKELETON_LINE2_HEIGHT,
                      marginTop: CHAT_SKELETON_LINE2_MARGIN_TOP,
                    },
                  ]}
                  backgroundColor={msg.isSender ? skelSenderBg : skelBg}
                  radius={CHAT_SKELETON_BORDER_RADIUS}
                />
              </View>
            </View>
          ))}
        </SkeletonGroup>
        <Animated.View style={[styles.keyboardSpacer, { height: keyboardSpacerHeight }]} />
      </ScrollView>

      <Animated.View style={[styles.footer, { transform: [{ translateY: keyboardFooterTranslateY }] }]}>
        <Animated.View style={[styles.footerInner, { paddingBottom: keyboardFooterPaddingBottom }]}>
          <View style={[styles.footerInputBarWrap, { height: footerBarHeight }]} collapsable={false}>
            <BlurView
              intensity={Platform.OS === 'ios' ? 40 : 80}
              tint={theme === 'dark' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderWidth: StyleSheet.hairlineWidth,
                  borderRadius: INPUT_BORDER_RADIUS,
                  borderColor: theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'transparent',
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : colors.inputBg,
                },
              ]}
              pointerEvents="none"
            />
            <View style={[styles.footerInputBar, { height: footerBarHeight }]}>
              <TouchableOpacity style={[styles.footerIconBtn, { height: footerBarHeight }]} activeOpacity={0.7}>
                <Ionicons name="image-outline" size={isFrameMode ? 20 : 22} color={colors.iconActive} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.footerIconBtn, { height: footerBarHeight }]} activeOpacity={0.7}>
                <Ionicons name="mic-outline" size={isFrameMode ? 20 : 22} color={colors.iconActive} />
              </TouchableOpacity>
              <TextInput
                style={[
                  styles.footerInput,
                  { color: colors.text },
                  isFrameMode && { fontSize: 12 },
                ]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type a message"
                placeholderTextColor={colors.placeholder}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity style={[styles.footerSendBtn, { height: footerBarHeight }]} activeOpacity={0.7}>
                <Ionicons name="paper-plane" size={isFrameMode ? 18 : 20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </KeyboardAvoidingView>
  );

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View
        style={[styles.rubberBandStrip, { right: 0, width: LEFT_RUBBER_BAND_MAX_PX }]}
        pointerEvents="none"
      />
      <GestureHandlerRootView style={styles.gestureRoot}>
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          minPointers={1}
          activeOffsetX={[-20, 20]}
          failOffsetY={[-15, 15]}
        >
          <Animated.View
            style={[styles.sheetWrap, { width: panelWidth, backgroundColor: colors.surface, transform: [{ translateX: sheetTranslateX }] }]}
          >
            {content}
          </Animated.View>
        </PanGestureHandler>
      </GestureHandlerRootView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  rubberBandStrip: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  gestureRoot: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  sheetWrap: {
    flex: 1,
    width: FALLBACK_WIDTH,
  },
  root: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    minWidth: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: CONTENT_PADDING_H,
    paddingTop: 20,
  },
  dateSeparator: {
    textAlign: 'center',
    fontSize: 12,
    marginVertical: 14,
  },
  chatSkeletonMessageRow: {
    flexDirection: 'row',
    marginBottom: CHAT_SKELETON_MESSAGE_MARGIN_BOTTOM,
  },
  chatSkeletonRowLeft: {
    justifyContent: 'flex-start',
  },
  chatSkeletonRowRight: {
    justifyContent: 'flex-end',
  },
  chatSkeletonBody: {
    gap: CHAT_SKELETON_BODY_GAP,
  },
  chatSkeletonLine1: {
    borderRadius: CHAT_SKELETON_BORDER_RADIUS,
  },
  chatSkeletonLine2: {
    borderRadius: CHAT_SKELETON_BORDER_RADIUS,
  },
  keyboardSpacer: {
    width: '100%',
  },
  footer: {
    width: '100%',
    paddingTop: 8,
    paddingBottom: 0,
  },
  footerInner: {
    width: '100%',
    paddingHorizontal: 12,
  },
  footerInputBarWrap: {
    width: '100%',
    borderRadius: INPUT_BORDER_RADIUS,
    overflow: 'hidden',
  },
  footerInputBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  footerIconBtn: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    ...(Platform.OS === 'android' && { textAlignVertical: 'center' }),
  },
  footerSendBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
