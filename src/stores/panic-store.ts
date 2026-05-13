import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PanicState {
  isTriggered: boolean;
  triggerTimestamp: number | null;
  location: { lat: number; lng: number } | null;
  isOfflineSyncPending: boolean;
  triggerPanic: (location?: { lat: number; lng: number }) => void;
  resetPanic: () => void;
  setOfflineSyncPending: (status: boolean) => void;
}

export const usePanicStore = create<PanicState>()(
  persist(
    (set) => ({
      isTriggered: false,
      triggerTimestamp: null,
      location: null,
      isOfflineSyncPending: false,

      triggerPanic: (location) => set({
        isTriggered: true,
        triggerTimestamp: Date.now(),
        location: location || null,
        isOfflineSyncPending: !navigator.onLine,
      }),

      resetPanic: () => set({
        isTriggered: false,
        triggerTimestamp: null,
        location: null,
        isOfflineSyncPending: false,
      }),

      setOfflineSyncPending: (status) => set({
        isOfflineSyncPending: status,
      }),
    }),
    {
      name: 'athena-panic-storage',
    }
  )
);
