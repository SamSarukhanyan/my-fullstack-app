import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { MusicPlayerProvider } from '../context/MusicPlayerContext';
import MainPager from '../components/MainPager';
import MessagesScreen from './MessagesScreen';
import HomeScreen from './HomeScreen';
import MusicScreen from './MusicScreen';
import CreatePostScreen from './CreatePostScreen';
import { InstagramStoriesIntegration } from '../components/stories';
import NotificationsScreen from './NotificationsScreen';
import ChatScreen from './ChatScreen';
import UserProfileScreen from './UserProfileScreen';
import MyProfileTabScreen from './MyProfileTabScreen';
import SettingsScreen from './SettingsScreen';

function mapToStoryUsers(payload) {
  if (!payload || !Array.isArray(payload)) return [];
  return payload.map((u, i) => {
    const name = u.userName ?? u.username ?? `User ${i + 1}`;
    const seed = (u.id ?? name).replace(/\s/g, '');
    const stories = Array.isArray(u.stories) && u.stories.length > 0
      ? u.stories.map((s, j) => ({
          id: `${i}-${j}`,
          type: 'image',
          uri: typeof s === 'string' ? s : (s.uri ?? s.url ?? `https://picsum.photos/seed/${seed}-${j}/400/600`),
          duration: typeof s?.duration === 'number' ? s.duration : 4000,
        }))
      : [0, 1, 2].map((j) => ({
          id: `${i}-${j}`,
          type: 'image',
          uri: `https://picsum.photos/seed/${seed}-${j}/400/600`,
          duration: 4000,
        }));
    return {
      id: String(u.id ?? i),
      username: name,
      avatar: u.avatar ?? `https://i.pravatar.cc/150?u=${i}`,
      stories,
    };
  });
}

/** Типы экранов оверлея для стека навигации. */
const NAV_TYPES = {
  story: 'story',
  notifications: 'notifications',
  userProfile: 'userProfile',
  chat: 'chat',
  settings: 'settings',
};

const NAV_TRANSITION_GUARD_MS = 240;

function getEntryId(entry) {
  if (!entry) return '';
  if (entry.type === NAV_TYPES.chat) return String(entry.contact?.id ?? '');
  if (entry.type === NAV_TYPES.userProfile) return String(entry.user?.id ?? '');
  return '';
}

function isSameEntry(a, b) {
  if (!a || !b) return false;
  if (a.type !== b.type) return false;
  return getEntryId(a) === getEntryId(b);
}

/**
 * Main app shell: 5-tab horizontal pager (Home | Music | Create | Messages | Profile).
 * Стек навигации: при открытии оверлея — push, при «назад»/свайпе назад — pop.
 * Возврат всегда на предыдущий экран в порядке открытия (как в Instagram).
 */
export default function MainPagerScreen() {
  const [navStack, setNavStack] = useState([]);
  const pagerTranslateX = useRef(new Animated.Value(0)).current;
  const lastNavActionAtRef = useRef(0);
  const underlayAnimationRef = useRef(null);

  const current = navStack.length > 0 ? navStack[navStack.length - 1] : null;

  const stopUnderlayAnimation = useCallback(() => {
    if (underlayAnimationRef.current) {
      underlayAnimationRef.current.stop();
      underlayAnimationRef.current = null;
    }
  }, []);

  const push = useCallback((entry) => {
    const now = Date.now();
    if (now - lastNavActionAtRef.current < NAV_TRANSITION_GUARD_MS) return;
    setNavStack((s) => {
      const top = s.length > 0 ? s[s.length - 1] : null;
      if (isSameEntry(top, entry)) return s;
      lastNavActionAtRef.current = now;
      return [...s, entry];
    });
  }, []);

  const pop = useCallback(() => {
    const now = Date.now();
    if (now - lastNavActionAtRef.current < NAV_TRANSITION_GUARD_MS) return;
    setNavStack((s) => {
      if (s.length === 0) return s;
      lastNavActionAtRef.current = now;
      stopUnderlayAnimation();
      const closed = s[s.length - 1];
      const needsPagerReset =
        closed?.type === NAV_TYPES.chat ||
        closed?.type === NAV_TYPES.settings ||
        closed?.type === NAV_TYPES.notifications ||
        closed?.type === NAV_TYPES.userProfile;
      if (needsPagerReset) {
        pagerTranslateX.setValue(0);
        requestAnimationFrame(() => pagerTranslateX.setValue(0));
      }
      return s.slice(0, -1);
    });
  }, [pagerTranslateX, stopUnderlayAnimation]);

  const animateUnderlayToZero = useCallback((duration) => {
    stopUnderlayAnimation();
    const animation = Animated.timing(pagerTranslateX, {
      toValue: 0,
      duration: duration ?? 260,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    });
    underlayAnimationRef.current = animation;
    animation.start(() => {
      if (underlayAnimationRef.current === animation) underlayAnimationRef.current = null;
    });
  }, [pagerTranslateX, stopUnderlayAnimation]);

  const animateUnderlayTo = useCallback((value, duration) => {
    stopUnderlayAnimation();
    const animation = Animated.timing(pagerTranslateX, {
      toValue: value,
      duration: duration ?? 240,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    });
    underlayAnimationRef.current = animation;
    animation.start(() => {
      if (underlayAnimationRef.current === animation) underlayAnimationRef.current = null;
    });
  }, [pagerTranslateX, stopUnderlayAnimation]);

  const handleSetUnderlayTranslateX = useCallback((x) => {
    stopUnderlayAnimation();
    pagerTranslateX.setValue(x);
  }, [pagerTranslateX, stopUnderlayAnimation]);

  return (
    <View style={styles.wrapper}>
      <MusicPlayerProvider>
        <Animated.View
          style={[styles.pagerWrap, { transform: [{ translateX: pagerTranslateX }] }]}
        >
          <MainPager
          hideTabBar={false}
          homeExtraProps={{
            onOpenStory: (payload) => push({
            type: NAV_TYPES.story,
            user: payload?.user ?? payload,
            users: payload?.users ?? null,
            initialUserIndex: payload?.initialUserIndex ?? 0,
            layout: payload?.layout ?? null,
            storyKey: Date.now(),
          }),
            onOpenNotifications: () => push({ type: NAV_TYPES.notifications }),
            onOpenUserProfile: (user) => push({ type: NAV_TYPES.userProfile, user }),
          }}
          messagesExtraProps={{
            onOpenChat: (chat) => push({ type: NAV_TYPES.chat, contact: chat }),
            onOpenUserProfile: (user) => push({ type: NAV_TYPES.userProfile, user }),
          }}
          profileExtraProps={{
            onOpenSettings: () => push({ type: NAV_TYPES.settings }),
          }}
          renderHome={(props) => <HomeScreen {...props} />}
          renderMusic={(props) => <MusicScreen {...props} />}
          renderCreate={(props) => <CreatePostScreen {...props} />}
          renderMessages={(props) => <MessagesScreen {...props} />}
          renderProfile={(props) => <MyProfileTabScreen {...props} />}
        />
        </Animated.View>
      </MusicPlayerProvider>

      <InstagramStoriesIntegration
        visible={current?.type === NAV_TYPES.story}
        users={
          current?.type === NAV_TYPES.story
            ? mapToStoryUsers(current.users)
            : []
        }
        initialUserIndex={
          current?.type === NAV_TYPES.story ? current.initialUserIndex ?? 0 : 0
        }
        onClose={pop}
      />
      <NotificationsScreen
        visible={current?.type === NAV_TYPES.notifications}
        onClose={pop}
        onClearAll={pop}
        onTranslateX={handleSetUnderlayTranslateX}
        onAnimateUnderlayToZero={animateUnderlayToZero}
      />
      <ChatScreen
        visible={current?.type === NAV_TYPES.chat}
        contact={current?.type === NAV_TYPES.chat ? current.contact : null}
        onClose={pop}
        onTranslateX={handleSetUnderlayTranslateX}
        onAnimateUnderlayTo={animateUnderlayTo}
        onAnimateUnderlayToZero={animateUnderlayToZero}
      />
      <UserProfileScreen
        visible={current?.type === NAV_TYPES.userProfile}
        user={current?.type === NAV_TYPES.userProfile ? current.user : null}
        onClose={pop}
        onOpenChat={(u) => push({ type: NAV_TYPES.chat, contact: u })}
        onTranslateX={handleSetUnderlayTranslateX}
        onAnimateUnderlayTo={animateUnderlayTo}
        onAnimateUnderlayToZero={animateUnderlayToZero}
      />
      <SettingsScreen
        visible={current?.type === NAV_TYPES.settings}
        onClose={pop}
        onTranslateX={handleSetUnderlayTranslateX}
        onAnimateUnderlayToZero={animateUnderlayToZero}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  pagerWrap: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
});
