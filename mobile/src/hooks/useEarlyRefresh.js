import { useState, useRef, useCallback } from 'react';
import { triggerTabHaptic } from '../utils/haptics';

/** Downward pull distance in pixels required to trigger refresh; a higher threshold allows only intentional pulls, not scroll play. */
const DEFAULT_TRIGGER_PX = 28;
/** Maximum spinner display time; the spinner always stops even if the request hangs. */
const MAX_REFRESH_MS = 15000;
/** Delay after refresh completes before allowing the next one. */
const RESET_TRIGGER_AFTER_MS = 500;
/** Maximum y change per frame in px; larger values are treated as bounce/scroll play, not refresh. */
const MAX_DELTA_PER_FRAME_PX = 14;
/** Minimum time in ms spent at the top before refresh is allowed, so reaching the top by scrolling up does not count as a pull. */
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
