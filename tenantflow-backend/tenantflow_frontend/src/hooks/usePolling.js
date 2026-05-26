import { useEffect, useRef } from 'react';

export default function usePolling(callback, intervalMs = 5000, enabled = true) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;

    const tick = () => savedCallback.current();
    tick();
    const intervalId = setInterval(tick, intervalMs);
    return () => clearInterval(intervalId);
  }, [intervalMs, enabled]);
}
