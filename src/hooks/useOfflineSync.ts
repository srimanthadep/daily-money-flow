import { useState, useEffect, useCallback } from 'react';

const QUEUE_KEY = 'offline_queue';

function loadQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(queue: any[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState(loadQueue);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const enqueue = useCallback((item: any) => {
    setQueue((prev: any[]) => {
      const next = [...prev, item];
      saveQueue(next);
      return next;
    });
  }, []);

  // Sync logic when we come back online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      console.log(`Syncing ${queue.length} items from offline queue...`);
      // Future: integrate with Supabase to replay actions
      // For now, clear queue after sync (or keep as a log)
      setQueue([]);
      saveQueue([]);
    }
  }, [isOnline, queue]);

  return { isOnline, queue, enqueue };
}
