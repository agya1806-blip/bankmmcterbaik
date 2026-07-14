import { useState, useRef, useCallback } from "react";

export function usePullRefresh(onRefresh: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const pulling = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current) return;
    const dist = Math.max(0, e.touches[0].clientY - startY.current);
    setPullDistance(Math.min(dist * 0.5, 80));
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDistance >= 60) {
      setRefreshing(true);
      try { await onRefresh(); } finally { setRefreshing(false); }
    }
    setPullDistance(0);
  }, [pullDistance, onRefresh]);

  return { refreshing, pullDistance, onTouchStart, onTouchMove, onTouchEnd };
}
