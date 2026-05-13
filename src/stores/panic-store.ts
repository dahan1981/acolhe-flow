import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? '';

interface PanicState {
  isTriggered: boolean;
  triggerTimestamp: number | null;
  location: { lat: number; lng: number } | null;
  isOfflineSyncPending: boolean;
  triggerPanic: (location?: { lat: number; lng: number }) => void;
  resetPanic: () => void;
  setOfflineSyncPending: (status: boolean) => void;
}

async function sendPanicToServer(payload: { lat?: number; lng?: number; timestamp: number }) {
  try {
    const res = await fetch(`${API_BASE}/api/panic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    // 202 = queued by SW, 200 = saved immediately
    return res.status === 200 || res.status === 202;
  } catch {
    return false;
  }
}

export const usePanicStore = create<PanicState>()(
  persist(
    (set) => ({
      isTriggered: false,
      triggerTimestamp: null,
      location: null,
      isOfflineSyncPending: false,

      triggerPanic: (location) => {
        const timestamp = Date.now();
        const isOffline = !navigator.onLine;

        set({
          isTriggered: true,
          triggerTimestamp: timestamp,
          location: location || null,
          isOfflineSyncPending: isOffline,
        });

        sendPanicToServer({ lat: location?.lat, lng: location?.lng, timestamp }).then((ok) => {
          if (ok) set({ isOfflineSyncPending: false });
        });

        // Re-sync when online comes back
        if (isOffline) {
          const onOnline = () => {
            sendPanicToServer({ lat: location?.lat, lng: location?.lng, timestamp }).then((ok) => {
              if (ok) set({ isOfflineSyncPending: false });
            });
            window.removeEventListener('online', onOnline);
          };
          window.addEventListener('online', onOnline);
        }

        // Listen for SW sync confirmation
        const onSwSync = () => {
          set({ isOfflineSyncPending: false });
          window.removeEventListener('athena:panic-synced', onSwSync);
        };
        window.addEventListener('athena:panic-synced', onSwSync);
      },

      resetPanic: () =>
        set({
          isTriggered: false,
          triggerTimestamp: null,
          location: null,
          isOfflineSyncPending: false,
        }),

      setOfflineSyncPending: (status) => set({ isOfflineSyncPending: status }),
    }),
    { name: 'athena-panic-storage' }
  )
);
