/**
 * Clock, Date & Greeting Module
 */

import { state } from './state.js';
import { t, getCurrentLanguageCode } from './i18n.js';

const clockDisplay = document.getElementById('clock-display');
const greetingText = document.getElementById('greeting-text');
const currentDateEl = document.getElementById('current-date');

export function updateClockAndGreeting() {
  if (!clockDisplay || !greetingText || !currentDateEl) return;

  const now = new Date();

  // Time formatting
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  let ampm = '';

  if (!state.config.is24Hour) {
    ampm = hours >= 12 ? ' PM' : ' AM';
    hours = hours % 12 || 12;
  } else {
    hours = String(hours).padStart(2, '0');
  }

  const timeString = `${hours}:${minutes}${state.config.showSeconds ? ':' + seconds : ''}${ampm}`;
  clockDisplay.textContent = timeString;

  // Date formatting with current localized locale
  const langCode = getCurrentLanguageCode() || undefined;
  const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  currentDateEl.textContent = now.toLocaleDateString(langCode, dateOptions);

  // Localized Greeting
  const hour = now.getHours();
  let greeting = t('greetings.welcome');
  if (hour >= 5 && hour < 12) {
    greeting = t('greetings.morning');
  } else if (hour >= 12 && hour < 18) {
    greeting = t('greetings.afternoon');
  } else if (hour >= 18 && hour < 22) {
    greeting = t('greetings.evening');
  } else {
    greeting = t('greetings.night');
  }
  greetingText.textContent = greeting;
}

export function initClock() {
  updateClockAndGreeting();
  setInterval(updateClockAndGreeting, 1000);
}
