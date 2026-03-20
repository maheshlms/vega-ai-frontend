import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../utils/auth';

interface AdminUser {
  name?: string;
  email?: string;
}

const getSession = (): AdminUser | null => {
  try {
    // Check for native auth data (from storeNativeAuthData)
    const userStr = localStorage.getItem("user");
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  } catch {
    return null;
  }
};

const clearSession = () => {
  // Use auth utility's logout function to clear all auth data
  auth.logout();
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&display=swap');

  html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; overflow-x: hidden; }
  #root { width: 100% !important; min-height: 100vh !important; margin: 0 !important; padding: 0 !important; max-width: none !important; }

  .as-root {
    position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
    width: 100vw !important; height: 100vh !important; font-family: 'DM Sans', sans-serif;
    background: #f5f5f7; color: #1a1a2e; overflow-y: auto; z-index: 9999 !important; box-sizing: border-box;
  }

  .as-nav {
    display: flex; align-items: center; justify-content: space-between; padding: 0 40px; height: 64px;
    background: #ffffff; border-bottom: 1px solid #e8e8ee; position: sticky; top: 0; z-index: 100;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .as-nav-brand { display: flex; align-items: center; gap: 12px; }
  .as-nav-logo {
    width: 34px; height: 34px; background: linear-gradient(135deg, #7c3aed, #a855f7);
    border-radius: 9px; display: flex; align-items: center; justify-content: center;
    font-size: 15px; font-weight: 700; color: #fff;
  }
  .as-nav-title { font-size: 15px; font-weight: 600; color: #1a1a2e; letter-spacing: -0.01em; }
  .as-nav-right { display: flex; align-items: center; gap: 12px; }
  .as-user-chip {
    display: flex; align-items: center; gap: 9px; background: #f5f5f7; border: 1px solid #e4e4ec;
    border-radius: 40px; padding: 5px 14px 5px 6px;
  }
  .as-user-avatar {
    width: 26px; height: 26px; background: linear-gradient(135deg, #7c3aed, #a855f7);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #fff;
  }
  .as-user-name { font-size: 13px; font-weight: 500; color: #4b4b6b; }
  .as-nav-logout {
    display: flex; align-items: center; gap: 7px; background: none; border: 1px solid #fecaca;
    border-radius: 9px; padding: 7px 14px; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500; color: #ef4444; cursor: pointer; transition: all 0.18s ease;
  }
  .as-nav-logout:hover { background: #fef2f2; border-color: #fca5a5; }

  .as-body { max-width: 1000px; margin: 0 auto; padding: 48px 40px; }
  .as-header { margin-bottom: 40px; animation: asFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
  .as-header h1 {
    font-family: 'DM Sans', sans-serif; font-size: 36px; font-weight: 700; color: #1a1a2e;
    margin: 0 0 6px; letter-spacing: -0.03em;
  }
  .as-header p { font-size: 14px; color: #9090a8; margin: 0; font-weight: 300; }
  .as-label {
    font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
    color: #b0b0c8; margin-bottom: 16px;
  }

  .as-cards {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 40px;
  }
  .as-card {
    background: #ffffff; border: 1px solid #e8e8ee; border-radius: 18px; padding: 28px; cursor: pointer;
    transition: all 0.22s cubic-bezier(0.22,1,0.36,1); animation: asFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both;
  }
  .as-card:nth-child(1) { animation-delay: 0.08s; }
  .as-card:nth-child(2) { animation-delay: 0.16s; }
  .as-card:hover { border-color: #d4d4e4; transform: translateY(-3px); box-shadow: 0 12px 40px rgba(100,80,180,0.1); }

  .as-card-icon-wrap {
    width: 48px; height: 48px; border-radius: 13px; display: flex;
    align-items: center; justify-content: center; font-size: 20px; margin-bottom: 20px;
  }
  .as-card-users .as-card-icon-wrap { background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.15); }
  .as-card-tokens .as-card-icon-wrap { background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.15); }

  .as-card h2 { font-size: 16px; font-weight: 600; color: #1a1a2e; margin: 0 0 7px; letter-spacing: -0.01em; }
  .as-card p { font-size: 13px; color: #9090a8; margin: 0 0 24px; line-height: 1.6; font-weight: 300; }

  .as-card-bottom { display: flex; align-items: center; justify-content: space-between; }
  .as-card-stat-val { font-size: 26px; font-weight: 600; letter-spacing: -0.02em; }
  .as-card-users .as-card-stat-val { color: #7c3aed; }
  .as-card-tokens .as-card-stat-val { color: #10b981; }
  .as-card-stat-lbl { font-size: 11px; color: #b0b0c8; margin-top: 2px; font-weight: 400; }

  .as-card-btn {
    display: flex; align-items: center; gap: 6px; border: none; border-radius: 9px;
    padding: 9px 16px; font-family: 'DM Sans', sans-serif; font-size: 12px;
    font-weight: 600; cursor: pointer; transition: all 0.18s;
  }
  .as-card-users .as-card-btn { background: rgba(124,58,237,0.08); color: #7c3aed; }
  .as-card-users .as-card-btn:hover { background: rgba(124,58,237,0.15); }
  .as-card-tokens .as-card-btn { background: rgba(16,185,129,0.08); color: #10b981; }
  .as-card-tokens .as-card-btn:hover { background: rgba(16,185,129,0.15); }

  .as-logout-box {
    background: #ffffff; border: 1px solid #fecaca; border-radius: 18px; padding: 24px 28px;
    display: flex; align-items: center; justify-content: space-between; gap: 24px;
    animation: asFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.24s both;
  }
  .as-logout-left { display: flex; align-items: center; gap: 16px; }
  .as-logout-icon {
    width: 44px; height: 44px; border-radius: 12px; background: #fef2f2;
    border: 1px solid #fecaca; display: flex; align-items: center;
    justify-content: center; font-size: 18px; flex-shrink: 0;
  }
  .as-logout-text h3 { font-size: 14px; font-weight: 600; color: #ef4444; margin: 0 0 3px; }
  .as-logout-text p { font-size: 12.5px; color: #9090a8; margin: 0; font-weight: 300; line-height: 1.5; }
  .as-logout-text p strong { font-weight: 500; color: #6b7280; }
  .as-persist-badge {
    display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #10b981;
    background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2);
    border-radius: 20px; padding: 2px 8px; font-weight: 500; margin-left: 4px;
  }
  .as-logout-cta {
    display: flex; align-items: center; gap: 8px; background: #fef2f2;
    border: 1px solid #fecaca; border-radius: 11px; padding: 11px 22px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    color: #ef4444; cursor: pointer; transition: all 0.18s; white-space: nowrap; flex-shrink: 0;
  }
  .as-logout-cta:hover {
    background: #fee2e2; border-color: #fca5a5; transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(239,68,68,0.15);
  }

  @keyframes asFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

  /* ══════════════════════════════════════════════════════════════════
     GLOBAL GUARDS
  ══════════════════════════════════════════════════════════════════ */

  .as-root *, .as-root *::before, .as-root *::after {
    box-sizing: border-box;
  }

  /* Font smoothing on headings — critical at QHD/4K */
  .as-root .as-header h1,
  .as-root .as-card h2,
  .as-root .as-logout-text h3 {
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    line-height: 1.25;
  }

  /* Unitless line-heights so they scale with font size */
  .as-root .as-header p  { line-height: 1.6; }
  .as-root .as-card p    { line-height: 1.6; }
  .as-root .as-logout-text p { line-height: 1.5; }

  /* Overflow protection for user-provided text (name, email) */
  .as-root .as-user-name,
  .as-root .as-header h1 {
    overflow-wrap: break-word;
    word-break: break-word;
    min-width: 0;
  }

  /* min-width: 0 on flex children that hold text (edge cases 6 & 7) */
  .as-root .as-logout-text { min-width: 0; }
  .as-root .as-logout-left { min-width: 0; overflow: hidden; }
  .as-root .as-nav-brand   { min-width: 0; }

  /* ══════════════════════════════════════════════════════════════════
     FLUID SCALING VIA clamp()
     Handles all 768px → 1920px range smoothly without breakpoints.
     Breakpoints are only used for structural shifts and ceilings above 1920px.
  ══════════════════════════════════════════════════════════════════ */

  /* Nav: fluid padding and height */
  .as-nav {
    padding-left:  clamp(16px, 2.5vw, 40px);
    padding-right: clamp(16px, 2.5vw, 40px);
    height: clamp(52px, 4vw, 64px);
  }

  /* Nav elements: fluid font sizes */
  .as-nav-title { font-size: clamp(13px, 0.9vw, 15px); }
  .as-nav-logo  { width: clamp(26px, 2vw, 34px); height: clamp(26px, 2vw, 34px); font-size: clamp(11px, 0.9vw, 15px); }
  .as-nav-right { gap: clamp(6px, 0.8vw, 12px); }
  .as-user-name { font-size: clamp(11px, 0.8vw, 13px); }
  .as-nav-logout { font-size: clamp(11px, 0.8vw, 13px); padding: clamp(5px, 0.4vw, 7px) clamp(10px, 0.9vw, 14px); }

  /* Body: fluid max-width and padding */
  .as-body {
    max-width: clamp(560px, 70vw, 1000px);
    padding: clamp(24px, 3vw, 48px) clamp(16px, 2.5vw, 40px);
  }

  /* Header: fluid heading and subtitle */
  .as-header { margin-bottom: clamp(20px, 2.5vw, 40px); }
  .as-header h1 { font-size: clamp(22px, 2.5vw, 36px); margin-bottom: clamp(4px, 0.4vw, 6px); }
  .as-header p  { font-size: clamp(12px, 0.85vw, 14px); }

  /* Label */
  .as-label { font-size: clamp(10px, 0.65vw, 11px); margin-bottom: clamp(10px, 1vw, 16px); }

  /* Cards grid: fluid gap and min column width */
  .as-cards {
    gap: clamp(12px, 1.2vw, 20px);
    margin-bottom: clamp(20px, 2.5vw, 40px);
    grid-template-columns: repeat(auto-fit, minmax(clamp(200px, 18vw, 280px), 1fr));
  }

  /* Card internals: fluid padding, font sizes, icon */
  .as-card { padding: clamp(16px, 1.8vw, 28px); border-radius: clamp(12px, 1.2vw, 18px); }
  .as-card h2 { font-size: clamp(13px, 1vw, 16px); }
  .as-card p  { font-size: clamp(11px, 0.8vw, 13px); margin-bottom: clamp(14px, 1.5vw, 24px); }
  .as-card-icon-wrap {
    width: clamp(32px, 3vw, 48px); height: clamp(32px, 3vw, 48px);
    font-size: clamp(14px, 1.3vw, 20px); margin-bottom: clamp(12px, 1.3vw, 20px);
    border-radius: clamp(8px, 0.9vw, 13px);
  }
  .as-card-stat-val { font-size: clamp(18px, 1.8vw, 26px); }
  .as-card-stat-lbl { font-size: clamp(10px, 0.65vw, 11px); }
  .as-card-btn {
    font-size: clamp(10px, 0.75vw, 12px);
    padding: clamp(6px, 0.6vw, 9px) clamp(10px, 1vw, 16px);
    border-radius: clamp(6px, 0.6vw, 9px);
  }

  /* Logout box: fluid padding, gap, font sizes */
  .as-logout-box {
    padding: clamp(14px, 1.5vw, 24px) clamp(16px, 1.8vw, 28px);
    border-radius: clamp(12px, 1.2vw, 18px);
    gap: clamp(12px, 1.5vw, 24px);
  }
  .as-logout-left { gap: clamp(10px, 1vw, 16px); }
  .as-logout-icon {
    width: clamp(34px, 3vw, 44px); height: clamp(34px, 3vw, 44px);
    font-size: clamp(14px, 1.2vw, 18px); border-radius: clamp(8px, 0.9vw, 12px);
  }
  .as-logout-text h3 { font-size: clamp(12px, 0.9vw, 14px); }
  .as-logout-text p  { font-size: clamp(11px, 0.8vw, 12.5px); }
  .as-persist-badge  { font-size: clamp(10px, 0.65vw, 11px); }
  .as-logout-cta {
    font-size: clamp(11px, 0.8vw, 13px);
    padding: clamp(8px, 0.8vw, 11px) clamp(14px, 1.3vw, 22px);
    border-radius: clamp(8px, 0.8vw, 11px);
  }

  /* ══════════════════════════════════════════════════════════════════
     BREAKPOINT: Large tablet 768–1023px
     Structural: touch targets 44px min, logout box stacks on very narrow
  ══════════════════════════════════════════════════════════════════ */
  @media (min-width: 768px) and (max-width: 1023px) {
    .as-body { max-width: 100%; }

    /* Touch targets — min 44px on interactive elements */
    .as-card-btn    { min-height: 44px; }
    .as-nav-logout  { min-height: 44px; }
    .as-logout-cta  { min-height: 44px; }

    /* Cards: keep 2 columns minimum at tablet */
    .as-cards { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  }

  /* ══════════════════════════════════════════════════════════════════
     BREAKPOINT: Small laptop 1024–1279px
  ══════════════════════════════════════════════════════════════════ */
  @media (min-width: 1024px) and (max-width: 1279px) {
    .as-body { max-width: 100%; }
    .as-cards { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important; }
  }

  /* ══════════════════════════════════════════════════════════════════
     BREAKPOINT: Medium laptop 1280–1439px
  ══════════════════════════════════════════════════════════════════ */
  @media (min-width: 1280px) and (max-width: 1439px) {
    .as-body  { max-width: 840px; }
    .as-cards { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)) !important; }
  }

  /* ══════════════════════════════════════════════════════════════════
     BREAKPOINT: Large laptop 1440–1919px
  ══════════════════════════════════════════════════════════════════ */
  @media (min-width: 1440px) and (max-width: 1919px) {
    .as-body  { max-width: 920px; }
    .as-cards { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)) !important; }
  }

  /* ══════════════════════════════════════════════════════════════════
     BREAKPOINT: 1920px BASELINE LOCK
     Pixel-perfect match to original — nothing shifts here
  ══════════════════════════════════════════════════════════════════ */
  @media (min-width: 1920px) and (max-width: 2559px) {
    .as-nav   { padding: 0 40px; height: 64px; }
    .as-body  { max-width: 1000px; padding: 48px 40px; }
    .as-header { margin-bottom: 40px; }
    .as-header h1 { font-size: 36px; }
    .as-header p  { font-size: 14px; }
    .as-label { font-size: 11px; margin-bottom: 16px; }
    .as-cards { gap: 20px; margin-bottom: 40px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important; }
    .as-card  { padding: 28px; border-radius: 18px; }
    .as-card h2 { font-size: 16px; }
    .as-card p  { font-size: 13px; margin-bottom: 24px; }
    .as-card-icon-wrap { width: 48px; height: 48px; font-size: 20px; margin-bottom: 20px; border-radius: 13px; }
    .as-card-stat-val { font-size: 26px; }
    .as-card-stat-lbl { font-size: 11px; }
    .as-card-btn { font-size: 12px; padding: 9px 16px; border-radius: 9px; }
    .as-nav-title { font-size: 15px; }
    .as-nav-logo  { width: 34px; height: 34px; font-size: 15px; }
    .as-nav-right { gap: 12px; }
    .as-user-name { font-size: 13px; }
    .as-nav-logout { font-size: 13px; padding: 7px 14px; }
    .as-logout-box { padding: 24px 28px; border-radius: 18px; gap: 24px; }
    .as-logout-left { gap: 16px; }
    .as-logout-icon { width: 44px; height: 44px; font-size: 18px; border-radius: 12px; }
    .as-logout-text h3 { font-size: 14px; }
    .as-logout-text p  { font-size: 12.5px; }
    .as-persist-badge  { font-size: 11px; }
    .as-logout-cta { font-size: 13px; padding: 11px 22px; border-radius: 11px; }
  }

  /* ══════════════════════════════════════════════════════════════════
     BREAKPOINT: QHD 2560–3839px
     clamp() values all hit ceiling at 1920px — must explicitly expand.
     Body widens to 1400px so content doesn't feel like a narrow column.
  ══════════════════════════════════════════════════════════════════ */
  @media (min-width: 2560px) and (max-width: 3839px) {
    .as-nav   { padding: 0 64px; height: 80px; }
    .as-nav-title { font-size: 18px; }
    .as-nav-logo  { width: 44px; height: 44px; font-size: 18px; border-radius: 12px; }
    .as-nav-right { gap: 16px; }
    .as-user-chip { padding: 6px 18px 6px 8px; gap: 11px; }
    .as-user-avatar { width: 34px; height: 34px; font-size: 13px; }
    .as-user-name  { font-size: 15px; }
    .as-nav-logout { font-size: 15px; padding: 9px 18px; border-radius: 12px; }

    .as-body  { max-width: 1400px; padding: 64px 64px; }
    .as-header { margin-bottom: 52px; }
    .as-header h1 { font-size: 52px; }
    .as-header p  { font-size: 17px; }
    .as-label { font-size: 13px; margin-bottom: 20px; }

    .as-cards { gap: 28px; margin-bottom: 52px; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)) !important; }
    .as-card  { padding: 38px; border-radius: 24px; }
    .as-card h2 { font-size: 20px; }
    .as-card p  { font-size: 15.5px; margin-bottom: 32px; }
    .as-card-icon-wrap { width: 64px; height: 64px; font-size: 26px; margin-bottom: 28px; border-radius: 17px; }
    .as-card-stat-val { font-size: 36px; }
    .as-card-stat-lbl { font-size: 13px; }
    .as-card-btn { font-size: 14px; padding: 12px 22px; border-radius: 12px; }

    .as-logout-box { padding: 32px 38px; border-radius: 24px; gap: 32px; }
    .as-logout-left { gap: 22px; }
    .as-logout-icon { width: 60px; height: 60px; font-size: 24px; border-radius: 16px; }
    .as-logout-text h3 { font-size: 17px; }
    .as-logout-text p  { font-size: 15px; }
    .as-persist-badge  { font-size: 13px; padding: 3px 10px; }
    .as-logout-cta { font-size: 15px; padding: 14px 30px; border-radius: 15px; }
  }

  /* ══════════════════════════════════════════════════════════════════
     BREAKPOINT: 4K / Ultrawide 3840px+
     Intentionally spacious — body widens to 1920px, large type,
     card layout feels designed for the display not accidental.
  ══════════════════════════════════════════════════════════════════ */
  @media (min-width: 3840px) {
    .as-nav   { padding: 0 80px; height: 96px; }
    .as-nav-title { font-size: 22px; }
    .as-nav-logo  { width: 54px; height: 54px; font-size: 22px; border-radius: 14px; }
    .as-nav-right { gap: 20px; }
    .as-user-chip { padding: 8px 22px 8px 10px; gap: 14px; }
    .as-user-avatar { width: 42px; height: 42px; font-size: 16px; }
    .as-user-name  { font-size: 18px; }
    .as-nav-logout { font-size: 18px; padding: 11px 22px; border-radius: 14px; }

    .as-body  { max-width: 1920px; padding: 80px 80px; }
    .as-header { margin-bottom: 64px; }
    .as-header h1 { font-size: 68px; }
    .as-header p  { font-size: 22px; }
    .as-label { font-size: 16px; margin-bottom: 24px; }

    .as-cards { gap: 36px; margin-bottom: 64px; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)) !important; }
    .as-card  { padding: 52px; border-radius: 32px; }
    .as-card h2 { font-size: 26px; }
    .as-card p  { font-size: 20px; margin-bottom: 44px; }
    .as-card-icon-wrap { width: 84px; height: 84px; font-size: 34px; margin-bottom: 36px; border-radius: 22px; }
    .as-card-stat-val { font-size: 48px; }
    .as-card-stat-lbl { font-size: 16px; }
    .as-card-btn { font-size: 18px; padding: 16px 30px; border-radius: 16px; }

    .as-logout-box { padding: 44px 52px; border-radius: 32px; gap: 44px; }
    .as-logout-left { gap: 28px; }
    .as-logout-icon { width: 78px; height: 78px; font-size: 32px; border-radius: 22px; }
    .as-logout-text h3 { font-size: 22px; }
    .as-logout-text p  { font-size: 19px; }
    .as-persist-badge  { font-size: 16px; padding: 4px 14px; }
    .as-logout-cta { font-size: 20px; padding: 18px 40px; border-radius: 20px; }
  }

  /* original mobile breakpoint — kept exactly as-is */
  @media (max-width: 640px) {
    .as-nav { padding: 0 20px; }
    .as-body { padding: 32px 20px; }
    .as-logout-box { flex-direction: column; align-items: flex-start; }
    .as-user-name { display: none; }
  }
`;

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const AdminSection: React.FC = () => {
  const navigate = useNavigate();
  const user = getSession();

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleLogout = () => {
    clearSession();
    navigate("/system-admin-login");
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="as-root">
        <nav className="as-nav">
          <div className="as-nav-brand">
            <div className="as-nav-logo">A</div>
            <span className="as-nav-title">Admin Panel</span>
          </div>
          <div className="as-nav-right">
            <div className="as-user-chip">
              <div className="as-user-avatar">{initials}</div>
              <span className="as-user-name">{user?.name || "Admin"}</span>
            </div>
            <button className="as-nav-logout" onClick={handleLogout}>
              <LogoutIcon /> Sign Out
            </button>
          </div>
        </nav>

        <main className="as-body">
          <div className="as-header">
            <h1>Hello, {user?.name?.split(" ")[0] || "Admin"} 👋</h1>
            <p>Welcome to your admin dashboard. Manage your users and tokens below.</p>
          </div>

          <p className="as-label">Management</p>
          <div className="as-cards">
            <div className="as-card as-card-users" onClick={() => navigate("/system-admin/users")}>
              <div className="as-card-icon-wrap">👥</div>
              <h2>User Management</h2>
              <p>View, manage and control all registered accounts, roles and permissions in your system.</p>
              <div className="as-card-bottom">
                <button className="as-card-btn" onClick={(e) => { e.stopPropagation(); navigate("/system-admin/users"); }}>
                  Manage →
                </button>
              </div>
            </div>

            <div className="as-card as-card-tokens" onClick={() => navigate("/system-admin/tokens")}>
              <div className="as-card-icon-wrap">🔑</div>
              <h2>Token Management</h2>
              <p>Generate, revoke and monitor API tokens and authentication keys for your integrations.</p>
              <div className="as-card-bottom">
                <button className="as-card-btn" onClick={(e) => { e.stopPropagation(); navigate("/system-admin/tokens"); }}>
                  Manage →
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminSection;