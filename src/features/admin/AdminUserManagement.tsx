import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useTheme } from '../../state/ThemeContext';

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
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if (diff < 86400*7) return `${Math.floor(diff/86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US",{month:"short",day:"numeric"});
};

const laDotColor = (iso: string | null | undefined) => {
  if (!iso) return "#d1d5db";
  const h = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (h < 1) return "#10b981";
  if (h < 24) return "#60a5fa";
  if (h < 168) return "#fbbf24";
  return "#d1d5db";
};

const BackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
);
const PencilIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
);
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
);

const AdminUserManagement: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [toast, setToast] = useState<{ msg: string; icon: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "", full_name: "", password: "", confirmPassword: "", roles: ["user"], permissions: ["create:agents", "read:agents"] as string[], is_system_admin: false });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPasswordPlain, setShowPasswordPlain] = useState(false);
  const [showConfirmPasswordPlain, setShowConfirmPasswordPlain] = useState(false);
  const [showAdminConfirmDialog, setShowAdminConfirmDialog] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState<"view" | "password" | "role">("view");
  const [editFormData, setEditFormData] = useState({ full_name: "", password: "", confirmPassword: "", roles: ["user"], is_system_admin: false });
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
  const [updatingUser, setUpdatingUser] = useState(false);
  const [editGeneratedPassword, setEditGeneratedPassword] = useState("");
  const [editShowPasswordPlain, setEditShowPasswordPlain] = useState(false);
  const [editShowConfirmPasswordPlain, setEditShowConfirmPasswordPlain] = useState(false);
  const [editShowAdminConfirmDialog, setEditShowAdminConfirmDialog] = useState(false);
  const [editSystemAdminWarning, setEditSystemAdminWarning] = useState(false);
  const [pendingEditUser, setPendingEditUser] = useState<User | null>(null);
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteUsernameConfirm, setDeleteUsernameConfirm] = useState("");
  const [deletingInProgress, setDeletingInProgress] = useState(false);
  const [deleteSystemAdminWarning, setDeleteSystemAdminWarning] = useState(false);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const c = {
    bg: isDark ? '#0d1117' : '#f5f5f7',
    surface: isDark ? '#1a2234' : '#ffffff',
    surfaceAlt: isDark ? '#111827' : '#fafafa',
    border: isDark ? '#1e2d45' : '#e8e8ee',
    borderLight: isDark ? '#0d1117' : '#f0f0f5',
    text: isDark ? '#e2e8f0' : '#1a1a2e',
    textMuted: isDark ? '#64748b' : '#9090a8',
    textSub: isDark ? '#94a3b8' : '#4b4b6b',
    navBg: isDark ? '#1a2234' : '#ffffff',
    inputBg: isDark ? '#111827' : '#f9f9fc',
    tableHead: isDark ? '#111827' : '#fafafa',
    tableHover: isDark ? 'rgba(30,45,69,0.5)' : '#fafbff',
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true); setError(null);
        const data = await api.users.list(0, 100);
        setUsers(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch users');
      } finally { setLoading(false); }
    };
    fetchUsers();
  }, []);

  const showToast = (msg: string, icon = "✅") => { setToast({ msg, icon }); setTimeout(() => setToast(null), 3000); };

  const validatePasswordStrength = (p: string) => p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p) && /[!@#$%^&*]/.test(p);

  const generateRandomPassword = () => {
    const u = "ABCDEFGHIJKLMNOPQRSTUVWXYZ", l = "abcdefghijklmnopqrstuvwxyz", n = "0123456789", s = "!@#$%^&*";
    const all = u + l + n + s;
    let p = [u[Math.floor(Math.random()*u.length)], n[Math.floor(Math.random()*n.length)], s[Math.floor(Math.random()*s.length)]];
    for (let i = 0; i < 5; i++) p.push(all[Math.floor(Math.random()*all.length)]);
    return p.sort(() => Math.random() - 0.5).join("");
  };

  const getDefaultPermissionsForRole = (role: string, isSystemAdmin: boolean = false) => {
    if (role === "admin") {
      const perms = ["create:agents","read:agents","delete:agents","create:target_systems","read:target_systems","edit:target_systems","delete:target_systems","read:audit_logs"];
      if (isSystemAdmin) perms.push("manage:users", "edit:user_permissions");
      return perms;
    }
    return ["create:agents","read:agents"];
  };

  const handleSystemAdminCheck = (value: boolean) => {
    if (value) setShowAdminConfirmDialog(true);
    else setFormData(prev => ({ ...prev, is_system_admin: false, permissions: getDefaultPermissionsForRole("admin", false) }));
  };

  const confirmAdminAccess = (confirmed: boolean) => {
    setShowAdminConfirmDialog(false);
    if (confirmed) setFormData(prev => ({ ...prev, is_system_admin: true, permissions: getDefaultPermissionsForRole("admin", true) }));
  };

  const handleEditUser = (user: User) => {
    if (user.is_system_admin) { setPendingEditUser(user); setEditSystemAdminWarning(true); return; }
    proceedEditUser(user);
  };

  const proceedEditUser = (user: User) => {
    setEditingUser(user);
    setEditFormData({ full_name: user.full_name || "", password: "", confirmPassword: "", roles: user.roles, is_system_admin: user.is_system_admin });
    setEditMode("view"); setEditFormErrors({}); setEditGeneratedPassword(""); setEditShowPasswordPlain(false); setEditShowConfirmPasswordPlain(false);
    setShowEditForm(true);
  };

  const confirmEditSystemAdmin = (confirmed: boolean) => {
    setEditSystemAdminWarning(false);
    if (confirmed && pendingEditUser) proceedEditUser(pendingEditUser);
    setPendingEditUser(null);
  };

  const handleEditSystemAdminCheck = (value: boolean) => {
    if (value) setEditShowAdminConfirmDialog(true);
    else setEditFormData(prev => ({ ...prev, is_system_admin: false }));
  };

  const confirmEditAdminAccess = (confirmed: boolean) => {
    setEditShowAdminConfirmDialog(false);
    if (confirmed) setEditFormData(prev => ({ ...prev, is_system_admin: true }));
  };

  const handleDeleteUser = (user: User) => {
    if (user.is_system_admin) { setPendingDeleteUser(user); setDeleteSystemAdminWarning(true); return; }
    proceedDeleteUser(user);
  };

  const proceedDeleteUser = (user: User) => {
    setDeletingUser(user); setDeleteUsernameConfirm(""); setDeleteError(null); setShowDeleteForm(true);
  };

  const confirmDeleteSystemAdmin = (confirmed: boolean) => {
    setDeleteSystemAdminWarning(false);
    if (confirmed && pendingDeleteUser) proceedDeleteUser(pendingDeleteUser);
    setPendingDeleteUser(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser || deleteUsernameConfirm !== deletingUser.username) return;
    try {
      setDeletingInProgress(true); setDeleteError(null);
      await api.users.delete(deletingUser.user_id);
      setUsers(users.filter(u => u.user_id !== deletingUser.user_id));
      setShowDeleteForm(false); setDeletingUser(null); setDeleteUsernameConfirm("");
      showToast(`User ${deletingUser.username} deleted`, "🗑️");
    } catch (err: any) {
      if (err.status === 403) setDeleteError("You cannot delete your own account.");
      else setDeleteError(err.message || 'Failed to delete user');
    } finally { setDeletingInProgress(false); }
  };

  const validateEditPasswordForm = () => {
    const errors: Record<string, string> = {};
    if (!editFormData.password) errors.password = "Password is required";
    else if (!validatePasswordStrength(editFormData.password)) errors.password = "Password must have 8+ chars, 1 uppercase, 1 number, 1 special char";
    else if (editFormData.password !== editFormData.confirmPassword) errors.confirmPassword = "Passwords do not match";
    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    if (editMode === "password" && !validateEditPasswordForm()) return;
    setUpdatingUser(true);
    try {
      const updateData: any = { full_name: editFormData.full_name.trim() || undefined };
      if (editMode === "password") updateData.password = editFormData.password;
      if (editMode === "role") { updateData.roles = editFormData.roles; updateData.is_system_admin = editFormData.is_system_admin; }
      const updatedUser = await api.users.update(editingUser.user_id, updateData);
      setUsers(prev => prev.map(u => u.user_id === editingUser.user_id ? updatedUser : u));
      setShowEditForm(false); setEditingUser(null); setEditMode("view");
      showToast("User updated successfully", "✅");
    } catch (err: any) {
      showToast(err.response?.data?.detail || err.message || "Failed to update user", "❌");
    } finally { setUpdatingUser(false); }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.username.trim()) errors.username = "Username is required";
    else if (formData.username.length < 3) errors.username = "Username must be at least 3 characters";
    else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) errors.username = "Letters, numbers, hyphens, and underscores only";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Invalid email format";
    if (!formData.password) errors.password = "Password is required";
    else if (!validatePasswordStrength(formData.password)) errors.password = "8+ chars, 1 uppercase, 1 number, 1 special char";
    else if (formData.password !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateForm()) return;
    setCreating(true);
    try {
      const permissions = getDefaultPermissionsForRole(formData.roles[0], formData.is_system_admin);
      const newUser = await api.users.create({ username: formData.username.trim(), email: formData.email.trim(), full_name: formData.full_name.trim() || undefined, password: formData.password, roles: formData.roles, permissions, is_active: true, is_system_admin: formData.is_system_admin, force_password_reset: true });
      setUsers(prev => [newUser, ...prev]);
      setShowCreateForm(false);
      setFormData({ username: "", email: "", full_name: "", password: "", confirmPassword: "", roles: ["user"], permissions: [], is_system_admin: false });
      setFormErrors({}); setGeneratedPassword(""); setShowPasswordPlain(false);
      showToast("User created successfully", "✅");
    } catch (err: any) {
      showToast(err.response?.data?.detail || err.message || "Failed to create user", "❌");
    } finally { setCreating(false); }
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
    setUsers(prev => prev.map(u => { if (u.user_id !== user_id) return u; toggled = { ...u, is_active: !u.is_active }; return toggled!; }));
    if (toggled) showToast(`${toggled.full_name || toggled.username} is now ${toggled.is_active ? "active" : "inactive"}.`, toggled.is_active ? "✅" : "⏸️");
  };

  const stats = { total: users.length, active: users.filter(u => u.is_active).length, admins: users.filter(u => u.roles.includes("admin")).length };

  const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', border: `1.5px solid ${c.border}`, borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: c.text, background: c.inputBg, transition: 'all 0.2s', boxSizing: 'border-box' };
  const modal: React.CSSProperties = { background: c.surface, borderRadius: '16px', boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.18)', maxWidth: '520px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '32px', border: `1px solid ${c.border}` };
  const overlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(26,26,46,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001 };

  const ConfirmDialog = ({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) => (
    <div style={overlay} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: c.surface, borderRadius: '16px', boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.2)', maxWidth: '400px', width: '90%', padding: '28px', border: `1px solid ${c.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: c.text }}>{title}</h3>
        </div>
        <p style={{ margin: '0 0 22px', fontSize: '14px', color: c.textMuted, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onCancel} style={{ padding: '11px 24px', background: isDark ? '#111827' : '#f5f5f7', border: `1px solid ${c.border}`, borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 600, color: c.textSub, cursor: 'pointer' }}>No</button>
          <button onClick={onConfirm} style={{ padding: '11px 28px', background: 'linear-gradient(135deg, #6d28d9, #7c3aed)', border: 'none', borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 600, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>Yes</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@700&display=swap');
        * { box-sizing: border-box; }
        html, body { margin: 0 !important; padding: 0 !important; }
        .um-inp:focus { outline: none; border-color: #7c3aed !important; background: ${isDark ? '#0d1117' : '#fff'} !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.1) !important; }
        .um-inp::placeholder { color: ${isDark ? '#334155' : '#b0b0c8'}; }
        .um-inp:disabled { background: ${isDark ? '#0d1117' : '#f5f5f7'} !important; opacity: 0.6; cursor: not-allowed; }
        .um-tr:hover td { background: ${c.tableHover} !important; }
        .um-search:focus { outline: none; border-color: #7c3aed !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.08) !important; }
        .um-back-btn:hover { background: ${isDark ? '#1e2d45' : '#ebebf0'} !important; }
        .um-edit-btn:hover { background: rgba(124,58,237,0.15) !important; border-color: rgba(124,58,237,0.35) !important; }
        .um-del-btn:hover { background: rgba(239,68,68,0.13) !important; border-color: rgba(239,68,68,0.35) !important; }
        .um-add-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,58,237,0.38) !important; }
        @keyframes umFadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .um-anim { animation: umFadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }

        /* ── Responsive: below 1920px ── */
        @media (max-width: 1919px) {
          .um-nav { padding: 0 32px !important; height: 60px !important; }
          .um-main { padding: 36px 32px 60px !important; }
          .um-stats-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 14px !important; }
          .um-stat-value { font-size: 26px !important; }
          .um-toolbar { gap: 10px !important; }
        }

        @media (max-width: 1400px) {
          .um-nav { padding: 0 24px !important; }
          .um-main { padding: 28px 24px 48px !important; max-width: 100% !important; }
          .um-header h1 { font-size: 26px !important; }
          .um-stats-grid { gap: 12px !important; }
          .um-stat-card { padding: 16px 18px !important; }
          .um-stat-value { font-size: 24px !important; }
          .um-table-container { overflow-x: auto !important; }
          .um-toolbar { flex-wrap: wrap !important; }
          .um-search { max-width: 100% !important; flex: 1 1 200px !important; }
          .um-add-btn { white-space: nowrap !important; }
        }

        @media (max-width: 1200px) {
          .um-nav { padding: 0 20px !important; height: 56px !important; }
          .um-main { padding: 24px 20px 40px !important; }
          .um-nav-brand span { font-size: 14px !important; }
          .um-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .um-header-row { flex-direction: column !important; align-items: flex-start !important; }
          .um-header { flex-direction: column !important; align-items: flex-start !important; }
          .um-header h1 { font-size: 24px !important; }
          .um-status-banner { font-size: 12px !important; }
          .um-toolbar { flex-wrap: wrap !important; gap: 8px !important; }
          .um-table th:nth-child(4),
          .um-table td:nth-child(4) { display: none !important; }
        }

        @media (max-width: 1024px) {
          .um-table th:nth-child(5),
          .um-table td:nth-child(5) { display: none !important; }
          .um-nav-breadcrumb { display: none !important; }
        }

        /* ── Responsive: above 1920px ── */
        @media (min-width: 1921px) {
          .um-nav { padding: 0 80px !important; height: 80px !important; }
          .um-nav-brand-logo { width: 42px !important; height: 42px !important; font-size: 18px !important; border-radius: 11px !important; }
          .um-nav-brand span { font-size: 18px !important; }
          .um-nav-breadcrumb { font-size: 16px !important; }
          .um-back-btn { font-size: 15px !important; padding: 10px 20px !important; border-radius: 11px !important; }
          .um-main { padding: 64px 80px 100px !important; max-width: 1400px !important; }
          .um-header { gap: 26px !important; margin-bottom: 36px !important; }
          .um-header-icon { width: 76px !important; height: 76px !important; border-radius: 22px !important; font-size: 32px !important; }
          .um-header h1 { font-size: 38px !important; }
          .um-header p { font-size: 17px !important; }
          .um-status-banner { font-size: 15px !important; padding: 14px 22px !important; border-radius: 14px !important; margin-bottom: 30px !important; }
          .um-stats-grid { gap: 22px !important; margin-bottom: 36px !important; }
          .um-stat-card { padding: 26px 28px !important; border-radius: 20px !important; }
          .um-stat-label { font-size: 12px !important; }
          .um-stat-value { font-size: 38px !important; }
          .um-stat-sub { font-size: 14px !important; }
          .um-toolbar { gap: 16px !important; margin-bottom: 22px !important; }
          .um-search { padding: 13px 18px !important; font-size: 15px !important; border-radius: 13px !important; }
          .um-filter-select { padding: 13px 42px 13px 16px !important; font-size: 14.5px !important; border-radius: 13px !important; }
          .um-count-text { font-size: 15px !important; }
          .um-add-btn { padding: 14px 28px !important; font-size: 15px !important; border-radius: 14px !important; }
          .um-table-container { border-radius: 24px !important; }
          .um-table th { padding: 16px 24px !important; font-size: 12px !important; }
          .um-table td { padding: 18px 24px !important; font-size: 15px !important; }
          .um-avatar { width: 48px !important; height: 48px !important; font-size: 15px !important; }
          .um-user-name { font-size: 15px !important; }
          .um-user-email { font-size: 13px !important; }
          .um-role-badge { font-size: 13px !important; padding: 5px 15px !important; }
          .um-status-badge { font-size: 13px !important; padding: 6px 15px !important; }
          .um-time-cell { font-size: 14px !important; }
          .um-date-cell { font-size: 15px !important; }
          .um-edit-btn { padding: 9px 18px !important; font-size: 13.5px !important; border-radius: 10px !important; }
          .um-del-btn { padding: 9px 18px !important; font-size: 13.5px !important; border-radius: 10px !important; }
        }

        @media (min-width: 2560px) {
          .um-nav { padding: 0 120px !important; height: 96px !important; }
          .um-main { padding: 80px 120px 120px !important; max-width: 1800px !important; }
          .um-header h1 { font-size: 48px !important; }
          .um-stat-value { font-size: 46px !important; }
          .um-table th { padding: 20px 28px !important; font-size: 13px !important; }
          .um-table td { padding: 22px 28px !important; font-size: 16px !important; }
          .um-avatar { width: 56px !important; height: 56px !important; font-size: 17px !important; }
          .um-add-btn { padding: 16px 34px !important; font-size: 16px !important; }
        }
      `}</style>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', fontFamily: "'DM Sans', sans-serif", background: c.bg, overflowY: 'auto', zIndex: 9999 }}>

        {/* NAV */}
        <nav className="um-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', height: '68px', background: c.navBg, borderBottom: `1px solid ${c.border}`, position: 'sticky', top: 0, zIndex: 100, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="um-back-btn" onClick={() => navigate("/system-admin")} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: isDark ? '#111827' : '#f5f5f7', border: `1px solid ${c.border}`, borderRadius: '9px', padding: '8px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 500, color: c.textSub, cursor: 'pointer', transition: 'all 0.18s' }}>
              <BackIcon /> Back
            </button>
            <div style={{ width: '1px', height: '22px', background: c.border }} />
            <div className="um-nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
              <div className="um-nav-brand-logo" style={{ width: '33px', height: '33px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff' }}>A</div>
              <span style={{ fontSize: '15px', fontWeight: 600, color: c.text }}>Admin Panel</span>
            </div>
          </div>
          <div className="um-nav-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13.5px', color: c.textMuted }}>
            <span style={{ color: isDark ? '#334155' : '#b0b0c8' }}>Dashboard</span>
            <span style={{ color: isDark ? '#334155' : '#b0b0c8' }}>›</span>
            <strong style={{ color: '#7c3aed', fontWeight: 500 }}>User Management</strong>
          </div>
        </nav>

        <main className="um-main" style={{ maxWidth: '1200px', margin: '0 auto', padding: '52px 48px 80px' }}>
          {/* Header */}
          <div className="um-anim um-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '20px' }}>
            <div className="um-header" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div className="um-header-icon" style={{ width: '62px', height: '62px', borderRadius: '18px', background: isDark ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.08)', border: `1px solid ${isDark ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>👥</div>
              <div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '30px', fontWeight: 700, color: c.text, margin: '0 0 5px', letterSpacing: '-0.02em' }}>User Management</h1>
                <p style={{ fontSize: '14.5px', color: c.textMuted, margin: 0, fontWeight: 300 }}>Manage accounts, assign roles and control access.</p>
              </div>
            </div>
          </div>

          {/* Status banner */}
          <div className="um-status-banner" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: isDark ? (loading ? 'rgba(245,158,11,0.06)' : error ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)') : (loading ? 'rgba(245,158,11,0.07)' : error ? 'rgba(239,68,68,0.07)' : 'rgba(16,185,129,0.07)'), border: `1px solid ${isDark ? (loading ? 'rgba(245,158,11,0.2)' : error ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)') : (loading ? 'rgba(245,158,11,0.25)' : error ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)')}`, borderRadius: '12px', padding: '11px 18px', marginBottom: '24px', fontSize: '13px', color: isDark ? (loading ? '#fbbf24' : error ? '#f87171' : '#34d399') : (loading ? '#92400e' : error ? '#991b1b' : '#065f46') }}>
            {loading ? <>⏳ <strong>Loading users...</strong></> : error ? <>❌ <strong>Error:</strong> {error}</> : <>✅ <strong>Connected to Database</strong></>}
          </div>

          {/* Stats */}
          <div className="um-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px', marginBottom: '28px' }}>
            {[
              { label: 'Total Users', value: stats.total, color: c.text, sub: 'All accounts' },
              { label: 'Active', value: stats.active, color: '#10b981', sub: `${stats.total - stats.active} inactive` },
              { label: 'Admins', value: stats.admins, color: '#7c3aed', sub: 'Full access' },
              { label: 'Users', value: stats.total - stats.admins, color: '#3b82f6', sub: 'Regular accounts' },
            ].map(s => (
              <div className="um-stat-card" key={s.label} style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: '16px', padding: '20px 22px' }}>
                <div className="um-stat-label" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: isDark ? '#334155' : '#b0b0c8', marginBottom: '7px' }}>{s.label}</div>
                <div className="um-stat-value" style={{ fontSize: '30px', fontWeight: 600, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</div>
                <div className="um-stat-sub" style={{ fontSize: '12px', color: c.textMuted, marginTop: '4px', fontWeight: 300 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="um-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
            <input
              className="um-search"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, maxWidth: '360px', padding: '10px 14px', background: c.surface, border: `1.5px solid ${c.border}`, borderRadius: '11px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: c.text, outline: 'none', transition: 'all 0.18s' }}
            />
            <select className="um-filter-select" value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ padding: '10px 36px 10px 13px', background: c.surface, border: `1.5px solid ${c.border}`, borderRadius: '11px', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: c.textSub, outline: 'none', cursor: 'pointer', appearance: 'none' as const, transition: 'border-color 0.18s' }}>
              <option value="all">All Roles</option>
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
            </select>
            <select className="um-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '10px 36px 10px 13px', background: c.surface, border: `1.5px solid ${c.border}`, borderRadius: '11px', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', color: c.textSub, outline: 'none', cursor: 'pointer', appearance: 'none' as const }}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <span className="um-count-text" style={{ fontSize: '13px', color: c.textMuted, marginLeft: 'auto', whiteSpace: 'nowrap' }}>{filtered.length} / {users.length} users</span>
            <button className="um-add-btn" onClick={() => setShowCreateForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'linear-gradient(135deg, #6d28d9, #7c3aed)', border: 'none', borderRadius: '12px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, color: '#fff', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(124,58,237,0.3)', whiteSpace: 'nowrap' }}>➕ Create User</button>
          </div>

          {/* Table */}
          <div className="um-table-container" style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: '20px', overflow: 'hidden', boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.2)' : '0 4px 24px rgba(0,0,0,0.04)' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: c.textMuted }}>⏳ Loading users...</div>
            ) : error ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>❌ {error}</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: c.textMuted }}>No users found</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="um-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                  <thead style={{ background: c.tableHead }}>
                    <tr>
                      {['User', 'Role', 'Status', 'Last Active', 'Created', ''].map(h => (
                        <th key={h} style={{ padding: '13px 20px', textAlign: h === '' ? 'right' : 'left', fontSize: '11px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: isDark ? '#334155' : '#b0b0c8', borderBottom: `1px solid ${c.borderLight}`, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(u => (
                      <tr key={u.user_id} className="um-tr">
                        <td style={{ padding: '14px 20px', fontSize: '14px', color: c.text, borderBottom: `1px solid ${c.borderLight}`, verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                            <div className="um-avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: avatarBg(u.full_name || u.username), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{getInit(u.full_name || u.username)}</div>
                            <div>
                              <div className="um-user-name" style={{ fontWeight: 500, color: c.text, fontSize: '14px' }}>{u.full_name || u.username}</div>
                              <div className="um-user-email" style={{ fontSize: '12px', color: c.textMuted, fontWeight: 300, marginTop: '2px' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', borderBottom: `1px solid ${c.borderLight}`, verticalAlign: 'middle' }}>
                          <span className="um-role-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '20px', textTransform: 'capitalize', background: u.roles[0] === 'admin' ? (isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.1)') : (isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)'), color: u.roles[0] === 'admin' ? '#a78bfa' : '#60a5fa' }}>
                            {u.is_system_admin ? 'System Admin' : (u.roles[0] || 'user')}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', borderBottom: `1px solid ${c.borderLight}`, verticalAlign: 'middle' }}>
                          <span className="um-status-badge" onClick={() => toggleActive(u.user_id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, padding: '5px 12px', borderRadius: '20px', cursor: 'pointer', userSelect: 'none', background: u.is_active ? (isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.1)') : (isDark ? 'rgba(156,163,175,0.1)' : 'rgba(156,163,175,0.12)'), color: u.is_active ? (isDark ? '#34d399' : '#059669') : (isDark ? '#475569' : '#9ca3af'), transition: 'opacity 0.15s' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                            {u.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="um-time-cell" style={{ padding: '14px 20px', fontSize: '13px', color: isDark ? '#475569' : '#6b7280', borderBottom: `1px solid ${c.borderLight}`, verticalAlign: 'middle' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: laDotColor(u.last_login), flexShrink: 0 }} />
                            {fmtLastActive(u.last_login)}
                          </span>
                        </td>
                        <td className="um-date-cell" style={{ padding: '14px 20px', fontSize: '14px', color: isDark ? '#475569' : '#2a2a3e', borderBottom: `1px solid ${c.borderLight}`, verticalAlign: 'middle' }}>
                          {new Date(u.created_at).toLocaleDateString("en-US", {month:"short", day:"numeric", year:"2-digit"})}
                        </td>
                        <td style={{ padding: '14px 20px', borderBottom: `1px solid ${c.borderLight}`, verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                            <button className="um-edit-btn" onClick={() => handleEditUser(u)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', background: isDark ? 'rgba(124,58,237,0.1)' : 'rgba(124,58,237,0.08)', border: `1px solid ${isDark ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.2)'}`, color: '#7c3aed', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}><PencilIcon /> Edit</button>
                            <button className="um-del-btn" onClick={() => handleDeleteUser(u)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', background: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.07)', border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.2)'}`, color: '#ef4444', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}><TrashIcon /> Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* CREATE USER MODAL */}
          {showCreateForm && (
            <div style={overlay} onClick={() => setShowCreateForm(false)}>
              <div style={modal} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '26px' }}>
                  <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 700, color: c.text }}>Create New User</h2>
                  <button onClick={() => setShowCreateForm(false)} disabled={creating} style={{ background: isDark ? '#111827' : '#f5f5f7', border: 'none', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#7c3aed', cursor: 'pointer' }}>✕</button>
                </div>

                {[
                  { label: 'Username *', key: 'username', type: 'text', placeholder: 'john_doe', err: formErrors.username },
                  { label: 'Email *', key: 'email', type: 'email', placeholder: 'john@example.com', err: formErrors.email },
                  { label: 'Full Name', key: 'full_name', type: 'text', placeholder: 'John Doe (optional)', err: '' },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: c.textSub, marginBottom: '8px' }}>{f.label}</label>
                    <input className="um-inp" type={f.type} placeholder={f.placeholder} value={(formData as any)[f.key]} onChange={e => { setFormData({...formData, [f.key]: e.target.value}); if (formErrors[f.key]) setFormErrors({...formErrors, [f.key]: ""}); }} disabled={creating} style={inp} />
                    {f.err && <span style={{ display: 'block', fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{f.err}</span>}
                  </div>
                ))}

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '13.5px', fontWeight: 600, color: c.textSub }}>Password *</label>
                    <button type="button" onClick={() => { const pwd = generateRandomPassword(); setGeneratedPassword(pwd); setFormData({...formData, password: pwd, confirmPassword: pwd}); setFormErrors({...formErrors, password: "", confirmPassword: ""}); }} disabled={creating} style={{ padding: '6px 12px', background: isDark ? 'rgba(124,58,237,0.1)' : '#f0f0f8', border: `1px solid ${isDark ? 'rgba(124,58,237,0.2)' : '#e0e0f0'}`, borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 600, color: '#7c3aed', cursor: 'pointer' }}>🔑 Generate</button>
                  </div>
                  {generatedPassword && (
                    <div style={{ marginBottom: '8px', padding: '12px', background: isDark ? 'rgba(124,58,237,0.05)' : 'rgba(124,58,237,0.05)', borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.1)'}` }}>
                      <div style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 600, marginBottom: '6px' }}>Generated Password:</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace', background: isDark ? '#0d1117' : '#f9f9fc', padding: '10px 12px', borderRadius: '8px' }}>
                        <span style={{ flex: 1, color: c.text, wordBreak: 'break-all' }}>{generatedPassword}</span>
                        <button type="button" onClick={() => { navigator.clipboard.writeText(generatedPassword); showToast("Copied!", "📋"); }} style={{ padding: '6px 12px', background: isDark ? '#1e2d45' : '#f5f5f7', border: `1px solid ${c.border}`, borderRadius: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, color: '#7c3aed', cursor: 'pointer' }}>📋 Copy</button>
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input className="um-inp" type={showPasswordPlain ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={e => { setFormData({...formData, password: e.target.value}); if (formErrors.password) setFormErrors({...formErrors, password: ""}); }} disabled={creating} style={{ ...inp, flex: 1 }} />
                    <button type="button" onClick={() => setShowPasswordPlain(!showPasswordPlain)} disabled={creating} style={{ padding: '10px 14px', background: isDark ? '#111827' : '#f5f5f7', border: `1px solid ${c.border}`, borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 600, color: '#7c3aed', cursor: 'pointer' }}>{showPasswordPlain ? "Hide" : "Show"}</button>
                  </div>
                  {formData.password && <div style={{ fontSize: '12px', marginTop: '7px', padding: '6px 10px', borderRadius: '6px', background: isDark ? 'rgba(124,58,237,0.06)' : 'rgba(124,58,237,0.08)' }}><span style={{ color: validatePasswordStrength(formData.password) ? '#10b981' : '#ef4444' }}>{validatePasswordStrength(formData.password) ? "✓" : "✗"} 8+ chars, 1 uppercase, 1 number, 1 special char (!@#$%^&*)</span></div>}
                  {formErrors.password && <span style={{ display: 'block', fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{formErrors.password}</span>}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: c.textSub, marginBottom: '8px' }}>Confirm Password *</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input className="um-inp" type={showConfirmPasswordPlain ? "text" : "password"} placeholder="••••••••" value={formData.confirmPassword} onChange={e => { setFormData({...formData, confirmPassword: e.target.value}); if (formErrors.confirmPassword) setFormErrors({...formErrors, confirmPassword: ""}); }} disabled={creating} style={{ ...inp, flex: 1 }} />
                    <button type="button" onClick={() => setShowConfirmPasswordPlain(!showConfirmPasswordPlain)} disabled={creating} style={{ padding: '10px 14px', background: isDark ? '#111827' : '#f5f5f7', border: `1px solid ${c.border}`, borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 600, color: '#7c3aed', cursor: 'pointer' }}>{showConfirmPasswordPlain ? "Hide" : "Show"}</button>
                  </div>
                  {formData.password && formData.confirmPassword && <div style={{ fontSize: '12px', marginTop: '7px', padding: '6px 10px', borderRadius: '6px', background: isDark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.08)' }}><span style={{ color: formData.password === formData.confirmPassword ? '#10b981' : '#ef4444' }}>{formData.password === formData.confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}</span></div>}
                  {formErrors.confirmPassword && <span style={{ display: 'block', fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{formErrors.confirmPassword}</span>}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: c.textSub, marginBottom: '8px' }}>Role *</label>
                  <select value={formData.roles[0] || ""} onChange={e => { const role = e.target.value; setFormData({...formData, roles: [role], permissions: getDefaultPermissionsForRole(role, role === "admin" ? formData.is_system_admin : false), is_system_admin: role === "admin" ? formData.is_system_admin : false }); }} disabled={creating} style={{ ...inp, appearance: 'none' as const, cursor: 'pointer' }}>
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>

                {formData.roles[0] === "admin" && (
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={formData.is_system_admin} onChange={e => handleSystemAdminCheck(e.target.checked)} disabled={creating} style={{ width: '18px', height: '18px', accentColor: '#7c3aed', cursor: 'pointer', flexShrink: 0 }} />
                      <span style={{ fontSize: '13.5px', fontWeight: 500, color: c.textSub }}>System Admin</span>
                    </label>
                    <div style={{ fontSize: '12px', color: c.textMuted, marginTop: '6px', marginLeft: '28px' }}>Enable critical system component management</div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '28px' }}>
                  <button onClick={() => setShowCreateForm(false)} disabled={creating} style={{ padding: '11px 24px', background: isDark ? '#111827' : '#f5f5f7', border: `1px solid ${c.border}`, borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 600, color: c.textSub, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleCreateUser} disabled={creating} style={{ padding: '11px 28px', background: 'linear-gradient(135deg, #6d28d9, #7c3aed)', border: 'none', borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 600, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.3)', opacity: creating ? 0.7 : 1 }}>{creating ? "Creating..." : "Create User"}</button>
                </div>
              </div>

              {showAdminConfirmDialog && <ConfirmDialog title="System Admin Access" message="System admin will be able to edit critical system components. Are you sure you want to proceed?" onConfirm={() => confirmAdminAccess(true)} onCancel={() => confirmAdminAccess(false)} />}
            </div>
          )}

          {/* EDIT USER MODAL */}
          {showEditForm && editingUser && (
            <div style={overlay} onClick={() => { setShowEditForm(false); setEditingUser(null); setEditMode("view"); }}>
              <div style={modal} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '26px' }}>
                  <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 700, color: c.text }}>Edit User</h2>
                  <button onClick={() => { setShowEditForm(false); setEditingUser(null); setEditMode("view"); }} disabled={updatingUser} style={{ background: isDark ? '#111827' : '#f5f5f7', border: 'none', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#7c3aed', cursor: 'pointer' }}>✕</button>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: c.textSub, marginBottom: '8px' }}>Username</label>
                  <input type="text" value={editingUser.username} disabled style={{ ...inp, opacity: 0.6, cursor: 'not-allowed' }} />
                  <div style={{ fontSize: '12px', color: c.textMuted, marginTop: '4px' }}>Read-only</div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: c.textSub, marginBottom: '8px' }}>Email</label>
                  <input type="email" value={editingUser.email} disabled style={{ ...inp, opacity: 0.6, cursor: 'not-allowed' }} />
                  <div style={{ fontSize: '12px', color: c.textMuted, marginTop: '4px' }}>Read-only</div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: c.textSub, marginBottom: '8px' }}>Full Name</label>
                  <input className="um-inp" type="text" placeholder="Full name (optional)" value={editFormData.full_name} onChange={e => setEditFormData({...editFormData, full_name: e.target.value})} disabled={updatingUser} style={inp} />
                </div>

                {editMode === "password" && (
                  <>
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label style={{ fontSize: '13.5px', fontWeight: 600, color: c.textSub }}>New Password *</label>
                        <button type="button" onClick={() => { const pwd = generateRandomPassword(); setEditGeneratedPassword(pwd); setEditFormData({...editFormData, password: pwd, confirmPassword: pwd}); }} disabled={updatingUser} style={{ padding: '6px 12px', background: isDark ? 'rgba(124,58,237,0.1)' : '#f0f0f8', border: `1px solid ${isDark ? 'rgba(124,58,237,0.2)' : '#e0e0f0'}`, borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 600, color: '#7c3aed', cursor: 'pointer' }}>🔑 Generate</button>
                      </div>
                      {editGeneratedPassword && (
                        <div style={{ marginBottom: '8px', padding: '12px', background: isDark ? 'rgba(124,58,237,0.05)' : 'rgba(124,58,237,0.05)', borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.1)'}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace', background: isDark ? '#0d1117' : '#f9f9fc', padding: '10px 12px', borderRadius: '8px' }}>
                            <span style={{ flex: 1, color: c.text, wordBreak: 'break-all', fontSize: '13px' }}>{editGeneratedPassword}</span>
                            <button type="button" onClick={() => { navigator.clipboard.writeText(editGeneratedPassword); showToast("Copied!", "📋"); }} style={{ padding: '6px 12px', background: isDark ? '#1e2d45' : '#f5f5f7', border: `1px solid ${c.border}`, borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: '#7c3aed', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>📋 Copy</button>
                          </div>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input className="um-inp" type={editShowPasswordPlain ? "text" : "password"} placeholder="••••••••" value={editFormData.password} onChange={e => { setEditFormData({...editFormData, password: e.target.value}); if (editFormErrors.password) setEditFormErrors({...editFormErrors, password: ""}); }} disabled={updatingUser} style={{ ...inp, flex: 1 }} />
                        <button type="button" onClick={() => setEditShowPasswordPlain(!editShowPasswordPlain)} style={{ padding: '10px 14px', background: isDark ? '#111827' : '#f5f5f7', border: `1px solid ${c.border}`, borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#7c3aed', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{editShowPasswordPlain ? "Hide" : "Show"}</button>
                      </div>
                      {editFormData.password && <div style={{ fontSize: '12px', marginTop: '7px', padding: '6px 10px', borderRadius: '6px', background: isDark ? 'rgba(124,58,237,0.06)' : 'rgba(124,58,237,0.08)' }}><span style={{ color: validatePasswordStrength(editFormData.password) ? '#10b981' : '#ef4444' }}>{validatePasswordStrength(editFormData.password) ? "✓" : "✗"} 8+ chars, 1 uppercase, 1 number, 1 special char</span></div>}
                      {editFormErrors.password && <span style={{ display: 'block', fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{editFormErrors.password}</span>}
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: c.textSub, marginBottom: '8px' }}>Confirm Password *</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input className="um-inp" type={editShowConfirmPasswordPlain ? "text" : "password"} placeholder="••••••••" value={editFormData.confirmPassword} onChange={e => { setEditFormData({...editFormData, confirmPassword: e.target.value}); if (editFormErrors.confirmPassword) setEditFormErrors({...editFormErrors, confirmPassword: ""}); }} disabled={updatingUser} style={{ ...inp, flex: 1 }} />
                        <button type="button" onClick={() => setEditShowConfirmPasswordPlain(!editShowConfirmPasswordPlain)} style={{ padding: '10px 14px', background: isDark ? '#111827' : '#f5f5f7', border: `1px solid ${c.border}`, borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#7c3aed', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{editShowConfirmPasswordPlain ? "Hide" : "Show"}</button>
                      </div>
                      {editFormData.password && editFormData.confirmPassword && <div style={{ fontSize: '12px', marginTop: '7px', padding: '6px 10px', borderRadius: '6px', background: isDark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.08)' }}><span style={{ color: editFormData.password === editFormData.confirmPassword ? '#10b981' : '#ef4444' }}>{editFormData.password === editFormData.confirmPassword ? "✓ Passwords match" : "✗ Do not match"}</span></div>}
                      {editFormErrors.confirmPassword && <span style={{ display: 'block', fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{editFormErrors.confirmPassword}</span>}
                    </div>
                  </>
                )}

                {editMode === "role" && (
                  <>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: c.textSub, marginBottom: '8px' }}>Role</label>
                      <select value={editFormData.roles[0] || ""} onChange={e => setEditFormData({...editFormData, roles: [e.target.value], is_system_admin: e.target.value === "admin" ? editFormData.is_system_admin : false})} disabled={updatingUser} style={{ ...inp, appearance: 'none' as const, cursor: 'pointer' }}>
                        {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                      </select>
                    </div>
                    {editFormData.roles[0] === "admin" && (
                      <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={editFormData.is_system_admin} onChange={e => handleEditSystemAdminCheck(e.target.checked)} disabled={updatingUser} style={{ width: '18px', height: '18px', accentColor: '#7c3aed', cursor: 'pointer' }} />
                          <span style={{ fontSize: '13.5px', fontWeight: 500, color: c.textSub }}>System Admin</span>
                        </label>
                      </div>
                    )}
                  </>
                )}

                {editMode === "view" && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '8px' }}>
                    <button onClick={() => setEditMode("password")} disabled={updatingUser} style={{ padding: '12px', background: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe'}`, borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 600, color: '#3b82f6', cursor: 'pointer' }}>🔐 Change Password</button>
                    <button onClick={() => setEditMode("role")} disabled={updatingUser} style={{ padding: '12px', background: isDark ? 'rgba(16,185,129,0.1)' : '#f0fdf4', border: `1px solid ${isDark ? 'rgba(16,185,129,0.2)' : '#bbf7d0'}`, borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 600, color: '#10b981', cursor: 'pointer' }}>👤 Modify Role</button>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '28px' }}>
                  <button onClick={() => { setShowEditForm(false); setEditingUser(null); setEditMode("view"); }} disabled={updatingUser} style={{ padding: '11px 24px', background: isDark ? '#111827' : '#f5f5f7', border: `1px solid ${c.border}`, borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 600, color: c.textSub, cursor: 'pointer' }}>{editMode === "view" ? "Close" : "Cancel"}</button>
                  {editMode === "view" && editFormData.full_name !== (editingUser?.full_name || "") && (
                    <button onClick={handleUpdateUser} disabled={updatingUser} style={{ padding: '11px 28px', background: 'linear-gradient(135deg, #d97706, #f59e0b)', border: 'none', borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>💾 Save Changes</button>
                  )}
                  {editMode !== "view" && <button onClick={handleUpdateUser} disabled={updatingUser} style={{ padding: '11px 28px', background: 'linear-gradient(135deg, #6d28d9, #7c3aed)', border: 'none', borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 600, color: '#fff', cursor: 'pointer', opacity: updatingUser ? 0.7 : 1 }}>{updatingUser ? "Updating..." : "Save Changes"}</button>}
                </div>

                {editShowAdminConfirmDialog && <ConfirmDialog title="System Admin Access" message="System admin will be able to edit critical system components. Proceed?" onConfirm={() => confirmEditAdminAccess(true)} onCancel={() => confirmEditAdminAccess(false)} />}
              </div>
            </div>
          )}

          {editSystemAdminWarning && <ConfirmDialog title="System Admin Account" message="You are about to edit a system admin's account. This is a critical account. Are you sure you want to proceed?" onConfirm={() => confirmEditSystemAdmin(true)} onCancel={() => confirmEditSystemAdmin(false)} />}
          {deleteSystemAdminWarning && <ConfirmDialog title="System Admin Account" message="You are about to delete a system admin's account. This is a critical action. Are you sure you want to proceed?" onConfirm={() => confirmDeleteSystemAdmin(true)} onCancel={() => confirmDeleteSystemAdmin(false)} />}

          {/* DELETE USER MODAL */}
          {showDeleteForm && deletingUser && (
            <div style={overlay} onClick={() => !deletingInProgress && setShowDeleteForm(false)}>
              <div style={modal} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '26px' }}>
                  <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 700, color: c.text }}>Delete User</h2>
                  <button onClick={() => !deletingInProgress && setShowDeleteForm(false)} disabled={deletingInProgress} style={{ background: isDark ? '#111827' : '#f5f5f7', border: 'none', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                </div>

                <div style={{ background: isDark ? 'rgba(245,158,11,0.08)' : '#fff3cd', border: `1px solid ${isDark ? 'rgba(245,158,11,0.2)' : '#ffe69c'}`, borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', fontSize: '13px', color: isDark ? '#fbbf24' : '#856404' }}>
                  <strong>Warning:</strong> This action cannot be undone.
                </div>

                {deleteError && <div style={{ background: isDark ? 'rgba(239,68,68,0.08)' : '#fee', border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#fcc'}`, borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', fontSize: '13px', color: '#ef4444' }}><strong>Error:</strong> {deleteError}</div>}

                <div style={{ background: isDark ? '#111827' : '#f5f5f7', borderRadius: '12px', padding: '18px', marginBottom: '24px' }}>
                  {[['Username', deletingUser.username], ['Email', deletingUser.email], ['Role', deletingUser.is_system_admin ? "System Admin" : deletingUser.roles[0] || "User"], ['Last Active', fmtLastActive(deletingUser.last_login)]].map(([label, val]) => (
                    <div key={label} style={{ marginBottom: '14px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: isDark ? '#334155' : '#b0b0c8', marginBottom: '4px' }}>{label}</div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: c.text }}>{val}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#ef4444', marginBottom: '8px' }}><strong>Type the username to confirm deletion</strong></label>
                  <input className="um-inp" type="text" placeholder={`Type "${deletingUser.username}" to confirm`} value={deleteUsernameConfirm} onChange={e => setDeleteUsernameConfirm(e.target.value)} disabled={deletingInProgress} style={inp} />
                  {deleteUsernameConfirm && deleteUsernameConfirm !== deletingUser.username && <span style={{ display: 'block', fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>Username does not match</span>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                  <button onClick={() => !deletingInProgress && setShowDeleteForm(false)} disabled={deletingInProgress} style={{ padding: '11px 24px', background: isDark ? '#111827' : '#f5f5f7', border: `1px solid ${c.border}`, borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 600, color: c.textSub, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleConfirmDelete} disabled={deleteUsernameConfirm !== deletingUser.username || deletingInProgress} style={{ padding: '11px 28px', background: deleteUsernameConfirm === deletingUser.username ? '#ef4444' : (isDark ? '#1e2d45' : '#c0c0d0'), border: 'none', borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 600, color: '#fff', cursor: 'pointer', opacity: deleteUsernameConfirm === deletingUser.username ? 1 : 0.6 }}>{deletingInProgress ? "Deleting..." : "Delete User"}</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {toast && <div style={{ position: 'fixed', bottom: '32px', right: '32px', background: isDark ? '#1a2234' : '#1a1a2e', color: '#fff', borderRadius: '13px', padding: '14px 22px', fontSize: '13.5px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', zIndex: 10002, border: isDark ? `1px solid ${c.border}` : 'none' }}>
        <span>{toast.icon}</span>{toast.msg}
      </div>}
    </>
  );
};

export default AdminUserManagement;