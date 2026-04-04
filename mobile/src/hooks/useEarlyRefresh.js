import { useState, useRef, useCallback } from 'react';
import { triggerTabHaptic } from '../utils/haptics';

/** Пиксели тяги вниз для срабатывания refresh; порог выше — только явный pull, не игра со скроллом. */
const DEFAULT_TRIGGER_PX = 28;
/** Макс. время показа спиннера (спиннер всегда закроется, даже если запрос завис). */
const MAX_REFRESH_MS = 15000;
/** После завершения рефреша — задержка перед разрешением следующего. */
const RESET_TRIGGER_AFTER_MS = 500;
/** Макс. изменение y за кадр (px): больше = bounce/игра скроллом, не рефреш. */
const MAX_DELTA_PER_FRAME_PX = 14;
/** Мин. время (ms) «стояния» у верха перед разрешением рефреша — чтобы скролл вверх до верха не считался pull. */
const AT_TOP_COOLDOWN_MS = 450;

export function useEarlyRefresh(refreshCallback, triggerPx = DEFAULT_TRIGGER_PX) {
  const [refreshing, setRefreshing] = useState(false);
  const isRefreshingRef = useRef(false);
  const lastRefreshEndedRef = useRef(0);
  const triggeredThisPullRef = useRef(false);
  const previousYRef = useRef(0);
  const wasAtTopRef = useRef(true);
  const lastTimeAtTopRef = useRef(0);

  const resetTriggerRef = useCallback(() => {
    triggeredThisPullRef.current = false;
  }, []);

  const onRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    if (Date.now() - lastRefreshEndedRef.current < RESET_TRIGGER_AFTER_MS) return;
    isRefreshingRef.current = true;
    setRefreshing(true);
    triggerTabHaptic();
    const timeoutId = setTimeout(() => {
      setRefreshing(false);
      isRefreshingRef.current = false;
      lastRefreshEndedRef.current = Date.now();
      setTimeout(resetTriggerRef, RESET_TRIGGER_AFTER_MS);
    }, MAX_REFRESH_MS);
    try {
      await refreshCallback();
    } catch (_) {}
    finally {
      clearTimeout(timeoutId);
      setRefreshing(false);
      isRefreshingRef.current = false;
      lastRefreshEndedRef.current = Date.now();
      setTimeout(resetTriggerRef, RESET_TRIGGER_AFTER_MS);
    }
  }, [refreshCallback, resetTriggerRef]);

  const onScroll = useCallback(
    (e) => {
      const y = e.nativeEvent?.contentOffset?.y ?? 0;
      const prevY = previousYRef.current;
      previousYRef.current = y;
      if (y >= 0) {
        wasAtTopRef.current = true;
        lastTimeAtTopRef.current = Date.now();
        triggeredThisPullRef.current = false;
        return;
      }
      const delta = Math.abs(y - prevY);
      const isDeliberatePull = delta <= MAX_DELTA_PER_FRAME_PX;
      const onlyFromTop = wasAtTopRef.current;
      const stayedAtTopLongEnough = Date.now() - lastTimeAtTopRef.current >= AT_TOP_COOLDOWN_MS;
      if (
        y < -triggerPx &&
        onlyFromTop &&
        stayedAtTopLongEnough &&
        !refreshing &&
        !triggeredThisPullRef.current &&
        isDeliberatePull
      ) {
        wasAtTopRef.current = false;
        triggeredThisPullRef.current = true;
        onRefresh();
      }
    },
    [refreshing, triggerPx, onRefresh]
  );

  return { refreshing, setRefreshing, onRefresh, onScroll };
}
