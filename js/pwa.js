/**
 * PWA & Service Worker Registration Management
 * Supports offline caching and parameter-based disabling on localhost or via URL query.
 */

import { state } from './state.js';

export function isLocalhost() {
  return Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]' ||
    window.location.protocol === 'file:'
  );
}

/**
 * Determines whether PWA / Service Worker should be registered.
 * Checks URL parameters (?pwa=true/false, ?nopwa=1), state configuration, and localhost status.
 */
export function isPwaEnabled() {
  const params = new URLSearchParams(window.location.search);

  // 1. Explicit query parameter overrides
  const pwaParam = params.get('pwa');
  const noPwaParam = params.get('nopwa') || params.get('disable_pwa');

  if (pwaParam === 'false' || pwaParam === '0' || noPwaParam === 'true' || noPwaParam === '1') {
    return false;
  }

  if (pwaParam === 'true' || pwaParam === '1') {
    return true;
  }

  // 2. Localhost check with configuration parameter
  const onLocal = isLocalhost();
  const disableOnLocal = state.config.disablePwaOnLocalhost !== false;

  if (onLocal && disableOnLocal) {
    return false;
  }

  return true;
}

export async function initPWA() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const enabled = isPwaEnabled();

  if (!enabled) {
    // When disabled (e.g., on localhost or ?pwa=false), unregister any active workers
    // to ensure development edits are never trapped in cache
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
        console.log('[PWA] Unregistered existing ServiceWorker for clean local development.');
      }
    } catch (e) {
      console.warn('[PWA] Error unregistering service workers:', e);
    }
    console.log('[PWA] Service Worker disabled (Localhost or ?pwa=false). To enable on localhost, append ?pwa=true to the URL.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('./sw.js', {
      scope: './'
    });

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] New version available. Refresh to update.');
          }
        });
      }
    });

    console.log('[PWA] Service Worker registered successfully for offline support.');
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
  }
}
