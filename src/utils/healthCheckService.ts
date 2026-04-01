/**
 * healthCheckService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * A singleton service that polls target-system health every N minutes.
 *
 * ── BUG FIXES IN THIS VERSION ──────────────────────────────────────────────
 *
 * FIX 1 — Timer skips check / restarts to 3 min near 0s:
 *   ROOT CAUSE: The ticker (`setInterval` every 1s) decrements `_countdown`
 *   independently of the `_firstCheckTimeoutId` setTimeout. When the ticker
 *   drives `_countdown` to 0, the UI shows "0:00" — but the actual check
 *   hasn't fired yet because the setTimeout hasn't triggered. Then the
 *   setTimeout fires, runs the check, and calls `startInterval()`. Meanwhile
 *   the ticker kept running and `_countdown` was already at 0 for several
 *   seconds before the check started. This caused a visible "stuck at 0:00"
 *   then a hard reset to full interval, making it look like the check was
 *   skipped.
 *   FIX: Remove the _firstCheckTimeoutId / two-path init entirely. Instead,
 *   the ticker itself drives the check: when `_countdown` hits 0 and no check
 *   is running, the ticker calls `runCheck()`. This guarantees the check always
 *   fires at exactly the moment the countdown reaches 0 — no race between two
 *   independent timers. The separate `setInterval` for scheduling is removed;
 *   the ticker IS the scheduler.
 *
 * FIX 2 — Changes within 10-15s remaining are ignored:
 *   ROOT CAUSE: `runNow()` called `stopInterval()` (clears `_intervalId`) but
 *   NOT `clearTimeout(_firstCheckTimeoutId)`. So if the page mounted and called
 *   `runNow()` while `_firstCheckTimeoutId` was still pending, the timeout
 *   would fire mid-check, see `_isRunning = true` in `runCheck()` (no-op
 *   guard) ... actually it bypassed the guard because runNow's runCheck() and
 *   the timeout's runCheck() were separate calls. This caused double-checks
 *   and the interval starting twice.
 *   FIX: With the unified ticker approach (FIX 1), there is no
 *   `_firstCheckTimeoutId` at all. `runNow()` just sets `_countdown = 0` and
 *   the ticker will fire the check on its next tick (within 1s). The `_isRunning`
 *   guard inside `runCheck()` prevents double-execution.
 *
 * FIX 3 — Sudden jump to 3 minutes mid-countdown:
 *   ROOT CAUSE: `setIntervalMinutes()` called `stopInterval()` but not
 *   `clearTimeout(_firstCheckTimeoutId)`. The pending first-check timeout
 *   would still fire after the new interval started, calling `startInterval()`
 *   a second time. Since `_intervalId` was already set by the first
 *   `startInterval()`, the second call returned early (guard) — but the
 *   timeout had already reset `_countdown = 0` and called `notify()`, making
 *   the UI flash to 0 then jump to the new full interval.
 *   FIX: No `_firstCheckTimeoutId` exists in the new design. `setIntervalMinutes`
 *   just updates `_intervalMinutes`, resets `_countdown`, saves, and notifies.
 *   The ticker picks up the new `_countdown` on its next tick automatically.
 *
 * ── OTHER PRESERVED FIXES (unchanged from previous version) ────────────────
 *
 * • `_results` cleared to [] after dispatch (notifyWithResults) so the per-
 *   second ticker notify() never re-sends a stale results batch.
 * • Per-request 20s timeout on testConnection so isRunning never hangs.
 * • sessionStorage persistence so countdown survives page refresh.
 * • _initialized flag (not _intervalId) as idempotency guard for init().
 */

import api from './api';

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface SystemHealthResult {
  id: string;
  newStatus: 'connected' | 'disconnected' | 'error';
}

export interface HealthCheckState {
  isRunning: boolean;
  lastChecked: Date | null;
  countdown: number;
  intervalMinutes: number;
  results: SystemHealthResult[];
}

type Listener = (state: HealthCheckState) => void;

/* ── Interval constants ─────────────────────────────────────────────────── */

const MIN_INTERVAL_MINUTES     = 3;
const DEFAULT_INTERVAL_MINUTES = 5;
const LS_INTERVAL_KEY          = 'hcs_interval_minutes';
const REQUEST_TIMEOUT_MS       = 20_000;

function loadIntervalMinutes(): number {
  try {
    const saved = localStorage.getItem(LS_INTERVAL_KEY);
    if (saved) {
      const n = parseInt(saved, 10);
      if (!isNaN(n) && n >= MIN_INTERVAL_MINUTES) return n;
    }
  } catch { /* ignore */ }
  return DEFAULT_INTERVAL_MINUTES;
}

let _intervalMinutes = loadIntervalMinutes();

function getIntervalSeconds() { return _intervalMinutes * 60; }

/* ── localStorage / sessionStorage keys ────────────────────────────────── */

const LS_LAST_CHECKED_KEY = 'hcs_lastChecked';
const LS_NEXT_CHECK_KEY   = 'hcs_nextCheck';

/* ── Internal state ─────────────────────────────────────────────────────── */

let _initialized  = false;

// ── FIX 1: single ticker — no separate _intervalId or _firstCheckTimeoutId.
//    The ticker both decrements the countdown AND fires runCheck() when it
//    hits 0. This eliminates the race between two independent timers.
let _tickerId:    ReturnType<typeof setInterval> | null = null;

let _isRunning    = false;
let _lastChecked: Date | null = null;
let _countdown    = getIntervalSeconds();
let _results:     SystemHealthResult[] = [];
let _listeners:   Set<Listener> = new Set();
let _getSystemIds: (() => string[]) | null = null;

/* ── sessionStorage helpers ─────────────────────────────────────────────── */

function saveCheckTimes() {
  try {
    if (_lastChecked) {
      sessionStorage.setItem(LS_LAST_CHECKED_KEY, _lastChecked.toISOString());
    }
    const nextCheck = new Date(Date.now() + _countdown * 1000);
    sessionStorage.setItem(LS_NEXT_CHECK_KEY, nextCheck.toISOString());
  } catch { /* ignore */ }
}

function loadSavedCountdown(): { countdown: number; lastChecked: Date | null } {
  try {
    const savedLastChecked = sessionStorage.getItem(LS_LAST_CHECKED_KEY);
    const savedNextCheck   = sessionStorage.getItem(LS_NEXT_CHECK_KEY);
    const lastChecked      = savedLastChecked ? new Date(savedLastChecked) : null;

    if (savedNextCheck) {
      const nextCheckTime  = new Date(savedNextCheck);
      const remainingMs    = nextCheckTime.getTime() - Date.now();

      if (remainingMs <= 0) {
        // Overdue — check immediately
        return { countdown: 0, lastChecked };
      }

      const remainingSeconds = Math.round(remainingMs / 1000);
      return { countdown: Math.min(remainingSeconds, getIntervalSeconds()), lastChecked };
    }
  } catch { /* ignore */ }

  return { countdown: getIntervalSeconds(), lastChecked: null };
}

/* ── Notify helpers ─────────────────────────────────────────────────────── */

function notify() {
  const state: HealthCheckState = {
    isRunning:       _isRunning,
    lastChecked:     _lastChecked,
    countdown:       _countdown,
    intervalMinutes: _intervalMinutes,
    results:         _results,
  };
  _listeners.forEach(fn => fn(state));
}

// Dispatches results to subscribers then immediately clears _results so
// subsequent per-second ticker notify() calls never re-send the same batch.
function notifyWithResults() {
  const resultsSnapshot = _results;
  _results = [];

  const state: HealthCheckState = {
    isRunning:       _isRunning,
    lastChecked:     _lastChecked,
    countdown:       _countdown,
    intervalMinutes: _intervalMinutes,
    results:         resultsSnapshot,
  };
  _listeners.forEach(fn => fn(state));
}

/* ── API helpers ────────────────────────────────────────────────────────── */

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

function testConnectionWithTimeout(id: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('timeout')),
      REQUEST_TIMEOUT_MS
    );
    api.targetSystems.testConnection(id)
      .then(r  => { clearTimeout(timer); resolve(r); })
      .catch(e => { clearTimeout(timer); reject(e);  });
  });
}

/* ── Core check ─────────────────────────────────────────────────────────── */

async function runCheck() {
  if (_isRunning) return; // already in progress — never double-run

  const ids = _getSystemIds ? _getSystemIds() : [];

  if (!ids.length) {
    // No systems registered — reset countdown and wait for next cycle.
    _countdown = getIntervalSeconds();
    saveCheckTimes();
    notify();
    return;
  }

  _isRunning = true;
  notify();

  const settled = await Promise.allSettled(
    ids.map(async (id): Promise<SystemHealthResult> => {
      try {
        const r = await testConnectionWithTimeout(id);
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

  // ── FIX 1: reset countdown to full interval after check completes.
  //    The ticker will pick this up naturally on its next tick.
  //    No need to call startInterval() — the ticker IS the scheduler now.
  _countdown = getIntervalSeconds();
  saveCheckTimes();
  notifyWithResults();
}

/* ── Unified ticker — the ONLY timer in the service ────────────────────────
 *
 *  FIX 1 implementation: one setInterval (the "ticker") does two jobs:
 *    1. Decrement _countdown every second and notify subscribers (UI updates).
 *    2. When _countdown reaches 0 and no check is running, fire runCheck().
 *
 *  This replaces the previous design that had a _firstCheckTimeoutId + a
 *  separate _intervalId running concurrently. Those two independent timers
 *  could drift apart, causing the race conditions described in FIX 1-3 above.
 *
 *  The ticker fires every 1000ms. If a check is in progress (_isRunning),
 *  the ticker still decrements _countdown (clamped to 0) but does NOT start
 *  another check — the _isRunning guard inside runCheck() handles that.
 *  Once runCheck() finishes, it resets _countdown to getIntervalSeconds() and
 *  the ticker resumes counting down from the full interval naturally.
 * ──────────────────────────────────────────────────────────────────────── */

function startTicker() {
  if (_tickerId) return; // already running
  _tickerId = setInterval(() => {
    if (_isRunning) {
      // A check is in flight — hold the countdown at 0, don't start another.
      _countdown = 0;
      saveCheckTimes();
      notify();
      return;
    }

    _countdown = Math.max(0, _countdown - 1);
    saveCheckTimes();
    notify();

    // ── FIX 1: this is the ONLY place a scheduled check is triggered.
    //    No separate setInterval or setTimeout races against this. ──
    if (_countdown === 0) {
      runCheck(); // async — does not block the ticker
    }
  }, 1_000);
}

function stopTicker() {
  if (_tickerId) {
    clearInterval(_tickerId);
    _tickerId = null;
  }
}

/* ── Public API ─────────────────────────────────────────────────────────── */

/**
 * Call once in your app entry-point (main.tsx / App.tsx).
 * Safe to call multiple times — idempotent.
 */
export function init() {
  if (_initialized) return;
  _initialized = true;

  const { countdown, lastChecked } = loadSavedCountdown();
  _countdown   = countdown;
  _lastChecked = lastChecked;

  // ── FIX 1: just start the ticker. The ticker will fire runCheck() as soon
  //    as _countdown hits 0. If countdown was already 0 (overdue), the ticker
  //    will fire runCheck() on its very first tick (within 1s).
  //    No _firstCheckTimeoutId needed — no race condition possible. ──
  startTicker();
}

/**
 * Subscribe to health-check state changes.
 * Returns an unsubscribe function.
 */
export function subscribe(listener: Listener): () => void {
  _listeners.add(listener);
  listener({
    isRunning:       _isRunning,
    lastChecked:     _lastChecked,
    countdown:       _countdown,
    intervalMinutes: _intervalMinutes,
    results:         _results,
  });
  return () => _listeners.delete(listener);
}

/**
 * Register a getter so the service knows which system IDs to check.
 */
export function registerSystemsGetter(getter: (() => string[]) | null) {
  _getSystemIds = getter;
}

/**
 * Trigger an immediate health check right now.
 *
 * FIX 2: Previously this called stopInterval() (didn't cancel
 * _firstCheckTimeoutId) + runCheck() + startInterval() — three operations
 * that could race with the pending first-check timeout.
 *
 * Now: just set _countdown = 0. The ticker will call runCheck() on its next
 * tick (within 1 second). The _isRunning guard prevents double-execution.
 * No timers are stopped or restarted — the ticker keeps running uninterrupted.
 */
export async function runNow() {
  if (_isRunning) return;
  _countdown = 0;
  saveCheckTimes();
  notify();
  // The ticker will fire runCheck() within 1s. We also call it directly here
  // for immediacy (the _isRunning guard ensures only one runs).
  await runCheck();
}

/**
 * Returns the current interval in minutes.
 */
export function getIntervalMinutes(): number {
  return _intervalMinutes;
}

/**
 * Update the health-check polling interval (minimum 3 minutes).
 *
 * FIX 3: Previously this called stopInterval() but not clearTimeout(
 * _firstCheckTimeoutId), so the pending timeout would fire and reset
 * _countdown + start a second interval loop.
 *
 * Now: no _firstCheckTimeoutId exists. Just update _intervalMinutes,
 * reset _countdown to the new full interval, save, and notify. The ticker
 * picks up the new _countdown on its next tick — no timers need restarting.
 */
export function setIntervalMinutes(minutes: number) {
  const clamped    = Math.max(MIN_INTERVAL_MINUTES, Math.round(minutes));
  _intervalMinutes = clamped;
  try {
    localStorage.setItem(LS_INTERVAL_KEY, String(clamped));
  } catch { /* ignore */ }

  // ── FIX 3: no stopInterval/startInterval needed — the ticker continues
  //    uninterrupted. Just reset the countdown to the new full interval. ──
  _countdown = getIntervalSeconds();
  saveCheckTimes();
  notify();
}

/**
 * Returns the current state snapshot (no subscription).
 */
export function getState(): HealthCheckState {
  return {
    isRunning:       _isRunning,
    lastChecked:     _lastChecked,
    countdown:       _countdown,
    intervalMinutes: _intervalMinutes,
    results:         _results,
  };
}

/**
 * Tear down all timers. Call on logout.
 * Re-call init() to restart.
 */
export function destroy() {
  stopTicker();
  _initialized = false;
  _listeners.clear();
  _getSystemIds = null;
  try {
    sessionStorage.removeItem(LS_LAST_CHECKED_KEY);
    sessionStorage.removeItem(LS_NEXT_CHECK_KEY);
  } catch { /* ignore */ }
}

const healthCheckService = {
  init,
  subscribe,
  registerSystemsGetter,
  runNow,
  getState,
  getIntervalMinutes,
  setIntervalMinutes,
  destroy,
};
export default healthCheckService;