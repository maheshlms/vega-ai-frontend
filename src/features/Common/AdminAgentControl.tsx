import React, { useState, useCallback, useEffect } from "react";
import ReactDOM from "react-dom";
import { 
  FaRobot, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaChartLine,
  FaClock,
  FaBolt,
  FaExclamationTriangle,
  FaPowerOff,
  FaUndo,
  FaDownload,
  FaSync,
  FaUsers,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaCircle,
  FaWifi,
} from "react-icons/fa";
import { MdSecurity, MdSpeed } from "react-icons/md";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';
import { auth } from '../../utils/auth';
import FloatingChat from '../chatbot/FloatingChat';
import { toast } from "react-toastify";
import { useTheme } from '../../state/ThemeContext';
import AgentToggleModal from "../agents/AgentToggleModal";  // shared component

// Scrollbar styles
const customStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
  .aad-font { font-family: 'DM Sans', sans-serif; }

  .aad-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #d1d5db #f1f5f9;
  }
  .aad-scrollbar::-webkit-scrollbar { width: 5px; }
  .aad-scrollbar::-webkit-scrollbar-track { background: #f9fafb; border-radius: 8px; }
  .aad-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 8px; }
  .aad-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }

  .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #d1d5db #f9fafb; }
  .light-scrollbar  { scrollbar-width: thin; scrollbar-color: #d1d5db #f9fafb; }

  .smooth-scroll {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    will-change: transform;
    transform: translateZ(0);
    backface-visibility: hidden;
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(0.85); }
  }
  .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }

  @keyframes dist-expand {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .dist-expand { animation: dist-expand 0.18s ease-out forwards; }

  @keyframes bar-fill {
    from { width: 0%; }
  }
  .bar-fill { animation: bar-fill 1s cubic-bezier(0.4,0,0.2,1) forwards; }

  /* ═══════════════════════════════════════════════════════
     GLOBAL BOX-SIZING GUARD
  ═══════════════════════════════════════════════════════ */
  .aad-font *, .aad-font *::before, .aad-font *::after {
    box-sizing: border-box;
  }

  /* ═══════════════════════════════════════════════════════
     FONT SMOOTHING FOR HEADINGS
  ═══════════════════════════════════════════════════════ */
  .aad-font h1, .aad-font h2, .aad-font h3 {
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  /* ═══════════════════════════════════════════════════════
     OVERFLOW PROTECTION FOR DYNAMIC TEXT
  ═══════════════════════════════════════════════════════ */
  .aad-font td, .aad-font .aad-dynamic-text {
    overflow-wrap: break-word;
    word-break: break-word;
  }

  /* ═══════════════════════════════════════════════════════
     IMAGES: ALWAYS FLUID
  ═══════════════════════════════════════════════════════ */
  .aad-font img {
    max-width: 100%;
    height: auto;
  }

  /* ═══════════════════════════════════════════════════════
     Z-INDEX SCALE
  ═══════════════════════════════════════════════════════ */
  .aad-font .aad-z-sticky   { z-index: 10; }
  .aad-font .aad-z-dropdown { z-index: 30; }
  .aad-font .aad-z-overlay  { z-index: 40; }
  .aad-font .aad-z-modal    { z-index: 50; }
  .aad-font .aad-z-toast    { z-index: 100; }

  /* ═══════════════════════════════════════════════════════
     PREVENT HORIZONTAL SCROLLBAR AT 1920PX
  ═══════════════════════════════════════════════════════ */
  .aad-font.min-h-screen {
    overflow-x: hidden;
  }

  /* ═══════════════════════════════════════════════════════
     OUTER PAGE WRAPPER
     1920px baseline: max-width 1400px, padding 48px
  ═══════════════════════════════════════════════════════ */
  .aad-page-wrapper {
    max-width: 1400px;
    margin-left: auto;
    margin-right: auto;
    padding-left: clamp(16px, 3vw, 48px);
    padding-right: clamp(16px, 3vw, 48px);
  }

  /* ═══════════════════════════════════════════════════════
     HEADER INNER WRAPPER
  ═══════════════════════════════════════════════════════ */
  .aad-header-wrapper {
    max-width: 1400px;
    margin-left: auto;
    margin-right: auto;
    padding-left: clamp(16px, 3vw, 48px);
    padding-right: clamp(16px, 3vw, 48px);
    padding-top: clamp(20px, 2.5vw, 40px);
    padding-bottom: clamp(16px, 2vw, 32px);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  /* ── H1 fluid scaling ── */
  .aad-h1-resp {
    font-size: clamp(22px, 2.5vw, 36px) !important;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  /* ═══════════════════════════════════════════════════════
     BREAKPOINT: Tablet 768–1023px
  ═══════════════════════════════════════════════════════ */
  @media (min-width: 768px) and (max-width: 1023px) {
    .aad-page-wrapper   { max-width: 100%; padding-left: 16px; padding-right: 16px; }
    .aad-header-wrapper { max-width: 100%; padding-left: 16px; padding-right: 16px; padding-top: 16px; padding-bottom: 14px; }
    .aad-h1-resp        { font-size: 1.625rem !important; }

    /* Stats: 3 cols at tablet */
    .aad-stats-grid-override { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }

    /* Charts shorter at tablet */
    .aad-chart-h80 { height: 200px; }

    /* List heights: shorter */
    .aad-rt-maxh   { max-height: 180px; }
    .aad-dist-maxh { max-height: 240px; }

    /* Details modal: full width */
    .aad-details-modal { max-width: calc(100vw - 32px); }

    /* Stat cards: 2-col at tablet */
    .aad-stat-cards-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }

    /* Stat card values: smaller */
    .aad-stat-card-value { font-size: 1.125rem; }
    .aad-stat-card-pad   { padding: 10px 12px; }

    /* Grid gaps: tighter */
    .aad-main-grid   { gap: 12px !important; }
    .aad-charts-grid { gap: 12px !important; }

    /* Touch targets: min 44px */
    .aad-font button,
    .aad-font a,
    .aad-font [role="button"] {
      min-height: 44px;
    }
    /* Exception: icon-only small utility buttons */
    .aad-font .aad-icon-btn-sm {
      min-height: unset;
    }

    /* Header action buttons: wrap at tablet */
    .aad-header-wrapper > div:last-child {
      flex-wrap: wrap;
      gap: 8px;
    }
  }

  /* ═══════════════════════════════════════════════════════
     BREAKPOINT: Small laptop 1024–1279px
  ═══════════════════════════════════════════════════════ */
  @media (min-width: 1024px) and (max-width: 1279px) {
    .aad-page-wrapper   { max-width: 100%; padding-left: 24px; padding-right: 24px; }
    .aad-header-wrapper { max-width: 100%; padding-left: 24px; padding-right: 24px; padding-top: 24px; padding-bottom: 20px; }
    .aad-h1-resp        { font-size: 1.875rem !important; }

    .aad-chart-h80    { height: 220px; }
    .aad-rt-maxh      { max-height: 210px; }
    .aad-dist-maxh    { max-height: 280px; }
    .aad-details-modal { max-width: 860px; }

    .aad-stat-card-value { font-size: 1.25rem; }
    .aad-stat-card-pad   { padding: 10px 12px; }

    .aad-main-grid   { gap: 14px !important; }
    .aad-charts-grid { gap: 14px !important; }

    .aad-header-wrapper > div:last-child {
      flex-wrap: wrap;
      gap: 8px;
    }
  }

  /* ═══════════════════════════════════════════════════════
     BREAKPOINT: Medium laptop 1280–1439px
  ═══════════════════════════════════════════════════════ */
  @media (min-width: 1280px) and (max-width: 1439px) {
    .aad-page-wrapper   { max-width: 1100px; padding-left: 28px; padding-right: 28px; }
    .aad-header-wrapper { max-width: 1100px; padding-left: 28px; padding-right: 28px; padding-top: 28px; padding-bottom: 22px; }
    .aad-h1-resp        { font-size: 2rem !important; }

    .aad-chart-h80     { height: 250px; }
    .aad-details-modal { max-width: 1000px; }

    .aad-stat-card-value { font-size: 1.375rem; }
    .aad-stat-card-pad   { padding: 10px 14px; }

    .aad-main-grid   { gap: 16px !important; }
    .aad-charts-grid { gap: 16px !important; }
  }

  /* ═══════════════════════════════════════════════════════
     BREAKPOINT: Large laptop 1440–1919px
  ═══════════════════════════════════════════════════════ */
  @media (min-width: 1440px) and (max-width: 1919px) {
    .aad-page-wrapper   { max-width: 1280px; padding-left: 36px; padding-right: 36px; }
    .aad-header-wrapper { max-width: 1280px; padding-left: 36px; padding-right: 36px; }

    .aad-chart-h80     { height: 270px; }
    .aad-details-modal { max-width: 1100px; }
  }

  /* ═══════════════════════════════════════════════════════
     BREAKPOINT: 1920px BASELINE — lock, nothing shifts
  ═══════════════════════════════════════════════════════ */
  @media (min-width: 1920px) and (max-width: 2559px) {
    .aad-page-wrapper   { max-width: 1400px; padding-left: 48px; padding-right: 48px; }
    .aad-header-wrapper { max-width: 1400px; padding-left: 48px; padding-right: 48px; padding-top: 40px; padding-bottom: 32px; }
    .aad-h1-resp        { font-size: 2.25rem !important; }

    .aad-chart-h80     { height: 300px; }
    .aad-rt-maxh       { max-height: 280px; }
    .aad-dist-maxh     { max-height: 380px; }
    .aad-details-modal { max-width: min(95vw, 1280px); }

    .aad-stat-card-value { font-size: 1.5rem; }
    .aad-stat-card-pad   { padding: 12px 16px; }
  }

  /* ═══════════════════════════════════════════════════════
     BREAKPOINT: QHD 2560–3839px
  ═══════════════════════════════════════════════════════ */
  @media (min-width: 2560px) and (max-width: 3839px) {
    .aad-page-wrapper   { max-width: 1800px; padding-left: 64px; padding-right: 64px; }
    .aad-header-wrapper { max-width: 1800px; padding-left: 64px; padding-right: 64px; padding-top: 52px; padding-bottom: 40px; }
    .aad-h1-resp        { font-size: 2.75rem !important; }

    .aad-stats-grid-override { gap: 16px !important; }
    .aad-chart-h80           { height: 380px; }
    .aad-rt-maxh             { max-height: 360px; }
    .aad-dist-maxh           { max-height: 500px; }
    .aad-details-modal       { max-width: 1600px; }

    .aad-stat-card-value { font-size: 1.75rem; }
    .aad-stat-card-pad   { padding: 16px 20px; }

    .aad-main-grid   { gap: 24px !important; }
    .aad-charts-grid { gap: 24px !important; }
  }

  /* ═══════════════════════════════════════════════════════
     BREAKPOINT: 4K 3840px+
  ═══════════════════════════════════════════════════════ */
  @media (min-width: 3840px) {
    .aad-page-wrapper   { max-width: 2400px; padding-left: 80px; padding-right: 80px; }
    .aad-header-wrapper { max-width: 2400px; padding-left: 80px; padding-right: 80px; padding-top: 64px; padding-bottom: 48px; }
    .aad-h1-resp        { font-size: 3.5rem !important; }

    .aad-stats-grid-override { gap: 20px !important; }
    .aad-chart-h80           { height: 480px; }
    .aad-rt-maxh             { max-height: 520px; }
    .aad-dist-maxh           { max-height: 680px; }
    .aad-details-modal       { max-width: 2200px; }

    .aad-stat-card-value { font-size: 2.25rem; }
    .aad-stat-card-pad   { padding: 22px 28px; }

    .aad-main-grid   { gap: 32px !important; }
    .aad-charts-grid { gap: 32px !important; }
  }

  /* ═══════════════════════════════════════════════════════
     CHART HEIGHT — fluid default (clamp handles 768–1919)
  ═══════════════════════════════════════════════════════ */
  .aad-chart-h80 { height: clamp(200px, 20vw, 300px); }

  /* ═══════════════════════════════════════════════════════
     SCROLLABLE LIST MAX-HEIGHTS — fluid default
  ═══════════════════════════════════════════════════════ */
  .aad-rt-maxh   { max-height: clamp(180px, 18vw, 280px); }
  .aad-dist-maxh { max-height: clamp(240px, 24vw, 380px); }

  /* ═══════════════════════════════════════════════════════
     DETAILS MODAL — safe at all sizes
  ═══════════════════════════════════════════════════════ */
  .aad-details-modal {
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
  }

  /* ═══════════════════════════════════════════════════════
     TASK OVERVIEW CARD — flex column, fills height
  ═══════════════════════════════════════════════════════ */
  .aad-task-overview-card {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
  }

  /* Chart wrapper: grows to fill remaining vertical space */
  .aad-chart-flex {
    flex: 1 1 0%;
    min-height: 180px;
  }

  /* ═══════════════════════════════════════════════════════
     STATS STRIP GRID — fluid gap
  ═══════════════════════════════════════════════════════ */
  .aad-stats-grid-override {
    gap: clamp(8px, 1vw, 12px) !important;
  }

  /* ═══════════════════════════════════════════════════════
     STAT CARD VALUE — fluid font
  ═══════════════════════════════════════════════════════ */
  .aad-stat-card-value {
    font-size: clamp(1.125rem, 1.5vw, 1.5rem);
  }

  /* ═══════════════════════════════════════════════════════
     STAT CARD PADDING — fluid
  ═══════════════════════════════════════════════════════ */
  .aad-stat-card-pad {
    padding: clamp(10px, 1vw, 16px) clamp(12px, 1.2vw, 16px);
  }

  /* ═══════════════════════════════════════════════════════
     MAIN CONTENT / CHARTS GRID GAPS — fluid
  ═══════════════════════════════════════════════════════ */
  .aad-main-grid   { gap: clamp(12px, 1.5vw, 20px) !important; }
  .aad-charts-grid { gap: clamp(12px, 1.5vw, 20px) !important; }

  /* ═══════════════════════════════════════════════════════
     FLEX CHILDREN WITH TRUNCATED TEXT: min-width: 0
  ═══════════════════════════════════════════════════════ */
  .aad-font .aad-rt-maxh > div > div {
    min-width: 0;
  }

  /* ═══════════════════════════════════════════════════════
     TABLE: horizontal scroll wrapper
  ═══════════════════════════════════════════════════════ */
  .aad-font .overflow-x-auto {
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: #d1d5db #f9fafb;
    -webkit-overflow-scrolling: touch;
  }
  .aad-font table {
    min-width: 600px;
  }

  /* ═══════════════════════════════════════════════════════
     DROPDOWN / TOOLTIP Z-INDEX
  ═══════════════════════════════════════════════════════ */
  .aad-font .fixed.inset-0 { z-index: 40; }
  .aad-font .absolute.right-0.top-full,
  .aad-font .absolute.left-1\/2.top-full {
    z-index: 50;
  }

  /* ═══════════════════════════════════════════════════════
     AGENT DISTRIBUTION CARD — auto height on small screens
  ═══════════════════════════════════════════════════════ */
  @media (min-width: 768px) and (max-width: 1279px) {
    .aad-font .h-150 {
      height: auto !important;
      min-height: 400px;
    }
  }

  /* ═══════════════════════════════════════════════════════
     DETAILS PANEL HEADER — button row wraps at tablet
  ═══════════════════════════════════════════════════════ */
  @media (min-width: 768px) and (max-width: 1023px) {
    .aad-details-modal .sticky.top-0 > div:first-child > div:first-child {
      flex-wrap: wrap;
      gap: 10px;
    }
    .aad-details-modal .sticky.top-0 > div:first-child > div:first-child > div:last-child {
      flex-wrap: wrap;
      gap: 6px;
    }
  }

  /* ═══════════════════════════════════════════════════════
     AGENT DETAIL MODAL — safe max-height + scrolling
     CRITICAL: The modal inner card must handle its own
     scroll. The outer overlay must NOT scroll — that's
     what causes the double-scrollbar in the screenshot.
  ═══════════════════════════════════════════════════════ */
  .aad-font .fixed.inset-0 > .bg-white.rounded-2xl,
  .aad-font .fixed.inset-0 > .bg-white.max-w-2xl {
    max-height: 90vh;
    overflow-y: auto;
  }

  /* Hide the outer overlay scrollbar — only inner card scrolls */
  .aad-font .fixed.inset-0.overflow-y-auto {
    scrollbar-width: none;
  }
  .aad-font .fixed.inset-0.overflow-y-auto::-webkit-scrollbar {
    display: none;
  }

  /* QHD: agent detail modal wider */
  @media (min-width: 2560px) and (max-width: 3839px) {
    .aad-font .fixed.inset-0 > .bg-white.max-w-2xl {
      max-width: 860px;
    }
  }
  @media (min-width: 3840px) {
    .aad-font .fixed.inset-0 > .bg-white.max-w-2xl {
      max-width: 1100px;
    }
  }

  /* ═══════════════════════════════════════════════════════
     RESPONSE TIME CARD — name column fluid width
  ═══════════════════════════════════════════════════════ */
  @media (min-width: 768px) and (max-width: 1279px) {
    .aad-font .aad-rt-maxh .w-28 {
      width: clamp(80px, 10vw, 112px);
    }
  }

  /* ═══════════════════════════════════════════════════════
     LINE HEIGHT: unitless everywhere
  ═══════════════════════════════════════════════════════ */
  .aad-font p, .aad-font span, .aad-font div {
    line-height: inherit;
  }
  .aad-font h1 { line-height: 1.15; }
  .aad-font h2 { line-height: 1.2;  }
  .aad-font h3 { line-height: 1.25; }
`;

// ─── Types ───────────────────────────────────────────────────────────────────

interface Agent {
  id: string;
  _id: string;
  name: string;
  type: string;
  status: string;
  isActive: boolean;
  permission: string;
  environment?: string;
  checkInterval?: number;
  lastActivity: string;
  createdBy: string;
  lastUsed: string;
  tasksCompleted: number;
  tasksGiven: number;
  tasksInProcess: number;
  tasksFailed: number;
  successRate: number;
  responseTime: number;
  killswitchActivated: boolean;
  killswitchActivatedBy?: string;
  killswitchReason?: string;
  killswitchActivatedAt?: string;
  softDeleted: boolean;
  avatarUrl?: string;
  avatarId?: string;
}

interface RemoteAgent {
  id: string;
  _id?: string;
  name: string;
  type: string;
  status?: string;
  permission?: string;
  config?: { environment?: string; selectedAvatarImg?: string; selectedAvatarId?: string; selectedAvatarName?: string; };
  checkInterval?: number;
  lastActivity?: string;
  created_by?: string;
  last_used_at?: string;
  killswitch_activated?: boolean;
  killswitch_activated_by?: string;
  killswitch_reason?: string;
  killswitch_activated_at?: string;
  soft_deleted?: boolean;
  tasks_completed?: number;
  tasks_given?: number;
  tasks_in_process?: number;
  tasks_failed?: number;
  success_rate?: number;
  response_time?: number;
  avatar_url?: string;
}

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unreachable' | 'loading';

interface ServiceCheck {
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unreachable';
  latency_ms?: number;
  error?: string;
  http_status?: number;
}

interface SystemHealthState {
  overall: HealthStatus;
  checks: {
    backend?: ServiceCheck;
    database?: ServiceCheck;
    audit_service?: ServiceCheck;
  };
  lastChecked: Date | null;
  isChecking: boolean;
}

interface ActivityDataPoint {
  day: string;
  fullDate: string;
  tasksCompleted: number;
  tasksGiven: number;
  tasksInProcess: number;
  tasksFailed: number;
}

interface EnvironmentStats { [key: string]: number; }
interface TypeStats { [key: string]: number; }

interface DailyMetrics {
  agent_id: string;
  date: string;
  total_tasks: number;
  successful_tasks: number;
  failed_tasks: number;
  avg_response_time_ms: number;
  min_response_time_ms: number;
  max_response_time_ms: number;
  success_rate: number;
}

interface AgentMetrics {
  agent_id: string;
  total_tasks: number;
  successful_tasks: number;
  failed_tasks: number;
  overall_success_rate: number;
  avg_response_time_ms: number;
  min_response_time_ms: number;
  max_response_time_ms: number;
}

interface DashboardMetricsResponse {
  daily_metrics_past_7_days: DailyMetrics[];
  agent_metrics: AgentMetrics[];
  timestamp: string;
}

// ─── Session Timer Hook ───────────────────────────────────────────────────────
// Derives the session start time directly from the JWT token's `iat` (issued-at)
// claim. This means the timer is always tied to when the token was issued —
// i.e. when the user logged in. No sessionStorage needed; logout → new token →
// new iat → timer resets to 00m 00s automatically on every fresh login.

const getTokenIssuedAt = (): number => {
  try {
    const token = auth.getToken();
    if (!token) return Date.now();
    const payload = token.split('.')[1];
    if (!payload) return Date.now();
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const { iat } = JSON.parse(json);
    if (typeof iat === 'number' && iat > 0) return iat * 1000;
  } catch {
    // malformed token — fall back to now
  }
  return Date.now();
};

const useSessionTimer = () => {
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    const start = getTokenIssuedAt();

    const tick = () => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const hours   = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  const formatted = hours > 0
    ? `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
    : `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;

  return { formatted, elapsed };
};

// clearSessionTimer is kept for backward compatibility (no-op now since we
// derive time from the token itself — nothing to clear)
export const clearSessionTimer = () => {};

// ─── Avatar Image Resolver ────────────────────────────────────────────────────
const resolveAgentAvatarUrl = (name: string, avatarId?: string, storedImg?: string): string => {
  if (storedImg && !storedImg.match(/\.(mp4|webm|mov)(\?|$)/i)) return storedImg;
  if (avatarId && avatarId.trim()) return `/avatars/${avatarId.trim()}.webp`;

  const rawName = name.trim();
  const firstWord = rawName.split(/[\s(]/)[0];
  const parenMatch = rawName.match(/\(([^)]+)\)/);
  const parenStyle = parenMatch ? parenMatch[1].replace(/\s+/g, '') : null;
  const withoutFirst = rawName.replace(firstWord, '').replace(/agent/gi, '').replace(/\([^)]*\)/g, '').trim();
  const styleWords = withoutFirst.split(/\s+/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');

  const style = parenStyle
    ? parenStyle.charAt(0).toUpperCase() + parenStyle.slice(1).toLowerCase() + 'Look'
    : styleWords
    ? styleWords + (styleWords.toLowerCase().includes('look') ? '' : 'Look')
    : 'ProfessionalLook';

  return `/avatars/${firstWord}_${style}_public.webp`;
};

// ─── Agent Avatar Component ───────────────────────────────────────────────────
interface AgentAvatarProps {
  agent: { name: string; avatarUrl?: string; avatarId?: string; isActive: boolean; killswitchActivated: boolean; softDeleted: boolean };
  size?: 'sm' | 'md' | 'lg';
}

const AgentAvatar: React.FC<AgentAvatarProps> = ({ agent, size = 'md' }) => {
  const [imgError, setImgError] = React.useState(false);
  const isDisabled = agent.killswitchActivated || agent.softDeleted;
  const resolvedUrl = agent.avatarUrl || resolveAgentAvatarUrl(agent.name, agent.avatarId);
  const isInactive = !agent.isActive || isDisabled;

  const sizeClasses: Record<string, string> = {
    sm: 'w-10 h-10 text-[11px]',
    md: 'w-10 h-10 text-[12px]',
    lg: 'w-16 h-16 text-xl',
  };

  const initials = agent.name
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .join('');

  const bgColor = isDisabled ? 'bg-red-100' : isInactive ? 'bg-gray-200' : 'bg-green-100';
  const textColor = isDisabled ? 'text-red-500' : isInactive ? 'text-gray-400' : 'text-green-700';

  if (resolvedUrl && !imgError) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 bg-gray-100`}>
        <img
          src={resolvedUrl}
          alt={agent.name}
          className={`w-full h-full object-cover object-top ${isInactive ? 'grayscale opacity-60' : ''}`}
          style={{ objectPosition: '50% 10%' }}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center flex-shrink-0 font-bold ${bgColor} ${textColor} ${isInactive ? 'opacity-70' : ''}`}>
      {initials ? initials : <FaRobot className={size === 'lg' ? 'text-2xl' : 'text-sm'} />}
    </div>
  );
};

// ─── Export Helper ────────────────────────────────────────────────────────────
const exportAgentsCSV = (agents: Agent[]) => {
  const headers = ['Name','Type','Status','Environment','Tasks Completed','Success Rate','Response Time','Created By','Last Activity'];
  const rows = agents.map(a => [
    a.name, a.type,
    a.killswitchActivated ? 'Disabled' : a.softDeleted ? 'Deleted' : a.isActive ? 'Active' : 'Inactive',
    a.environment || 'N/A',
    a.tasksCompleted, `${a.successRate}%`, `${(a.responseTime / 1000).toFixed(2)}s`,
    a.createdBy,
    new Date(a.lastActivity).toLocaleString()
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `agents-export-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Health Status Helpers ────────────────────────────────────────────────────
const getHealthColors = (status: HealthStatus) => {
  switch (status) {
    case 'healthy':
      return { bg: 'bg-green-50 border-green-200', text: 'text-green-700', dot: 'bg-green-500', badge: 'bg-green-100 text-green-800 border-green-200', label: 'Healthy' };
    case 'degraded':
      return { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', dot: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Degraded' };
    case 'unhealthy':
      return { bg: 'bg-red-50 border-red-200', text: 'text-red-700', dot: 'bg-red-500', badge: 'bg-red-100 text-red-800 border-red-200', label: 'Unhealthy' };
    case 'unreachable':
      return { bg: 'bg-red-50 border-red-200', text: 'text-red-700', dot: 'bg-red-500', badge: 'bg-red-100 text-red-800 border-red-200', label: 'Unreachable' };
    case 'loading':
    default:
      return { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-500', dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Checking…' };
  }
};

// ─── Health Detail Tooltip Component ─────────────────────────────────────────
interface HealthTooltipProps {
  health: SystemHealthState;
  onRefresh: () => void;
}

const HealthTooltip: React.FC<HealthTooltipProps> = ({ health, onRefresh }) => {
  const [open, setOpen] = useState(false);
  const colors = getHealthColors(health.overall);

  const serviceIcon = (s?: ServiceCheck) => {
    if (!s) return <FaCircle className="text-gray-300 text-[8px]" />;
    if (s.status === 'healthy')  return <FaCircle className="text-green-500 text-[8px]" />;
    if (s.status === 'degraded') return <FaCircle className="text-yellow-500 text-[8px]" />;
    return <FaCircle className="text-red-500 text-[8px]" />;
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className={`px-4 py-2 rounded-xl border ${colors.bg} transition-all hover:shadow-sm flex items-center gap-2`}>
        <div>
          <div className="text-[11px] text-gray-500 mb-1 font-medium flex items-center gap-1.5">
            <FaWifi className="text-xs" /> System
          </div>
          <div className={`text-[13px] font-semibold flex items-center gap-1.5 ${colors.text}`}>
            {health.overall === 'loading' ? (
              <span className="inline-block w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
            ) : (
              <span className={`inline-block w-2 h-2 rounded-full ${colors.dot} ${health.overall === 'healthy' ? 'pulse-dot' : ''}`} />
            )}
            {colors.label}
          </div>
        </div>
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform duration-200 flex-shrink-0 mt-1 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className={`px-4 py-3 border-b border-gray-100 flex items-center justify-between ${colors.bg}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${colors.dot} ${health.overall === 'healthy' ? 'pulse-dot' : ''}`} />
                <span className={`text-sm font-bold ${colors.text}`}>System {colors.label}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onRefresh(); }} disabled={health.isChecking} className="p-1.5 rounded-lg hover:bg-white/60 transition-colors" title="Re-check health">
                <FaSync className={`text-xs text-gray-500 ${health.isChecking ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2.5">
                  {serviceIcon(health.checks.backend)}
                  <div>
                    <div className="text-[12px] font-semibold text-gray-800">Backend API</div>
                    <div className="text-[10px] text-gray-400">REST service</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-[11px] font-semibold capitalize ${health.checks.backend?.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                    {health.checks.backend?.status ?? '—'}
                  </div>
                  {health.checks.backend?.latency_ms !== undefined && (
                    <div className="text-[10px] text-gray-400">{health.checks.backend.latency_ms} ms</div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2.5">
                  {serviceIcon(health.checks.database)}
                  <div>
                    <div className="text-[12px] font-semibold text-gray-800">Database</div>
                    <div className="text-[10px] text-gray-400">MongoDB</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-[11px] font-semibold capitalize ${health.checks.database?.status === 'healthy' ? 'text-green-600' : health.checks.database?.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'}`}>
                    {health.checks.database?.status ?? '—'}
                  </div>
                  {health.checks.database?.latency_ms !== undefined && (
                    <div className="text-[10px] text-gray-400">{health.checks.database.latency_ms} ms</div>
                  )}
                </div>
              </div>
              {health.checks.audit_service && (
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    {serviceIcon(health.checks.audit_service)}
                    <div>
                      <div className="text-[12px] font-semibold text-gray-800">Audit Service</div>
                      <div className="text-[10px] text-gray-400">Log pipeline</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[11px] font-semibold capitalize ${health.checks.audit_service.status === 'healthy' ? 'text-green-600' : health.checks.audit_service.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'}`}>
                      {health.checks.audit_service.status}
                    </div>
                    {health.checks.audit_service.latency_ms !== undefined && (
                      <div className="text-[10px] text-gray-400">{health.checks.audit_service.latency_ms} ms</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
              <div className="text-[10px] text-gray-400 text-center">
                {health.isChecking ? 'Checking…' : health.lastChecked ? `Last checked ${health.lastChecked.toLocaleTimeString()}` : 'Not yet checked'}
                {' · '}<span className="text-gray-400">auto-refreshes every 10s</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Response Time Info Tooltip ───────────────────────────────────────────────
const RtInfoTooltip: React.FC = () => {
  const [open, setOpen] = useState(false);

  const tiers = [
    { color: '#22C55E', label: 'Excellent', range: '< 2s',      desc: 'Agent is responding very fast.' },
    { color: '#3B82F6', label: 'Good',      range: '2s – 5s',   desc: 'Normal operating range.' },
    { color: '#EAB308', label: 'Fair',      range: '5s – 10s',  desc: 'Agent is performing slightly slow.' },
    { color: '#EF4444', label: 'Poor',      range: '> 10s',     desc: 'Response time is high.' },
  ];

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(v => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-[18px] h-[18px] rounded-full border-2 border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 flex items-center justify-center transition-all duration-150 text-[10px] font-black focus:outline-none"
        title="How response time is rated"
      >
        i
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div className="text-[12px] font-bold text-gray-700 flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[9px] font-black flex-shrink-0">i</span>
                How Response Time is Rated
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Based on the average response time of each agent's last telemetry reading.
              </p>
            </div>
            <div className="p-3 space-y-2">
              {tiers.map(t => (
                <div key={t.label} className="flex items-start gap-3 px-3 py-2 rounded-xl" style={{ background: `${t.color}0d` }}>
                  <div className="w-3 h-3 rounded-sm flex-shrink-0 mt-0.5" style={{ background: t.color }} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-gray-800">{t.label}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: `${t.color}22`, color: t.color }}>
                        {t.range}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
              <p className="text-[10px] text-gray-400">
                Agents showing <span className="font-semibold text-gray-500">N/A</span> have no telemetry data yet.
                Disabled agents are always shown in gray.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Response Time Card ───────────────────────────────────────────────────────
interface ResponseTimeCardProps {
  agents: Agent[];
  getSortedAgents: (list: Agent[]) => Agent[];
  getAgentResponseTimeFromTelemetry: (id: string) => number | null;
}

const ResponseTimeCard: React.FC<ResponseTimeCardProps> = ({
  agents,
  getSortedAgents,
  getAgentResponseTimeFromTelemetry,
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [rtFilter, setRtFilter] = useState<'all' | 'active' | 'killed' | 'standby'>('all');

  const handleFilterChange = (key: 'all' | 'active' | 'killed' | 'standby') => {
    setRtFilter(key);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const maxRt = Math.max(
    ...agents.map(agent => {
      const tRT = getAgentResponseTimeFromTelemetry(agent.id);
      return tRT !== null ? tRT : agent.responseTime;
    }).filter(rt => rt > 0),
    1
  );

  const filteredAgents = getSortedAgents(agents).filter(agent => {
    const tRT = getAgentResponseTimeFromTelemetry(agent.id);
    const rt  = tRT !== null ? tRT : agent.responseTime;
    const hasResponseTime = rt > 0;
    if (rtFilter === 'standby') return !hasResponseTime;
    if (rtFilter === 'killed') return agent.killswitchActivated && hasResponseTime;
    if (rtFilter === 'active') return agent.isActive && !agent.killswitchActivated && !agent.softDeleted && hasResponseTime;
    return hasResponseTime;
  });

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col">
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[17px] font-bold text-[#0A0A0A] tracking-tight">Response Time Analysis</h3>
            <RtInfoTooltip />
          </div>
          <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-md">{agents.length} agents</span>
        </div>
        <p className="text-[12.5px] text-gray-500">Average response times by agent</p>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        {([
          { key: 'all',     label: 'All',      dot: 'bg-gray-400'  },
          { key: 'active',  label: 'Active',   dot: 'bg-green-500' },
          { key: 'killed',  label: 'Disabled', dot: 'bg-red-500'   },
          { key: 'standby', label: 'Standby',  dot: 'bg-gray-300'  },
        ] as const).map(f => (
          <button
            key={f.key}
            onClick={() => handleFilterChange(f.key)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
              rtFilter === f.key
                ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${rtFilter === f.key ? 'bg-white' : f.dot}`} />
            {f.label}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto aad-rt-maxh pr-2 space-y-3 aad-scrollbar">
        {filteredAgents.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-[13px] text-gray-400">
            No agents match this filter
          </div>
        ) : filteredAgents.map(agent => {
          const tRT = getAgentResponseTimeFromTelemetry(agent.id);
          const rt  = tRT !== null ? tRT : agent.responseTime;

          const barWidth = rt === 0 ? '8%' : `${Math.max((rt / maxRt) * 100, 8)}%`;

          const barColor = agent.killswitchActivated || agent.softDeleted
            ? 'bg-gray-300'
            : rt === 0   ? 'bg-gray-200'
            : rt < 2000  ? 'bg-green-500'
            : rt < 5000  ? 'bg-blue-500'
            : rt < 10000 ? 'bg-yellow-500'
            : 'bg-red-500';

          const valueColor = agent.killswitchActivated || agent.softDeleted
            ? 'text-gray-400'
            : rt === 0   ? 'text-gray-400'
            : rt < 2000  ? 'text-green-600'
            : rt < 5000  ? 'text-blue-600'
            : rt < 10000 ? 'text-yellow-600'
            : 'text-red-600';

          const rtLabel = rt > 0 ? `${(rt / 1000).toFixed(2)}s` : 'N/A';

          return (
            <div
              key={agent.id}
              className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
                agent.killswitchActivated || agent.softDeleted ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex-shrink-0">
                <AgentAvatar agent={agent} size="sm" />
              </div>
              <div className="w-28 flex-shrink-0">
                <div className={`text-[13px] font-medium truncate ${
                  agent.killswitchActivated || agent.softDeleted ? 'text-gray-400' : 'text-[#0A0A0A]'
                }`}>
                  {agent.name}
                </div>
                <div className="text-[11px] text-gray-400">{agent.type}</div>
              </div>
              <div className="flex-1 bg-gray-100 rounded-full h-2 relative overflow-hidden">
                <div className={`h-2 rounded-full transition-all duration-700 ${barColor}`} style={{ width: barWidth }} />
              </div>
              <div className="flex-shrink-0 w-14 text-right">
                <span className={`text-[12px] font-semibold ${valueColor}`}>{rtLabel}</span>
              </div>
              {agent.killswitchActivated && (
                <span className="flex-shrink-0 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">Disabled</span>
              )}
              {agent.softDeleted && !agent.killswitchActivated && (
                <span className="flex-shrink-0 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-300">Deleted</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-3">
          {[
            { color: 'bg-green-500',  hex: '#22C55E', label: 'Excellent', sub: '< 2s',     desc: 'Agent is responding very fast.' },
            { color: 'bg-blue-500',   hex: '#3B82F6', label: 'Good',      sub: '2s – 5s',  desc: 'Normal operating range.' },
            { color: 'bg-yellow-500', hex: '#EAB308', label: 'Fair',      sub: '5s – 10s', desc: 'Agent is performing slightly slow.' },
            { color: 'bg-red-500',    hex: '#EF4444', label: 'Poor',      sub: '> 10s',    desc: 'Response time is high.' },
          ].map(item => (
            <div key={item.label} className="relative group flex items-center gap-2 cursor-default">
              <div className={`w-4 h-4 ${item.color} rounded flex-shrink-0`} />
              <div>
                <div className="text-xs font-semibold text-gray-900">{item.label}</div>
                <div className="text-xs text-gray-500">{item.sub}</div>
              </div>
              <div className="pointer-events-none absolute bottom-full left-0 mb-2 w-52 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  <div className="h-1 w-full" style={{ background: item.hex }} />
                  <div className="px-3 py-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: item.hex }} />
                      <span className="text-[12px] font-bold text-gray-900">{item.label}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md ml-auto" style={{ background: `${item.hex}18`, color: item.hex }}>
                        {item.sub}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-snug">{item.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Agent Distribution Card ──────────────────────────────────────────────────
interface ProductDefinition {
  key: string;
  label: string;
  accentBg: string;
  accentBorder: string;
  barEnv: string;
  barType: string;
  dotColor: string;
  iconLetter: string;
}

const PRODUCT_REGISTRY: ProductDefinition[] = [
  { key: 'pingfederate',  label: 'PingFederate',  accentBg: 'bg-blue-50',    accentBorder: 'border-blue-200',    barEnv: 'bg-blue-500',    barType: 'bg-blue-400',    dotColor: 'bg-blue-500',    iconLetter: 'F' },
  { key: 'pingdirectory', label: 'PingDirectory', accentBg: 'bg-violet-50',  accentBorder: 'border-violet-200',  barEnv: 'bg-violet-500',  barType: 'bg-violet-400',  dotColor: 'bg-violet-500',  iconLetter: 'D' },
  { key: 'pingone',       label: 'PingOne',       accentBg: 'bg-emerald-50', accentBorder: 'border-emerald-200', barEnv: 'bg-emerald-500', barType: 'bg-emerald-400', dotColor: 'bg-emerald-500', iconLetter: '1' },
];

interface ProductGroup extends ProductDefinition {
  agents: Agent[];
  envStats: EnvironmentStats;
  typeStats: TypeStats;
}

interface AgentDistributionCardProps {
  agents: Agent[];
  totalAgents: number;
  environmentStats: EnvironmentStats;
  typeStats: TypeStats;
}

const AgentDistributionCard: React.FC<AgentDistributionCardProps> = ({ agents, totalAgents }) => {
  const [expandedKey, setExpandedKey] = useState<string | null>(PRODUCT_REGISTRY[0]?.key ?? null);

  const productGroups: ProductGroup[] = React.useMemo(() => {
    const buckets: ProductGroup[] = PRODUCT_REGISTRY.map(p => ({ ...p, agents: [], envStats: {}, typeStats: {} }));
    agents.forEach(agent => {
      const haystack = `${agent.name} ${agent.type}`.toLowerCase();
      const matched = buckets.filter(b => haystack.includes(b.key)).sort((a, b) => b.key.length - a.key.length)[0];
      const target = matched ?? buckets[0];
      target.agents.push(agent);
      const env = agent.environment || 'Unknown';
      target.envStats[env] = (target.envStats[env] || 0) + 1;
      target.typeStats[agent.type] = (target.typeStats[agent.type] || 0) + 1;
    });
    return buckets.filter(b => b.agents.length > 0);
  }, [agents]);

  const renderBars = (entries: [string, number][], max: number, barClass: string, label: string) => (
    <div>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</div>
      <div className="space-y-2">
        {entries.map(([name, count]) => (
          <div key={name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] font-medium text-[#0A0A0A] truncate max-w-[120px]">{name}</span>
              <span className="text-[12px] font-bold text-[#0A0A0A] ml-2 flex-shrink-0">{count}</span>
            </div>
            <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className={`${barClass} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${Math.max((count / max) * 100, 4)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 h-150">
      <div>
        <h3 className="text-[17px] font-bold text-[#0A0A0A] tracking-tight mb-1">Agent Distribution</h3>
        <p className="text-[12.5px] text-gray-500">By product, environment and type</p>
      </div>
      <div className="flex items-center gap-3">
        {productGroups.map(g => (
          <div key={g.key} title={`${g.label}: ${g.agents.length} agents`}
            className={`h-1.5 rounded-full ${g.dotColor} transition-all duration-700`}
            style={{ width: `${totalAgents > 0 ? (g.agents.length / totalAgents) * 100 : 0}%`, minWidth: g.agents.length > 0 ? '4px' : '0' }}
          />
        ))}
        <span className="text-[11px] text-gray-400 flex-shrink-0 ml-auto">{totalAgents} total</span>
      </div>
      <div className="space-y-2 aad-scrollbar pr-1 flex-1">
        {productGroups.map(group => {
          const isOpen = expandedKey === group.key;
          const envEntries  = Object.entries(group.envStats);
          const typeEntries = Object.entries(group.typeStats);
          const maxEnv  = Math.max(...envEntries.map(([, v]) => v),  1);
          const maxType = Math.max(...typeEntries.map(([, v]) => v), 1);
          const activeCount = group.agents.filter(a => a.isActive && !a.killswitchActivated && !a.softDeleted).length;

          return (
            <div key={group.key} className={`rounded-xl border ${group.accentBorder} overflow-hidden`}>
              <button
                onClick={() => setExpandedKey(isOpen ? null : group.key)}
                className={`w-full flex items-center justify-between px-3.5 py-3 text-left ${group.accentBg} hover:brightness-[0.97] transition-all`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[#0A0A0A] truncate">{group.label}</div>
                    <div className="text-[10px] text-gray-400">{activeCount} active · {group.agents.length} total</div>
                  </div>
                </div>
                <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && (
                <div className="dist-expand px-4 pb-4 pt-3 bg-white space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className={`${group.dotColor} h-1.5 rounded-full transition-all duration-700`}
                        style={{ width: `${group.agents.length > 0 ? (activeCount / group.agents.length) * 100 : 0}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{activeCount}/{group.agents.length} active</span>
                  </div>
                  {envEntries.length > 0 && renderBars(
                    envEntries.map(([name, count]) => [`${name.charAt(0).toUpperCase() + name.slice(1)} Agents`, count] as [string, number]),
                    maxEnv, group.barEnv, 'Environments',
                  )}
                  {typeEntries.length > 0 && renderBars(typeEntries, maxType, group.barType, 'Agent Types')}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1.5">
        {productGroups.map(g => (
          <div key={g.key} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${g.dotColor}`} />
            <span className="text-[11px] text-gray-500">{g.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Stat Card with fixed-position tooltip (escapes sidebar overflow:hidden) ──
interface StatCardProps {
  s: { label: string; value: string | number; bg: string; color: string; tooltip: { title: string; desc: string } };
  Icon: React.ElementType;
}
const StatCard: React.FC<StatCardProps> = ({ s, Icon }) => {
  const [visible, setVisible] = React.useState(false);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const TOOLTIP_W = 240;

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    let x = rect.left + rect.width / 2 - TOOLTIP_W / 2;
    if (x < 8) x = 8;
    if (x + TOOLTIP_W > window.innerWidth - 8) x = window.innerWidth - TOOLTIP_W - 8;
    setPos({ x, y: rect.top - 8 });
    setVisible(true);
  };

  return (
    <div
      className="relative flex items-center gap-3 bg-gray-100 rounded-xl p-4 border border-gray-100 cursor-default"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setVisible(false)}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
        <Icon style={{ color: s.color }} size={17} />
      </div>
      <div>
        <div className="text-xl font-bold text-[#0A0A0A]">{s.value}</div>
        <div className="text-[11px] text-gray-400 mt-0.5">{s.label}</div>
      </div>
      {visible && ReactDOM.createPortal(
        <div
          style={{
            position: "fixed",
            left: pos.x,
            top: pos.y,
            width: TOOLTIP_W,
            zIndex: 99999,
            transform: "translateY(-100%)",
            pointerEvents: "none",
          }}
        >
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            <div className="h-1 w-full" style={{ background: s.color }} />
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                <span className="text-[12px] font-bold text-gray-900">{s.tooltip.title}</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-snug">{s.tooltip.desc}</p>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white" />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminAgentControl: React.FC = () => {
  const { isDark } = useTheme();
  const { formatted: sessionTime, elapsed: sessionElapsed } = useSessionTimer();

  const [agents, setAgents]   = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [systemHealth, setSystemHealth] = useState<SystemHealthState>({
    overall: 'loading', checks: {}, lastChecked: null, isChecking: false,
  });

  const [selectedAgent,     setSelectedAgent]     = useState<Agent | null>(null);
  const [showAgentModal,    setShowAgentModal]     = useState<boolean>(false);
  const [showDetailsPanel,  setShowDetailsPanel]   = useState<boolean>(false);
  const [detailsFilter,     setDetailsFilter]      = useState<'all'|'active'|'inactive'|'killed'>('all');
  const [detailsSortField,  setDetailsSortField]   = useState<'name'|'successRate'|'responseTime'|'tasksCompleted'>('name');
  const [detailsSortDir,    setDetailsSortDir]     = useState<'asc'|'desc'>('asc');
  const [detailsRefreshing, setDetailsRefreshing]  = useState<boolean>(false);

  // ── Shared modal state (replaces showKillswitchModal + showReenableModal) ──
  const [toggleModal, setToggleModal] = useState<{
    mode: 'disable' | 'enable';
    agent: Agent;
    loading: boolean;
  } | null>(null);

  const [telemetryLoading, setTelemetryLoading] = useState<boolean>(true);
  const [telemetryData,    setTelemetryData]    = useState<DashboardMetricsResponse | null>(null);
  const [telemetryError,   setTelemetryError]   = useState<string | null>(null);

  const isAdmin = auth.isAdmin();

  const fetchSystemHealth = async () => {
    setSystemHealth(prev => ({ ...prev, isChecking: true }));

    // Run backend and audit-service health checks in parallel
    const [backendResult, auditResult] = await Promise.allSettled([
      api.fetchWithAuth('/api/v1/health'),
      api.auditHealthCheck(),
    ]);

    // ── Parse backend response ───────────────────────────────────────────────
    let checks: SystemHealthState['checks'] = {};
    let overall: HealthStatus = 'unhealthy';

    if (backendResult.status === 'fulfilled' && backendResult.value.ok) {
      const data = await backendResult.value.json();
      checks = data.checks || {};
      overall = data.status as HealthStatus;
    } else if (backendResult.status === 'fulfilled') {
      checks.backend = { status: 'unhealthy', error: `HTTP ${backendResult.value.status}` };
    } else {
      checks.backend = { status: 'unreachable', error: 'Cannot reach backend' };
    }

    // ── Parse audit service response ─────────────────────────────────────────
    if (auditResult.status === 'fulfilled' && auditResult.value.ok) {
      checks.audit_service = { status: 'healthy' };
    } else if (auditResult.status === 'fulfilled') {
      checks.audit_service = { status: 'unreachable', error: `HTTP ${auditResult.value.status}` };
    } else {
      checks.audit_service = { status: 'unreachable', error: 'Cannot reach audit service' };
    }

    // ── Derive overall status from all checks ────────────────────────────────
    const statuses = Object.values(checks).map(c => c?.status);
    if (statuses.some(s => s === 'unreachable' || s === 'unhealthy')) {
      overall = statuses.every(s => s === 'unreachable' || s === 'unhealthy') ? 'unhealthy' : 'degraded';
    } else if (statuses.some(s => s === 'degraded')) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    setSystemHealth({ overall, checks, lastChecked: new Date(), isChecking: false });
  };

  const fetchAgents = async (): Promise<void> => {
    try {
      const remoteAgents: RemoteAgent[] = await api.llmRuntime.listAgents();
      const normalized: Agent[] = (remoteAgents || []).map((agent) => ({
        id:             agent.id,
        _id:            agent.id,
        name:           agent.name,
        type:           agent.type,
        status:         agent.status || 'enabled',
        isActive:       (agent.status === 'enabled' || agent.status === 'active') && !agent.killswitch_activated && !agent.soft_deleted,
        permission:     agent.permission || 'read',
        environment:    agent.config?.environment,
        checkInterval:  agent.checkInterval,
        lastActivity:   agent.lastActivity || new Date().toISOString(),
        createdBy:      agent.created_by || 'Unknown',
        lastUsed:       agent.last_used_at || new Date().toISOString(),
        tasksCompleted: agent.tasks_completed ?? 0,
        tasksGiven:     agent.tasks_given ?? 0,
        tasksInProcess: agent.tasks_in_process ?? 0,
        tasksFailed:    agent.tasks_failed ?? 0,
        successRate:    agent.success_rate ?? (agent.status === 'active' ? 100 : 0),
        responseTime:   agent.response_time ?? 0,
        killswitchActivated:   agent.killswitch_activated || false,
        killswitchActivatedBy: agent.killswitch_activated_by,
        killswitchReason:      agent.killswitch_reason,
        killswitchActivatedAt: agent.killswitch_activated_at,
        softDeleted: agent.soft_deleted || false,
        avatarUrl: agent.avatar_url || agent.config?.selectedAvatarImg,
        avatarId: agent.config?.selectedAvatarId,
      }));
      setAgents(normalized);
    } catch {
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchSystemHealth();
    const healthInterval = setInterval(fetchSystemHealth, 10_000);
    return () => clearInterval(healthInterval);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchAgents();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    const fetchTelemetry = async (): Promise<void> => {
      try {
        const token = auth.getToken();
        if (!token) {
          const errorMsg = 'No authentication token available for telemetry';
          console.warn(errorMsg);
          setTelemetryError(errorMsg);
          setTelemetryLoading(false);
          return;
        }
        // ── fetch 7 days (mahesh) but keep the verbose warning (HeyGen) ──
        const response = await api.fetchWithAuth('/api/v1/telemetry/dashboard?days=7');
        if (response.ok) {
          setTelemetryData(await response.json());
          setTelemetryError(null);
        } else {
          setTelemetryError(`Telemetry endpoint returned status ${response.status}`);
        }
      } catch (error: any) {
        setTelemetryError(`Unable to reach telemetry endpoint: ${error?.message || 'Network error'}`);
      } finally {
        setTelemetryLoading(false);
      }
    };
    fetchTelemetry();
  }, []);

  // ── AgentToggleModal confirm handler ──────────────────────────────────────
  const handleToggleConfirm = useCallback(async (reason?: string) => {
    if (!toggleModal) return;
    const { agent, mode } = toggleModal;
    setToggleModal(prev => prev ? { ...prev, loading: true } : null);

    try {
      if (mode === 'disable') {
        await api.llmRuntime.activateKillswitch(agent.id, { reason: reason ?? '' });
        const update = { killswitchActivated: true, isActive: false, status: 'disabled' };
        setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, ...update } : a));
        setSelectedAgent(prev => prev ? { ...prev, ...update } : null);
        setShowAgentModal(false);
        toast.success('Agent disabled successfully.');
      } else {
        await api.llmRuntime.updateAgent(agent.id, {
          killswitch_activated: false, killswitch_activated_at: '',
          killswitch_activated_by: '', killswitch_reason: '',
          soft_deleted: false, status: 'active',
        });
        const update = {
          killswitchActivated: false,
          killswitchActivatedBy: undefined as string | undefined,
          killswitchReason: undefined as string | undefined,
          killswitchActivatedAt: undefined as string | undefined,
          isActive: true, status: 'active',
        };
        setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, ...update } : a));
        setSelectedAgent(prev => prev ? { ...prev, ...update } : null);
        setShowAgentModal(false);
        toast.success(`Agent "${agent.name}" has been re-enabled.`);
      }
    } catch (error: any) {
      toast.error(`Failed to ${mode} agent: ` + (error.response?.data?.detail || error.message || 'Unknown error'));
      setToggleModal(prev => prev ? { ...prev, loading: false } : null);
      return;
    }
    setToggleModal(null);
  }, [toggleModal]);

  const handleToggleCancel = useCallback(() => {
    if (toggleModal?.loading) return;
    setToggleModal(null);
  }, [toggleModal]);

  // Stats
  const totalAgents    = agents.length;
  const activeAgents   = agents.filter(a => a.isActive && !a.killswitchActivated && !a.softDeleted).length;
  const inactiveAgents = agents.filter(a => !a.isActive || a.killswitchActivated || a.softDeleted).length;

  // ── FIXED: filter ALL telemetry stats to only this user's agents ──
  const agentIdSet = new Set(agents.map(a => a.id));
  const filteredMetrics = telemetryData?.agent_metrics?.filter(m => agentIdSet.has(m.agent_id)) ?? [];

  const avgSuccessRate = filteredMetrics.length
    ? (filteredMetrics.reduce((s, m) => s + m.overall_success_rate, 0) / filteredMetrics.length).toFixed(1)
    : agents.length > 0 ? (agents.reduce((s, a) => s + a.successRate, 0) / agents.length).toFixed(1) : '0';

  const totalTasks = filteredMetrics.length
    ? filteredMetrics.reduce((s, m) => s + m.successful_tasks, 0)
    : agents.reduce((s, a) => s + a.tasksCompleted, 0);

  const avgResponseTime = filteredMetrics.length
    ? Math.floor(filteredMetrics.reduce((s, m) => s + m.avg_response_time_ms, 0) / filteredMetrics.length)
    : agents.length > 0 ? Math.floor(agents.reduce((s, a) => s + a.responseTime, 0) / agents.length) : 0;

  const environmentStats: EnvironmentStats = agents.reduce((acc, a) => {
    const env = a.environment || 'Unknown';
    acc[env] = (acc[env] || 0) + 1;
    return acc;
  }, {} as EnvironmentStats);

  const typeStats: TypeStats = agents.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {} as TypeStats);

  const activityData: ActivityDataPoint[] = React.useMemo(() => {
    // Generate last 7 days (including today)
    const last7Days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      last7Days.push(dateStr);
    }

    // Group telemetry data by date and aggregate metrics across all agents
    const dateMap = new Map<string, { total_tasks: number; successful_tasks: number; failed_tasks: number }>();

    if (telemetryData?.daily_metrics_past_7_days?.length) {
      telemetryData.daily_metrics_past_7_days
        // ── FIX: filter daily metrics to only THIS user's agents ──
        // Without this filter, a regular user sees the admin's chart data
        // because the telemetry endpoint returns ALL agents from the system.
        .filter(metric => agentIdSet.has(metric.agent_id))
        .forEach(metric => {
          if (!dateMap.has(metric.date)) {
            dateMap.set(metric.date, { total_tasks: 0, successful_tasks: 0, failed_tasks: 0 });
          }
          const entry = dateMap.get(metric.date)!;
          entry.total_tasks      += metric.total_tasks;
          entry.successful_tasks += metric.successful_tasks;
          entry.failed_tasks     += metric.failed_tasks;
        });
    }

    // Build complete 7-day dataset with zeros for missing days
    return last7Days.map(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day); // local date — avoids timezone shift
      const metrics = dateMap.get(dateStr) || { total_tasks: 0, successful_tasks: 0, failed_tasks: 0 };
      return {
        day:            date.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate:       date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tasksCompleted: metrics.successful_tasks,
        tasksGiven:     metrics.total_tasks,
        tasksInProcess: 0,
        tasksFailed:    metrics.failed_tasks,
      };
    });
  }, [telemetryData, agents]);

  const getFilteredDetailAgents = (): Agent[] => {
    let list = [...agents];
    if (detailsFilter === 'active')        list = list.filter(a => a.isActive && !a.killswitchActivated && !a.softDeleted);
    else if (detailsFilter === 'inactive') list = list.filter(a => !a.isActive && !a.killswitchActivated && !a.softDeleted);
    else if (detailsFilter === 'killed')   list = list.filter(a => a.killswitchActivated || a.softDeleted);

    list.sort((a, b) => {
      if (detailsFilter === 'all') {
        const aActive = a.isActive && !a.killswitchActivated && !a.softDeleted;
        const bActive = b.isActive && !b.killswitchActivated && !b.softDeleted;
        if (aActive !== bActive) return aActive ? -1 : 1;
      }
      let diff = 0;
      if (detailsSortField === 'name')               diff = a.name.localeCompare(b.name);
      else if (detailsSortField === 'successRate')    diff = a.successRate - b.successRate;
      else if (detailsSortField === 'responseTime')   diff = a.responseTime - b.responseTime;
      else if (detailsSortField === 'tasksCompleted') diff = a.tasksCompleted - b.tasksCompleted;
      return detailsSortDir === 'asc' ? diff : -diff;
    });
    return list;
  };

  const handleSortClick = (field: typeof detailsSortField) => {
    if (detailsSortField === field) setDetailsSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setDetailsSortField(field); setDetailsSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: typeof detailsSortField }) => {
    if (detailsSortField !== field) return <FaSort className="opacity-30 text-xs" />;
    return detailsSortDir === 'asc' ? <FaSortUp className="text-blue-500 text-xs" /> : <FaSortDown className="text-blue-500 text-xs" />;
  };

  const handleRefreshDetails = async () => {
    setDetailsRefreshing(true);
    await fetchAgents();
    setDetailsRefreshing(false);
    toast.success('Agent data refreshed!');
  };

  const getAgentSuccessRateFromTelemetry = (agentId: string): number | null => {
    if (!telemetryData?.agent_metrics?.length) return null;
    const m = telemetryData.agent_metrics.find(m => m.agent_id === agentId);
    return m ? Math.round(m.overall_success_rate) : null;
  };

  const getAgentTasksFromTelemetry = (agentId: string) => {
    if (!telemetryData?.agent_metrics?.length) return null;
    const m = telemetryData.agent_metrics.find(m => m.agent_id === agentId);
    if (!m) return null;
    return { tasksGiven: m.total_tasks, tasksCompleted: m.successful_tasks, tasksFailed: m.failed_tasks };
  };

  const getAgentResponseTimeFromTelemetry = (agentId: string): number | null => {
    if (!telemetryData?.agent_metrics?.length) return null;
    const m = telemetryData.agent_metrics.find(m => m.agent_id === agentId);
    return m ? Math.round(m.avg_response_time_ms) : null;
  };

  const chartActivityData  = activityData;
  const chartGridColor     = isDark ? '#1e2d45' : '#e5e7eb';
  const chartAxisColor     = isDark ? '#64748b' : '#9ca3af';
  const chartTextColor     = isDark ? '#cbd5e1' : '#4b5563';
  const tooltipBgColor     = isDark ? '#1e293b' : 'white';
  const tooltipBorderColor = isDark ? '#334155' : '#e5e7eb';
  const scrollbarClass     = isDark ? 'custom-scrollbar' : 'light-scrollbar';

  const sessionStatusColor = sessionElapsed < 1800 ? 'text-green-700' : sessionElapsed < 3600 ? 'text-yellow-700' : 'text-orange-700';
  const sessionBgColor     = sessionElapsed < 1800 ? 'bg-green-50 border-green-200' : sessionElapsed < 3600 ? 'bg-yellow-50 border-yellow-200' : 'bg-orange-50 border-orange-200';

  const getSortedAgents = (agentList: Agent[]): Agent[] => {
    return agentList.slice().sort((a, b) => {
      const getPriority = (agent: Agent): number => {
        if (agent.softDeleted) return 3;
        if (agent.killswitchActivated) return 2;
        if (agent.isActive) return 0;
        return 1;
      };
      const priorityDiff = getPriority(a) - getPriority(b);
      if (priorityDiff !== 0) return priorityDiff;
      return a.name.localeCompare(b.name);
    });
  };

  // ── Derived count for truly inactive agents (not active, not killed, not deleted) ──
  const trulyInactiveAgents = agents.filter(a => !a.isActive && !a.killswitchActivated && !a.softDeleted).length;
  const disabledDeletedAgents = agents.filter(a => a.killswitchActivated || a.softDeleted).length;

  // ── Task summary totals for the bottom stat cards ──
  const weekTasksGiven     = chartActivityData.reduce((s, d) => s + d.tasksGiven, 0);
  const weekTasksCompleted = chartActivityData.reduce((s, d) => s + d.tasksCompleted, 0);
  const weekTasksInProcess = chartActivityData.reduce((s, d) => s + d.tasksInProcess, 0);
  const weekTasksFailed    = chartActivityData.reduce((s, d) => s + d.tasksFailed, 0);

  return (
    <div className="aad-font min-h-screen bg-[#FAFAFA] text-[#111] overflow-x-hidden">
      <style>{customStyles}</style>

      {/* ════════════ AGENT TOGGLE MODAL — portaled to document.body, z-[10000] wrapper guarantees it always wins ════════════ */}
      {toggleModal && ReactDOM.createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, isolation: 'isolate' }}>
          <AgentToggleModal
            open={true}
            mode={toggleModal.mode}
            agentName={toggleModal.agent.name}
            agentAvatarSrc={toggleModal.agent.avatarUrl}
            accent={toggleModal.mode === 'disable' ? '#EF4444' : '#22C55E'}
            loading={toggleModal.loading}
            requireReasonOnEnable={true}
            onConfirm={handleToggleConfirm}
            onCancel={handleToggleCancel}
          />
        </div>,
        document.body
      )}

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="aad-header-wrapper">
          <div>
            <h1 className="aad-h1-resp text-4xl font-bold leading-tight tracking-tight text-[#0A0A0A] mb-2 max-md:text-3xl">AI Agent Dashboard</h1>
            <p className="text-[15px] text-gray-500 font-normal max-w-[480px] leading-relaxed m-0">Manage and monitor your AI-powered IAM agents</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`px-4 py-2 rounded-xl border ${sessionBgColor}`}>
              <div className="text-[11px] text-gray-500 mb-1 flex items-center gap-1 font-medium">
                <FaClock className="text-xs" /> Logged In For
              </div>
              <div className={`text-[13px] font-semibold font-mono ${sessionStatusColor}`}>{sessionTime}</div>
            </div>
            <HealthTooltip health={systemHealth} onRefresh={fetchSystemHealth} />
          </div>
        </div>
      </div>

      <div className="aad-page-wrapper">

        {/* ── Stats strip ── */}
        <div className="py-5 border-b border-gray-100">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 aad-stats-grid-override">
            {[
              { icon: FaRobot,       label: 'Total Agents', value: totalAgents,                             bg: '#EFF6FF', color: '#3B82F6', tooltip: { title: 'Total Agents',         desc: 'The total number of AI agents configured in your system, including those that are active, inactive, or disabled.' } },
              { icon: FaCheckCircle, label: 'Active',       value: activeAgents,                            bg: '#F0FDF4', color: '#22C55E', tooltip: { title: 'Active Agents',         desc: 'Agents that are active and prepared to handle incoming tasks in the IAM system.' } },
              { icon: FaTimesCircle, label: 'Inactive',     value: inactiveAgents,                          bg: '#FFF7ED', color: '#F97316', tooltip: { title: 'Inactive Agents',       desc: 'Agents that are inactive or disabled and currently unavailable to process tasks.' } },
              { icon: FaChartLine,   label: 'Success Rate', value: `${avgSuccessRate}%`,                    bg: '#FAF5FF', color: '#A855F7', tooltip: { title: 'Average Success Rate',  desc: 'Shows how accurately your agents complete assigned tasks across the system.' } },
              { icon: FaBolt,        label: 'Tasks Done',   value: totalTasks.toLocaleString(),             bg: '#EFF6FF', color: '#3B82F6', tooltip: { title: 'Tasks Completed',       desc: 'The total number of tasks your agents have successfully completed.' } },
              { icon: MdSpeed,       label: 'Avg Response', value: `${(avgResponseTime/1000).toFixed(2)}s`, bg: '#F0FDF4', color: '#22C55E', tooltip: { title: 'Average Response Time', desc: 'The average time it takes your agents to respond to your request.' } },
            ].map((s, i) => {
              const Icon = s.icon as React.ElementType;
              return (
                <StatCard key={i} s={s} Icon={Icon} />
              );
            })}
          </div>
        </div>

        {/* MAIN CONTENT GRID — lg:items-stretch so Task Overview matches Agent Distribution height */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8 pt-8 lg:items-stretch aad-main-grid">

          {/* TASK OVERVIEW CHART */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 aad-task-overview-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <FaChartLine className="text-white text-sm" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg xl:text-xl font-bold text-gray-900">Task Overview (This Week)</h3>
                  <p className="text-sm text-gray-500">AI Agent task performance metrics</p>
                </div>
              </div>
            </div>

            {/* ── FIX: Show error OR empty state correctly ──
                Scenario 1: telemetry API error → show error state
                Scenario 2: user has NO agents at all → show "no agents" empty state
                            (previously showed admin's data here — the core bug)
                Scenario 3: user has agents but zero activity this week → show "no activity"
                Scenario 4: user has agents with data → show the chart (unchanged) */}
            {telemetryError || agents.length === 0 || activityData.every(d => d.tasksGiven === 0 && d.tasksFailed === 0) ? (
              <div className={`flex-1 flex items-center justify-center min-h-[260px] rounded-lg border ${
                telemetryError ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="text-center">
                  <FaExclamationTriangle className={`text-4xl mx-auto mb-3 ${telemetryError ? 'text-red-500' : 'text-gray-300'}`} />
                  <p className={`font-medium ${telemetryError ? 'text-red-700' : 'text-gray-500'}`}>
                    {telemetryError
                      ? 'Telemetry Data Unavailable'
                      : agents.length === 0
                      ? 'No Agents Configured'
                      : 'No Activity This Week'}
                  </p>
                  <p className={`text-sm mt-1 ${telemetryError ? 'text-red-600' : 'text-gray-400'}`}>
                    {telemetryError
                      ? telemetryError
                      : agents.length === 0
                      ? 'No agents configured yet. Add an agent to start tracking task metrics.'
                      : 'No telemetry data available for this period'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chart — flex-grows to fill remaining card height, matching Agent Distribution */}
                <div className="aad-chart-flex aad-chart-h80 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartActivityData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: chartTextColor }} stroke={chartAxisColor} />
                      <YAxis tick={{ fontSize: 12, fill: chartTextColor }} stroke={chartAxisColor} width={30} />
                      <Tooltip contentStyle={{ backgroundColor: tooltipBgColor, border: `1px solid ${tooltipBorderColor}`, borderRadius: '8px', fontSize: '12px', color: chartTextColor }} />
                      <Line type="linear" dataKey="tasksGiven"     stroke="#22c55e" strokeWidth={3} name="Tasks Given"  dot={{ fill: '#22c55e', r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="linear" dataKey="tasksCompleted" stroke="#3b82f6" strokeWidth={3} name="Completed"    dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="linear" dataKey="tasksInProcess" stroke="#eab308" strokeWidth={3} name="In Process"   dot={{ fill: '#eab308', r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="linear" dataKey="tasksFailed"    stroke="#ef4444" strokeWidth={2} name="Failed"       dot={{ fill: '#ef4444', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* ── Stat cards — match the reference image style ── */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 aad-stat-cards-grid">
                    {[
                      {
                        dot: 'bg-green-500',
                        dotHex: '#22c55e',
                        label: 'TASKS GIVEN',
                        value: weekTasksGiven,
                        valueColor: 'text-green-500',
                        cardBg: 'bg-green-50',
                        border: 'border-green-100',
                      },
                      {
                        dot: 'bg-blue-500',
                        dotHex: '#3b82f6',
                        label: 'COMPLETED',
                        value: weekTasksCompleted,
                        valueColor: 'text-blue-500',
                        cardBg: 'bg-blue-50',
                        border: 'border-blue-100',
                      },
                      {
                        dot: 'bg-yellow-500',
                        dotHex: '#eab308',
                        label: 'IN PROCESS',
                        value: weekTasksInProcess,
                        valueColor: 'text-yellow-500',
                        cardBg: 'bg-yellow-50',
                        border: 'border-yellow-100',
                      },
                      {
                        dot: 'bg-red-500',
                        dotHex: '#ef4444',
                        label: 'FAILED',
                        value: weekTasksFailed,
                        valueColor: 'text-red-500',
                        cardBg: 'bg-red-50',
                        border: 'border-red-100',
                      },
                    ].map(item => (
                      <div
                        key={item.label}
                        className={`${item.cardBg} border ${item.border} rounded-xl aad-stat-card-pad flex flex-col gap-1.5`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${item.dot}`}
                          />
                          <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                            {item.label}
                          </span>
                        </div>
                        <div className={`aad-stat-card-value font-bold ${item.valueColor}`}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <AgentDistributionCard agents={agents} totalAgents={totalAgents} environmentStats={environmentStats} typeStats={typeStats} />
        </div>

        {/* ADDITIONAL CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8 aad-charts-grid">

          {/* AGENT ACTIVITY STATUS */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[17px] font-bold text-[#0A0A0A] tracking-tight mb-0.5">Agent Activity Status</h3>
                <p className="text-[12.5px] text-gray-400">Real-time agent availability</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Availability</span>
                <span className="text-[11px] text-gray-400">{totalAgents} total</span>
              </div>
              <div className="h-7 bg-gray-100 rounded-xl overflow-hidden flex">
                {activeAgents > 0 && (
                  <div className="h-full flex items-center justify-center text-[11px] font-bold text-white transition-all duration-700 bg-blue-500"
                    style={{ width: `${totalAgents > 0 ? (activeAgents / totalAgents) * 100 : 0}%` }}>
                    {activeAgents}
                  </div>
                )}
                {inactiveAgents > 0 && (
                  <div className="h-full flex items-center justify-center text-[11px] font-semibold text-gray-400 transition-all duration-700"
                    style={{ width: `${totalAgents > 0 ? (inactiveAgents / totalAgents) * 100 : 0}%` }}>
                    {inactiveAgents}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100" />

            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">By Agent Type</p>
              <div className="space-y-3">
                {Object.entries(typeStats).map(([type, count]) => {
                  const activeCount   = agents.filter(a => a.type === type && a.isActive && !a.killswitchActivated && !a.softDeleted).length;
                  const inactiveCount = count - activeCount;
                  const activePct     = count > 0 ? (activeCount / count) * 100 : 0;

                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[13px] font-semibold text-[#0A0A0A]">{type}</span>
                        <span className="text-[11px] text-gray-400">{count} total</span>
                      </div>
                      <div className="h-7 bg-gray-100 rounded-xl overflow-hidden flex">
                        {activeCount > 0 && (
                          <div className="h-full flex items-center justify-center text-[11px] font-bold text-white transition-all duration-700 bg-blue-500"
                            style={{ width: `${activePct}%` }}>
                            {activeCount}
                          </div>
                        )}
                        {inactiveCount > 0 && (
                          <div className="h-full flex items-center justify-center text-[11px] font-semibold text-gray-400 transition-all duration-700"
                            style={{ width: `${100 - activePct}%` }}>
                            {inactiveCount}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-500" /><span className="text-[11px] text-gray-500">Active</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-gray-200" /><span className="text-[11px] text-gray-500">Disabled</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100">
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-3.5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Avg Response</p>
                <p className="text-[20px] font-bold text-[#0A0A0A]">{(avgResponseTime / 1000).toFixed(2)}s</p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-3.5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Total Tasks</p>
                <p className="text-[20px] font-bold text-[#0A0A0A]">{totalTasks.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <ResponseTimeCard
            agents={agents}
            getSortedAgents={getSortedAgents}
            getAgentResponseTimeFromTelemetry={getAgentResponseTimeFromTelemetry}
          />
        </div>

        {/* AGENT LIST TABLE */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-10">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[17px] font-bold text-[#0A0A0A] tracking-tight mb-0.5">All AI Agents</h3>
                <p className="text-[12.5px] text-gray-500">{totalAgents} agents currently configured</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleRefreshDetails} disabled={detailsRefreshing}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200 transition-colors disabled:opacity-40">
                  <FaSync className={`text-xs ${detailsRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button onClick={() => exportAgentsCSV(agents)} disabled={agents.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200 transition-colors disabled:opacity-40">
                  <FaDownload className="text-xs" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button onClick={() => setShowDetailsPanel(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#111] hover:bg-[#333] text-white rounded-lg text-[13px] font-medium transition-colors">
                  <FaUsers className="text-xs" /> View Details
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#111]" />
            </div>
          ) : agents.length === 0 ? (
            <div className="p-12 text-center">
              <FaRobot className="text-gray-300 text-5xl mx-auto mb-4" />
              <p className="text-[14px] text-gray-500">No agents configured</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#FAFAFA]">
                  <tr>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em]">Agent</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em] hidden md:table-cell">Type</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em] hidden md:table-cell">Environment</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em] hidden lg:table-cell">Tasks</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em] hidden lg:table-cell">Success Rate</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em] hidden xl:table-cell">Response Time</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getSortedAgents(agents).map(agent => (
                    <tr key={agent.id} className="hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                      onClick={() => { setSelectedAgent(agent); setShowAgentModal(true); }}>
                      <td className="px-3 md:px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 xl:gap-3">
                          <AgentAvatar agent={agent} size="md" />
                          <div>
                            <div className="text-[13px] font-semibold text-[#0A0A0A]">{agent.name}</div>
                            <div className="text-[11px] text-gray-400">ID: {agent.id.slice(0,8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#EFF6FF] text-blue-700">{agent.type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[13px] text-gray-600 hidden md:table-cell">{agent.environment || 'N/A'}</td>
                      <td className="px-3 md:px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap hidden lg:table-cell">
                        <div className="text-[13px] font-semibold text-[#0A0A0A]">{getAgentTasksFromTelemetry(agent.id)?.tasksCompleted ?? agent.tasksCompleted}</div>
                        <div className="text-[11px] text-gray-400">completed</div>
                      </td>
                      <td className="px-3 md:px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap hidden lg:table-cell">
                        {(() => {
                          const rate = getAgentSuccessRateFromTelemetry(agent.id) ?? agent.successRate;
                          return (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-20">
                                <div className={`h-1.5 rounded-full ${rate>=90?'bg-green-500':rate>=70?'bg-yellow-500':'bg-red-500'}`} style={{ width: `${rate}%` }} />
                              </div>
                              <span className="text-[13px] font-semibold text-[#0A0A0A]">{rate}%</span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-3 md:px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap hidden xl:table-cell">
                        <div className="text-[13px] font-semibold text-[#0A0A0A]">
                          {(() => { const rt = getAgentResponseTimeFromTelemetry(agent.id) ?? agent.responseTime; return rt > 0 ? `${(rt/1000).toFixed(2)}s` : 'N/A'; })()}
                        </div>
                      </td>
                      <td className="px-3 md:px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                        {agent.killswitchActivated ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-red-50 text-red-700 border border-red-100"><FaPowerOff className="w-2 h-2"/>Disabled</span>
                        ) : agent.softDeleted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">Deleted</span>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium ${agent.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${agent.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                            {agent.isActive ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ════════════ VIEW DETAILS PANEL ════════════ */}
      {showDetailsPanel && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowDetailsPanel(false)}>
          <div className="aad-details-modal bg-white rounded-2xl shadow-2xl max-w-[95vw] xl:max-w-5xl 2xl:max-w-7xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><FaUsers className="text-blue-600" />Agent Details</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Full breakdown of all {totalAgents} agents</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleRefreshDetails} disabled={detailsRefreshing}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                    <FaSync className={`text-xs ${detailsRefreshing ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                  <button onClick={() => exportAgentsCSV(getFilteredDetailAgents())} disabled={agents.length === 0}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors border border-blue-200">
                    <FaDownload className="text-xs" /> Export CSV
                  </button>
                  <button onClick={() => setShowDetailsPanel(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4">
                {[
                  { label: 'Total',            value: totalAgents,             filter: 'all'      as const, color: 'bg-gray-100 text-gray-900 border-gray-200'       },
                  { label: 'Active',           value: activeAgents,            filter: 'active'   as const, color: 'bg-green-50 text-green-700 border-green-200'    },
                  { label: 'Inactive',         value: trulyInactiveAgents,     filter: 'inactive' as const, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                  { label: 'Disabled/Deleted', value: disabledDeletedAgents,   filter: 'killed'   as const, color: 'bg-red-50 text-red-700 border-red-200'          },
                ].map(item => (
                  <button key={item.filter} onClick={() => setDetailsFilter(item.filter)}
                    className={`p-3 rounded-xl border text-left transition-all ${item.color} ${detailsFilter === item.filter ? 'ring-2 ring-blue-500 ring-offset-1' : 'opacity-80 hover:opacity-100'}`}>
                    <div className="text-2xl font-bold">{item.value}</div>
                    <div className="text-xs font-medium opacity-80">{item.label}</div>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500 flex items-center gap-1"><FaSort className="text-xs"/> Sort by:</span>
                {([['name','Name'],['successRate','Success Rate'],['responseTime','Response Time'],['tasksCompleted','Tasks']] as const).map(([field, label]) => (
                  <button key={field} onClick={() => handleSortClick(field)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${detailsSortField === field ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {label} <SortIcon field={field} />
                  </button>
                ))}
              </div>
            </div>
            <div className={`flex-1 overflow-y-auto p-6 space-y-3 min-h-0 ${scrollbarClass}`}>
              {getFilteredDetailAgents().length === 0 ? (
                <div className="text-center py-12 text-gray-400">No agents match this filter.</div>
              ) : getFilteredDetailAgents().map(agent => (
                <div key={agent.id} className="bg-gray-50 rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-4">
                    <AgentAvatar agent={agent} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{agent.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{agent.type}</span>
                        {agent.environment && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{agent.environment}</span>}
                        {agent.killswitchActivated && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center gap-1"><FaPowerOff className="text-xs"/>Disabled</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Created by <span className="font-medium text-gray-700">{agent.createdBy}</span> · Last active {new Date(agent.lastActivity).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-900">{getAgentTasksFromTelemetry(agent.id)?.tasksCompleted ?? agent.tasksCompleted}</div>
                        <div className="text-xs text-gray-400">Tasks</div>
                      </div>
                      <div className="text-center">
                        {(() => { const r = getAgentSuccessRateFromTelemetry(agent.id) ?? agent.successRate; return <><div className={`text-sm font-bold ${r>=90?'text-green-600':r>=70?'text-yellow-600':'text-red-600'}`}>{r}%</div><div className="text-xs text-gray-400">Success</div></>; })()}
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-900">{agent.responseTime > 0 ? `${(agent.responseTime/1000).toFixed(2)}s` : 'N/A'}</div>
                        <div className="text-xs text-gray-400">Response</div>
                      </div>
                      <button onClick={() => { setSelectedAgent(agent); setShowAgentModal(true); setShowDetailsPanel(false); }}
                        className="px-3 py-1.5 bg-gray-900 hover:bg-gray-700 text-white rounded-lg text-xs font-medium transition-colors">Manage</button>
                    </div>
                  </div>
                  {agent.killswitchActivated && agent.killswitchReason && (
                    <div className="mt-3 pt-3 border-t border-red-100 text-xs text-red-600">
                      <span className="font-semibold">Disabled by:</span> {agent.killswitchActivatedBy} · <span className="font-semibold">Reason:</span> {agent.killswitchReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ════════════ AGENT DETAIL MODAL ════════════ */}
      {showAgentModal && selectedAgent && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowAgentModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <AgentAvatar agent={selectedAgent} size="lg" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedAgent.name}</h2>
                    <p className="text-sm text-gray-500">ID: {selectedAgent.id}</p>
                  </div>
                </div>
                <button onClick={() => setShowAgentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2">
                {selectedAgent.killswitchActivated ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-red-50 text-red-700 border-2 border-red-200"><FaPowerOff className="w-3 h-3"/>Disabled</span>
                ) : selectedAgent.softDeleted ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 border-2 border-gray-200">Soft Deleted</span>
                ) : (
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${selectedAgent.isActive ? 'bg-green-50 text-green-700 border-2 border-green-200' : 'bg-gray-100 text-gray-700 border-2 border-gray-200'}`}>
                    <span className={`w-3 h-3 rounded-full ${selectedAgent.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                    {selectedAgent.isActive ? 'Active' : 'Inactive'}
                  </span>
                )}
                <span className="px-4 py-2 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">{selectedAgent.type}</span>
              </div>

              {isAdmin && selectedAgent.killswitchActivated && !selectedAgent.softDeleted && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg flex-shrink-0 mt-0.5"><FaUndo className="text-green-600 text-lg"/></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-green-900 mb-1">Re-enable Agent</h4>
                      {(selectedAgent.killswitchActivatedBy || selectedAgent.killswitchReason) && (
                        <div className="bg-white/70 rounded-lg p-2 mb-2 border border-green-200 space-y-0.5">
                          {selectedAgent.killswitchActivatedBy && <p className="text-xs text-gray-600"><span className="font-semibold">Disabled by:</span> {selectedAgent.killswitchActivatedBy}</p>}
                          {selectedAgent.killswitchActivatedAt && <p className="text-xs text-gray-600"><span className="font-semibold">At:</span> {new Date(selectedAgent.killswitchActivatedAt).toLocaleString()}</p>}
                          {selectedAgent.killswitchReason && <p className="text-xs text-gray-600"><span className="font-semibold">Reason:</span> {selectedAgent.killswitchReason}</p>}
                        </div>
                      )}
                      <p className="text-xs text-green-700 mb-3">Restore full agent operations and make this agent available again.</p>
                      <button
                        onClick={() => setToggleModal({ mode: 'enable', agent: selectedAgent, loading: false })}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <FaUndo/> Re-enable Agent
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isAdmin && !selectedAgent.killswitchActivated && !selectedAgent.softDeleted && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <FaExclamationTriangle className="text-red-600 text-xl flex-shrink-0 mt-1"/>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-red-900 mb-1">Emergency Control</h4>
                      <p className="text-xs text-red-700 mb-3">Immediately stop agent operations and revoke access</p>
                      <button
                        onClick={() => setToggleModal({ mode: 'disable', agent: selectedAgent, loading: false })}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <FaPowerOff/> Disable the Agent
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Environment</div>
                  <div className="text-lg font-semibold text-gray-900">{selectedAgent.environment || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Response Time</div>
                  <div className="text-lg font-semibold text-gray-900">{(() => { const rt = getAgentResponseTimeFromTelemetry(selectedAgent.id) ?? selectedAgent.responseTime; return rt > 0 ? `${(rt/1000).toFixed(2)}s` : 'N/A'; })()}</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="text-xs text-green-600 uppercase tracking-wide mb-1">Success Rate</div>
                  <div className="text-lg font-semibold text-green-700">{getAgentSuccessRateFromTelemetry(selectedAgent.id) ?? selectedAgent.successRate}%</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="text-xs text-blue-600 uppercase tracking-wide mb-1">Tasks Completed</div>
                  <div className="text-lg font-semibold text-blue-700">{getAgentTasksFromTelemetry(selectedAgent.id)?.tasksCompleted ?? selectedAgent.tasksCompleted}</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><FaChartLine className="text-blue-600"/>Task Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  {(() => {
                    const tt = getAgentTasksFromTelemetry(selectedAgent.id);
                    const tg = tt?.tasksGiven     ?? selectedAgent.tasksGiven;
                    const tc = tt?.tasksCompleted ?? selectedAgent.tasksCompleted;
                    const tf = tt?.tasksFailed    ?? selectedAgent.tasksFailed;
                    const ti = selectedAgent.tasksInProcess;
                    return [
                      { label:'Tasks Given', value:tg, color:'bg-green-500',  pct:100 },
                      { label:'Completed',   value:tc, color:'bg-blue-500',   pct:tg>0?(tc/tg)*100:0 },
                      { label:'In Process',  value:ti, color:'bg-yellow-500', pct:tg>0?(ti/tg)*100:0 },
                      { label:'Failed',      value:tf, color:'bg-red-500',    pct:tg>0?(tf/tg)*100:0 },
                    ].map(item => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-700">{item.label}</span>
                          <span className="text-sm font-bold text-gray-900">{item.value}</span>
                        </div>
                        <div className="bg-white rounded-full h-2">
                          <div className={`${item.color} h-2 rounded-full`} style={{ width:`${item.pct}%` }}/>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><MdSecurity className="text-purple-600"/>Agent Information</h3>
                <div className="space-y-3">
                  {[
                    ['Created By',    selectedAgent.createdBy],
                    ['Last Activity', new Date(selectedAgent.lastActivity).toLocaleString()],
                    ['Last Used',     new Date(selectedAgent.lastUsed).toLocaleString()],
                    ...(selectedAgent.checkInterval ? [['Check Interval', `${selectedAgent.checkInterval}s`]] : []),
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{label}</span>
                      <span className="text-sm font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-2xl">
              <button onClick={() => setShowAgentModal(false)} className="w-full px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors">Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* <FloatingChat /> */}
    </div>
  );
};

export default AdminAgentControl;