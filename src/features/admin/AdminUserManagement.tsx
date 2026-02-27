import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';

interface User {
  user_id: string;
  username: string;
  email: string;
  full_name?: string;
  roles: string[];
  permissions: string[];
  is_active: boolean;
  is_system_admin: boolean;
  force_password_reset: boolean;
  created_at: string;
  updated_at?: string;
  last_login?: string;
  created_by?: string;
}

const ROLES = ["admin", "user"];
const PALETTE = ["#7c3aed","#10b981","#ef4444","#f59e0b","#3b82f6","#ec4899","#06b6d4","#f97316"];
const avatarBg = (name = "?") => PALETTE[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % PALETTE.length];
const getInit = (name = "?") => name.trim().split(/\s+/).map(w => w[0] || "").join("").toUpperCase().slice(0, 2) || "?";

const fmtLastActive = (iso: string | null | undefined) => {
  if (!iso) return "Never";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)       return "Just now";
  if (diff < 3600)     return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)    return `${Math.floor(diff/3600)}h ago`;
  if (diff < 86400*7)  return `${Math.floor(diff/86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US",{month:"short",day:"numeric"});
};

const laDotClass = (iso: string | null | undefined) => {
  if (!iso) return "la-old";
  const h = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (h < 1)   return "la-recent";
  if (h < 24)  return "la-today";
  if (h < 168) return "la-week";
  return "la-old";
};

const MINIMAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&display=swap');
  html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; }
  #root { width: 100% !important; min-height: 100vh !important; margin: 0 !important; padding: 0 !important; max-width: none !important; }
  .um-root { position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
    width: 100vw !important; height: 100vh !important; font-family: 'DM Sans', sans-serif; background: #f5f5f7;
    overflow-y: auto; z-index: 9999 !important; box-sizing: border-box;
  }
  .um-nav {
    display: flex; align-items: center; justify-content: space-between; padding: 0 48px; height: 68px;
    background: #fff; border-bottom: 1px solid #e8e8ee; position: sticky; top: 0; z-index: 100;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .um-nav-left { display: flex; align-items: center; gap: 16px; }
  .um-back-btn { display: flex; align-items: center; gap: 7px; background: #f5f5f7; border: 1px solid #e4e4ec;
    border-radius: 9px; padding: 8px 16px; font-family: 'DM Sans', sans-serif; font-size: 13.5px;
    font-weight: 500; color: #4b4b6b; cursor: pointer; transition: all 0.18s; }
  .um-back-btn:hover { background: #ebebf0; border-color: #d4d4e4; }
  .um-nav-divider { width: 1px; height: 22px; background: #e4e4ec; }
  .um-nav-brand { display: flex; align-items: center; gap: 11px; }
  .um-nav-logo { width: 33px; height: 33px; background: linear-gradient(135deg, #7c3aed, #a855f7);
    border-radius: 9px; display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; color: #fff; }
  .um-nav-title { font-size: 15px; font-weight: 600; color: #1a1a2e; }
  .um-breadcrumb { display: flex; align-items: center; gap: 7px; font-size: 13.5px; color: #9090a8; }
  .um-breadcrumb span { color: #b0b0c8; }
  .um-breadcrumb strong { color: #7c3aed; font-weight: 500; }
  .um-body { max-width: 1200px; margin: 0 auto; padding: 52px 48px 80px; }
  .um-header-row {
    display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; gap: 20px;
    animation: umFadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both;
  }
  .um-header-left { display: flex; align-items: center; gap: 20px; }
  .um-header-icon { width: 62px; height: 62px; border-radius: 18px; background: rgba(124,58,237,0.08);
    border: 1px solid rgba(124,58,237,0.15); display: flex; align-items: center;
    justify-content: center; font-size: 26px; flex-shrink: 0; }
  .um-header-text h1 { font-family: 'DM Sans', sans-serif; font-size: 36px; font-weight: 700;
    color: #1a1a2e; margin: 0 0 5px; letter-spacing: -0.03em; }
  .um-header-text p { font-size: 14.5px; color: #9090a8; margin: 0; font-weight: 300; }
  .um-btn-add { display: flex; align-items: center; gap: 8px; padding: 12px 24px;
    background: linear-gradient(135deg, #6d28d9, #7c3aed); border: none; border-radius: 12px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; color: #fff;
    cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgba(124,58,237,0.3);
    white-space: nowrap; flex-shrink: 0; }
  .um-btn-add:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,58,237,0.38); }
  .um-demo-banner { display: flex; align-items: center; gap: 10px; background: rgba(245,158,11,0.07);
    border: 1px solid rgba(245,158,11,0.25); border-radius: 12px; padding: 11px 18px;
    margin-bottom: 24px; font-size: 13px; color: #92400e; }
  .um-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-bottom: 28px; }
  .um-stat-card { background: #fff; border: 1px solid #e8e8ee; border-radius: 16px; padding: 20px 22px; }
  .um-stat-label { font-size: 11px; font-weight: 600; letter-spacing: 0.09em;
    text-transform: uppercase; color: #b0b0c8; margin-bottom: 7px; }
  .um-stat-value { font-size: 30px; font-weight: 600; color: #1a1a2e; letter-spacing: -0.03em; line-height: 1; }
  .um-stat-sub { font-size: 12px; color: #b0b0c8; margin-top: 4px; font-weight: 300; }
  .um-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
  .um-search-wrap { position: relative; flex: 1; max-width: 360px; }
  .um-search { width: 100%; padding: 10px 14px; background: #fff; border: 1.5px solid #e8e8ee;
    border-radius: 11px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #1a1a2e;
    outline: none; transition: all 0.18s; box-sizing: border-box; }
  .um-search::placeholder { color: #c0c0d0; }
  .um-search:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }
  .um-filter-select { padding: 10px 36px 10px 13px; background: #fff; border: 1.5px solid #e8e8ee;
    border-radius: 11px; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: #4b4b6b;
    outline: none; cursor: pointer; appearance: none; transition: border-color 0.18s; }
  .um-filter-select:focus { border-color: #7c3aed; outline: none; }
  .um-result-count { font-size: 13px; color: #b0b0c8; margin-left: auto; white-space: nowrap; }
  .um-table-wrap { background: #fff; border: 1px solid #e8e8ee; border-radius: 20px;
    overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.04); }
  .um-table { width: 100%; border-collapse: collapse; }
  .um-table thead { background: #fafafa; }
  .um-table th { padding: 13px 20px; text-align: left; font-size: 11px; font-weight: 700;
    letter-spacing: 0.09em; text-transform: uppercase; color: #b0b0c8;
    border-bottom: 1px solid #f0f0f5; white-space: nowrap; }
  .um-table td { padding: 14px 20px; font-size: 14px; color: #2a2a3e;
    border-bottom: 1px solid #f5f5f8; vertical-align: middle; }
  .um-table tbody tr:last-child td { border-bottom: none; }
  .um-table tbody tr:hover { background: #fafbff; }
  .um-avatar-wrap { display: flex; align-items: center; gap: 13px; }
  .um-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex;
    align-items: center; justify-content: center; font-size: 13px; font-weight: 700;
    color: #fff; flex-shrink: 0; letter-spacing: 0.02em; }
  .um-user-name { font-weight: 500; color: #1a1a2e; font-size: 14px; }
  .um-user-email { font-size: 12px; color: #9090a8; font-weight: 300; margin-top: 2px; }
  .um-role { display: inline-flex; align-items: center; gap: 5px; font-size: 12px;
    font-weight: 600; padding: 4px 12px; border-radius: 20px; text-transform: capitalize;
    white-space: nowrap; }
  .r-admin { background: rgba(124,58,237,0.1); color: #7c3aed; }
  .r-user { background: rgba(59,130,246,0.1); color: #3b82f6; }
  .um-status { display: inline-flex; align-items: center; gap: 6px; font-size: 12px;
    font-weight: 500; padding: 5px 12px; border-radius: 20px; cursor: pointer;
    transition: opacity 0.15s; user-select: none; white-space: nowrap; }
  .um-status:hover { opacity: 0.72; }
  .s-active { background: rgba(16,185,129,0.1); color: #059669; }
  .s-inactive { background: rgba(156,163,175,0.12); color: #9ca3af; }
  .um-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
  .um-last-active { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #6b7280; }
  .um-last-active-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .la-recent { background: #10b981; }
  .la-today { background: #60a5fa; }
  .la-week { background: #fbbf24; }
  .la-old { background: #d1d5db; }
  .um-2fa { display: inline-flex; align-items: center; gap: 5px; font-size: 12px;
    font-weight: 500; padding: 4px 10px; border-radius: 8px; }
  .twofa-on { background: rgba(16,185,129,0.08); color: #059669; border: 1px solid rgba(16,185,129,0.2); }
  .twofa-off { background: #f5f5f7; color: #c0c0d0; border: 1px solid #ebebf0; }
  .um-row-actions { display: flex; align-items: center; gap: 8px; justify-content: flex-end; }
  .um-action-edit { display: flex; align-items: center; gap: 6px; padding: 7px 14px;
    border-radius: 8px; background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.2);
    color: #7c3aed; font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 600;
    cursor: pointer; transition: all 0.15s; white-space: nowrap; }
  .um-action-edit:hover { background: rgba(124,58,237,0.15); border-color: rgba(124,58,237,0.35); }
  .um-action-del { display: flex; align-items: center; gap: 6px; padding: 7px 14px;
    border-radius: 8px; background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.2);
    color: #ef4444; font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 600;
    cursor: pointer; transition: all 0.15s; white-space: nowrap; }
  .um-action-del:hover { background: rgba(239,68,68,0.13); border-color: rgba(239,68,68,0.35); }
  @keyframes umFadeUp { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @media (max-width: 900px) {
    .um-nav, .um-body { padding-left: 20px; padding-right: 20px; }
    .um-stats { grid-template-columns: 1fr 1fr; }
    .um-breadcrumb { display: none; }
  }
  .um-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(26, 26, 46, 0.6); display: flex; align-items: center; justify-content: center;
    z-index: 10001; animation: umFadeUp 0.25s cubic-bezier(0.22,1,0.36,1) both; }
  .um-modal-content { background: #fff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.18);
    max-width: 520px; width: 95%; max-height: 90vh; overflow-y: auto; padding: 32px;
    animation: umFadeUp 0.3s cubic-bezier(0.22,1,0.36,1) 0.05s both; }
  .um-modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 26px; gap: 16px; }
  .um-modal-header h2 { margin: 0; font-family: 'DM Sans', sans-serif; font-size: 24px;
    font-weight: 700; color: #1a1a2e; letter-spacing: -0.02em; }
  .um-modal-close { background: #f5f5f7; border: none; width: 32px; height: 32px;
    border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px;
    color: #7c3aed; cursor: pointer; transition: all 0.2s; flex-shrink: 0; font-weight: 600; }
  .um-modal-close:hover:not(:disabled) { background: #e8e8f0; }
  .um-modal-close:disabled { opacity: 0.5; cursor: not-allowed; }
  .um-form-group { margin-bottom: 20px; }
  .um-form-group label { display: block; font-size: 13.5px; font-weight: 600; color: #4b4b6b;
    margin-bottom: 8px; text-transform: capitalize; }
  .um-form-group input:not([type="checkbox"]),
  .um-form-group select { width: 100%; padding: 11px 14px; border: 1.5px solid #e8e8ee;
    border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: #1a1a2e;
    background: #f9f9fc; transition: all 0.2s; box-sizing: border-box; }
  .um-form-group input:not([type="checkbox"]):focus,
  .um-form-group select:focus { outline: none; border-color: #7c3aed; background: #fff;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1); }
  .um-form-group input:disabled,
  .um-form-group select:disabled { background: #f5f5f7; opacity: 0.6; cursor: not-allowed; }
  .um-form-group input::placeholder { color: #b0b0c8; }
  .um-password-hint { font-size: 12px; margin-top: 7px; padding: 6px 10px; border-radius: 6px;
    background: rgba(124, 58, 237, 0.08); }
  .um-password-match { font-size: 12px; margin-top: 7px; padding: 6px 10px; border-radius: 6px;
    background: rgba(16, 185, 129, 0.08); }
  .um-error { display: block; font-size: 12px; color: #ef4444; margin-top: 6px; }
  .um-form-checkbox { margin-bottom: 24px; }
  .um-form-checkbox label { display: flex; align-items: center; gap: 10px; margin-bottom: 0;
    text-transform: none; cursor: pointer; font-weight: 500; }
  .um-form-checkbox input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer;
    accent-color: #7c3aed; flex-shrink: 0; }
  .um-modal-footer { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 28px; }
  .um-btn-cancel { padding: 11px 24px; background: #f5f5f7; border: 1px solid #e8e8ee;
    border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600;
    color: #4b4b6b; cursor: pointer; transition: all 0.2s; }
  .um-btn-cancel:hover:not(:disabled) { background: #ebebf0; border-color: #d4d4e4; }
  .um-btn-cancel:disabled { opacity: 0.6; cursor: not-allowed; }
  .um-btn-create { padding: 11px 28px; background: linear-gradient(135deg, #6d28d9, #7c3aed);
    border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13.5px;
    font-weight: 600; color: #fff; cursor: pointer; transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3); }
  .um-btn-create:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(124, 58, 237, 0.4); }
  .um-btn-create:disabled { opacity: 0.7; cursor: not-allowed; }
  .um-btn-gen-pwd { padding: 6px 12px; background: #f0f0f8; border: 1px solid #e0e0f0;
    border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
    color: #7c3aed; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
  .um-btn-gen-pwd:hover:not(:disabled) { background: #e8e0ff; border-color: #7c3aed; }
  .um-btn-gen-pwd:disabled { opacity: 0.5; cursor: not-allowed; }
  .um-btn-toggle-pwd { padding: 10px 14px; background: #f5f5f7; border: 1px solid #e8e8ee;
    border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
    color: #7c3aed; cursor: pointer; transition: all 0.2s; flex-shrink: 0; white-space: nowrap; }
  .um-btn-toggle-pwd:hover:not(:disabled) { background: #ebebf0; border-color: #7c3aed; }
  .um-btn-toggle-pwd:disabled { opacity: 0.5; cursor: not-allowed; }
  .um-btn-copy { padding: 6px 12px; background: #f5f5f7; border: 1px solid #e8e8ee;
    border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600;
    color: #7c3aed; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
  .um-btn-copy:hover { background: #ebebf0; border-color: #7c3aed; }
  .um-generated-pwd { margin-top: 10px; padding: 12px; background: rgba(124, 58, 237, 0.05);
    border-radius: 8px; border: 1px solid rgba(124, 58, 237, 0.1); }
  .um-permissions-list { display: flex; flex-direction: column; gap: 12px; }
  .um-permission-item { border: 1px solid #e8e8ee; border-radius: 10px; padding: 14px;
    background: #fafafe; transition: all 0.2s; }
  .um-permission-item:hover { background: #f5f5fb; border-color: #7c3aed; }
  .um-permission-item label { display: flex; align-items: flex-start; gap: 12px; cursor: pointer;
    margin: 0; }
  .um-permission-item input[type="checkbox"] { width: 20px; height: 20px; margin-top: 2px;
    accent-color: #7c3aed; cursor: pointer; flex-shrink: 0; }
  .um-permission-info { flex: 1; }
  .um-permission-name { font-size: 13.5px; font-weight: 600; color: #1a1a2e; margin-bottom: 3px; }
  .um-permission-desc { font-size: 12px; color: #b0b0c8; }
  .um-confirm-dialog { background: #fff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    max-width: 400px; width: 90%; padding: 28px; animation: umFadeUp 0.3s cubic-bezier(0.22,1,0.36,1) both; }
  .um-confirm-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  .um-confirm-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: #1a1a2e; }
  .um-confirm-message { margin: 0 0 22px 0; font-size: 14px; color: #9090a8; line-height: 1.5; }
  .um-confirm-footer { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
  .um-confirm-footer .um-btn-cancel { min-width: 100px; }
  .um-confirm-footer .um-btn-create { min-width: 100px; }
`;

const BackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const PencilIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

const AdminUserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [toast, setToast] = useState<{ msg: string; icon: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
    confirmPassword: "",
    roles: ["user"],
    permissions: ["create:agents", "read:agents"] as string[],
    is_system_admin: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPasswordPlain, setShowPasswordPlain] = useState(false);
  const [showConfirmPasswordPlain, setShowConfirmPasswordPlain] = useState(false);
  const [showAdminConfirmDialog, setShowAdminConfirmDialog] = useState(false);

  // Edit form state
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState<"view" | "password" | "role">("view");
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    password: "",
    confirmPassword: "",
    roles: ["user"],
    is_system_admin: false,
  });
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
  const [updatingUser, setUpdatingUser] = useState(false);
  const [editGeneratedPassword, setEditGeneratedPassword] = useState("");
  const [editShowPasswordPlain, setEditShowPasswordPlain] = useState(false);
  const [editShowConfirmPasswordPlain, setEditShowConfirmPasswordPlain] = useState(false);
  const [editShowAdminConfirmDialog, setEditShowAdminConfirmDialog] = useState(false);
  const [editSystemAdminWarning, setEditSystemAdminWarning] = useState(false);
  const [pendingEditUser, setPendingEditUser] = useState<User | null>(null);

  // Delete user state
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteUsernameConfirm, setDeleteUsernameConfirm] = useState("");
  const [deletingInProgress, setDeletingInProgress] = useState(false);
  const [deleteSystemAdminWarning, setDeleteSystemAdminWarning] = useState(false);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // All available permissions with descriptions
  const PERMISSIONS_MAP: Record<string, {name: string, description: string}> = {
    "create:agents": { name: "Create Agents", description: "Create new AI agents" },
    "read:agents": { name: "Read Agents", description: "View and read agent information" },
    "delete:agents": { name: "Delete Agents", description: "Permanently delete agents" },
    "create:target_systems": { name: "Create Target Systems", description: "Create new target systems" },
    "read:target_systems": { name: "Read Target Systems", description: "View target systems" },
    "edit:target_systems": { name: "Edit Target Systems", description: "Modify target systems" },
    "delete:target_systems": { name: "Delete Target Systems", description: "Permanently delete target systems" },
    "read:audit_logs": { name: "Read Audit Logs", description: "Access audit logs" },
    "manage:users": { name: "Manage Users", description: "Create, edit, and delete users" },
    "edit:user_permissions": { name: "Edit User Permissions", description: "Assign and revoke user permissions" },
  };

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.users.list(0, 100);
        setUsers(data);
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setError(err.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const showToast = (msg: string, icon = "✅") => {
    setToast({ msg, icon });
    setTimeout(() => setToast(null), 3000);
  };

  const validatePasswordStrength = (password: string): boolean => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);
    return password.length >= 8 && hasUpperCase && hasNumber && hasSpecialChar;
  };

  const generateRandomPassword = (): string => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const specialChars = "!@#$%^&*";
    
    // Ensure at least one of each required type
    const randomUpper = uppercase[Math.floor(Math.random() * uppercase.length)];
    const randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
    const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)];
    
    // Fill remaining characters
    const allChars = uppercase + lowercase + numbers + specialChars;
    let password = [randomUpper, randomNumber, randomSpecial];
    
    for (let i = 0; i < 5; i++) {
      password.push(allChars[Math.floor(Math.random() * allChars.length)]);
    }
    
    // Shuffle the password array
    return password.sort(() => Math.random() - 0.5).join("");
  };

  const getDefaultPermissionsForRole = (role: string, isSystemAdmin: boolean = false): string[] => {
    if (role === "admin") {
      const adminPerms = [
        "create:agents",
        "read:agents",
        "delete:agents",
        "create:target_systems",
        "read:target_systems",
        "edit:target_systems",
        "delete:target_systems",
        "read:audit_logs",
      ];
      // Add manage_users and edit_user_permissions only for system admin
      if (isSystemAdmin) {
        adminPerms.push("manage:users", "edit:user_permissions");
      }
      return adminPerms;
    } else {
      // Regular user gets basic permissions
      return ["create:agents", "read:agents"];
    }
  };

  const handleSystemAdminCheck = (value: boolean) => {
    if (value) {
      // Show custom confirmation dialog
      setShowAdminConfirmDialog(true);
    } else {
      setFormData(prev => ({
        ...prev,
        is_system_admin: false,
        permissions: getDefaultPermissionsForRole("admin", false),
      }));
    }
  };

  const confirmAdminAccess = (confirmed: boolean) => {
    setShowAdminConfirmDialog(false);
    if (confirmed) {
      setFormData(prev => ({
        ...prev,
        is_system_admin: true,
        permissions: getDefaultPermissionsForRole("admin", true),
      }));
    }
  };

  const handleEditUser = (user: User) => {
    // If user is system admin, show warning first
    if (user.is_system_admin) {
      setPendingEditUser(user);
      setEditSystemAdminWarning(true);
      return;
    }
    
    // Otherwise proceed normally
    proceedEditUser(user);
  };

  const proceedEditUser = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      full_name: user.full_name || "",
      password: "",
      confirmPassword: "",
      roles: user.roles,
      is_system_admin: user.is_system_admin,
    });
    setEditMode("view");
    setEditFormErrors({});
    setEditGeneratedPassword("");
    setEditShowPasswordPlain(false);
    setEditShowConfirmPasswordPlain(false);
    setShowEditForm(true);
  };

  const confirmEditSystemAdmin = (confirmed: boolean) => {
    setEditSystemAdminWarning(false);
    if (confirmed && pendingEditUser) {
      proceedEditUser(pendingEditUser);
    }
    setPendingEditUser(null);
  };

  const handleEditSystemAdminCheck = (value: boolean) => {
    if (value) {
      setEditShowAdminConfirmDialog(true);
    } else {
      setEditFormData(prev => ({
        ...prev,
        is_system_admin: false,
      }));
    }
  };

  const confirmEditAdminAccess = (confirmed: boolean) => {
    setEditShowAdminConfirmDialog(false);
    if (confirmed) {
      setEditFormData(prev => ({
        ...prev,
        is_system_admin: true,
      }));
    }
  };

  const handleDeleteUser = (user: User) => {
    // If user is system admin, show warning first
    if (user.is_system_admin) {
      setPendingDeleteUser(user);
      setDeleteSystemAdminWarning(true);
      return;
    }
    
    // Otherwise proceed normally
    proceedDeleteUser(user);
  };

  const proceedDeleteUser = (user: User) => {
    setDeletingUser(user);
    setDeleteUsernameConfirm("");
    setDeleteError(null);
    setShowDeleteForm(true);
  };

  const confirmDeleteSystemAdmin = (confirmed: boolean) => {
    setDeleteSystemAdminWarning(false);
    if (confirmed && pendingDeleteUser) {
      proceedDeleteUser(pendingDeleteUser);
    }
    setPendingDeleteUser(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser || deleteUsernameConfirm !== deletingUser.username) {
      return;
    }

    try {
      setDeletingInProgress(true);
      setDeleteError(null);
      await api.users.delete(deletingUser.user_id);
      
      // Remove user from list
      setUsers(users.filter(u => u.user_id !== deletingUser.user_id));
      setShowDeleteForm(false);
      setDeletingUser(null);
      setDeleteUsernameConfirm("");
      showToast(`User ${deletingUser.username} deleted successfully`, "🗑️");
    } catch (err: any) {
      console.error('Error deleting user:', err);
      
      // Check for specific error codes
      if (err.status === 403) {
        setDeleteError("You cannot delete your own account. Contact another admin to delete your account.");
      } else {
        setDeleteError(err.message || 'Failed to delete user');
      }
    } finally {
      setDeletingInProgress(false);
    }
  };

  const validateEditPasswordForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!editFormData.password) {
      errors.password = "Password is required";
    } else if (!validatePasswordStrength(editFormData.password)) {
      errors.password = "Password must have 8+ chars, 1 uppercase, 1 number, 1 special char";
    } else if (editFormData.password !== editFormData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    if (editMode === "password") {
      if (!validateEditPasswordForm()) return;
    }

    setUpdatingUser(true);
    try {
      const updateData: any = {
        full_name: editFormData.full_name.trim() || undefined,
      };

      if (editMode === "password") {
        updateData.password = editFormData.password;
      }

      if (editMode === "role") {
        updateData.roles = editFormData.roles;
        updateData.is_system_admin = editFormData.is_system_admin;
      }

      const updatedUser = await api.users.update(editingUser.user_id, updateData);
      setUsers(prev => prev.map(u => u.user_id === editingUser.user_id ? updatedUser : u));
      setShowEditForm(false);
      setEditingUser(null);
      setEditMode("view");
      showToast("User updated successfully ✅", "✅");
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || "Failed to update user";
      showToast(errorMsg, "❌");
    } finally {
      setUpdatingUser(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.username.trim()) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      errors.username = "Username can only contain letters, numbers, hyphens, and underscores";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (!validatePasswordStrength(formData.password)) {
      errors.password = "Password must have 8+ chars, 1 uppercase, 1 number, 1 special char";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateForm()) return;

    setCreating(true);
    try {
      // Determine permissions based on role and system admin status
      const permissions = getDefaultPermissionsForRole(formData.roles[0], formData.is_system_admin);
      
      const createData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        full_name: formData.full_name.trim() || undefined,
        password: formData.password,
        roles: formData.roles,
        permissions: permissions,
        is_active: true,
        is_system_admin: formData.is_system_admin,
        force_password_reset: true,
      };

      const newUser = await api.users.create(createData);
      setUsers((prev) => [newUser, ...prev]);
      setShowCreateForm(false);
      setFormData({
        username: "",
        email: "",
        full_name: "",
        password: "",
        confirmPassword: "",
        roles: ["user"],
        permissions: [],
        is_system_admin: false,
      });
      setFormErrors({});
      setGeneratedPassword("");
      setShowPasswordPlain(false);
      showToast("User created successfully ✅", "✅");
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || "Failed to create user";
      showToast(errorMsg, "❌");
    } finally {
      setCreating(false);
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const displayName = u.full_name || u.username;
    const matchQ = !q || displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchR = filterRole === "all" || u.roles.includes(filterRole);
    const matchS = filterStatus === "all" || (filterStatus === "active" ? u.is_active : !u.is_active);
    return matchQ && matchR && matchS;
  });

  const toggleActive = (user_id: string) => {
    let toggled: User | undefined;
    setUsers(prev => prev.map(u => {
      if (u.user_id !== user_id) return u;
      toggled = { ...u, is_active: !u.is_active };
      return toggled;
    }));
    if (toggled) {
      showToast(`${toggled.full_name || toggled.username} is now ${toggled.is_active ? "active" : "inactive"}.`, toggled.is_active ? "✅" : "⏸️");
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    admins: users.filter(u => u.roles.includes("admin")).length,
  };

  return (
    <>
      <style>{MINIMAL_STYLES}</style>
      <div className="um-root">
        <nav className="um-nav">
          <div className="um-nav-left">
            <button className="um-back-btn" onClick={() => navigate("/system-admin")}><BackIcon /> Back</button>
            <div className="um-nav-divider" />
            <div className="um-nav-brand">
              <div className="um-nav-logo">A</div>
              <span className="um-nav-title">Admin Panel</span>
            </div>
          </div>
          <div className="um-breadcrumb">
            <span>Dashboard</span><span>›</span><strong>User Management</strong>
          </div>
        </nav>

        <main className="um-body">
          <div className="um-header-row">
            <div className="um-header-left">
              <div className="um-header-icon">👥</div>
              <div className="um-header-text">
                <h1>User Management</h1>
                <p>Manage accounts, assign roles and control access.</p>
              </div>
            </div>
          </div>

          <div className="um-demo-banner">
            {loading ? (
              <>⏳&nbsp;<strong>Loading users...</strong>&nbsp;Fetching from Database</>
            ) : error ? (
              <>❌&nbsp;<strong>Error:</strong>&nbsp;{error}</>
            ) : (
              <>✅&nbsp;<strong>Connected to Database</strong></>
            )}
          </div>

          <div className="um-stats">
            <div className="um-stat-card">
              <div className="um-stat-label">Total Users</div>
              <div className="um-stat-value">{stats.total}</div>
              <div className="um-stat-sub">All accounts</div>
            </div>
            <div className="um-stat-card">
              <div className="um-stat-label">Active</div>
              <div className="um-stat-value" style={{color:"#10b981"}}>{stats.active}</div>
              <div className="um-stat-sub">{stats.total - stats.active} inactive</div>
            </div>
            <div className="um-stat-card">
              <div className="um-stat-label">Admins</div>
              <div className="um-stat-value" style={{color:"#7c3aed"}}>{stats.admins}</div>
              <div className="um-stat-sub">Full access</div>
            </div>
            <div className="um-stat-card">
              <div className="um-stat-label">Users</div>
              <div className="um-stat-value" style={{color:"#3b82f6"}}>{stats.total - stats.admins}</div>
              <div className="um-stat-sub">Regular accounts</div>
            </div>
          </div>

          <div className="um-toolbar">
            <div className="um-search-wrap">
              <input className="um-search" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="um-filter-select" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
              <option value="all">All Roles</option>
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
            </select>
            <select className="um-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <span className="um-result-count">{filtered.length} / {users.length} users</span>
            <button className="um-btn-add" onClick={() => setShowCreateForm(true)}>➕ Create User</button>
          </div>

          <div className="um-table-wrap">
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9090a8' }}>
                <div>⏳ Loading users...</div>
              </div>
            ) : error ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
                <div>❌ {error}</div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9090a8' }}>
                <div>No users found</div>
              </div>
            ) : (
              <table className="um-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Active</th>
                    <th>Created</th>
                    <th style={{textAlign:"right"}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.user_id}>
                      <td>
                        <div className="um-avatar-wrap">
                          <div className="um-avatar" style={{backgroundColor: avatarBg(u.full_name || u.username)}}>
                            {getInit(u.full_name || u.username)}
                          </div>
                          <div>
                            <div className="um-user-name">{u.full_name || u.username}</div>
                            <div className="um-user-email">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`um-role r-${u.roles[0] || 'user'}`}>
                          {u.is_system_admin ? 'System Admin' : (u.roles[0] || 'user')}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`um-status ${u.is_active ? "s-active" : "s-inactive"}`}
                          onClick={() => toggleActive(u.user_id)}
                          title="Click to toggle"
                        >
                          <span className="um-dot" />
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <span className="um-last-active">
                          <span className={`um-last-active-dot ${laDotClass(u.last_login)}`} />
                          {fmtLastActive(u.last_login)}
                        </span>
                      </td>
                      <td>
                        {new Date(u.created_at).toLocaleDateString("en-US", {month:"short", day:"numeric", year:"2-digit"})}
                      </td>
                      <td>
                        <div className="um-row-actions">
                          <button className="um-action-edit" onClick={() => handleEditUser(u)}><PencilIcon /> Edit</button>
                          <button className="um-action-del" onClick={() => handleDeleteUser(u)}><TrashIcon /> Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {showCreateForm && (
            <div className="um-modal-overlay" onClick={() => setShowCreateForm(false)}>
              <div className="um-modal-content" onClick={e => e.stopPropagation()}>
                <div className="um-modal-header">
                  <h2>Create New User</h2>
                  <button 
                    className="um-modal-close"
                    onClick={() => setShowCreateForm(false)}
                    disabled={creating}
                  >✕</button>
                </div>

                <div className="um-form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    placeholder="john_doe"
                    value={formData.username}
                    onChange={e => {
                      setFormData({...formData, username: e.target.value});
                      if (formErrors.username) setFormErrors({...formErrors, username: ""});
                    }}
                    disabled={creating}
                  />
                  {formErrors.username && <span className="um-error">{formErrors.username}</span>}
                </div>

                <div className="um-form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={e => {
                      setFormData({...formData, email: e.target.value});
                      if (formErrors.email) setFormErrors({...formErrors, email: ""});
                    }}
                    disabled={creating}
                  />
                  {formErrors.email && <span className="um-error">{formErrors.email}</span>}
                </div>

                <div className="um-form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe (optional)"
                    value={formData.full_name}
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                    disabled={creating}
                  />
                </div>

                <div className="um-form-group">
                  <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px"}}>
                    <label>Password *</label>
                    <button
                      type="button"
                      className="um-btn-gen-pwd"
                      onClick={() => {
                        const pwd = generateRandomPassword();
                        setGeneratedPassword(pwd);
                        setFormData({...formData, password: pwd, confirmPassword: pwd});
                        setFormErrors({...formErrors, password: "", confirmPassword: ""});
                      }}
                      disabled={creating}
                    >🔑 Generate</button>
                  </div>
                  {generatedPassword && (
                    <div className="um-generated-pwd">
                      <div style={{fontSize:"12px", color:"#7c3aed", fontWeight:600, marginBottom:"6px"}}>Generated Password:</div>
                      <div style={{display:"flex", alignItems:"center", gap:"8px", background:"#f9f9fc", padding:"10px 12px", borderRadius:"8px", fontFamily:"monospace"}}>
                        <span style={{flex:1, color:"#1a1a2e", wordBreak:"break-all"}}>{generatedPassword}</span>
                        <button
                          type="button"
                          className="um-btn-copy"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedPassword);
                            showToast("Password copied to clipboard", "📋");
                          }}
                        >📋 Copy</button>
                      </div>
                    </div>
                  )}
                  <div style={{display:"flex", alignItems:"center", gap:"8px"}}>
                    <input
                      type={showPasswordPlain ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={e => {
                        setFormData({...formData, password: e.target.value});
                        if (formErrors.password) setFormErrors({...formErrors, password: ""});
                      }}
                      disabled={creating}
                      style={{flex: 1}}
                    />
                    <button
                      type="button"
                      className="um-btn-toggle-pwd"
                      onClick={() => setShowPasswordPlain(!showPasswordPlain)}
                      disabled={creating}
                      title={showPasswordPlain ? "Hide password" : "Show password"}
                    >{showPasswordPlain ? "Hide" : "Show"}</button>
                  </div>
                  {formData.password && (
                    <div className="um-password-hint">
                      <span style={{color: validatePasswordStrength(formData.password) ? "#10b981" : "#ef4444"}}>
                        {validatePasswordStrength(formData.password) ? "✓" : "✗"} 8+ chars, 1 uppercase, 1 number, 1 special char (!@#$%^&*)
                      </span>
                    </div>
                  )}
                  {formErrors.password && <span className="um-error">{formErrors.password}</span>}
                </div>

                <div className="um-form-group">
                  <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px"}}>
                    <label>Confirm Password *</label>
                  </div>
                  <div style={{display:"flex", alignItems:"center", gap:"8px"}}>
                    <input
                      type={showConfirmPasswordPlain ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={e => {
                        setFormData({...formData, confirmPassword: e.target.value});
                        if (formErrors.confirmPassword) setFormErrors({...formErrors, confirmPassword: ""});
                      }}
                      disabled={creating}
                      style={{flex: 1}}
                    />
                    <button
                      type="button"
                      className="um-btn-toggle-pwd"
                      onClick={() => setShowConfirmPasswordPlain(!showConfirmPasswordPlain)}
                      disabled={creating}
                      title={showConfirmPasswordPlain ? "Hide password" : "Show password"}
                    >{showConfirmPasswordPlain ? "Hide" : "Show"}</button>
                  </div>
                  {formData.password && formData.confirmPassword && (
                    <div className="um-password-match">
                      {formData.password === formData.confirmPassword ? (
                        <span style={{color:"#10b981"}}>✓ Passwords match</span>
                      ) : (
                        <span style={{color:"#ef4444"}}>✗ Passwords do not match</span>
                      )}
                    </div>
                  )}
                  {formErrors.confirmPassword && <span className="um-error">{formErrors.confirmPassword}</span>}
                </div>

                <div className="um-form-group">
                  <label>Role *</label>
                  <select 
                    value={formData.roles[0] || ""}
                    onChange={e => {
                      const role = e.target.value;
                      const defaultPerms = getDefaultPermissionsForRole(role, role === "admin" ? formData.is_system_admin : false);
                      setFormData({
                        ...formData,
                        roles: [role],
                        permissions: defaultPerms,
                        is_system_admin: role === "admin" ? formData.is_system_admin : false,
                      });
                    }}
                    disabled={creating}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>

                {formData.roles[0] === "admin" && (
                  <div className="um-form-group um-form-checkbox">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.is_system_admin}
                        onChange={e => handleSystemAdminCheck(e.target.checked)}
                        disabled={creating}
                      />
                      <span>System Admin</span>
                    </label>
                    <div style={{fontSize:"12px", color:"#9090a8", marginTop:"6px", marginLeft:"28px"}}>
                      Enable critical system component management
                    </div>
                  </div>
                )}

                <div className="um-form-group" style={{display: "none"}}>
                  <label>Permissions</label>
                  <div className="um-permissions-list">
                    {Object.entries(PERMISSIONS_MAP).map(([permId, permInfo]) => {
                      // Show manage_users and edit_user_permissions only if system admin and role is admin
                      if ((permId === "manage:users" || permId === "edit:user_permissions") && 
                          (formData.roles[0] !== "admin" || !formData.is_system_admin)) {
                        return null;
                      }
                      
                      const isChecked = formData.permissions.includes(permId);
                      return (
                        <div key={permId} className="um-permission-item">
                          <label>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    permissions: [...prev.permissions, permId],
                                  }));
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    permissions: prev.permissions.filter(p => p !== permId),
                                  }));
                                }
                              }}
                              disabled={creating}
                            />
                            <div className="um-permission-info">
                              <div className="um-permission-name">{permInfo.name}</div>
                              <div className="um-permission-desc">{permInfo.description}</div>
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="um-modal-footer">
                  <button 
                    className="um-btn-cancel"
                    onClick={() => setShowCreateForm(false)}
                    disabled={creating}
                  >Cancel</button>
                  <button 
                    className="um-btn-create"
                    onClick={handleCreateUser}
                    disabled={creating}
                  >{creating ? "Creating..." : "Create User"}</button>
                </div>
              </div>
              
              {showAdminConfirmDialog && (
                <div className="um-modal-overlay" onClick={() => confirmAdminAccess(false)}>
                  <div className="um-confirm-dialog" onClick={e => e.stopPropagation()}>
                    <div className="um-confirm-header">
                      <div style={{fontSize:"20px"}}>⚠️</div>
                      <h3>System Admin Access</h3>
                    </div>
                    <p className="um-confirm-message">
                      System admin will be able to edit critical system components. Are you sure you want to proceed?
                    </p>
                    <div className="um-confirm-footer">
                      <button 
                        className="um-btn-cancel"
                        onClick={() => confirmAdminAccess(false)}
                      >No</button>
                      <button 
                        className="um-btn-create"
                        onClick={() => confirmAdminAccess(true)}
                      >Yes</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {showEditForm && editingUser && (
            <div className="um-modal-overlay" onClick={() => {
              setShowEditForm(false);
              setEditingUser(null);
              setEditMode("view");
            }}>
              <div className="um-modal-content" onClick={e => e.stopPropagation()}>
                <div className="um-modal-header">
                  <h2>Edit User</h2>
                  <button 
                    className="um-modal-close"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingUser(null);
                      setEditMode("view");
                    }}
                    disabled={updatingUser}
                  >✕</button>
                </div>

                <div className="um-form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={editingUser.username}
                    disabled
                    style={{opacity: 0.6, background: "#f5f5f7"}}
                  />
                  <div style={{fontSize:"12px", color:"#9090a8", marginTop:"4px"}}>Read-only</div>
                </div>

                <div className="um-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    disabled
                    style={{opacity: 0.6, background: "#f5f5f7"}}
                  />
                  <div style={{fontSize:"12px", color:"#9090a8", marginTop:"4px"}}>Read-only</div>
                </div>

                <div className="um-form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    placeholder="Full name (optional)"
                    value={editFormData.full_name}
                    onChange={e => {
                      setEditFormData({...editFormData, full_name: e.target.value});
                    }}
                    disabled={updatingUser}
                  />
                </div>

                {editMode === "password" && (
                  <>
                    <div className="um-form-group">
                      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px"}}>
                        <label>New Password *</label>
                        <button
                          type="button"
                          className="um-btn-gen-pwd"
                          onClick={() => {
                            const pwd = generateRandomPassword();
                            setEditGeneratedPassword(pwd);
                            setEditFormData({...editFormData, password: pwd, confirmPassword: pwd});
                            setEditFormErrors({...editFormErrors, password: "", confirmPassword: ""});
                          }}
                          disabled={updatingUser}
                        >🔑 Generate</button>
                      </div>
                      {editGeneratedPassword && (
                        <div className="um-generated-pwd">
                          <div style={{fontSize:"12px", color:"#7c3aed", fontWeight:600, marginBottom:"6px"}}>Generated Password:</div>
                          <div style={{display:"flex", alignItems:"center", gap:"8px", background:"#f9f9fc", padding:"10px 12px", borderRadius:"8px", fontFamily:"monospace"}}>
                            <span style={{flex:1, color:"#1a1a2e", wordBreak:"break-all"}}>{editGeneratedPassword}</span>
                            <button
                              type="button"
                              className="um-btn-copy"
                              onClick={() => {
                                navigator.clipboard.writeText(editGeneratedPassword);
                                showToast("Password copied to clipboard", "📋");
                              }}
                            >📋 Copy</button>
                          </div>
                        </div>
                      )}
                      <div style={{display:"flex", alignItems:"center", gap:"8px"}}>
                        <input
                          type={editShowPasswordPlain ? "text" : "password"}
                          placeholder="••••••••"
                          value={editFormData.password}
                          onChange={e => {
                            setEditFormData({...editFormData, password: e.target.value});
                            if (editFormErrors.password) setEditFormErrors({...editFormErrors, password: ""});
                          }}
                          disabled={updatingUser}
                          style={{flex: 1}}
                        />
                        <button
                          type="button"
                          className="um-btn-toggle-pwd"
                          onClick={() => setEditShowPasswordPlain(!editShowPasswordPlain)}
                          disabled={updatingUser}
                          title={editShowPasswordPlain ? "Hide password" : "Show password"}
                        >{editShowPasswordPlain ? "Hide" : "Show"}</button>
                      </div>
                      {editFormData.password && (
                        <div className="um-password-hint">
                          <span style={{color: validatePasswordStrength(editFormData.password) ? "#10b981" : "#ef4444"}}>
                            {validatePasswordStrength(editFormData.password) ? "✓" : "✗"} 8+ chars, 1 uppercase, 1 number, 1 special char (!@#$%^&*)
                          </span>
                        </div>
                      )}
                      {editFormErrors.password && <span className="um-error">{editFormErrors.password}</span>}
                    </div>

                    <div className="um-form-group">
                      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px"}}>
                        <label>Confirm Password *</label>
                      </div>
                      <div style={{display:"flex", alignItems:"center", gap:"8px"}}>
                        <input
                          type={editShowConfirmPasswordPlain ? "text" : "password"}
                          placeholder="••••••••"
                          value={editFormData.confirmPassword}
                          onChange={e => {
                            setEditFormData({...editFormData, confirmPassword: e.target.value});
                            if (editFormErrors.confirmPassword) setEditFormErrors({...editFormErrors, confirmPassword: ""});
                          }}
                          disabled={updatingUser}
                          style={{flex: 1}}
                        />
                        <button
                          type="button"
                          className="um-btn-toggle-pwd"
                          onClick={() => setEditShowConfirmPasswordPlain(!editShowConfirmPasswordPlain)}
                          disabled={updatingUser}
                          title={editShowConfirmPasswordPlain ? "Hide password" : "Show password"}
                        >{editShowConfirmPasswordPlain ? "Hide" : "Show"}</button>
                      </div>
                      {editFormData.password && editFormData.confirmPassword && (
                        <div className="um-password-match">
                          {editFormData.password === editFormData.confirmPassword ? (
                            <span style={{color:"#10b981"}}>✓ Passwords match</span>
                          ) : (
                            <span style={{color:"#ef4444"}}>✗ Passwords do not match</span>
                          )}
                        </div>
                      )}
                      {editFormErrors.confirmPassword && <span className="um-error">{editFormErrors.confirmPassword}</span>}
                    </div>
                  </>
                )}

                {editMode === "role" && (
                  <>
                    <div className="um-form-group">
                      <label>Role</label>
                      <select 
                        value={editFormData.roles[0] || ""}
                        onChange={e => {
                          setEditFormData({
                            ...editFormData,
                            roles: [e.target.value],
                            is_system_admin: e.target.value === "admin" ? editFormData.is_system_admin : false,
                          });
                        }}
                        disabled={updatingUser}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                      </select>
                    </div>

                    {editFormData.roles[0] === "admin" && (
                      <div className="um-form-group um-form-checkbox">
                        <label>
                          <input
                            type="checkbox"
                            checked={editFormData.is_system_admin}
                            onChange={e => handleEditSystemAdminCheck(e.target.checked)}
                            disabled={updatingUser}
                          />
                          <span>System Admin</span>
                        </label>
                        <div style={{fontSize:"12px", color:"#9090a8", marginTop:"6px", marginLeft:"28px"}}>
                          Enable critical system component management
                        </div>
                      </div>
                    )}
                  </>
                )}

                {editMode === "view" && (
                  <div style={{display:"flex", flexDirection:"column", gap:"10px"}}>
                    <button
                      className="um-btn-create"
                      onClick={() => setEditMode("password")}
                      disabled={updatingUser}
                      style={{background: "#3b82f6", marginBottom: "8px"}}
                    >🔐 Change Password</button>
                    <button
                      className="um-btn-create"
                      onClick={() => setEditMode("role")}
                      disabled={updatingUser}
                      style={{background: "#10b981"}}
                    >👤 Modify Role</button>
                  </div>
                )}

                <div className="um-modal-footer">
                  <button 
                    className="um-btn-cancel"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingUser(null);
                      setEditMode("view");
                    }}
                    disabled={updatingUser}
                  >{editMode === "view" ? "Close" : "Cancel"}</button>
                  {editMode === "view" && editFormData.full_name !== (editingUser?.full_name || "") && (
                    <button 
                      className="um-btn-create"
                      onClick={() => handleUpdateUser()}
                      disabled={updatingUser}
                      style={{background: "#f59e0b"}}
                    >💾 Save Changes</button>
                  )}
                  {editMode !== "view" && (
                    <button 
                      className="um-btn-create"
                      onClick={handleUpdateUser}
                      disabled={updatingUser}
                    >{updatingUser ? "Updating..." : "Save Changes"}</button>
                  )}
                </div>
              </div>

              {editShowAdminConfirmDialog && (
                <div className="um-modal-overlay" onClick={() => confirmEditAdminAccess(false)}>
                  <div className="um-confirm-dialog" onClick={e => e.stopPropagation()}>
                    <div className="um-confirm-header">
                      <div style={{fontSize:"20px"}}>⚠️</div>
                      <h3>System Admin Access</h3>
                    </div>
                    <p className="um-confirm-message">
                      System admin will be able to edit critical system components. Are you sure you want to proceed?
                    </p>
                    <div className="um-confirm-footer">
                      <button 
                        className="um-btn-cancel"
                        onClick={() => confirmEditAdminAccess(false)}
                      >No</button>
                      <button 
                        className="um-btn-create"
                        onClick={() => confirmEditAdminAccess(true)}
                      >Yes</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {editSystemAdminWarning && (
            <div className="um-modal-overlay" onClick={() => confirmEditSystemAdmin(false)}>
              <div className="um-confirm-dialog" onClick={e => e.stopPropagation()}>
                <div className="um-confirm-header">
                  <div style={{fontSize:"20px"}}>⚠️</div>
                  <h3>System Admin Account</h3>
                </div>
                <p className="um-confirm-message">
                  You are about to edit a system admin's account. This is a critical account that can modify system components. Are you sure you want to proceed?
                </p>
                <div className="um-confirm-footer">
                  <button 
                    className="um-btn-cancel"
                    onClick={() => confirmEditSystemAdmin(false)}
                  >No</button>
                  <button 
                    className="um-btn-create"
                    onClick={() => confirmEditSystemAdmin(true)}
                  >Yes</button>
                </div>
              </div>
            </div>
          )}

          {deleteSystemAdminWarning && (
            <div className="um-modal-overlay" onClick={() => confirmDeleteSystemAdmin(false)}>
              <div className="um-confirm-dialog" onClick={e => e.stopPropagation()}>
                <div className="um-confirm-header">
                  <div style={{fontSize:"20px"}}>⚠️</div>
                  <h3>System Admin Account</h3>
                </div>
                <p className="um-confirm-message">
                  You are about to delete a system admin's account. This is a critical account that manages system components. Are you sure you want to proceed?
                </p>
                <div className="um-confirm-footer">
                  <button 
                    className="um-btn-cancel"
                    onClick={() => confirmDeleteSystemAdmin(false)}
                  >No</button>
                  <button 
                    className="um-btn-create"
                    onClick={() => confirmDeleteSystemAdmin(true)}
                  >Yes</button>
                </div>
              </div>
            </div>
          )}

          {showDeleteForm && deletingUser && (
            <div className="um-modal-overlay" onClick={() => !deletingInProgress && setShowDeleteForm(false)}>
              <div className="um-modal-content" onClick={e => e.stopPropagation()}>
                <div className="um-modal-header">
                  <h2>Delete User</h2>
                  <button 
                    className="um-modal-close"
                    onClick={() => !deletingInProgress && setShowDeleteForm(false)}
                    disabled={deletingInProgress}
                  >✕</button>
                </div>

                <div style={{background: "#fff3cd", border: "1px solid #ffe69c", borderRadius: "10px", padding: "12px 14px", marginBottom: "20px", fontSize: "13px", color: "#856404"}}>
                  <strong>Warning:</strong> This action cannot be undone. The user will be permanently deleted.
                </div>

                {deleteError && (
                  <div style={{background: "#fee", border: "1px solid #fcc", borderRadius: "10px", padding: "12px 14px", marginBottom: "20px", fontSize: "13px", color: "#c33"}}>
                    <strong>Error:</strong> {deleteError}
                  </div>
                )}

                <div style={{background: "#f5f5f7", borderRadius: "12px", padding: "18px", marginBottom: "24px"}}>
                  <div style={{marginBottom: "14px"}}>
                    <div style={{fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#b0b0c8", marginBottom: "4px"}}>Username</div>
                    <div style={{fontSize: "14px", fontWeight: "500", color: "#1a1a2e"}}>{deletingUser.username}</div>
                  </div>
                  <div style={{marginBottom: "14px"}}>
                    <div style={{fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#b0b0c8", marginBottom: "4px"}}>Email</div>
                    <div style={{fontSize: "14px", fontWeight: "500", color: "#1a1a2e"}}>{deletingUser.email}</div>
                  </div>
                  <div style={{marginBottom: "14px"}}>
                    <div style={{fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#b0b0c8", marginBottom: "4px"}}>Role</div>
                    <div style={{fontSize: "14px", fontWeight: "500", color: "#1a1a2e"}}>
                      {deletingUser.is_system_admin ? "System Admin" : deletingUser.roles[0] || "User"}
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#b0b0c8", marginBottom: "4px"}}>Last Active</div>
                    <div style={{fontSize: "14px", fontWeight: "500", color: "#1a1a2e"}}>
                      {fmtLastActive(deletingUser.last_login)}
                    </div>
                  </div>
                </div>

                <div className="um-form-group">
                  <label style={{color: "#ef4444"}}><strong>To confirm deletion, please enter the username</strong></label>
                  <input
                    type="text"
                    placeholder={`Type "${deletingUser.username}" to confirm`}
                    value={deleteUsernameConfirm}
                    onChange={e => setDeleteUsernameConfirm(e.target.value)}
                    disabled={deletingInProgress}
                    style={{marginTop: "6px"}}
                  />
                  {deleteUsernameConfirm && deleteUsernameConfirm !== deletingUser.username && (
                    <span className="um-error">Username does not match</span>
                  )}
                </div>

                <div className="um-modal-footer">
                  <button 
                    className="um-btn-cancel"
                    onClick={() => !deletingInProgress && setShowDeleteForm(false)}
                    disabled={deletingInProgress}
                  >Cancel</button>
                  <button 
                    className="um-btn-create"
                    style={{background: deleteUsernameConfirm === deletingUser.username ? "#ef4444" : "#c0c0d0", opacity: deleteUsernameConfirm === deletingUser.username ? 1 : 0.6}}
                    onClick={handleConfirmDelete}
                    disabled={deleteUsernameConfirm !== deletingUser.username || deletingInProgress}
                  >{deletingInProgress ? "Deleting..." : "Delete User"}</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      {toast && <div style={{position:"fixed", bottom:32, right:32, background:"#1a1a2e", color:"#fff", borderRadius:13, padding:"14px 22px", fontSize:13.5, fontWeight:500, display:"flex", alignItems:"center", gap:10, boxShadow:"0 8px 32px rgba(0,0,0,0.18)", zIndex:10002}}>
        <span>{toast.icon}</span>{toast.msg}
      </div>}
    </>
  );
};

export default AdminUserManagement;
