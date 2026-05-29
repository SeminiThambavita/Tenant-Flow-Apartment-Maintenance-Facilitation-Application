import { useEffect, useRef } from 'react';
import { STATUS_REFRESH_EVENT, STATUS_REFRESH_KEY } from '../utils/statusRefresh';

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

    const handleIssueUpdated = () => tick();
    const handleStorageUpdate = (event) => {
      if (event.key === STATUS_REFRESH_KEY) {
        tick();
      }
    };

    window.addEventListener(STATUS_REFRESH_EVENT, handleIssueUpdated);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener(STATUS_REFRESH_EVENT, handleIssueUpdated);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [intervalMs, enabled]);
}
