import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoSun } from "react-icons/go";
import { MdOutlineDarkMode } from "react-icons/md";
import { api } from '../../utils/api';
import { auth } from '../../utils/auth';
import { useTheme } from '../../state/ThemeContext';

/* ══════════════════════════════════════════════════════════
   RESPONSIVE STYLES
   Breakpoint strategy (desktop-only, mobile blocked):
   - 768–1023px  : tablet / small laptop
   - 1024–1279px : laptop
   - 1280–1535px : standard desktop
   - 1536–1919px : large desktop / 1440p
   - 1920px      : reference (no changes)
   - 2560px+     : 2K / 4K scale-up
   - 3840px+     : 4K max scale
══════════════════════════════════════════════════════════ */
const responsiveStyles = `
  /* ── Shared card shell ── */
  .adm-card-shell {
    width: 420px;
    transition: width 0.2s ease;
  }

  /* Tablet / small laptop (768–1279px) */
  @media (min-width: 768px) and (max-width: 1279px) {
    .adm-card-shell { width: 380px; }
    .adm-logo { height: 6rem !important; }   /* 96px */
    .adm-heading { font-size: 1.35rem !important; }
    .adm-sub { font-size: 0.7rem !important; }
    .adm-px { padding-left: 1.25rem !important; padding-right: 1.25rem !important; }
    .adm-footer { font-size: 0.65rem !important; }
    .adm-toggle { top: 1rem !important; right: 1rem !important; }
    .adm-corner-tl { top: 10px !important; left: 10px !important; }
    .adm-corner-tr { top: 10px !important; right: 10px !important; }
    .adm-corner-bl { bottom: 10px !important; left: 10px !important; }
    .adm-corner-br { bottom: 10px !important; right: 10px !important; }
  }

  /* Standard desktop (1280–1535px) */
  @media (min-width: 1280px) and (max-width: 1535px) {
    .adm-card-shell { width: 400px; }
    .adm-logo { height: 7rem !important; }
  }

  /* Large desktop (1536–1919px) */
  @media (min-width: 1536px) and (max-width: 1919px) {
    .adm-card-shell { width: 410px; }
    .adm-logo { height: 7.5rem !important; }
  }

  /* 2K / 4K (2560px+) */
  @media (min-width: 2560px) {
    .adm-card-shell { width: 520px; }
    .adm-logo { height: 10rem !important; }
    .adm-heading { font-size: 2rem !important; }
    .adm-sub { font-size: 0.9rem !important; }
    .adm-label {
      font-size: 0.8rem !important;
      letter-spacing: 0.12em !important;
    }
    .adm-input {
      padding: 0.75rem 1rem !important;
      font-size: 0.95rem !important;
    }
    .adm-btn {
      height: 3rem !important;
      font-size: 0.9rem !important;
    }
    .adm-footer { font-size: 0.8rem !important; margin-top: 2rem !important; }
    .adm-toggle { top: 2rem !important; right: 2rem !important; width: 44px !important; height: 44px !important; }
    .adm-px { padding-left: 2.5rem !important; padding-right: 2.5rem !important; }
    .adm-pt { padding-top: 2.5rem !important; }
    .adm-pb { padding-bottom: 2.5rem !important; }
    .adm-space { gap: 1.5rem !important; }
    .adm-mb-card { margin-bottom: 2rem !important; }
    .adm-corner-size { width: 28px !important; height: 28px !important; }
  }

  /* 4K max (3840px+) */
  @media (min-width: 3840px) {
    .adm-card-shell { width: 680px; }
    .adm-logo { height: 13rem !important; }
    .adm-heading { font-size: 2.8rem !important; }
    .adm-sub { font-size: 1.1rem !important; }
    .adm-input {
      padding: 1rem 1.25rem !important;
      font-size: 1.2rem !important;
    }
    .adm-btn { height: 3.75rem !important; font-size: 1.1rem !important; }
    .adm-toggle { width: 56px !important; height: 56px !important; }
    .adm-corner-size { width: 36px !important; height: 36px !important; }
    .adm-footer { font-size: 1rem !important; }
  }

  /* Animation keyframes */
  @keyframes admScan {
    0%   { top: -2px; opacity: 0; }
    5%   { opacity: 1; }
    95%  { opacity: 0.55; }
    100% { top: 100%; opacity: 0; }
  }
  .adm-scan { animation: admScan 7s ease-in-out infinite; position: absolute; }

  @keyframes admBubble {
    0%   { transform: translateY(0); opacity: 0; }
    8%   { opacity: 1; }
    92%  { opacity: 0.55; }
    100% { transform: translateY(calc(-100vh - 200px)) translateX(16px); opacity: 0; }
  }
  .adm-bubble { animation: admBubble linear infinite; position: absolute; }

  @keyframes admFadeIn {
    from { opacity: 0; transform: translateY(18px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .adm-card { animation: admFadeIn 0.6s cubic-bezier(0.22,1,0.36,1) both; }

  @keyframes admShake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-6px); }
    40%     { transform: translateX(6px); }
    60%     { transform: translateX(-3px); }
    80%     { transform: translateX(3px); }
  }
  .adm-shake { animation: admShake 0.38s ease; }

  @keyframes admTheme {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .adm-theme { animation: admTheme 0.3s ease both; }

  .adm-input::placeholder { opacity: 1; }
`;

/* ══════════════════════════════════════════════════════════
   DARK MODE EFFECTS
══════════════════════════════════════════════════════════ */
function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    const stars: { x: number; y: number; r: number; o: number; sp: number }[] = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.1 + 0.2,
        o: Math.random() * 0.6 + 0.1,
        sp: Math.random() * 0.015 + 0.003,
      });
    }
    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.01;
      stars.forEach(s => {
        const p = s.o + Math.sin(t * s.sp * 60) * 0.18;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(178,245,234,${Math.max(0, Math.min(1, p))})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.45 }} />;
}

function DarkGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.055 }}>
        <defs>
          <pattern id="admgrid" width="55" height="55" patternUnits="userSpaceOnUse">
            <path d="M 55 0 L 0 0 0 55" fill="none" stroke="#2dd4bf" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#admgrid)" />
      </svg>
      <div className="absolute left-0 right-0 h-px adm-scan"
        style={{ background: 'linear-gradient(90deg,transparent,rgba(45,212,191,0.45),transparent)' }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   LIGHT MODE EFFECTS
══════════════════════════════════════════════════════════ */
const DOTS = [
  { size: 5,  left: '3%',  delay: 0,    dur: 12, color: 'rgba(167,139,250,0.6)'  },
  { size: 4,  left: '9%',  delay: 2.5,  dur: 16, color: 'rgba(236,172,213,0.65)' },
  { size: 6,  left: '16%', delay: 5,    dur: 14, color: 'rgba(147,197,253,0.6)'  },
  { size: 5,  left: '24%', delay: 1,    dur: 18, color: 'rgba(196,181,253,0.65)' },
  { size: 4,  left: '31%', delay: 7,    dur: 11, color: 'rgba(253,186,116,0.55)' },
  { size: 6,  left: '38%', delay: 3,    dur: 15, color: 'rgba(167,139,250,0.55)' },
  { size: 5,  left: '45%', delay: 9,    dur: 13, color: 'rgba(236,172,213,0.6)'  },
  { size: 6,  left: '52%', delay: 0.5,  dur: 17, color: 'rgba(147,197,253,0.65)' },
  { size: 4,  left: '59%', delay: 6,    dur: 10, color: 'rgba(196,181,253,0.6)'  },
  { size: 5,  left: '66%', delay: 4,    dur: 19, color: 'rgba(167,139,250,0.55)' },
  { size: 6,  left: '73%', delay: 11,   dur: 14, color: 'rgba(253,186,116,0.5)'  },
  { size: 4,  left: '79%', delay: 2,    dur: 16, color: 'rgba(236,172,213,0.65)' },
  { size: 5,  left: '85%', delay: 8,    dur: 12, color: 'rgba(147,197,253,0.6)'  },
  { size: 6,  left: '91%', delay: 3.5,  dur: 20, color: 'rgba(196,181,253,0.55)' },
  { size: 4,  left: '97%', delay: 13,   dur: 15, color: 'rgba(167,139,250,0.6)'  },
  { size: 5,  left: '13%', delay: 10,   dur: 13, color: 'rgba(253,186,116,0.55)' },
  { size: 6,  left: '27%', delay: 14,   dur: 18, color: 'rgba(236,172,213,0.55)' },
  { size: 4,  left: '42%', delay: 4.5,  dur: 11, color: 'rgba(147,197,253,0.65)' },
  { size: 5,  left: '57%', delay: 12,   dur: 16, color: 'rgba(196,181,253,0.6)'  },
  { size: 6,  left: '71%', delay: 7.5,  dur: 14, color: 'rgba(167,139,250,0.55)' },
];

function FloatingDots() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {DOTS.map((d, i) => (
        <div key={i} className="absolute rounded-full adm-bubble" style={{
          width: d.size, height: d.size,
          left: d.left, bottom: '-20px',
          background: d.color,
          animationDuration: `${d.dur}s`,
          animationDelay: `${d.delay}s`,
        }} />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
const AdminLoginForm: React.FC = () => {
  const { isDark: dark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.nativeLogin({ username: username.trim(), password });
      auth.storeNativeAuthData(response.access_token, response.user);
      localStorage.setItem('loginSource', 'system-admin-login');
      if (response.force_password_reset === true) {
        navigate('/system-admin/change-password-forced', { replace: true });
      } else {
        navigate('/system-admin', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const D = {
    pageBg:      'linear-gradient(155deg,#020617 0%,#050e1a 50%,#020b14 100%)',
    cardBg:      'rgba(7,13,22,0.88)',
    cardBorder:  '1px solid rgba(45,212,191,0.18)',
    cardShadow:  '0 0 48px rgba(45,212,191,0.07), 0 20px 50px rgba(0,0,0,0.65)',
    topBar:      'linear-gradient(90deg,transparent,rgba(45,212,191,0.7),rgba(99,102,241,0.4),transparent)',
    botBar:      'linear-gradient(90deg,transparent,rgba(99,102,241,0.4),rgba(45,212,191,0.3),transparent)',
    heading:     '#e2e8f0',
    sub:         'rgba(45,212,191,0.4)',
    muted:       '#1e3a4a',
    inputBg:     'rgba(15,23,42,0.55)',
    inputBgFoc:  'rgba(45,212,191,0.04)',
    inputBorder: 'rgba(51,65,85,0.8)',
    inputFocus:  'rgba(45,212,191,0.5)',
    inputShadow: '0 0 0 3px rgba(45,212,191,0.07)',
    inputColor:  '#e2e8f0',
    btnBg:       'linear-gradient(135deg,rgba(13,148,136,0.28),rgba(8,145,178,0.18))',
    btnBorder:   '1px solid rgba(45,212,191,0.38)',
    btnColor:    '#2dd4bf',
    toggleBg:    'rgba(15,23,42,0.9)',
    toggleBdr:   '1px solid rgba(45,212,191,0.2)',
    toggleClr:   '#fbbf24',
  };

  const L = {
    pageBg:      'linear-gradient(135deg,#fce7f3 0%,#f3e8ff 40%,#dbeafe 75%,#c8dff5 100%)',
    cardBg:      'var(--card-bg, #fff)',
    cardBorder:  'none',
    cardShadow:  '0 8px 40px rgba(124,58,237,0.12), 0 2px 8px rgba(0,0,0,0.06)',
    topBar:      'none',
    botBar:      'none',
    heading:     'var(--text-main, #111)',
    sub:         'var(--text-belowmain, #6b7280)',
    muted:       'var(--text-muted, #9ca3af)',
    inputBg:     'var(--input-bg, #fff)',
    inputBgFoc:  'var(--input-bg, #fff)',
    inputBorder: 'rgba(196,181,253,0.55)',
    inputFocus:  '#7c3aed',
    inputShadow: '0 0 0 3px rgba(124,58,237,0.1)',
    inputColor:  'var(--text-main, #111)',
    btnBg:       'linear-gradient(to right,#3B82F6,#9333EA)',
    btnBorder:   'none',
    btnColor:    '#fff',
    toggleBg:    '#fff',
    toggleBdr:   'none',
    toggleClr:   '#6b7280',
  };

  const T = dark ? D : L;

  const corners = ['tl', 'tr', 'bl', 'br'] as const;

  return (
    <>
      <style>{responsiveStyles}</style>

      {/* MOBILE BLOCKER */}
      <div className="flex md:hidden h-screen w-full items-center justify-center p-6 bg-slate-900">
        <p className="text-center text-lg font-semibold text-white">
          This application is not available on mobile devices.<br />
          Please use a laptop or desktop.
        </p>
      </div>

      {/* DESKTOP */}
      <div
        key={dark ? 'dark' : 'light'}
        className="adm-theme hidden md:flex h-screen w-full items-center justify-center relative overflow-hidden p-6"
        style={{ background: T.pageBg }}
      >
        {dark ? (
          <>
            <StarField />
            <DarkGrid />
            <div className="absolute pointer-events-none" style={{
              top: '10%', left: '50%', transform: 'translateX(-50%)',
              width: 'min(600px,90vw)', height: 'min(600px,90vh)',
              background: 'radial-gradient(ellipse,rgba(13,148,136,0.1) 0%,transparent 65%)',
            }} />

            {/* Corner accents — responsive via CSS classes */}
            {corners.map(c => (
              <div key={c} className={`absolute pointer-events-none adm-corner-${c === 'tl' ? 'tl' : c === 'tr' ? 'tr' : c === 'bl' ? 'bl' : 'br'}`} style={{
                top:    c[0] === 't' ? 20 : undefined,
                bottom: c[0] === 'b' ? 20 : undefined,
                left:   c[1] === 'l' ? 20 : undefined,
                right:  c[1] === 'r' ? 20 : undefined,
              }}>
                <div className="adm-corner-size" style={{
                  width: 22, height: 22,
                  borderTop:    c[0] === 't' ? '1px solid rgba(45,212,191,0.25)' : undefined,
                  borderBottom: c[0] === 'b' ? '1px solid rgba(45,212,191,0.25)' : undefined,
                  borderLeft:   c[1] === 'l' ? '1px solid rgba(45,212,191,0.25)' : undefined,
                  borderRight:  c[1] === 'r' ? '1px solid rgba(45,212,191,0.25)' : undefined,
                }} />
              </div>
            ))}

            <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
              <span style={{
                color: 'rgba(45,212,191,0.18)',
                fontFamily: "'Courier New',monospace",
                fontSize: 9,
                letterSpacing: '0.3em',
              }}>
                VEGA CONTROL SYSTEM — RESTRICTED ACCESS
              </span>
            </div>
          </>
        ) : (
          <FloatingDots />
        )}

        {/* THEME TOGGLE */}
        <div className="absolute adm-toggle" style={{ top: '24px', right: '24px', zIndex: 50 }}>
          <button
            onClick={toggleTheme}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-md cursor-pointer transition-all duration-200 hover:scale-110"
            style={{
              background:     T.toggleBg,
              border:         T.toggleBdr || undefined,
              color:          T.toggleClr,
              width:          '36px',
              height:         '36px',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              backdropFilter: 'blur(12px)',
            }}
          >
            {dark ? <GoSun size={18} /> : <MdOutlineDarkMode size={18} />}
          </button>
        </div>

        {/* CARD — width managed by .adm-card-shell via media queries */}
        <div className="adm-card adm-card-shell relative">
          {dark && (
            <div className="absolute -inset-px rounded-md pointer-events-none" style={{
              background: 'linear-gradient(135deg,rgba(45,212,191,0.22),rgba(99,102,241,0.12),rgba(45,212,191,0.06))',
            }} />
          )}

          <div className="relative rounded-md overflow-hidden" style={{
            background:     T.cardBg,
            border:         T.cardBorder,
            boxShadow:      T.cardShadow,
            backdropFilter: dark ? 'blur(28px)' : undefined,
          }}>
            {dark && <div className="h-px w-full" style={{ background: T.topBar }} />}

            <div className="adm-pb" style={{ paddingBottom: '1.5rem' }}>
              <div className="flex justify-center adm-pt" style={{ paddingTop: '1.5rem' }}>
                <img
                  src={dark ? '/logo-dark.png' : '/logo-light.png'}
                  alt="Vega AI"
                  className="adm-logo"
                  style={{ height: '8rem' }} /* 128px at 1920 reference */
                />
              </div>

              <h1
                className="text-center font-bold mt-4 adm-heading"
                style={{
                  fontSize:   '1.5rem', /* 24px at reference */
                  color:      T.heading,
                  fontFamily: dark ? "'Courier New',monospace" : undefined,
                }}
              >
                {dark ? 'Admin Access' : 'Admin Login'}
              </h1>

              <p
                className="text-center font-medium mt-1 mb-6 adm-sub"
                style={{
                  fontSize:   '0.75rem',
                  color:      T.sub,
                  fontFamily: dark ? "'Courier New',monospace" : undefined,
                }}
              >
                {dark ? '// restricted — authenticate to proceed' : 'System administrator portal'}
              </p>

              <div className="adm-px" style={{ paddingLeft: '1.75rem', paddingRight: '1.75rem' }}>
                <form onSubmit={handleLogin} className="adm-space" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* USERNAME */}
                  <div>
                    <label
                      className="adm-label font-medium mb-1 block"
                      style={{
                        fontSize:      dark ? '0.688rem' : '0.875rem',
                        color:         T.heading,
                        fontFamily:    dark ? "'Courier New',monospace" : undefined,
                        letterSpacing: dark ? '0.1em' : undefined,
                        textTransform: dark ? 'uppercase' as const : undefined,
                      }}
                    >
                      {dark ? '⟩ Username' : 'Username'}
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={e => { setUsername(e.target.value); setError(''); }}
                      placeholder="admin"
                      disabled={isLoading}
                      className="adm-input w-full px-3 py-2 rounded-md outline-none transition-all duration-200"
                      style={{
                        background: T.inputBg,
                        border:     `1px solid ${T.inputBorder}`,
                        color:      T.inputColor,
                        fontFamily: dark ? "'Courier New',monospace" : undefined,
                        fontSize:   13,
                      }}
                      onFocus={e => {
                        e.currentTarget.style.border = `1px solid ${T.inputFocus}`;
                        e.currentTarget.style.boxShadow = T.inputShadow;
                        e.currentTarget.style.background = T.inputBgFoc;
                      }}
                      onBlur={e => {
                        e.currentTarget.style.border = `1px solid ${T.inputBorder}`;
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.background = T.inputBg;
                      }}
                    />
                  </div>

                  {/* PASSWORD */}
                  <div>
                    <label
                      className="adm-label font-medium mb-1 block"
                      style={{
                        fontSize:      dark ? '0.688rem' : '0.875rem',
                        color:         T.heading,
                        fontFamily:    dark ? "'Courier New',monospace" : undefined,
                        letterSpacing: dark ? '0.1em' : undefined,
                        textTransform: dark ? 'uppercase' as const : undefined,
                      }}
                    >
                      {dark ? '⟩ Password' : 'Password'}
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="adm-input w-full px-3 py-2 rounded-md outline-none transition-all duration-200"
                      style={{
                        background: T.inputBg,
                        border:     `1px solid ${T.inputBorder}`,
                        color:      T.inputColor,
                        fontFamily: dark ? "'Courier New',monospace" : undefined,
                        fontSize:   13,
                      }}
                      onFocus={e => {
                        e.currentTarget.style.border = `1px solid ${T.inputFocus}`;
                        e.currentTarget.style.boxShadow = T.inputShadow;
                        e.currentTarget.style.background = T.inputBgFoc;
                      }}
                      onBlur={e => {
                        e.currentTarget.style.border = `1px solid ${T.inputBorder}`;
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.background = T.inputBg;
                      }}
                    />
                  </div>

                  {/* ERROR */}
                  {error && (
                    <div
                      key={error}
                      className="adm-shake text-xs text-center py-2 px-3 rounded-md"
                      style={dark ? {
                        background: 'rgba(239,68,68,0.08)',
                        border:     '1px solid rgba(239,68,68,0.3)',
                        color:      '#fca5a5',
                        fontFamily: "'Courier New',monospace",
                      } : {
                        background: '#fef2f2',
                        border:     '1px solid #fecaca',
                        color:      '#b91c1c',
                      }}
                    >
                      {dark ? `⚠ ${error}` : error}
                    </div>
                  )}

                  {/* SUBMIT */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="adm-btn relative w-full rounded-md overflow-hidden font-semibold transition-all duration-300 ease-in-out group"
                    style={{
                      height:        '2.5rem',
                      background:    T.btnBg,
                      border:        T.btnBorder || undefined,
                      color:         T.btnColor,
                      cursor:        isLoading ? 'not-allowed' : 'pointer',
                      opacity:       isLoading ? 0.7 : 1,
                      fontFamily:    dark ? "'Courier New',monospace" : undefined,
                      letterSpacing: dark ? '0.1em' : undefined,
                      textTransform: dark ? 'uppercase' as const : undefined,
                      fontSize:      '0.875rem',
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)' }}
                    />
                    <span className="relative flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                          {dark ? 'Authenticating...' : 'Signing In...'}
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </span>
                  </button>
                </form>

                <p
                  className="adm-footer w-full text-center mt-6"
                  style={{
                    fontSize:   '0.75rem',
                    color:      T.muted,
                    fontFamily: dark ? "'Courier New',monospace" : undefined,
                  }}
                >
                  © 2026 Product of Like Minds Consulting Inc.
                </p>
              </div>
            </div>

            {dark && (
              <div className="h-px w-full" style={{ background: T.botBar }} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLoginForm;