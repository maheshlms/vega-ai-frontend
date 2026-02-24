import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const BUBBLES: Bubble[] = [
  { size: 90,  left: "5%",  delay: 0,    dur: 15, color: "rgba(236,172,213,0.55)" },
  { size: 55,  left: "18%", delay: 3.5,  dur: 19, color: "rgba(180,160,240,0.5)"  },
  { size: 130, left: "33%", delay: 1,    dur: 22, color: "rgba(160,200,240,0.4)"  },
  { size: 42,  left: "48%", delay: 5.5,  dur: 13, color: "rgba(240,180,210,0.5)"  },
  { size: 95,  left: "63%", delay: 2.5,  dur: 18, color: "rgba(200,165,245,0.48)" },
  { size: 65,  left: "77%", delay: 7,    dur: 16, color: "rgba(160,220,240,0.48)" },
  { size: 35,  left: "87%", delay: 4,    dur: 12, color: "rgba(240,200,180,0.52)" },
  { size: 110, left: "93%", delay: 9.5,  dur: 24, color: "rgba(200,180,255,0.38)" },
  { size: 58,  left: "13%", delay: 11.5, dur: 17, color: "rgba(255,180,210,0.45)" },
  { size: 75,  left: "54%", delay: 6.5,  dur: 20, color: "rgba(170,210,255,0.48)" },
  { size: 48,  left: "41%", delay: 13.5, dur: 14, color: "rgba(220,170,255,0.45)" },
  { size: 88,  left: "71%", delay: 8.5,  dur: 21, color: "rgba(255,200,230,0.38)" },
];

// Bubbles Component
function Bubbles() {
  return (
    <div className="lp-bubbles">
      {BUBBLES.map((b, i) => (
        <div
          key={i}
          className="lp-bubble"
          style={{
            width: b.size,
            height: b.size,
            left: b.left,
            bottom: -160,
            background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.88), ${b.color})`,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
            boxShadow: `inset 0 0 18px rgba(255,255,255,0.5), 0 4px 12px rgba(180,160,240,0.12)`,
          }}
        />
      ))}
    </div>
  );
}

// Login Form
function LoginForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gErr, setGErr] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: "" }));
    setGErr("");
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.username.trim()) e.username = "Username is required";
    if (!form.password) e.password = "Password is required";
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setLoading(true);
    try {
      const response = await api.nativeLogin({
        username: form.username,
        password: form.password
      });

      // Store the authentication token and user data
      auth.storeNativeAuthData(response.access_token, response.user);

      // Check if force_password_reset flag is set
      if (response.force_password_reset === true) {
        // Redirect to forced password change page
        navigate("/system-admin/change-password-forced", { replace: true });
      } else {
        // Normal flow: redirect to admin dashboard
        navigate("/system-admin", { replace: true });
      }
      setLoading(false);
    } catch (err: any) {
      setGErr(err.message || "Login failed. Please check your credentials.");
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div className="lp-card">
      <div className="lp-logo-area">
        <div className="lp-logo-mark"><span>A</span></div>
        <h1>Welcome back.</h1>
        <p className="lp-subtitle">Sign in to continue your session.</p>
      </div>
      <div className="lp-form">
        {gErr && <div className="lp-global-err" key={gErr}>{gErr}</div>}
        <div className="lp-field">
          <label>Username</label>
          <input
            type="text"
            value={form.username}
            onChange={set("username")}
            onKeyDown={onKey}
            placeholder="admin"
            className={errors.username ? "lp-err" : ""}
          />
          {errors.username && <span className="lp-field-error">{errors.username}</span>}
        </div>
        <div className="lp-field">
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={set("password")}
            onKeyDown={onKey}
            placeholder="••••••••"
            className={errors.password ? "lp-err" : ""}
          />
          {errors.password && <span className="lp-field-error">{errors.password}</span>}
        </div>
        <div className="lp-forgot"><span>Forgot password?</span></div>
        <button className="lp-btn" onClick={submit} disabled={loading}>
          {loading && <span className="lp-spinner" />}
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </div>
    </div>
  );
}

// Main Login Page
export default function AdminLoginForm() {
  return (
    <>
      <style>{STYLES}</style>
      <div className="lp-root">
        <Bubbles />
        <div className="lp-wrapper">
          <LoginForm />
        </div>
      </div>
    </>
  );
}
