import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoSun } from "react-icons/go";
import { MdOutlineDarkMode } from "react-icons/md";
import { api } from '../../utils/api';
import { auth } from '../../utils/auth';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');

  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    height: 100% !important;
    overflow-x: hidden;
  }

  #root {
    width: 100% !important;
    min-height: 100vh !important;
    margin: 0 !important;
    padding: 0 !important;
    max-width: none !important;
  }

  .lp-root {
    position: fixed !important;
    top: 0 !important; left: 0 !important;
    right: 0 !important; bottom: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    background: linear-gradient(135deg, #f9d6e8 0%, #e8d6f5 35%, #d6e8f9 70%, #c8dff5 100%) !important;
    overflow: hidden !important;
    z-index: 9999 !important;
    font-family: 'DM Sans', sans-serif;
    box-sizing: border-box;
    padding: 24px;
  }

  .lp-bubbles {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }

  .lp-bubble {
    position: absolute;
    border-radius: 50%;
    animation: lpFloat linear infinite;
  }

  @keyframes lpFloat {
    0%   { transform: translateY(110vh) translateX(0px);  opacity: 0; }
    8%   { opacity: 1; }
    92%  { opacity: 0.55; }
    100% { transform: translateY(-15vh) translateX(25px); opacity: 0; }
  }

  .lp-wrapper {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 420px;
  }

  .lp-back-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.8);
    border-radius: 12px;
    padding: 12px 16px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #18182b;
    cursor: pointer;
    width: fit-content;
    margin-bottom: 20px;
    transition: all 0.2s ease;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .lp-back-btn:hover {
    background: rgba(255, 255, 255, 0.8);
    box-shadow: 0 4px 15px rgba(124, 58, 237, 0.15);
    transform: translateX(-2px);
  }

  .lp-back-btn:active {
    transform: scale(0.98);
  }

  .lp-back-arrow {
    font-size: 16px;
    line-height: 1;
  }

  .lp-card {
    background: rgba(255, 255, 255, 0.84);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.8);
    border-radius: 24px;
    padding: 44px 44px 40px;
    box-shadow:
      0 8px 40px rgba(124, 58, 237, 0.13),
      0 2px 8px rgba(0, 0, 0, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.95);
    animation: lpSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    box-sizing: border-box;
    width: 100%;
  }

  @keyframes lpSlideUp {
    from { opacity: 0; transform: translateY(20px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .lp-logo-area { margin-bottom: 32px; }

  .lp-logo-mark {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    box-shadow: 0 6px 20px rgba(124, 58, 237, 0.38);
  }

  .lp-logo-mark span {
    color: #fff;
    font-family: 'Playfair Display', serif;
    font-size: 24px;
    font-weight: 700;
    line-height: 1;
  }

  .lp-card h1 {
    font-family: 'Playfair Display', serif;
    font-size: 28px;
    font-weight: 700;
    color: #18182b;
    line-height: 1.2;
    margin: 0 0 5px;
  }

  .lp-subtitle {
    font-size: 14px;
    color: #6b7280;
    font-weight: 300;
    margin: 0;
  }

  .lp-form { display: flex; flex-direction: column; gap: 16px; }

  .lp-field { display: flex; flex-direction: column; gap: 6px; }

  .lp-field label {
    font-size: 11px;
    font-weight: 600;
    color: #374151;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .lp-field input {
    background: rgba(255, 255, 255, 0.7);
    border: 1.5px solid rgba(196, 181, 253, 0.55);
    border-radius: 12px;
    padding: 12px 15px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    color: #18182b;
    outline: none;
    width: 100%;
    transition: all 0.2s ease;
    box-sizing: border-box;
  }

  .lp-field input::placeholder { color: #9ca3af; }

  .lp-field input:focus {
    border-color: #7c3aed;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
  }

  .lp-field input.lp-err { border-color: #ef4444; }
  .lp-field input.lp-err:focus { box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1); }

  .lp-field-error { font-size: 12px; color: #ef4444; }

  .lp-forgot { text-align: right; margin-top: -4px; }
  .lp-forgot span {
    font-size: 12.5px;
    color: #7c3aed;
    cursor: pointer;
    font-weight: 500;
    transition: opacity 0.15s;
  }
  .lp-forgot span:hover { opacity: 0.7; }

  .lp-btn {
    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    cursor: pointer;
    width: 100%;
    margin-top: 4px;
    box-shadow: 0 4px 18px rgba(124, 58, 237, 0.38);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .lp-btn:hover   { transform: translateY(-1px); box-shadow: 0 8px 26px rgba(124,58,237,0.44); }
  .lp-btn:active  { transform: scale(0.99); }
  .lp-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .lp-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: #9ca3af;
  }
  .lp-divider::before, .lp-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(196, 181, 253, 0.4);
  }

  .lp-switch { text-align: center; font-size: 13.5px; color: #6b7280; margin: 0; }
  .lp-switch button {
    background: none;
    border: none;
    color: #7c3aed;
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .lp-switch button:hover { opacity: 0.75; }

  .lp-global-err {
    background: rgba(254, 226, 226, 0.8);
    border: 1px solid rgba(252, 165, 165, 0.6);
    border-radius: 12px;
    padding: 11px 15px;
    font-size: 13px;
    color: #b91c1c;
    animation: lpShake 0.35s ease;
  }
  @keyframes lpShake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-6px); }
    60%     { transform: translateX(6px); }
  }

  .lp-spinner {
    display: inline-block;
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: lpSpin 0.7s linear infinite;
    vertical-align: middle;
    margin-right: 8px;
  }
  @keyframes lpSpin { to { transform: rotate(360deg); } }
`;

// Bubble data
interface Bubble {
  size: number;
  left: string;
  delay: number;
  dur: number;
  color: string;
}

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
          width: d.size,
          height: d.size,
          left: d.left,
          bottom: '-20px',
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
  const [dark, setDark] = useState<boolean>(false);
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

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

      // Mark that user logged in from system-admin-login endpoint
      localStorage.setItem('loginSource', 'system-admin-login');

      // Check if force_password_reset flag is set
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

  /* ─────────────────────────────────────────
     Theme token objects — dark vs light
  ───────────────────────────────────────── */
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
    inputPh:     'rgba(71,85,105,0.8)',
    btnBg:       'linear-gradient(135deg,rgba(13,148,136,0.28),rgba(8,145,178,0.18))',
    btnBorder:   '1px solid rgba(45,212,191,0.38)',
    btnColor:    '#2dd4bf',
    divider:     'rgba(30,41,59,0.8)',
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
    inputPh:     '#9ca3af',
    btnBg:       'linear-gradient(to right,#3B82F6,#9333EA)',
    btnBorder:   'none',
    btnColor:    '#fff',
    divider:     '#e5e7eb',
    toggleBg:    '#fff',
    toggleBdr:   'none',
    toggleClr:   '#6b7280',
  };

  const T = dark ? D : L;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
        .adm-root { font-family: 'DM Sans', sans-serif; }
        .adm-root * { font-family: 'DM Sans', sans-serif; }
        .adm-root input, .adm-root button { font-family: 'DM Sans', sans-serif; }
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
      `}</style>

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
        className="adm-root adm-theme hidden md:flex h-screen w-full items-center justify-center relative overflow-hidden p-6"
        style={{ background: T.pageBg }}
      >
        {/* background layer */}
        {dark ? (
          <>
            <StarField />
            <DarkGrid />
            <div className="absolute pointer-events-none" style={{
              top: '10%', left: '50%', transform: 'translateX(-50%)',
              width: 'min(600px,90vw)', height: 'min(600px,90vh)',
              background: 'radial-gradient(ellipse,rgba(13,148,136,0.1) 0%,transparent 65%)',
            }} />
            {(['tl','tr','bl','br'] as const).map(c => (
              <div key={c} className="absolute pointer-events-none" style={{
                top:    c[0]==='t' ? 20 : undefined,
                bottom: c[0]==='b' ? 20 : undefined,
                left:   c[1]==='l' ? 20 : undefined,
                right:  c[1]==='r' ? 20 : undefined,
              }}>
                <div style={{
                  width: 22, height: 22,
                  borderTop:    c[0]==='t' ? '1px solid rgba(45,212,191,0.25)' : undefined,
                  borderBottom: c[0]==='b' ? '1px solid rgba(45,212,191,0.25)' : undefined,
                  borderLeft:   c[1]==='l' ? '1px solid rgba(45,212,191,0.25)' : undefined,
                  borderRight:  c[1]==='r' ? '1px solid rgba(45,212,191,0.25)' : undefined,
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

        {/* THEME TOGGLE + BACK TO LOGIN */}
        <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
          <button
            onClick={() => navigate('/login')}
            className="px-3 py-2 rounded-lg shadow-sm cursor-pointer transition-all duration-200 text-sm font-medium"
            style={{
              background: T.toggleBg,
              border:     dark ? '1px solid rgba(45,212,191,0.25)' : '1px solid #E5E7EB',
              color:      dark ? '#2dd4bf' : '#374151',
              fontFamily: "'DM Sans',sans-serif",
              fontSize:   13,
            }}
          >
            ← Login
          </button>
          <button
            onClick={() => setDark(d => !d)}
            className="p-2 rounded-md shadow cursor-pointer hover:bg-gray-100 transition-all duration-200"
            style={{
              background: T.toggleBg,
              border:     T.toggleBdr || undefined,
              color:      T.toggleClr,
            }}
          >
            {dark ? <GoSun size={18} /> : <MdOutlineDarkMode size={18} />}
          </button>
        </div>

        {/* CARD */}
        <div className="adm-card relative" style={{ width: 420 }}>

          {dark && (
            <div className="absolute -inset-px rounded-2xl pointer-events-none" style={{
              background: 'linear-gradient(135deg,rgba(45,212,191,0.22),rgba(99,102,241,0.12),rgba(45,212,191,0.06))',
            }} />
          )}

          <div className="relative rounded-2xl overflow-hidden" style={{
            background:     T.cardBg,
            border:         T.cardBorder,
            boxShadow:      T.cardShadow,
            backdropFilter: dark ? 'blur(28px)' : undefined,
          }}>

            {dark && <div className="h-px w-full" style={{ background: T.topBar }} />}

            <div className="pb-6">

              <div className="flex justify-center pt-6">
                <img
                  src={dark ? '/logo-dark.png' : '/logo-light.png'}
                  alt="Vega AI"
                  className="h-32"
                />
              </div>

              <h1
                className="text-center text-2xl font-bold mt-4"
                style={{
                  color:      T.heading,
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                Admin Login
              </h1>

              <p
                className="text-center text-xs font-medium mt-1 mb-6"
                style={{
                  color:      T.sub,
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                System administrator portal
              </p>

              <div className="px-7">
                <form onSubmit={handleLogin} className="space-y-4">

                  {/* USERNAME */}
                  <div>
                    <label
                      className="text-sm font-medium mb-1 block"
                      style={{
                        color:      T.heading,
                        fontFamily: "'DM Sans',sans-serif",
                      }}
                    >
                      Username
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
                        fontFamily: "'DM Sans',sans-serif",
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
                      className="text-sm font-medium mb-1 block"
                      style={{
                        color:      T.heading,
                        fontFamily: "'DM Sans',sans-serif",
                      }}
                    >
                      Password
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
                        fontFamily: "'DM Sans',sans-serif",
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
                      style={{
                        background: dark ? 'rgba(239,68,68,0.08)' : '#fef2f2',
                        border:     dark ? '1px solid rgba(239,68,68,0.3)' : '1px solid #fecaca',
                        color:      dark ? '#fca5a5' : '#b91c1c',
                        fontFamily: "'DM Sans',sans-serif",
                      }}
                    >
                      {error}
                    </div>
                  )}

                  {/* SUBMIT */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="relative w-full h-10 rounded-md overflow-hidden font-semibold text-sm transition-all duration-300 ease-in-out group"
                    style={{
                      background:    T.btnBg,
                      border:        T.btnBorder || undefined,
                      color:         T.btnColor,
                      cursor:        isLoading ? 'not-allowed' : 'pointer',
                      opacity:       isLoading ? 0.7 : 1,
                      fontFamily: "'DM Sans',sans-serif",
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
                          Signing In...
                        </>
                      ) : (
                        dark ? 'Sign In' : 'Sign In'
                      )}
                    </span>
                  </button>
                </form>

                {/* footer */}
                <p
                  className="w-full text-center text-xs mt-6"
                  style={{
                    color:      T.muted,
                    fontFamily: "'DM Sans',sans-serif",
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