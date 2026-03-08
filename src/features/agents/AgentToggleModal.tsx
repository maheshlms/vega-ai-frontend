/**
 * AgentToggleModal — Shared component for enabling / disabling agents.
 *
 * Used by both:
 *   - Agents.tsx              (user-facing card grid)
 *   - AdminAgentControll.tsx  (admin dashboard)
 *
 * Props:
 *   open                – whether the modal is visible
 *   mode                – "disable" | "enable"
 *   agentName           – display name of the agent
 *   agentAvatarSrc      – image URL for avatar (optional; falls back to initials)
 *   accent              – brand colour for the active mode (optional)
 *   loading             – show spinner on confirm button
 *   onConfirm(reason?)  – called on confirm; reason always provided for "disable"
 *   onCancel()          – called on cancel / backdrop click
 *   requireReasonOnEnable – show reason textarea for "enable" too (default false)
 */

import React, { useState, useEffect } from 'react';

export type AgentToggleMode = 'disable' | 'enable';

export interface AgentToggleModalProps {
  open: boolean;
  mode: AgentToggleMode;
  agentName: string;
  agentAvatarSrc?: string;
  accent?: string;
  loading?: boolean;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  requireReasonOnEnable?: boolean;
}

// ─── Style injection ──────────────────────────────────────────────────────────

let _injected = false;
const injectStyles = () => {
  if (_injected || typeof document === 'undefined') return;
  _injected = true;
  const s = document.createElement('style');
  s.setAttribute('data-atm', '');
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

    [data-atm-root], [data-atm-root] * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }

    @keyframes atm-backdrop-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes atm-card-in {
      from { opacity: 0; transform: scale(0.88) translateY(24px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes atm-card-out {
      from { opacity: 1; transform: scale(1); }
      to   { opacity: 0; transform: scale(0.92); }
    }
    @keyframes atm-slide-up {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes atm-icon-pop {
      from { opacity: 0; transform: scale(0.6); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes atm-shimmer {
      0%   { transform: translateX(-100%); }
      100% { transform: translateX(200%); }
    }
    @keyframes atm-warning-in {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes atm-item-in {
      from { opacity: 0; transform: translateX(-8px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes atm-particle {
      0%   { transform: translate(0,0) scale(1); opacity: 1; }
      100% { transform: translate(var(--px),var(--py)) scale(0); opacity: 0; }
    }
    @keyframes atm-spin {
      to { transform: rotate(360deg); }
    }

    /* Scrollbar — right side only, full card height */
    [data-atm-scroll]::-webkit-scrollbar              { width: 6px; }
    [data-atm-scroll]::-webkit-scrollbar-track        { background: #f3f4f6; border-radius: 0 22px 22px 0; }
    [data-atm-scroll]::-webkit-scrollbar-thumb        { background: #d1d5db; border-radius: 10px; }
    [data-atm-scroll]::-webkit-scrollbar-thumb:hover  { background: #9ca3af; }
  `;
  document.head.appendChild(s);
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

const InlineAvatar: React.FC<{
  src?: string; name: string; size: number; accent: string; dimmed?: boolean;
}> = ({ src, name, size, accent, dimmed }) => {
  const [failed, setFailed] = useState(false);
  const initial = (name?.[0] ?? '?').toUpperCase();
  const base: React.CSSProperties = {
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    opacity: dimmed ? 0.65 : 1,
    filter:  dimmed ? 'grayscale(0.5)' : 'none',
    transition: 'opacity 0.3s, filter 0.3s',
  };
  if (!src || failed) return (
    <div style={{
      ...base,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(135deg, ${accent}cc, ${accent})`,
      color: '#fff', fontWeight: 700, fontSize: size * 0.38,
    }}>{initial}</div>
  );
  return (
    <img src={src} alt={name} onError={() => setFailed(true)}
      style={{ ...base, objectFit: 'cover', objectPosition: '50% 10%' }} />
  );
};

// ─── Particles ────────────────────────────────────────────────────────────────

const DISABLE_COLORS = ['#6B7280','#9CA3AF','#374151','#D1D5DB','#4B5563'];
const ENABLE_COLORS  = ['#10B981','#34D399','#6EE7B7','#A7F3D0','#FCD34D','#F9A8D4'];

interface Particle { id: number; x: number; y: number; px: number; py: number; color: string; size: number; delay: number; }

const makeParticles = (mode: AgentToggleMode): Particle[] => {
  const palette = mode === 'disable' ? DISABLE_COLORS : ENABLE_COLORS;
  return Array.from({ length: 28 }, (_, i) => {
    const angle = (i / 28) * Math.PI * 2;
    const dist  = 80 + Math.random() * 120;
    return {
      id: i, x: 50 + (Math.random() - 0.5) * 10, y: 50 + (Math.random() - 0.5) * 10,
      px: Math.cos(angle) * dist, py: Math.sin(angle) * dist,
      color: palette[Math.floor(Math.random() * palette.length)],
      size: 4 + Math.random() * 6, delay: Math.random() * 0.08,
    };
  });
};

// ─── Warning items ────────────────────────────────────────────────────────────

const DISABLE_WARNINGS = [
  'Stop all agent operations immediately',
  'Revoke all active sessions',
  'Disable agent access to all systems',
  'Require manual reactivation to restore',
];

// ─── Modal ────────────────────────────────────────────────────────────────────

export const AgentToggleModal: React.FC<AgentToggleModalProps> = ({
  open, mode, agentName, agentAvatarSrc,
  accent: accentProp, loading = false,
  onConfirm, onCancel, requireReasonOnEnable = false,
}) => {
  injectStyles();

  const isDisabling = mode === 'disable';
  const needReason  = isDisabling || requireReasonOnEnable;
  const accent      = accentProp ?? (isDisabling ? '#EF4444' : '#22C55E');

  const [mounted,   setMounted]   = useState(false);
  const [exiting,   setExiting]   = useState(false);
  const [reason,    setReason]    = useState('');
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (open) { setExiting(false); setReason(''); requestAnimationFrame(() => setMounted(true)); }
  }, [open]);

  if (!open && !mounted) return null;

  const canConfirm = !loading && (!needReason || reason.trim().length > 0);

  const fireAndConfirm = () => {
    if (!canConfirm) return;
    setParticles(makeParticles(mode));
    setTimeout(() => setParticles([]), 900);
    setExiting(true);
    setTimeout(() => { setMounted(false); onConfirm(needReason ? reason.trim() : undefined); }, 300);
  };
  const handleCancel = () => {
    if (loading) return;
    setExiting(true);
    setTimeout(() => { setMounted(false); onCancel(); }, 280);
  };

  // ── Derived colours ──
  const headerGrad  = isDisabling ? 'linear-gradient(90deg,#F87171,#EF4444)' : `linear-gradient(90deg,${accent}88,${accent})`;
  const iconBg      = isDisabling ? '#FEF2F2' : `${accent}12`;
  const iconShadow  = isDisabling
    ? '0 8px 32px rgba(239,68,68,0.12),inset 0 1px 0 rgba(255,255,255,0.8)'
    : `0 8px 32px ${accent}22,inset 0 1px 0 rgba(255,255,255,0.8)`;
  const glowOrb     = isDisabling
    ? 'radial-gradient(circle,rgba(239,68,68,0.06) 0%,transparent 70%)'
    : `radial-gradient(circle,${accent}12 0%,transparent 70%)`;
  const cardShadow  = isDisabling
    ? '0 32px 80px rgba(0,0,0,0.22),0 0 0 1px rgba(0,0,0,0.06)'
    : `0 32px 80px rgba(0,0,0,0.18),0 0 0 1px ${accent}22`;
  const badgeBg     = isDisabling ? '#FEF2F2' : `${accent}12`;
  const badgeColor  = isDisabling ? '#EF4444' : accent;
  const badgeBorder = isDisabling ? '1px solid #FECACA' : `1px solid ${accent}25`;
  const confirmBg   = canConfirm
    ? isDisabling ? 'linear-gradient(135deg,#EF4444,#DC2626)' : `linear-gradient(135deg,${accent},${accent}cc)`
    : isDisabling ? '#FCA5A5' : `${accent}66`;
  const confirmGlow = canConfirm
    ? isDisabling ? '0 4px 16px rgba(239,68,68,0.35)' : `0 4px 16px ${accent}44`
    : 'none';
  const taFocusBorder = isDisabling ? '#EF4444' : accent;
  const taFocusShadow = isDisabling ? '0 0 0 3px rgba(239,68,68,0.10)' : `0 0 0 3px ${accent}22`;

  const cardAnim = exiting
    ? 'atm-card-out 0.28s ease forwards'
    : 'atm-card-in 0.42s cubic-bezier(0.34,1.3,0.64,1) forwards';

  return (
    /* ── Backdrop ── */
    <div
      data-atm-root
      onClick={!loading ? handleCancel : undefined}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        background: 'rgba(15,15,20,0.55)',
        backdropFilter: 'blur(14px) saturate(0.7)',
        animation: 'atm-backdrop-in 0.35s ease forwards',
      }}
    >
      {/* Particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size, borderRadius: '50%', background: p.color,
            animation: `atm-particle 0.85s cubic-bezier(0.25,0.46,0.45,0.94) ${p.delay}s both`,
            '--px': `${p.px}px`, '--py': `${p.py}px`,
          } as React.CSSProperties} />
        ))}
      </div>

      {/* ── Card ──
            The card is a flex-column. The scrollable region fills all available
            height and shows a full-height right-side scrollbar via overflow-y:scroll.
            overflow:hidden on the outer card clips the rounded corners cleanly.
      */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          display: 'flex', flexDirection: 'column',
          width: 460, maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 48px)',
          borderRadius: 24,
          overflow: 'hidden',          /* clips scrollbar track to card corners */
          background: '#fff',
          boxShadow: cardShadow,
          animation: cardAnim,
          position: 'relative',
        }}
      >
        {/* Shimmer + glow — absolutely positioned decorations */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(105deg,transparent 40%,${isDisabling ? 'rgba(0,0,0,0.015)' : `${accent}07`} 50%,transparent 60%)`,
            animation: 'atm-shimmer 2.4s ease infinite',
          }} />
        </div>
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 220, height: 220, borderRadius: '50%',
          background: glowOrb, pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Top accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 4, background: headerGrad, zIndex: 3, flexShrink: 0,
        }} />

        {/* ══ SCROLLABLE AREA — fills card, scrollbar runs full height ══ */}
        <div
          data-atm-scroll
          style={{
            position: 'relative', zIndex: 1,
            flex: 1,
            overflowY: 'scroll',    /* always render scrollbar track */
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f3f4f6',
            padding: '36px 32px 32px',
          }}
        >

          {/* Avatar ring */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, marginTop: 4 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: iconShadow,
              animation: 'atm-icon-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both',
            }}>
              <InlineAvatar src={agentAvatarSrc} name={agentName} size={44} accent={accent} dimmed={isDisabling} />
            </div>
          </div>

          {/* Title */}
          <h2 style={{
            textAlign: 'center', margin: '0 0 8px',
            fontSize: 20, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.02em',
            animation: 'atm-slide-up 0.4s ease 0.15s both',
          }}>
            {isDisabling ? 'Disable this agent?' : 'Re-enable this agent?'}
          </h2>

          {/* Agent name badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, animation: 'atm-slide-up 0.4s ease 0.2s both' }}>
            <span style={{
              background: badgeBg, color: badgeColor, border: badgeBorder,
              borderRadius: 999, padding: '3px 12px', fontSize: 12, fontWeight: 600,
            }}>
              {agentName}
            </span>
          </div>

          {/* Body text */}
          <p style={{
            textAlign: 'center', margin: '0 0 16px',
            fontSize: 13, lineHeight: 1.6, color: '#6b7280',
            animation: 'atm-slide-up 0.4s ease 0.25s both',
          }}>
            {isDisabling
              ? 'The agent will stop monitoring and processing tasks. You can re-enable it at any time.'
              : 'The agent will resume monitoring and processing tasks immediately.'}
          </p>

          {/* ── Disable warning block ── */}
          {isDisabling && (
            <div style={{
              marginBottom: 20,
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 14, padding: '12px 14px',
              animation: 'atm-warning-in 0.4s ease 0.28s both',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M9.99 2L1 18h18L9.99 2z" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M10 8v4" stroke="#EF4444" strokeWidth="1.75" strokeLinecap="round"/>
                  <circle cx="10" cy="14.5" r="0.9" fill="#EF4444"/>
                </svg>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#B91C1C', letterSpacing: '0.01em' }}>
                  This action will immediately:
                </span>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {DISABLE_WARNINGS.map((warn, i) => (
                  <li key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    animation: `atm-item-in 0.3s ease ${0.3 + i * 0.06}s both`,
                  }}>
                    <span style={{
                      flexShrink: 0, marginTop: 5,
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#EF4444', display: 'inline-block',
                    }} />
                    <span style={{ fontSize: 12.5, color: '#7F1D1D', lineHeight: 1.5 }}>{warn}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Reason textarea ── */}
          {needReason && (
            <div style={{ marginBottom: 24, animation: 'atm-slide-up 0.4s ease 0.32s both' }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 700,
                color: '#374151', marginBottom: 8, letterSpacing: '0.01em',
              }}>
                Reason <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={isDisabling
                  ? "Explain why you're disabling this agent…"
                  : "Explain why you're re-enabling this agent…"}
                rows={3}
                disabled={loading}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 12,
                  border: `1.5px solid ${reason.trim() ? (isDisabling ? '#FCA5A5' : `${accent}88`) : '#E5E7EB'}`,
                  background: reason.trim() ? (isDisabling ? '#FFF5F5' : `${accent}08`) : '#F9FAFB',
                  fontSize: 13, color: '#111827',
                  resize: 'none', outline: 'none',
                  fontFamily: 'inherit', lineHeight: 1.5,
                  transition: 'border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease',
                  boxSizing: 'border-box',
                  opacity: loading ? 0.6 : 1,
                }}
                onFocus={e => { e.currentTarget.style.borderColor = taFocusBorder; e.currentTarget.style.boxShadow = taFocusShadow; }}
                onBlur={e => { e.currentTarget.style.borderColor = reason.trim() ? (isDisabling ? '#FCA5A5' : `${accent}88`) : '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <p style={{ margin: '6px 0 0', fontSize: 11, color: '#9CA3AF' }}>
                This reason will be logged for audit purposes.
              </p>
            </div>
          )}

          {/* ── Buttons ── */}
          <div style={{ display: 'flex', gap: 10, animation: 'atm-slide-up 0.4s ease 0.34s both' }}>
            {/* Cancel */}
            <button
              onClick={!loading ? handleCancel : undefined}
              disabled={loading}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.borderColor = '#D1D5DB'; }}}
              onMouseLeave={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
              style={{
                flex: 1, height: 44, borderRadius: 12,
                border: '1px solid #E5E7EB', background: '#F9FAFB',
                color: '#374151', fontSize: 13, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease', opacity: loading ? 0.5 : 1,
                fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>

            {/* Confirm */}
            <button
              onClick={fireAndConfirm}
              disabled={!canConfirm}
              onMouseEnter={e => { if (canConfirm) e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              style={{
                flex: 1, height: 44, borderRadius: 12,
                border: 'none', background: confirmBg,
                color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: canConfirm ? 'pointer' : 'not-allowed',
                opacity: canConfirm ? 1 : 0.7,
                boxShadow: confirmGlow,
                transition: 'transform 0.12s ease, box-shadow 0.12s ease, opacity 0.15s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: 'inherit',
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff', display: 'inline-block',
                    animation: 'atm-spin 0.7s linear infinite',
                  }} />
                  {isDisabling ? 'Disabling…' : 'Enabling…'}
                </>
              ) : (isDisabling ? 'Yes, Disable' : 'Yes, Enable')}
            </button>
          </div>

        </div>{/* end scrollable area */}
      </div>{/* end card */}
    </div>  /* end backdrop */
  );
};

export default AgentToggleModal;