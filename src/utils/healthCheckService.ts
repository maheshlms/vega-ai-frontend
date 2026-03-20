/**
 * healthCheckService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * A singleton service that polls target-system health every 5 minutes.
 *
 * Key design decisions
 * ────────────────────
 * • Runs entirely outside React — no component needs to be mounted.
 * • Pages/components subscribe via `subscribe()` to receive status updates.
 * • The service starts automatically on first import (call `init()` once in
 *   your app entry-point, e.g. main.tsx or App.tsx).
 * • A manual `runNow()` lets the TargetSystemShow page trigger an immediate
 *   check (e.g. on mount) without resetting the 5-min cadence.
 * • `isRunning` flag lets the UI know a check is in progress so it can show
 *   the loader — but ONLY for the background check, not for manual test/delete.
 *
 * ── CHANGED: countdown and lastChecked are now persisted in localStorage so
 *    the timer survives page refreshes. On init, the service reads the saved
 *    timestamp and resumes from the correct remaining time rather than always
 *    restarting from 300s. If the saved interval has already elapsed while the
 *    page was closed, a check is triggered immediately on load.
 */

import api from './api'; // adjust path if needed

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface SystemHealthResult {
  id: string;
  newStatus: 'connected' | 'disconnected' | 'error';
}

export interface HealthCheckState {
  isRunning: boolean;                        // true while a batch check is in flight
  lastChecked: Date | null;                  // timestamp of last completed check
  countdown: number;                         // seconds until next scheduled check
  results: SystemHealthResult[];             // results from last completed check
}

type Listener = (state: HealthCheckState) => void;

/* ── Interval constant ──────────────────────────────────────────────────── */

const CHECK_INTERVAL_MS  = 5 * 60 * 1000;  // 5 minutes
const COUNTDOWN_SECONDS  = CHECK_INTERVAL_MS / 1000; // 300

/* ── localStorage keys ──────────────────────────────────────────────────── */

const LS_LAST_CHECKED_KEY  = 'hcs_lastChecked';   // ISO string of last completed check
const LS_NEXT_CHECK_KEY    = 'hcs_nextCheck';     // ISO string of when next check is due

/* ── Internal state ─────────────────────────────────────────────────────── */

let _intervalId:   ReturnType<typeof setInterval>  | null = null;
let _tickerId:     ReturnType<typeof setInterval>  | null = null;
let _isRunning     = false;
let _lastChecked:  Date | null = null;
let _countdown     = COUNTDOWN_SECONDS;
let _results:      SystemHealthResult[] = [];
let _listeners:    Set<Listener> = new Set();

let _getSystemIds: (() => string[]) | null = null;

/* ── localStorage helpers ────────────────────────────────────────────────── */

function saveCheckTimes() {
  try {
    if (_lastChecked) {
      // ── CHANGED: sessionStorage clears on tab/browser close but persists on refresh ──
      sessionStorage.setItem(LS_LAST_CHECKED_KEY, _lastChecked.toISOString());
    }
    const nextCheck = new Date(Date.now() + _countdown * 1000);
    sessionStorage.setItem(LS_NEXT_CHECK_KEY, nextCheck.toISOString());
  } catch { /* sessionStorage may be unavailable in some envs */ }
}

/**
 * On init, read saved timestamps and compute how many seconds remain.
 * Returns the countdown to use (may be 0 if the interval already elapsed).
 */
function loadSavedCountdown(): { countdown: number; lastChecked: Date | null } {
  try {
    // ── CHANGED: sessionStorage — survives refresh, clears on tab/browser close ──
    const savedLastChecked = sessionStorage.getItem(LS_LAST_CHECKED_KEY);
    const savedNextCheck   = sessionStorage.getItem(LS_NEXT_CHECK_KEY);

    const lastChecked = savedLastChecked ? new Date(savedLastChecked) : null;

    if (savedNextCheck) {
      const nextCheckTime = new Date(savedNextCheck);
      const remainingMs   = nextCheckTime.getTime() - Date.now();

      if (remainingMs <= 0) {
        return { countdown: 0, lastChecked };
      }

      const remainingSeconds = Math.round(remainingMs / 1000);
      return { countdown: Math.min(remainingSeconds, COUNTDOWN_SECONDS), lastChecked };
    }
  } catch { /* ignore */ }

  return { countdown: COUNTDOWN_SECONDS, lastChecked: null };
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function notify() {
  const state: HealthCheckState = {
    isRunning:   _isRunning,
    lastChecked: _lastChecked,
    countdown:   _countdown,
    results:     _results,
  };
  _listeners.forEach(fn => fn(state));
}

function resetCountdown() {
  _countdown = COUNTDOWN_SECONDS;
  saveCheckTimes();
  notify();
}

function isApiTestFailure(r: any): boolean {
  return (
    r?.success   === false  ||
    r?.connected === false  ||
    r?.status    === 'error'  ||
    r?.status    === 'failed' ||
    /fail|error|unable|cannot|unreachable|connection failed/i.test(
      r?.message || r?.detail || ''
    )
  );
}

/* ── Core check ─────────────────────────────────────────────────────────── */

async function runCheck() {
  const ids = _getSystemIds ? _getSystemIds() : [];

  // No systems registered — skip silently (page not mounted or list empty)
  if (!ids.length) {
    resetCountdown();
    return;
  }

  _isRunning = true;
  notify();

  const settled = await Promise.allSettled(
    ids.map(async (id): Promise<SystemHealthResult> => {
      try {
        const r = await api.targetSystems.testConnection(id);
        return { id, newStatus: isApiTestFailure(r) ? 'disconnected' : 'connected' };
      } catch {
        return { id, newStatus: 'error' };
      }
    })
  );

  _results = settled
    .filter((r): r is PromiseFulfilledResult<SystemHealthResult> => r.status === 'fulfilled')
    .map(r => r.value);

  _isRunning   = false;
  _lastChecked = new Date();
  resetCountdown();
}

/* ── Countdown ticker ───────────────────────────────────────────────────── */

function startTicker() {
  if (_tickerId) return;
  _tickerId = setInterval(() => {
    _countdown = Math.max(0, _countdown - 1);
    // ── CHANGED: persist the updated countdown every second so a refresh
    //    always picks up the correct remaining time ──
    saveCheckTimes();
    notify();
  }, 1_000);
}

function stopTicker() {
  if (_tickerId) {
    clearInterval(_tickerId);
    _tickerId = null;
  }
}

/* ── Scheduled interval ─────────────────────────────────────────────────── */

function startInterval() {
  if (_intervalId) return;
  _intervalId = setInterval(() => {
    _countdown = 0;          // show 0 briefly before check starts
    notify();
    runCheck();
  }, CHECK_INTERVAL_MS);
}

function stopInterval() {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
}

/* ── Public API ─────────────────────────────────────────────────────────── */

/**
 * Call once in your app entry-point (main.tsx / App.tsx).
 * Safe to call multiple times — idempotent.
 *
 * ── CHANGED: on init, reads localStorage to resume from the correct
 *    countdown instead of always starting fresh from 300s. If the saved
 *    next-check time has already passed, triggers an immediate check.
 */
export function init() {
  if (_intervalId) return; // already initialised

  // ── CHANGED: restore persisted state ──
  const { countdown, lastChecked } = loadSavedCountdown();
  _countdown   = countdown;
  _lastChecked = lastChecked;

  startTicker();

  if (countdown <= 0) {
    // Overdue — run immediately, then start the regular 5-min interval
    runCheck().then(() => startInterval());
  } else {
    // Schedule the first check to fire exactly when the saved countdown expires,
    // then switch to the regular 5-min interval afterwards.
    const firstCheckMs = countdown * 1000;
    const firstTimeoutId = setTimeout(() => {
      _countdown = 0;
      notify();
      runCheck().then(() => startInterval());
    }, firstCheckMs);

    // Store timeout so destroy() can cancel it
    // (we reuse _intervalId slot as a sentinel; the real interval starts after)
    // We just set _intervalId to a truthy dummy so repeated init() calls are blocked.
    _intervalId = firstTimeoutId as unknown as ReturnType<typeof setInterval>;
  }
}

/**
 * Subscribe to health-check state changes.
 * Returns an unsubscribe function — call it in useEffect cleanup.
 */
export function subscribe(listener: Listener): () => void {
  _listeners.add(listener);
  // Immediately push current state to the new subscriber
  listener({
    isRunning:   _isRunning,
    lastChecked: _lastChecked,
    countdown:   _countdown,
    results:     _results,
  });
  return () => _listeners.delete(listener);
}

/**
 * Register a getter so the service knows which system IDs to check.
 * Call this when the TargetSystemShow page mounts; pass null when it unmounts.
 */
export function registerSystemsGetter(getter: (() => string[]) | null) {
  _getSystemIds = getter;
}

/**
 * Trigger an immediate health check right now, outside the 5-min schedule.
 * Resets the countdown so the next scheduled check is 5 min from now.
 * Safe to call even if a check is already running — it will be a no-op.
 */
export async function runNow() {
  if (_isRunning) return;
  stopInterval();
  await runCheck();
  startInterval();
}

/**
 * Returns the current state snapshot (no subscription).
 */
export function getState(): HealthCheckState {
  return {
    isRunning:   _isRunning,
    lastChecked: _lastChecked,
    countdown:   _countdown,
    results:     _results,
  };
}

/**
 * Tear down all timers. Call only if you want to fully stop the service
 * (e.g. on logout). Re-call init() to restart.
 */
export function destroy() {
  stopTicker();
  stopInterval();
  _listeners.clear();
  _getSystemIds = null;
  // ── CHANGED: clear persisted state on full teardown (e.g. logout) ──
  try {
    sessionStorage.removeItem(LS_LAST_CHECKED_KEY);
    sessionStorage.removeItem(LS_NEXT_CHECK_KEY);
  } catch { /* ignore */ }
}

const healthCheckService = { init, subscribe, registerSystemsGetter, runNow, getState, destroy };
export default healthCheckService;