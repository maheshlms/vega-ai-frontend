import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../state/ThemeContext';

interface IntegrationItem {
  id: string;
  value: string;
  name: string;
  description: string;
  logo: string;
  verified: boolean;
  status: string;
  badges: string[];
  auth_methods: string[];
}

const STATIC_INTEGRATIONS: IntegrationItem[] = [
  { id: '1',  value: 'pingfederate',    name: 'Ping Federate',         description: 'Enterprise federation & SSO server',         logo: '/logos/pingfederate.png',    verified: true, status: 'connected',   badges: ['SSO', 'Enterprise'],  auth_methods: ['basic_auth', 'bearer_token'] },
  { id: '2',  value: 'okta',            name: 'Okta',                  description: 'Identity management & SSO platform',         logo: '/logos/okta.png',            verified: true, status: 'Coming Soon', badges: ['Cloud', 'Auth'],       auth_methods: ['oauth2'] },
  { id: '3',  value: 'keycloak',        name: 'Keycloak',              description: 'Open source identity & access management',   logo: '/logos/keycloak.png',        verified: true, status: 'Coming Soon', badges: ['IAM', 'Open Source'],  auth_methods: ['oauth2', 'bearer_token'] },
  { id: '4',  value: 'pingdirectory',   name: 'Ping Directory',        description: 'High-performance directory server',          logo: '/logos/pingdirectory.png',   verified: true, status: 'connected',   badges: ['LDAP', 'Directory'],   auth_methods: ['basic_auth'] },
  { id: '5',  value: 'activedirectory', name: 'Active Directory',      description: 'Microsoft domain & identity services',       logo: '/logos/activedirectory.png', verified: true, status: 'Coming Soon', badges: ['Domain', 'Microsoft'], auth_methods: ['basic_auth'] },
  { id: '6',  value: 'aws',             name: 'AWS Directory',         description: 'Amazon Web Services directory services',     logo: '/logos/aws.png',             verified: true, status: 'Coming Soon', badges: ['AWS', 'Cloud'],        auth_methods: ['bearer_token'] },
  { id: '7',  value: 'pingone',         name: 'Ping One',              description: 'Cloud identity-as-a-service platform',      logo: '/logos/pingone.png',         verified: true, status: 'connected',   badges: ['SaaS', 'IDaaS'],       auth_methods: ['oauth2'] },
  { id: '8',  value: 'azure',           name: 'Azure AD',              description: 'Microsoft cloud identity & access',         logo: '/logos/azure.png',           verified: true, status: 'Coming Soon', badges: ['Cloud', 'Microsoft'],  auth_methods: ['oauth2'] },
  { id: '9',  value: 'googlecloud',     name: 'Google Cloud Identity', description: 'Google cloud identity platform',            logo: '/logos/googlecloud.png',     verified: true, status: 'Coming Soon', badges: ['IDaaS', 'Google'],     auth_methods: ['oauth2'] },
  { id: '10', value: 'britive',         name: 'Britive',               description: 'Cloud privilege access management',         logo: '/logos/britive.png',         verified: true, status: 'Coming Soon', badges: ['Cloud', 'Auth'],       auth_methods: ['oauth2', 'api_key'] },
  { id: '11', value: 'strivacity',      name: 'Strivacity',            description: 'Customer identity platform',                logo: '/logos/strivacity.png',      verified: true, status: 'Coming Soon', badges: ['Cloud', 'Auth'],       auth_methods: ['oauth2'] },
  { id: '12', value: 'aembit',          name: 'Aembit',                description: 'Workload identity & access platform',       logo: '/logos/aembit.png',          verified: true, status: 'Coming Soon', badges: ['Cloud', 'Identity'],   auth_methods: ['oauth2', 'bearer_token'] },
];

const CARD_ACCENT_COLORS: Record<string, { border: string; shadow: string; logoBg: string; headerBg: string; darkBorder: string; darkShadow: string; darkLogoBg: string; darkHeaderBg: string }> = {
  pingfederate:    { border: '#E9472A', shadow: 'rgba(233,71,42,0.15)',   logoBg: '#FFF5F3', headerBg: '#FFF8F7', darkBorder: '#E9472A', darkShadow: 'rgba(233,71,42,0.25)',   darkLogoBg: '#FFF5F3',  darkHeaderBg: 'rgba(233,71,42,0.08)' },
  okta:            { border: '#007DC1', shadow: 'rgba(0,125,193,0.15)',   logoBg: '#F0F8FF', headerBg: '#F5FBFF', darkBorder: '#007DC1', darkShadow: 'rgba(0,125,193,0.25)',   darkLogoBg: '#F0F8FF',  darkHeaderBg: 'rgba(0,125,193,0.08)' },
  keycloak:        { border: '#4D9BF5', shadow: 'rgba(77,155,245,0.15)',  logoBg: '#EFF6FF', headerBg: '#F5F9FF', darkBorder: '#4D9BF5', darkShadow: 'rgba(77,155,245,0.25)',  darkLogoBg: '#EFF6FF',  darkHeaderBg: 'rgba(77,155,245,0.08)' },
  pingdirectory:   { border: '#0A85C2', shadow: 'rgba(10,133,194,0.15)',  logoBg: '#F0F8FF', headerBg: '#F5FBFF', darkBorder: '#0A85C2', darkShadow: 'rgba(10,133,194,0.25)',  darkLogoBg: '#F0F8FF',  darkHeaderBg: 'rgba(10,133,194,0.08)' },
  activedirectory: { border: '#00A4EF', shadow: 'rgba(0,164,239,0.15)',   logoBg: '#F0FAFF', headerBg: '#F5FCFF', darkBorder: '#00A4EF', darkShadow: 'rgba(0,164,239,0.25)',   darkLogoBg: '#F0FAFF',  darkHeaderBg: 'rgba(0,164,239,0.08)' },
  aws:             { border: '#FF9900', shadow: 'rgba(255,153,0,0.15)',   logoBg: '#FFFBF0', headerBg: '#FFFDF5', darkBorder: '#FF9900', darkShadow: 'rgba(255,153,0,0.25)',   darkLogoBg: '#FFFBF0',  darkHeaderBg: 'rgba(255,153,0,0.08)' },
  pingone:         { border: '#7C3AED', shadow: 'rgba(124,58,237,0.15)',  logoBg: '#FAF5FF', headerBg: '#FCF9FF', darkBorder: '#7C3AED', darkShadow: 'rgba(124,58,237,0.25)',  darkLogoBg: '#FAF5FF',  darkHeaderBg: 'rgba(124,58,237,0.08)' },
  azure:           { border: '#0078D4', shadow: 'rgba(0,120,212,0.15)',   logoBg: '#F0F6FF', headerBg: '#F5F9FF', darkBorder: '#0078D4', darkShadow: 'rgba(0,120,212,0.25)',   darkLogoBg: '#F0F6FF',  darkHeaderBg: 'rgba(0,120,212,0.08)' },
  googlecloud:     { border: '#4285F4', shadow: 'rgba(66,133,244,0.15)',  logoBg: '#EFF5FF', headerBg: '#F5F9FF', darkBorder: '#4285F4', darkShadow: 'rgba(66,133,244,0.25)',  darkLogoBg: '#EFF5FF',  darkHeaderBg: 'rgba(66,133,244,0.08)' },
  britive:         { border: '#6366F1', shadow: 'rgba(99,102,241,0.15)',  logoBg: '#EEF2FF', headerBg: '#F3F5FF', darkBorder: '#6366F1', darkShadow: 'rgba(99,102,241,0.25)',  darkLogoBg: '#EEF2FF',  darkHeaderBg: 'rgba(99,102,241,0.08)' },
  strivacity:      { border: '#10B981', shadow: 'rgba(16,185,129,0.15)',  logoBg: '#F0FDF4', headerBg: '#F5FDF9', darkBorder: '#10B981', darkShadow: 'rgba(16,185,129,0.25)',  darkLogoBg: '#F0FDF4',  darkHeaderBg: 'rgba(16,185,129,0.08)' },
  aembit:          { border: '#F59E0B', shadow: 'rgba(245,158,11,0.15)',  logoBg: '#FFFBEB', headerBg: '#FFFDF5', darkBorder: '#F59E0B', darkShadow: 'rgba(245,158,11,0.25)',  darkLogoBg: '#FFFBEB',  darkHeaderBg: 'rgba(245,158,11,0.08)' },
};

const BADGE_PALETTE: Record<string, { bg: string; text: string; dot: string; darkBg: string; darkText: string; darkDot: string }> = {
  'SSO':         { bg: '#EEF2FF', text: '#4338CA', dot: '#6366F1', darkBg: 'rgba(99,102,241,0.15)',  darkText: '#a5b4fc', darkDot: '#6366F1' },
  'Enterprise':  { bg: '#F5F3FF', text: '#6D28D9', dot: '#7C3AED', darkBg: 'rgba(124,58,237,0.15)', darkText: '#c4b5fd', darkDot: '#7C3AED' },
  'LDAP':        { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6', darkBg: 'rgba(59,130,246,0.15)',  darkText: '#93c5fd', darkDot: '#3B82F6' },
  'Directory':   { bg: '#F9FAFB', text: '#374151', dot: '#9CA3AF', darkBg: 'rgba(148,163,184,0.1)',  darkText: '#94a3b8', darkDot: '#64748b' },
  'Domain':      { bg: '#F9FAFB', text: '#374151', dot: '#9CA3AF', darkBg: 'rgba(148,163,184,0.1)',  darkText: '#94a3b8', darkDot: '#64748b' },
  'SaaS':        { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6', darkBg: 'rgba(59,130,246,0.15)',  darkText: '#93c5fd', darkDot: '#3B82F6' },
  'IDaaS':       { bg: '#F5F3FF', text: '#6D28D9', dot: '#7C3AED', darkBg: 'rgba(124,58,237,0.15)', darkText: '#c4b5fd', darkDot: '#7C3AED' },
  'Cloud':       { bg: '#F0F9FF', text: '#0369A1', dot: '#0EA5E9', darkBg: 'rgba(14,165,233,0.15)',  darkText: '#7dd3fc', darkDot: '#0EA5E9' },
  'Auth':        { bg: '#EEF2FF', text: '#4338CA', dot: '#6366F1', darkBg: 'rgba(99,102,241,0.15)',  darkText: '#a5b4fc', darkDot: '#6366F1' },
  'IAM':         { bg: '#FAF5FF', text: '#7C3AED', dot: '#A855F7', darkBg: 'rgba(168,85,247,0.15)',  darkText: '#d8b4fe', darkDot: '#A855F7' },
  'Open Source': { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E', darkBg: 'rgba(34,197,94,0.15)',   darkText: '#86efac', darkDot: '#22C55E' },
  'Google':      { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444', darkBg: 'rgba(239,68,68,0.15)',   darkText: '#fca5a5', darkDot: '#EF4444' },
  'AWS':         { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316', darkBg: 'rgba(249,115,22,0.15)',  darkText: '#fdba74', darkDot: '#F97316' },
  'Microsoft':   { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6', darkBg: 'rgba(59,130,246,0.15)',  darkText: '#93c5fd', darkDot: '#3B82F6' },
  'Identity':    { bg: '#FDF2F8', text: '#9D174D', dot: '#EC4899', darkBg: 'rgba(236,72,153,0.15)',  darkText: '#f9a8d4', darkDot: '#EC4899' },
};

const IntegrationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('All');

  const categories = ['All', 'SSO', 'Cloud', 'IAM', 'Enterprise', 'LDAP'];

  const filtered = filter === 'All'
    ? STATIC_INTEGRATIONS
    : STATIC_INTEGRATIONS.filter(i => i.badges.includes(filter));

  return (
    <>
      {/* ─── Styles: animations + responsive breakpoints ─── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

        .int-font { font-family: 'DM Sans', sans-serif; }

        @keyframes int-rise {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .int-card { animation: int-rise 0.4s ease both; }
        .int-card:nth-child(1)  { animation-delay: 0.03s; }
        .int-card:nth-child(2)  { animation-delay: 0.06s; }
        .int-card:nth-child(3)  { animation-delay: 0.09s; }
        .int-card:nth-child(4)  { animation-delay: 0.12s; }
        .int-card:nth-child(5)  { animation-delay: 0.15s; }
        .int-card:nth-child(6)  { animation-delay: 0.18s; }
        .int-card:nth-child(7)  { animation-delay: 0.21s; }
        .int-card:nth-child(8)  { animation-delay: 0.24s; }
        .int-card:nth-child(9)  { animation-delay: 0.27s; }
        .int-card:nth-child(10) { animation-delay: 0.30s; }
        .int-card:nth-child(11) { animation-delay: 0.33s; }
        .int-card:nth-child(12) { animation-delay: 0.36s; }

        .int-accent-bar {
          height: 3px;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }
        .int-card:hover .int-accent-bar { transform: scaleX(1); }

        @keyframes int-pulse-green {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .int-pulse { animation: int-pulse-green 2s ease infinite; }

        /* ══════════════════════════════════════════════
           RESPONSIVE — Baseline is 1920×1080 (no override)
           ══════════════════════════════════════════════ */

        /* ── ≤ 1919px : laptops & mid-size desktops ── */
        @media (max-width: 1919px) {
          .int-page-header    { padding-left: 40px !important; padding-right: 40px !important; }
          .int-header-inner   { max-width: 1200px !important; padding-top: 16px !important; padding-bottom: 24px !important; }
          .int-header-title   { font-size: 1.75rem !important; }
          .int-header-sub     { font-size: 0.8rem !important; }
          .int-toolbar-outer  { padding-left: 40px !important; padding-right: 40px !important; }
          .int-toolbar-inner  { max-width: 1200px !important; height: 52px !important; }
          .int-grid-outer     { max-width: 1200px !important; padding-left: 40px !important; padding-right: 40px !important; padding-top: 28px !important; padding-bottom: 64px !important; }
          .int-grid           { gap: 16px !important; }
          .int-card-logo-zone { min-height: 140px !important; padding: 20px 24px !important; }
          .int-card-logo-box  { width: 120px !important; height: 86px !important; }
          .int-card-body      { padding: 18px 20px 22px !important; }
          .int-card-footer    { padding: 10px 20px !important; }
        }

        /* ── ≤ 1400px ── */
        @media (max-width: 1400px) {
          .int-page-header    { padding-left: 28px !important; padding-right: 28px !important; }
          .int-header-title   { font-size: 1.5rem !important; }
          .int-toolbar-outer  { padding-left: 28px !important; padding-right: 28px !important; }
          .int-grid-outer     { padding-left: 28px !important; padding-right: 28px !important; padding-top: 24px !important; padding-bottom: 52px !important; }
          .int-grid           { grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)) !important; gap: 14px !important; }
          .int-filter-btn     { padding: 5px 10px !important; font-size: 12px !important; }
          .int-count-text     { font-size: 12px !important; }
          .int-card-logo-zone { min-height: 124px !important; padding: 16px 20px !important; }
          .int-card-logo-box  { width: 108px !important; height: 76px !important; }
          .int-card-name      { font-size: 13.5px !important; }
          .int-card-desc      { font-size: 12px !important; }
          .int-badge-item     { font-size: 10.5px !important; padding: 3px 8px !important; }
        }

        /* ── ≤ 1200px ── */
        @media (max-width: 1200px) {
          .int-page-header    { padding-left: 20px !important; padding-right: 20px !important; }
          .int-header-inner   { padding-top: 14px !important; padding-bottom: 18px !important; }
          .int-header-title   { font-size: 1.35rem !important; }
          .int-toolbar-outer  { padding-left: 20px !important; padding-right: 20px !important; }
          .int-toolbar-inner  { height: 48px !important; gap: 12px !important; }
          .int-grid-outer     { padding-left: 20px !important; padding-right: 20px !important; padding-top: 20px !important; padding-bottom: 44px !important; }
          .int-grid           { grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)) !important; gap: 12px !important; }
          .int-card-logo-zone { min-height: 110px !important; padding: 14px 18px !important; }
          .int-card-logo-box  { width: 96px !important; height: 68px !important; border-radius: 12px !important; }
          .int-card-body      { padding: 14px 16px 18px !important; gap: 10px !important; }
          .int-card-footer    { padding: 8px 16px !important; }
          .int-footer-arrow   { width: 26px !important; height: 26px !important; font-size: 12px !important; }
        }

        /* ── ≤ 1024px ── */
        @media (max-width: 1024px) {
          .int-page-header    { padding-left: 16px !important; padding-right: 16px !important; }
          .int-header-title   { font-size: 1.2rem !important; }
          .int-toolbar-outer  { padding-left: 16px !important; padding-right: 16px !important; }
          .int-grid-outer     { padding-left: 16px !important; padding-right: 16px !important; }
          .int-grid           { grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)) !important; gap: 10px !important; }
          .int-filter-btn     { padding: 4px 8px !important; font-size: 11.5px !important; }
        }

        /* ── ≥ 1921px : 2K displays ── */
        @media (min-width: 1921px) {
          .int-page-header    { padding-left: 80px !important; padding-right: 80px !important; }
          .int-header-inner   { max-width: 1800px !important; padding-top: 28px !important; padding-bottom: 40px !important; }
          .int-header-title   { font-size: 3rem !important; }
          .int-header-sub     { font-size: 1rem !important; }
          .int-future-badge   { font-size: 11px !important; padding: 3px 10px !important; }
          .int-toolbar-outer  { padding-left: 80px !important; padding-right: 80px !important; }
          .int-toolbar-inner  { max-width: 1800px !important; height: 68px !important; gap: 32px !important; }
          .int-filter-btn     { padding: 8px 18px !important; font-size: 15px !important; border-radius: 8px !important; }
          .int-count-text     { font-size: 15px !important; }
          .int-grid-outer     { max-width: 1800px !important; padding-left: 80px !important; padding-right: 80px !important; padding-top: 48px !important; padding-bottom: 96px !important; }
          .int-grid           { gap: 24px !important; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) !important; }
          .int-accent-bar     { height: 4px !important; }
          .int-card-logo-zone { min-height: 200px !important; padding: 32px 40px !important; }
          .int-card-logo-box  { width: 180px !important; height: 130px !important; border-radius: 18px !important; }
          .int-card-body      { padding: 24px 28px 30px !important; gap: 16px !important; }
          .int-card-name      { font-size: 17px !important; }
          .int-card-desc      { font-size: 14px !important; }
          .int-verified-badge { font-size: 12px !important; padding: 4px 10px !important; }
          .int-badge-item     { font-size: 12.5px !important; padding: 5px 12px !important; }
          .int-card-footer    { padding: 14px 28px !important; }
          .int-footer-status  { font-size: 13px !important; }
          .int-footer-arrow   { width: 34px !important; height: 34px !important; border-radius: 10px !important; font-size: 16px !important; }
        }

        /* ── ≥ 2560px : 4K / ultrawide ── */
        @media (min-width: 2560px) {
          .int-page-header    { padding-left: 120px !important; padding-right: 120px !important; }
          .int-header-inner   { max-width: 2200px !important; padding-top: 40px !important; padding-bottom: 56px !important; }
          .int-header-title   { font-size: 3.8rem !important; }
          .int-header-sub     { font-size: 1.2rem !important; }
          .int-toolbar-outer  { padding-left: 120px !important; padding-right: 120px !important; }
          .int-toolbar-inner  { max-width: 2200px !important; height: 80px !important; }
          .int-filter-btn     { padding: 10px 22px !important; font-size: 17px !important; }
          .int-count-text     { font-size: 17px !important; }
          .int-grid-outer     { max-width: 2200px !important; padding-left: 120px !important; padding-right: 120px !important; padding-top: 60px !important; padding-bottom: 120px !important; }
          .int-grid           { gap: 32px !important; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)) !important; }
          .int-card-logo-zone { min-height: 240px !important; padding: 40px 48px !important; }
          .int-card-logo-box  { width: 210px !important; height: 155px !important; }
          .int-card-name      { font-size: 20px !important; }
          .int-card-desc      { font-size: 15px !important; }
          .int-badge-item     { font-size: 14px !important; padding: 6px 14px !important; }
          .int-card-footer    { padding: 18px 32px !important; }
          .int-footer-status  { font-size: 15px !important; }
          .int-footer-arrow   { width: 40px !important; height: 40px !important; font-size: 18px !important; }
        }
      `}</style>

      <div
        className="int-font min-h-screen"
        style={{ background: isDark ? '#0d1117' : '#FAFAFA', color: isDark ? '#e2e8f0' : '#111' }}
      >

        {/* ── Header ── */}
        <div
          className="int-page-header border-b px-12 max-md:px-5"
          style={{
            background: isDark ? '#1a2234' : '#ffffff',
            borderColor: isDark ? '#1e2d45' : '#e5e7eb',
          }}
        >
          <div className="int-header-inner max-w-[1400px] mx-auto pt-5 pb-8">
            <h1
              className="int-header-title text-3xl lg:text-4xl 2xl:text-5xl font-bold leading-tight tracking-tight mb-2"
              style={{ color: isDark ? '#f1f5f9' : '#0A0A0A' }}
            >
              Integrations Marketplace
            </h1>
            <p
              className="int-header-sub text-gray-400 text-sm 2xl:text-base"
              style={{ color: isDark ? '#64748b' : '#6b7280' }}
            >
              Connect your IAM systems and manage integrations across your identity infrastructure.
            </p>
            <div className="flex items-center gap-2 mt-5">
              <div className="w-6 h-0.5" style={{ background: isDark ? '#e2e8f0' : '#111' }} />
              <span
                className="text-[11px] font-semibold tracking-[0.12em] uppercase"
                style={{ color: isDark ? '#64748b' : '#6b7280' }}
              >
                Marketplace
              </span>
              <span
                className="int-future-badge text-[10px] font-semibold tracking-[0.08em] uppercase px-2 py-0.5 rounded ml-1"
                style={{
                  color: isDark ? '#64748b' : '#9ca3af',
                  background: isDark ? '#111827' : '#f3f4f6',
                }}
              >
                Future Release
              </span>
            </div>
          </div>
        </div>

        {/* ── Sticky Toolbar ── */}
        <div
          className="int-toolbar-outer border-b px-12 sticky top-0 z-20 max-md:px-5"
          style={{
            background: isDark ? '#1a2234' : '#ffffff',
            borderColor: isDark ? '#1e2d45' : '#e5e7eb',
          }}
        >
          <div className="int-toolbar-inner max-w-[1400px] mx-auto flex items-center justify-between gap-6 h-14">
            {/* Filter buttons */}
            <div className="flex items-center gap-0.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className="int-filter-btn px-3.5 py-1.5 rounded-md border-none text-[13px] font-medium cursor-pointer transition-all duration-150 whitespace-nowrap font-[inherit]"
                  style={
                    filter === cat
                      ? { background: isDark ? '#e2e8f0' : '#111', color: isDark ? '#0d1117' : '#fff' }
                      : { background: 'transparent', color: isDark ? '#64748b' : '#6b7280' }
                  }
                  onMouseEnter={e => {
                    if (filter !== cat) {
                      (e.currentTarget as HTMLButtonElement).style.background = isDark ? '#1e2d45' : '#f3f4f6';
                      (e.currentTarget as HTMLButtonElement).style.color = isDark ? '#e2e8f0' : '#111';
                    }
                  }}
                  onMouseLeave={e => {
                    if (filter !== cat) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color = isDark ? '#64748b' : '#6b7280';
                    }
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
            <span
              className="int-count-text text-[13px] whitespace-nowrap font-normal"
              style={{ color: isDark ? '#475569' : '#9ca3af' }}
            >
              {filtered.length} integration{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ── Grid ── */}
        <div className="int-grid-outer max-w-[1400px] mx-auto px-12 pt-10 pb-20 max-md:px-5 max-md:pt-6 max-md:pb-16">
          <div
            className="int-grid gap-5 max-md:grid-cols-1"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
          >
            {filtered.length === 0 ? (
              <div
                className="col-span-full text-center py-20 text-sm"
                style={{ color: isDark ? '#475569' : '#9ca3af' }}
              >
                <div className="text-5xl mb-4 opacity-40">🔌</div>
                <div>No integrations match this filter.</div>
              </div>
            ) : filtered.map(item => {
              const isHovered = hoveredId === item.id;
              const accent = CARD_ACCENT_COLORS[item.value];

              const cardStyle: React.CSSProperties = {
                background: isDark ? '#1a2234' : '#ffffff',
                border: isDark
                  ? `1px solid ${isHovered && accent ? accent.darkBorder : '#1e2d45'}`
                  : `1px solid ${isHovered && accent ? accent.border : '#e5e7eb'}`,
                boxShadow: isDark
                  ? isHovered && accent
                    ? `0 4px 6px -1px rgba(0,0,0,0.3), 0 20px 40px -8px ${accent.darkShadow}`
                    : '0 1px 3px rgba(0,0,0,0.3)'
                  : isHovered && accent
                    ? `0 4px 6px -1px rgba(0,0,0,0.04), 0 20px 40px -8px ${accent.shadow}`
                    : '0 1px 3px rgba(0,0,0,0.05)',
                transform: isHovered ? 'translateY(-3px)' : 'none',
              };

              const accentBarStyle: React.CSSProperties = isHovered && accent
                ? { background: isDark ? accent.darkBorder : accent.border }
                : { background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' };

              const logoZoneBg = isHovered && accent
                ? accent.headerBg
                : '#ffffff';

              const logoBoxStyle: React.CSSProperties = isHovered && accent ? {
                borderColor: accent.border,
                boxShadow: `0 4px 16px ${accent.shadow}`,
                background: accent.logoBg,
              } : {
                background: '#ffffff',
                borderColor: '#e5e7eb',
              };

              return (
                <div
                  key={item.id}
                  className="int-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-[220ms] flex flex-col relative"
                  style={cardStyle}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Accent bar */}
                  <div className="int-accent-bar" style={accentBarStyle} />

                  {/* Logo zone */}
                  <div
                    className="int-card-logo-zone flex items-center justify-center border-b min-h-[160px] px-7 py-8 transition-colors duration-200"
                    style={{
                      background: logoZoneBg,
                      borderColor: isDark ? '#1e2d45' : '#f3f4f6',
                    }}
                  >
                    <div
                      className="int-card-logo-box w-[140px] h-[100px] rounded-2xl border flex items-center justify-center overflow-hidden flex-shrink-0 transition-all duration-200 p-4"
                      style={logoBoxStyle}
                    >
                      <img src={item.logo} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="int-card-body px-6 pt-5 pb-6 flex-1 flex flex-col gap-3">
                    {/* Name row */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="int-card-name text-[15px] font-semibold tracking-tight leading-tight"
                          style={{ color: isDark ? '#f1f5f9' : '#0A0A0A' }}
                        >
                          {item.name}
                        </span>
                        {item.verified && (
                          <span
                            className="int-verified-badge flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold whitespace-nowrap flex-shrink-0"
                            style={{
                              background: isDark ? 'rgba(16,185,129,0.15)' : '#f0fdf4',
                              border: isDark ? '1px solid rgba(16,185,129,0.3)' : '1px solid #bbf7d0',
                              color: isDark ? '#34d399' : '#15803d',
                            }}
                          >
                            <span className="int-pulse w-1.5 h-1.5 rounded-full inline-block" style={{ background: isDark ? '#34d399' : '#4ade80' }} />
                            Verified
                          </span>
                        )}
                      </div>
                      <p
                        className="int-card-desc text-[12.5px] leading-relaxed font-normal m-0"
                        style={{ color: isDark ? '#64748b' : '#6b7280' }}
                      >
                        {item.description}
                      </p>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {item.badges.map((badge, i) => {
                        const p = BADGE_PALETTE[badge] || { bg: '#F9FAFB', text: '#374151', dot: '#9CA3AF', darkBg: 'rgba(148,163,184,0.1)', darkText: '#94a3b8', darkDot: '#64748b' };
                        return (
                          <span
                            key={i}
                            className="int-badge-item inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap"
                            style={{
                              background: isDark ? p.darkBg : p.bg,
                              color: isDark ? p.darkText : p.text,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: isDark ? p.darkDot : p.dot }}
                            />
                            {badge}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer */}
                  <div
                    className="int-card-footer border-t px-6 py-3 flex items-center justify-between"
                    style={{ borderColor: isDark ? '#1e2d45' : '#f3f4f6' }}
                  >
                    {item.status === 'connected' ? (
                      <span className="int-footer-status flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: isDark ? '#34d399' : '#15803d' }}>
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: isHovered && accent ? accent.border : (isDark ? '#34d399' : '#22C55E') }}
                        />
                        Connected
                      </span>
                    ) : (
                      <span className="int-footer-status flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: isDark ? '#475569' : '#9ca3af' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: isDark ? '#334155' : '#d1d5db' }} />
                        Coming Soon
                      </span>
                    )}

                    {/* Arrow button */}
                    <div
                      className="int-footer-arrow w-7 h-7 rounded-lg border flex items-center justify-center text-[13px] transition-all duration-150"
                      style={
                        isHovered && accent
                          ? { background: accent.border, borderColor: accent.border, color: '#fff', transform: 'translateX(2px)' }
                          : { background: isDark ? '#111827' : '#fff', borderColor: isDark ? '#1e2d45' : '#e5e7eb', color: isDark ? '#475569' : '#9CA3AF' }
                      }
                    >
                      →
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </>
  );
};

export default IntegrationsPage;