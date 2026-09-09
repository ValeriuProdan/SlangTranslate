/**
 * Timed pause: a temporary snooze that resumes on its own, as opposed to the
 * main on/off switch which stays where you put it.
 *
 * Pure time arithmetic, so the rules are testable without a browser. The
 * state is a single timestamp: everything else is derived from comparing it
 * to now, which means a stale value left in storage is harmless -- once it is
 * in the past, the extension is simply not paused any more.
 */
(function (root) {
  'use strict';

  // When "until tomorrow" lands you back in business.
  const RESUME_HOUR = 8;

  const DURATIONS = [
    { id: '15m', labelKey: 'pause15', minutes: 15 },
    { id: '1h', labelKey: 'pause60', minutes: 60 },
    { id: 'tomorrow', labelKey: 'pauseTomorrow', minutes: null }
  ];

  function now(value) {
    return typeof value === 'number' ? value : Date.now();
  }

  /** The next RESUME_HOUR o'clock strictly after `stamp`. */
  function nextMorning(stamp) {
    const date = new Date(stamp);
    date.setHours(RESUME_HOUR, 0, 0, 0);
    if (date.getTime() <= stamp) date.setDate(date.getDate() + 1);
    return date.getTime();
  }

  /** @returns {number} the timestamp a pause of `id` should end at, 0 if unknown. */
  function until(id, at) {
    const stamp = now(at);
    const duration = DURATIONS.filter(function (d) { return d.id === id; })[0];
    if (!duration) return 0;
    if (duration.minutes) return stamp + duration.minutes * 60000;
    return nextMorning(stamp);
  }

  function isPaused(pausedUntil, at) {
    return !!pausedUntil && pausedUntil > now(at);
  }

  /** @returns {number} milliseconds left, or 0 when not paused. */
  function remaining(pausedUntil, at) {
    const left = (pausedUntil || 0) - now(at);
    return left > 0 ? left : 0;
  }

  /** Compact and language-neutral: "<1m", "45m", "1h 30m". */
  function formatRemaining(ms) {
    if (ms <= 0) return '';
    if (ms < 60000) return '<1m';
    // Round up: a countdown should only say '1m' during the final minute.
    const minutes = Math.ceil(ms / 60000);
    if (minutes < 60) return minutes + 'm';
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? hours + 'h ' + rest + 'm' : hours + 'h';
  }

  /** Local wall-clock time the pause ends, as "HH:MM". */
  function formatUntil(pausedUntil) {
    const date = new Date(pausedUntil);
    return String(date.getHours()).padStart(2, '0') + ':' +
      String(date.getMinutes()).padStart(2, '0');
  }

  /** True when the pause ends on a later calendar day than `at`. */
  function isNextDay(pausedUntil, at) {
    const end = new Date(pausedUntil);
    const start = new Date(now(at));
    return end.getFullYear() !== start.getFullYear() ||
      end.getMonth() !== start.getMonth() ||
      end.getDate() !== start.getDate();
  }

  const api = {
    DURATIONS: DURATIONS,
    RESUME_HOUR: RESUME_HOUR,
    until: until,
    isPaused: isPaused,
    remaining: remaining,
    formatRemaining: formatRemaining,
    formatUntil: formatUntil,
    isNextDay: isNextDay
  };

  root.SlangPause = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
