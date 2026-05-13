export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[Athena SW] registered, scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[Athena SW] registration failed:', err);
      });

    // Listen for sync-complete messages from SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'PANIC_SYNC_COMPLETE') {
        window.dispatchEvent(new CustomEvent('athena:panic-synced'));
      }
    });
  });
}
