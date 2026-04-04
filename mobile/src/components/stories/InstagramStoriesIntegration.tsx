/**
 * Интеграция instagram-stories с проектом.
 * Маппинг наших users → формат Instagram и рендер без собственного списка аватаров (hideAvatarList).
 * Логику instagram-stories не изменяем.
 */
import React, { useMemo } from 'react';
import InstagramStories from '../../instagram-stories';

/** Наш формат пользователя (из HomeScreen / MainPagerScreen) */
interface OurStoryUser {
  id?: string | number;
  userName?: string;
  username?: string;
  avatar?: string;
  stories?: Array<{ id?: string; uri?: string; url?: string; duration?: number }>;
  storiesCount?: number;
  timeAgo?: string;
}

/** Пустой URI для скелетонов — компоненты рендерят View вместо Image. */
const SKELETON_URI = '';

/** Маппинг наших users в формат instagram-stories (скелетоны — без картинок и имён). */
function mapToInstagramStories(
  payload: OurStoryUser[] | null | undefined,
  initialUserIndex: number
) {
  if (!payload || !Array.isArray(payload) || payload.length === 0) {
    return [];
  }
  const users = payload.map((u, i) => {
    const id = String(u.id ?? i);
    const rawStories = Array.isArray(u.stories) && u.stories.length > 0
      ? u.stories
      : [0, 1, 2].map((j) => ({ id: `${i}-${j}`, duration: 4000 }));
    const stories = rawStories.map((s, j) => ({
      id: typeof s === 'object' && s?.id ? String(s.id) : `${i}-${j}`,
      source: { uri: SKELETON_URI },
      mediaType: 'image' as const,
      animationDuration: typeof s === 'object' && s?.duration === 'number' ? s.duration : 4000,
    }));
    return {
      id,
      avatarSource: { uri: SKELETON_URI },
      name: undefined,
      stories,
    };
  });
  const idx = Math.max(0, Math.min(initialUserIndex, users.length - 1));
  if (idx === 0) return users;
  return [...users.slice(idx), ...users.slice(0, idx)];
}

interface InstagramStoriesIntegrationProps {
  visible: boolean;
  users: OurStoryUser[];
  initialUserIndex: number;
  onClose: () => void;
}

export function InstagramStoriesIntegration({
  visible,
  users,
  initialUserIndex,
  onClose,
}: InstagramStoriesIntegrationProps) {
  const instagramStories = useMemo(
    () => mapToInstagramStories(users, initialUserIndex),
    [users, initialUserIndex]
  );

  if (!visible || instagramStories.length === 0) {
    return null;
  }

  return (
    <InstagramStories
      stories={instagramStories}
      isVisible={visible}
      hideAvatarList
      saveProgress={false}
      onStoryHeaderPress={onClose}
      onHide={onClose}
      statusBarTranslucent
    />
  );
}
