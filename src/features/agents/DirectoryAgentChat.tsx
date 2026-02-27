import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaArrowLeft, FaPlus, FaSearch, FaEdit, FaTrash, FaKey,
  FaFileImport, FaChevronDown, FaCheck, FaTimes, FaUser,
  FaEnvelope, FaPhone, FaIdBadge, FaExclamationTriangle
} from 'react-icons/fa';
import { IoMicOutline, IoAttachOutline, IoPaperPlaneOutline, IoGridOutline } from 'react-icons/io5';
import { HiSparkles } from 'react-icons/hi2';
import api from '../../utils/api';

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════════════ */
interface LocationState {
  integrationId?: string;
  agentTypeId?: string;
  agentName?: string;
  agentId?: string;
}

interface DirectoryUser {
  dn: string;
  cn?: string;
  sn?: string;
  givenName?: string;
  mail?: string;
  telephoneNumber?: string;
  uid?: string;
  [attr: string]: string | string[] | undefined;
}

type MessageSender = 'user' | 'ai' | 'system';
type MessageType   = 'text' | 'confirm' | 'form' | 'result' | 'error';

interface ChatMessage {
  id: number;
  sender: MessageSender;
  type: MessageType;
  text?: string;
  html?: string;
  timestamp: Date;
  confirmContext?: 'create_form_prompt' | 'delete_confirm' | 'reset_confirm';
  confirmPayload?: any;
  confirmAnswered?: boolean;
  formFields?: FormField[];
  formSubmitted?: boolean;
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'password' | 'select';
  placeholder: string;
  required: boolean;
  options?: string[];
  value: string;
}

interface Stats {
  totalUsers: number;
  totalOU: number;
  usersCreated: number;
  usersDeleted: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════════ */
const NOW = () => new Date();
const uid = () => Date.now() + Math.random();

const DUMMY_USER = {
  uid: 'user_' + Math.floor(Math.random() * 9000 + 1000),
  givenName: 'Demo',
  sn: 'User',
  mail: 'demo.user@example.com',
  telephoneNumber: '+1 555 000 1234',
  userPassword: 'P@ssw0rd!',
};

const INITIAL_FORM_FIELDS = (): FormField[] => [
  { name: 'uid',             label: 'UID (username)',  type: 'text',     placeholder: 'e.g. jsmith',             required: true,  value: '' },
  { name: 'givenName',       label: 'First Name',      type: 'text',     placeholder: 'e.g. John',               required: true,  value: '' },
  { name: 'sn',              label: 'Last Name',        type: 'text',     placeholder: 'e.g. Smith',              required: true,  value: '' },
  { name: 'mail',            label: 'Email',            type: 'email',    placeholder: 'john@example.com',        required: false, value: '' },
  { name: 'telephoneNumber', label: 'Phone',            type: 'tel',      placeholder: '+1 555 000 0000',         required: false, value: '' },
  { name: 'userPassword',    label: 'Password',         type: 'password', placeholder: 'Set initial password',    required: true,  value: '' },
  { name: 'baseDN',          label: 'Container DN',     type: 'text',     placeholder: 'ou=people,dc=example,dc=com', required: true, value: '' },
];

const detectIntent = (msg: string): 'create' | 'delete' | 'update' | 'reset' | 'search' | 'list' | 'other' => {
  const m = msg.toLowerCase();
  if (/create|add|new\s+user|make\s+user/.test(m))  return 'create';
  if (/delete|remove/.test(m))                        return 'delete';
  if (/update|edit|modify|change/.test(m))            return 'update';
  if (/reset.*pass|pass.*reset/.test(m))              return 'reset';
  if (/search|find|look/.test(m))                     return 'search';
  if (/list|show|display|all\s+user/.test(m))         return 'list';
  return 'other';
};

/* ═══════════════════════════════════════════════════════════════════════════
   STAT CARD
═══════════════════════════════════════════════════════════════════════════ */
const StatCard: React.FC<{ label: string; value: number | string; }> = ({ label, value }) => (
  <div className="bg-[#f0f0f8] dark:bg-[#111827] rounded-xl p-4 2xl:p-5 flex flex-col gap-1">
    <span className="text-xs 2xl:text-sm text-gray-500 dark:text-slate-400 font-medium">{label}</span>
    <span className="text-2xl 2xl:text-3xl font-bold text-gray-800 dark:text-white">{value}</span>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const DirectoryAgentChat: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const state     = location.state as LocationState | undefined;
  const targetId  = state?.integrationId;
  const agentName = state?.agentName || 'Directory Agent';

  const [dashboardOpen, setDashboardOpen] = useState(true);

  const [messages,    setMessages]    = useState<ChatMessage[]>([]);
  const [inputValue,  setInputValue]  = useState('');
  const [aiTyping,    setAiTyping]    = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [users,          setUsers]          = useState<DirectoryUser[]>([]);
  const [loadingUsers,   setLoadingUsers]   = useState(false);
  const [stats,          setStats]          = useState<Stats>({ totalUsers: 0, totalOU: 0, usersCreated: 0, usersDeleted: 0 });
  const [searchTerm,     setSearchTerm]     = useState('');
  const [searchBy,       setSearchBy]       = useState('UID');
  const [parentOU,       setParentOU]       = useState('Ou=Employees, dc=Company, dc=com');
  const [baseDN,         setBaseDN]         = useState('dc=example,dc=com');
  const [selectedRows,   setSelectedRows]   = useState<Set<string>>(new Set());
  const [showErrorLogs,  setShowErrorLogs]  = useState(false);
  const [errorLogs,      setErrorLogs]      = useState<string[]>([]);

  const [editUser,  setEditUser]  = useState<DirectoryUser | null>(null);
  const [editForm,  setEditForm]  = useState<Record<string, string>>({});

  const [showImport, setShowImport] = useState(false);

  /* ═══ FETCH USERS ═══════════════════════════════════════════════════════ */
  const fetchUsers = useCallback(async (filter?: string) => {
    if (!targetId) {
      pushAI('⚠️ No PingDirectory target system connected. Please go back and select a connected target.', 'error');
      return;
    }
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams({ target_id: targetId, base_dn: baseDN });
      if (filter) params.set('filter', filter);
      const res = await api.fetchWithAuth(`/api/v1/directory/users?${params}`);
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      const list: DirectoryUser[] = data.users || data.entries || [];
      setUsers(list);
      setStats(prev => ({ ...prev, totalUsers: list.length }));
    } catch (err: any) {
      logError('Fetch users: ' + err.message);
    } finally {
      setLoadingUsers(false);
    }
  }, [targetId, baseDN]);

  useEffect(() => {
    fetchUsers();
    pushAI(
      `👋 Hi! I'm your **${agentName}**. I can help you manage directory users via chat.\n\nTry saying:\n• "Create a new user"\n• "Delete user jsmith"\n• "Search for john"\n• "Reset password for uid=jdoe"\n• "List all users"`,
      'text'
    );
  }, []); // eslint-disable-line

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, aiTyping]);

  /* ═══ MESSAGE HELPERS ═════════════════════════════════════════════════ */
  const pushMsg = (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, { ...msg, id: uid(), timestamp: NOW() }]);
  };

  const pushAI = (text: string, type: MessageType = 'text') => {
    pushMsg({ sender: 'ai', type, text });
  };

  const pushUser = (text: string) => {
    pushMsg({ sender: 'user', type: 'text', text });
  };

  const answerConfirm = (msgId: number) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, confirmAnswered: true } : m));
  };

  const markFormSubmitted = (msgId: number) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, formSubmitted: true } : m));
  };

  const updateFormField = (msgId: number, fieldName: string, value: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId || !m.formFields) return m;
      return { ...m, formFields: m.formFields.map(f => f.name === fieldName ? { ...f, value } : f) };
    }));
  };

  /* ═══ ERROR LOGS ══════════════════════════════════════════════════════ */
  const logError = (msg: string) => {
    setErrorLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);
  };

  /* ═══ DIRECTORY OPERATIONS ════════════════════════════════════════════ */
  const createUser = async (fields: Record<string, string>, useDummy = false) => {
    const data = useDummy ? DUMMY_USER : fields;
    if (!targetId) { pushAI('No target system connected.', 'error'); return; }
    setAiTyping(true);
    try {
      const res = await api.fetchWithAuth('/api/v1/directory/users', {
        method: 'POST',
        body: JSON.stringify({
          target_id: targetId,
          base_dn: data.baseDN || baseDN,
          attributes: {
            uid: data.uid, cn: `${data.givenName} ${data.sn}`.trim(),
            givenName: data.givenName, sn: data.sn,
            mail: data.mail, telephoneNumber: data.telephoneNumber,
            userPassword: data.userPassword,
            objectClass: ['top', 'person', 'organizationalPerson', 'inetOrgPerson'],
          }
        })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || res.statusText); }
      pushAI(`✅ User **${data.givenName} ${data.sn}** (uid: \`${data.uid}\`) created successfully!`, 'result');
      setStats(prev => ({ ...prev, usersCreated: prev.usersCreated + 1 }));
      await fetchUsers();
    } catch (err: any) {
      pushAI(`❌ Failed to create user: ${err.message}`, 'error');
      logError('Create: ' + err.message);
    } finally {
      setAiTyping(false);
    }
  };

  const deleteUser = async (dn: string, displayName: string) => {
    if (!targetId) return;
    setAiTyping(true);
    try {
      const res = await api.fetchWithAuth(`/api/v1/directory/users/${encodeURIComponent(dn)}?target_id=${targetId}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || res.statusText); }
      pushAI(`✅ User **${displayName}** deleted from the directory.`, 'result');
      setStats(prev => ({ ...prev, usersDeleted: prev.usersDeleted + 1 }));
      await fetchUsers();
    } catch (err: any) {
      pushAI(`❌ Failed to delete: ${err.message}`, 'error');
      logError('Delete: ' + err.message);
    } finally {
      setAiTyping(false);
    }
  };

  const resetPassword = async (dn: string, uid: string) => {
    const newPass = 'Reset@' + Math.random().toString(36).slice(-6).toUpperCase();
    if (!targetId) return;
    setAiTyping(true);
    try {
      const res = await api.fetchWithAuth(`/api/v1/directory/users/${encodeURIComponent(dn)}`, {
        method: 'PATCH',
        body: JSON.stringify({ target_id: targetId, modifications: { userPassword: newPass } })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || res.statusText); }
      pushAI(`🔑 Password reset for **${uid}**. Temporary password: \`${newPass}\`\n\n_Please share this securely with the user._`, 'result');
    } catch (err: any) {
      pushAI(`❌ Password reset failed: ${err.message}`, 'error');
      logError('Reset: ' + err.message);
    } finally {
      setAiTyping(false);
    }
  };

  const updateUser = async (dn: string, modifications: Record<string, string>) => {
    if (!targetId) return;
    setAiTyping(true);
    try {
      const res = await api.fetchWithAuth(`/api/v1/directory/users/${encodeURIComponent(dn)}`, {
        method: 'PATCH',
        body: JSON.stringify({ target_id: targetId, modifications })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || res.statusText); }
      pushAI(`✅ User updated successfully.`, 'result');
      await fetchUsers();
    } catch (err: any) {
      pushAI(`❌ Update failed: ${err.message}`, 'error');
      logError('Update: ' + err.message);
    } finally {
      setAiTyping(false);
    }
  };

  const searchUsers = async (term: string, by: string = 'uid') => {
    if (!targetId) return;
    setLoadingUsers(true);
    try {
      const attr = by === 'UID' ? 'uid' : by === 'Email' ? 'mail' : 'cn';
      const filter = `(${attr}=*${term}*)`;
      await fetchUsers(filter);
      pushAI(`🔍 Search complete — found ${users.length} result(s) for "${term}". Check the dashboard panel.`, 'result');
    } finally {
      setLoadingUsers(false);
    }
  };

  /* ═══ INLINE FORM SUBMIT ══════════════════════════════════════════════ */
  const handleInlineFormSubmit = async (msgId: number, fields: FormField[]) => {
    const data: Record<string, string> = {};
    fields.forEach(f => { data[f.name] = f.value; });
    markFormSubmitted(msgId);
    pushAI('📋 Form received! Creating user now…', 'text');
    await createUser(data, false);
  };

  /* ═══ MAIN CHAT SEND ══════════════════════════════════════════════════ */
  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text) return;
    pushUser(text);
    setInputValue('');
    setAiTyping(true);

    const intent = detectIntent(text);

    await new Promise(r => setTimeout(r, 600));
    setAiTyping(false);

    if (intent === 'create') {
      pushMsg({
        sender: 'ai',
        type: 'confirm',
        text: '👤 I can create a new directory user for you.\n\nWould you like to **fill in the details yourself**, or should I use **dummy data** to create a test user?',
        confirmContext: 'create_form_prompt',
        confirmAnswered: false,
      });

    } else if (intent === 'delete') {
      const match = text.match(/(?:delete|remove)\s+(?:user\s+)?([a-z0-9._-]+)/i);
      const uidStr = match ? match[1] : null;
      const found  = uidStr ? users.find(u => (u.uid as string)?.toLowerCase() === uidStr.toLowerCase()) : null;

      if (!found) {
        pushAI(uidStr
          ? `I couldn't find a user with uid \`${uidStr}\` in the directory. Check the dashboard or try "search for ${uidStr}" first.`
          : `Which user would you like to delete? Please specify a UID, e.g. "delete user jsmith".`
        );
      } else {
        const displayName = found.cn as string || `${found.givenName || ''} ${found.sn || ''}`.trim() || uidStr!;
        pushMsg({
          sender: 'ai', type: 'confirm',
          text: `⚠️ Are you sure you want to **permanently delete** user **${displayName}** (\`${found.dn}\`)?\n\nThis cannot be undone.`,
          confirmContext: 'delete_confirm',
          confirmPayload: { dn: found.dn, displayName },
          confirmAnswered: false,
        });
      }

    } else if (intent === 'reset') {
      const match = text.match(/(?:reset.*?(?:for|of|password))[\s:]+([a-z0-9._=-]+)/i) ||
                    text.match(/uid=([a-z0-9._-]+)/i) ||
                    text.match(/(?:for|of)\s+([a-z0-9._-]+)/i);
      const uidStr = match ? match[1].replace(/^uid=/, '') : null;
      const found  = uidStr ? users.find(u => (u.uid as string)?.toLowerCase() === uidStr.toLowerCase()) : null;

      if (!found) {
        pushAI(uidStr
          ? `User \`${uidStr}\` not found. Try listing users first.`
          : 'Which user? e.g. "reset password for jsmith"'
        );
      } else {
        pushMsg({
          sender: 'ai', type: 'confirm',
          text: `🔑 Reset password for **${found.uid}**? A temporary password will be generated and shown here.`,
          confirmContext: 'reset_confirm',
          confirmPayload: { dn: found.dn, uid: found.uid },
          confirmAnswered: false,
        });
      }

    } else if (intent === 'search') {
      const match = text.match(/(?:search|find|look)\s+(?:for\s+)?(.+)/i);
      const term  = match ? match[1].trim() : text;
      pushAI(`🔍 Searching for "${term}" in the directory…`);
      await searchUsers(term, searchBy);

    } else if (intent === 'list') {
      pushAI('📋 Refreshing the user list from the directory…');
      await fetchUsers();
      pushAI(`Found **${users.length}** user(s). The dashboard panel on the right has been updated.`, 'result');

    } else {
      try {
        const res = await api.fetchWithAuth('/api/v1/chat', {
          method: 'POST',
          body: JSON.stringify({
            session_id: 'dir-' + (state?.agentId || 'default'),
            agent_type: 'directory', message: text,
            context: { users_count: users.length, base_dn: baseDN }
          })
        });
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        pushAI(data.message || 'I\'m not sure how to handle that. Try asking me to create, search, update or delete a user.');
      } catch {
        pushAI('I can help with: **create user**, **search**, **delete**, **update**, or **reset password**. Try one of those!');
      }
    }
  }, [inputValue, users, baseDN, searchBy, state]);

  /* ═══ CONFIRM BUTTON HANDLERS ═════════════════════════════════════════ */
  const handleConfirmYes = async (msg: ChatMessage) => {
    answerConfirm(msg.id);

    if (msg.confirmContext === 'create_form_prompt') {
      pushUser('Yes, I want to fill in the details.');
      pushMsg({
        sender: 'ai', type: 'form',
        text: '📝 Please fill in the user details below:',
        formFields: INITIAL_FORM_FIELDS(),
        formSubmitted: false,
      });

    } else if (msg.confirmContext === 'delete_confirm') {
      pushUser('Yes, delete the user.');
      const { dn, displayName } = msg.confirmPayload;
      await deleteUser(dn, displayName);

    } else if (msg.confirmContext === 'reset_confirm') {
      pushUser('Yes, reset the password.');
      const { dn, uid } = msg.confirmPayload;
      await resetPassword(dn, uid);
    }
  };

  const handleConfirmNo = async (msg: ChatMessage) => {
    answerConfirm(msg.id);

    if (msg.confirmContext === 'create_form_prompt') {
      pushUser('No, use dummy data.');
      pushAI('🤖 No worries! I\'ll create a test user with dummy data…');
      await createUser({}, true);

    } else if (msg.confirmContext === 'delete_confirm') {
      pushUser('No, cancel.');
      pushAI('👍 Deletion cancelled. No changes were made.');

    } else if (msg.confirmContext === 'reset_confirm') {
      pushUser('No, cancel.');
      pushAI('👍 Password reset cancelled.');
    }
  };

  /* ═══ DASHBOARD ACTIONS ═══════════════════════════════════════════════ */
  const handleDashboardSearch = () => {
    if (!searchTerm.trim()) { fetchUsers(); return; }
    const attr = searchBy === 'UID' ? 'uid' : searchBy === 'Email' ? 'mail' : 'cn';
    fetchUsers(`(${attr}=*${searchTerm.trim()}*)`);
  };

  const handleDashboardDelete = async (user: DirectoryUser) => {
    const name = (user.cn as string) || (user.uid as string) || user.dn;
    if (!window.confirm(`Delete user "${name}"?`)) return;
    pushAI(`🗑️ Deleting user **${name}** via dashboard…`);
    await deleteUser(user.dn, name);
  };

  const handleDashboardPassReset = async (user: DirectoryUser) => {
    const uidStr = user.uid as string || user.dn;
    pushAI(`🔑 Password reset for **${uidStr}** triggered from dashboard…`);
    await resetPassword(user.dn, uidStr);
  };

  const openEditModal = (user: DirectoryUser) => {
    setEditUser(user);
    setEditForm({
      cn: (user.cn as string) || '',
      givenName: (user.givenName as string) || '',
      sn: (user.sn as string) || '',
      mail: (user.mail as string) || '',
      telephoneNumber: (user.telephoneNumber as string) || '',
    });
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    pushAI(`✏️ Updating user **${editUser.uid || editUser.cn}** from dashboard…`);
    await updateUser(editUser.dn, editForm);
    setEditUser(null);
  };

  const toggleSelectRow = (dn: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      next.has(dn) ? next.delete(dn) : next.add(dn);
      return next;
    });
  };

  const displayName = (u: DirectoryUser) =>
    (u.cn as string) || `${u.givenName || ''} ${u.sn || ''}`.trim() || (u.uid as string) || u.dn.split(',')[0];

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        .dac-root {
          font-family: 'Outfit', sans-serif;
          background: #f5f5f8;
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .dark .dac-root {
          background: #0d1117;
        }

        /* ── TOPBAR ── */
        .dac-topbar {
          background: #ffffff;
          border-bottom: 1px solid #e8e8ef;
          padding: 0 16px;
          height: 50px;
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
          z-index: 30;
        }
        .dark .dac-topbar {
          background: #1a2234;
          border-bottom-color: #1e2d45;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
        .dac-topbar-left  { display: flex; align-items: center; gap: 12px; }
        .dac-topbar-right { display: flex; align-items: center; gap: 8px; }

        .dac-back {
          display: flex; align-items: center; gap: 7px;
          background: none; border: none; cursor: pointer;
          color: #9ca3af; font-size: 12px; font-weight: 500;
          padding: 5px 8px; border-radius: 8px;
          transition: all .15s; font-family: inherit;
        }
        .dac-back:hover { color: #374151; background: #f3f4f6; }
        .dark .dac-back:hover { color: #e2e8f0; background: #1e2d45; }

        .dac-agent-pill {
          display: flex; align-items: center; gap: 8px;
          background: #f0f0fb; border: 1px solid #d8d8f0;
          border-radius: 10px; padding: 5px 10px;
        }
        .dark .dac-agent-pill {
          background: #111827;
          border-color: #1e2d45;
        }
        .dac-agent-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 3px rgba(34,197,94,.2);
          animation: dac-pulse 2s infinite;
        }
        @keyframes dac-pulse {
          0%,100% { box-shadow: 0 0 0 3px rgba(34,197,94,.2); }
          50%      { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }
        .dac-agent-name { font-size: 12px; font-weight: 600; color: #3730a3; }
        .dark .dac-agent-name { color: #818cf8; }

        .dac-topbtn {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 9px;
          font-size: 12px; font-weight: 500; cursor: pointer;
          font-family: inherit; transition: all .15s;
          border: 1px solid transparent;
        }
        .dac-btn-dash {
          background: #ede9fe; border-color: #c4b5fd; color: #5b21b6;
        }
        .dac-btn-dash:hover { background: #ddd6fe; }
        .dac-btn-dash.active { background: #7c3aed; color: #fff; border-color: #7c3aed; }
        .dark .dac-btn-dash {
          background: #1e1b4b; border-color: #3730a3; color: #a78bfa;
        }
        .dark .dac-btn-dash:hover { background: #2d2a6e; }
        .dark .dac-btn-dash.active { background: #7c3aed; color: #fff; border-color: #7c3aed; }

        /* ── BODY SPLIT ── */
        .dac-body {
          flex: 1; display: flex; overflow: hidden;
        }

        /* ── CHAT PANEL ── */
        .dac-chat {
          display: flex; flex-direction: column;
          flex: 1; min-width: 0;
          background: #f5f5f8;
          transition: all .3s ease;
        }
        .dark .dac-chat {
          background: #0d1117;
        }

        .dac-msgs {
          flex: 1; overflow-y: auto;
          padding: 16px 20px;
          display: flex; flex-direction: column; gap: 12px;
          scrollbar-width: thin; scrollbar-color: #e5e7eb transparent;
        }
        .dark .dac-msgs {
          scrollbar-color: #1e2d45 transparent;
        }
        .dac-msgs::-webkit-scrollbar { width: 4px; }
        .dac-msgs::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }
        .dark .dac-msgs::-webkit-scrollbar-thumb { background: #1e2d45; }

        /* ── MSG ROWS ── */
        .dac-row { display: flex; align-items: flex-end; gap: 10px; animation: dac-in .2s ease; }
        .dac-row.user   { justify-content: flex-end; }
        .dac-row.ai,
        .dac-row.system { justify-content: flex-start; }
        @keyframes dac-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .dac-avatar {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #6d28d9, #4f46e5);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; color: #fff; font-weight: 700;
        }

        /* ── BUBBLES ── */
        .dac-bubble {
          max-width: 70%; padding: 10px 14px; border-radius: 18px;
          font-size: 13px; line-height: 1.6; word-break: break-word;
        }
        .dac-bubble.user {
          background: linear-gradient(135deg, #4f46e5, #6d28d9);
          color: #fff; border-bottom-right-radius: 5px;
          box-shadow: 0 4px 12px rgba(79,70,229,.3);
        }
        .dac-bubble.ai {
          background: #fff; color: #1f2937;
          border: 1px solid #e8e8ef; border-bottom-left-radius: 5px;
          box-shadow: 0 2px 8px rgba(0,0,0,.05);
          white-space: pre-line;
        }
        .dark .dac-bubble.ai {
          background: #1a2234;
          color: #e2e8f0;
          border-color: #1e2d45;
          box-shadow: 0 2px 8px rgba(0,0,0,.2);
        }
        .dac-bubble.error {
          background: #fff5f5; border-color: #fecaca; color: #b91c1c;
        }
        .dark .dac-bubble.error {
          background: #3b0a0a; border-color: #7f1d1d; color: #fca5a5;
        }
        .dac-bubble.result {
          background: #f0fdf4; border-color: #bbf7d0; color: #166534;
          white-space: pre-line;
        }
        .dark .dac-bubble.result {
          background: #052e16; border-color: #166534; color: #86efac;
        }

        /* ── CONFIRM CARD ── */
        .dac-confirm {
          background: #fff; border: 1.5px solid #e0e7ff;
          border-radius: 16px; padding: 14px 16px;
          max-width: 70%;
          box-shadow: 0 2px 12px rgba(79,70,229,.08);
        }
        .dark .dac-confirm {
          background: #1a2234;
          border-color: #1e2d45;
          box-shadow: 0 2px 12px rgba(0,0,0,.3);
        }
        .dac-confirm-text {
          font-size: 13px; color: #374151; line-height: 1.6;
          white-space: pre-line; margin-bottom: 12px;
        }
        .dark .dac-confirm-text { color: #e2e8f0; }
        .dac-confirm-btns { display: flex; gap: 8px; }
        .dac-yes {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 16px; border-radius: 9px;
          background: #4f46e5; color: #fff;
          font-size: 12px; font-weight: 600; cursor: pointer;
          border: none; font-family: inherit; transition: .15s;
        }
        .dac-yes:hover { background: #4338ca; }
        .dac-no {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 16px; border-radius: 9px;
          background: #fff; color: #6b7280;
          font-size: 12px; font-weight: 600; cursor: pointer;
          border: 1.5px solid #e5e7eb; font-family: inherit; transition: .15s;
        }
        .dac-no:hover { border-color: #d1d5db; color: #374151; }
        .dark .dac-no {
          background: #111827; color: #9ca3af; border-color: #1e2d45;
        }
        .dark .dac-no:hover { border-color: #374151; color: #e2e8f0; }
        .dac-answered { opacity: .45; pointer-events: none; }

        /* ── INLINE FORM ── */
        .dac-form-card {
          background: #fff; border: 1.5px solid #d8d8f0;
          border-radius: 16px; padding: 16px;
          max-width: 80%;
          box-shadow: 0 2px 14px rgba(79,70,229,.08);
        }
        .dark .dac-form-card {
          background: #1a2234;
          border-color: #1e2d45;
          box-shadow: 0 2px 14px rgba(0,0,0,.3);
        }
        .dac-form-title {
          font-size: 12px; font-weight: 700; color: #3730a3;
          margin-bottom: 12px; display: flex; align-items: center; gap: 7px;
        }
        .dark .dac-form-title { color: #818cf8; }
        .dac-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
        .dac-form-grid .full { grid-column: 1 / -1; }
        .dac-form-label { font-size: 10px; font-weight: 600; color: #6b7280; margin-bottom: 4px; text-transform: uppercase; letter-spacing: .04em; }
        .dark .dac-form-label { color: #94a3b8; }
        .dac-form-input {
          width: 100%; padding: 7px 10px; font-size: 12px;
          border: 1.5px solid #e5e7eb; border-radius: 9px;
          background: #fafafa; font-family: inherit;
          transition: border-color .15s; outline: none; box-sizing: border-box;
        }
        .dac-form-input:focus { border-color: #6d28d9; background: #fff; }
        .dark .dac-form-input {
          background: #111827; border-color: #1e2d45; color: #e2e8f0;
        }
        .dark .dac-form-input:focus { border-color: #7c3aed; background: #0d1117; }
        .dac-form-submit {
          margin-top: 12px; width: 100%;
          padding: 9px; border-radius: 10px;
          background: linear-gradient(135deg, #4f46e5, #6d28d9);
          color: #fff; font-size: 12px; font-weight: 700;
          border: none; cursor: pointer; font-family: inherit;
          transition: opacity .15s;
        }
        .dac-form-submit:hover { opacity: .9; }
        .dac-form-submitted { opacity: .4; pointer-events: none; }

        /* ── TYPING ── */
        .dac-typing {
          background: #fff; border: 1px solid #e8e8ef;
          border-radius: 18px; border-bottom-left-radius: 5px;
          padding: 12px 14px; display: flex; gap: 5px; align-items: center;
          box-shadow: 0 2px 8px rgba(0,0,0,.05);
        }
        .dark .dac-typing {
          background: #1a2234;
          border-color: #1e2d45;
          box-shadow: 0 2px 8px rgba(0,0,0,.2);
        }
        .dac-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #c4b5fd;
          animation: dac-bounce 1.2s ease-in-out infinite;
        }
        .dac-dot:nth-child(2) { animation-delay: .18s; background: #a78bfa; }
        .dac-dot:nth-child(3) { animation-delay: .36s; background: #7c3aed; }
        @keyframes dac-bounce {
          0%,60%,100% { transform: translateY(0); }
          30%          { transform: translateY(-6px); }
        }

        /* ── TIMESTAMP ── */
        .dac-ts { font-size: 10px; color: #d1d5db; margin-top: 2px; }
        .dark .dac-ts { color: #4b5563; }
        .dac-ts.user   { text-align: right; }
        .dac-ts.ai, .dac-ts.system { padding-left: 38px; }

        /* ── INPUT ZONE ── */
        .dac-inputzone {
          background: #fff; border-top: 1px solid #e8e8ef;
          padding: 10px 16px 14px;
          box-shadow: 0 -2px 10px rgba(0,0,0,.04);
        }
        .dark .dac-inputzone {
          background: #1a2234;
          border-top-color: #1e2d45;
          box-shadow: 0 -2px 10px rgba(0,0,0,.2);
        }
        .dac-inputrow {
          display: flex; align-items: center; gap: 8px;
          background: #f8f8fb; border: 1.5px solid #e5e7eb;
          border-radius: 14px; padding: 7px 10px;
          transition: border-color .2s, box-shadow .2s;
        }
        .dac-inputrow:focus-within {
          border-color: #a78bfa;
          box-shadow: 0 0 0 3px rgba(109,40,217,.08);
          background: #fff;
        }
        .dark .dac-inputrow {
          background: #111827;
          border-color: #1e2d45;
        }
        .dark .dac-inputrow:focus-within {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124,58,237,.15);
          background: #0d1117;
        }
        .dac-icon-btn {
          background: none; border: none; color: #d1d5db;
          cursor: pointer; padding: 4px; border-radius: 7px;
          font-size: 17px; display: flex; align-items: center;
          transition: color .15s, background .15s;
        }
        .dac-icon-btn:hover { color: #9ca3af; background: #f3f4f6; }
        .dark .dac-icon-btn { color: #4b5563; }
        .dark .dac-icon-btn:hover { color: #9ca3af; background: #1e2d45; }
        .dac-textinput {
          flex: 1; background: none; border: none; outline: none;
          color: #111827; font-size: 13px; font-family: inherit; padding: 4px 0;
        }
        .dac-textinput::placeholder { color: #d1d5db; }
        .dark .dac-textinput { color: #e2e8f0; }
        .dark .dac-textinput::placeholder { color: #4b5563; }
        .dac-divider { width: 1px; height: 18px; background: #e5e7eb; }
        .dark .dac-divider { background: #1e2d45; }
        .dac-send {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 10px;
          background: linear-gradient(135deg, #4f46e5, #6d28d9);
          border: none; color: #fff; font-size: 12px; font-weight: 600;
          cursor: pointer; font-family: inherit;
          box-shadow: 0 4px 12px rgba(79,70,229,.3);
          transition: all .18s;
        }
        .dac-send:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(79,70,229,.38); }
        .dac-send:disabled { opacity: .35; cursor: not-allowed; transform: none; box-shadow: none; }

        /* ── DASHBOARD PANEL ── */
        .dac-dash {
          /* Responsive width: smaller on <1920, base at 1920, larger above */
          width: clamp(320px, 28vw, 560px);
          background: #fff;
          border-left: 1px solid #e8e8ef;
          display: flex; flex-direction: column;
          overflow: hidden;
          transition: width .3s ease, opacity .3s ease;
          flex-shrink: 0;
        }
        .dark .dac-dash {
          background: #1a2234;
          border-left-color: #1e2d45;
        }
        .dac-dash.closed { width: 0; opacity: 0; overflow: hidden; }

        .dac-dash-header {
          padding: 12px 14px;
          border-bottom: 1px solid #f0f0f8;
          background: #fafafe;
          flex-shrink: 0;
        }
        .dark .dac-dash-header {
          border-bottom-color: #1e2d45;
          background: #111827;
        }
        .dac-dash-title {
          font-size: 15px; font-weight: 700; color: #1e1b4b; margin-bottom: 12px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .dark .dac-dash-title { color: #e2e8f0; }
        .dac-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-bottom: 12px; }

        /* Filter section */
        .dac-filter-section {
          background: #f8f8fc; border: 1px solid #ebebf5;
          border-radius: 12px; padding: 10px 12px; margin-bottom: 0;
        }
        .dark .dac-filter-section {
          background: #0d1117;
          border-color: #1e2d45;
        }
        .dac-filter-title { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px; }
        .dark .dac-filter-title { color: #94a3b8; }
        .dac-filter-row   { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; }
        .dac-filter-label { font-size: 11px; color: #6b7280; white-space: nowrap; min-width: 66px; }
        .dark .dac-filter-label { color: #94a3b8; }
        .dac-filter-select, .dac-filter-input {
          flex: 1; padding: 5px 8px; font-size: 11px;
          border: 1.5px solid #e0e0f0; border-radius: 8px;
          background: #fff; font-family: inherit; outline: none;
          transition: border-color .15s;
        }
        .dac-filter-select:focus, .dac-filter-input:focus { border-color: #7c3aed; }
        .dark .dac-filter-select, .dark .dac-filter-input {
          background: #1a2234;
          border-color: #1e2d45;
          color: #e2e8f0;
        }
        .dark .dac-filter-select:focus, .dark .dac-filter-input:focus { border-color: #7c3aed; }
        .dac-search-btn {
          padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: 600;
          background: #7c3aed; color: #fff; border: none; cursor: pointer;
          font-family: inherit; transition: .15s;
        }
        .dac-search-btn:hover { background: #6d28d9; }

        /* Results table */
        .dac-results { flex: 1; overflow-y: auto; padding: 12px 14px; }
        .dac-results-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 8px;
        }
        .dac-results-title { font-size: 13px; font-weight: 700; color: #1e1b4b; }
        .dark .dac-results-title { color: #e2e8f0; }
        .dac-errlogs-btn {
          padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 600;
          background: #fef3c7; color: #92400e; border: 1px solid #fde68a;
          cursor: pointer; font-family: inherit; transition: .15s;
        }
        .dac-errlogs-btn:hover { background: #fde68a; }
        .dark .dac-errlogs-btn {
          background: #1c1200; color: #fbbf24; border-color: #92400e;
        }
        .dark .dac-errlogs-btn:hover { background: #291a00; }

        .dac-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .dac-table th {
          text-align: left; padding: 7px 8px;
          font-size: 10px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: .05em;
          border-bottom: 1px solid #f0f0f8;
        }
        .dark .dac-table th {
          color: #6b7280;
          border-bottom-color: #1e2d45;
        }
        .dac-table td {
          padding: 8px 8px; border-bottom: 1px solid #f8f8fc;
          vertical-align: middle;
        }
        .dark .dac-table td {
          border-bottom-color: #1e2d45;
          color: #e2e8f0;
        }
        .dac-table tr:hover td { background: #fafafe; }
        .dark .dac-table tr:hover td { background: #111827; }
        .dac-table tr:last-child td { border-bottom: none; }

        .dac-tbl-btn {
          padding: 3px 8px; border-radius: 7px; font-size: 10px; font-weight: 600;
          border: 1.5px solid; cursor: pointer; font-family: inherit; transition: .15s;
        }
        .dac-tbl-btn.update { border-color: #c7d2fe; color: #4f46e5; background: #eef2ff; }
        .dac-tbl-btn.update:hover { background: #e0e7ff; }
        .dark .dac-tbl-btn.update { border-color: #3730a3; color: #818cf8; background: #1e1b4b; }
        .dark .dac-tbl-btn.update:hover { background: #2d2a6e; }
        .dac-tbl-btn.reset  { border-color: #fde68a; color: #92400e; background: #fffbeb; }
        .dac-tbl-btn.reset:hover  { background: #fef3c7; }
        .dark .dac-tbl-btn.reset { border-color: #92400e; color: #fbbf24; background: #1c1200; }
        .dark .dac-tbl-btn.reset:hover { background: #291a00; }
        .dac-tbl-btn.del    { border-color: #fecaca; color: #b91c1c; background: #fff5f5; }
        .dac-tbl-btn.del:hover { background: #fee2e2; }
        .dark .dac-tbl-btn.del { border-color: #7f1d1d; color: #f87171; background: #3b0a0a; }
        .dark .dac-tbl-btn.del:hover { background: #4c1414; }

        .dac-bulk-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 11px; border-radius: 9px; font-size: 11px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: .15s; border: 1.5px solid;
        }
        .dac-bulk-import { background: #eef2ff; border-color: #c7d2fe; color: #4f46e5; }
        .dac-bulk-import:hover { background: #e0e7ff; }
        .dark .dac-bulk-import { background: #1e1b4b; border-color: #3730a3; color: #818cf8; }
        .dark .dac-bulk-import:hover { background: #2d2a6e; }
        .dac-create-btn { background: #7c3aed; border-color: #7c3aed; color: #fff; }
        .dac-create-btn:hover { background: #6d28d9; }

        /* ── MONO ── */
        .mono { font-family: 'JetBrains Mono', monospace; font-size: 11px; }

        /* ── EDIT MODAL ── */
        .dac-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,.4); backdrop-filter: blur(4px);
          z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .dark .dac-modal-overlay { background: rgba(0,0,0,.7); }
        .dac-modal {
          background: #fff; border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,.15);
          width: 100%; max-width: 460px;
          animation: dac-scale .2s ease;
        }
        .dark .dac-modal {
          background: #1a2234;
          box-shadow: 0 20px 60px rgba(0,0,0,.5);
        }
        @keyframes dac-scale {
          from { opacity:0; transform: scale(.95); }
          to   { opacity:1; transform: scale(1); }
        }
        .dac-modal-header {
          padding: 16px 18px 12px;
          border-bottom: 1px solid #f0f0f8;
          display: flex; align-items: center; justify-content: space-between;
        }
        .dark .dac-modal-header { border-bottom-color: #1e2d45; }
        .dac-modal-title { font-size: 15px; font-weight: 700; color: #1e1b4b; }
        .dark .dac-modal-title { color: #e2e8f0; }
        .dac-modal-body  { padding: 16px 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .dac-modal-full  { grid-column: 1 / -1; }
        .dac-modal-label { font-size: 10px; font-weight: 600; color: #6b7280; margin-bottom: 5px; text-transform: uppercase; }
        .dark .dac-modal-label { color: #94a3b8; }
        .dac-modal-input {
          width: 100%; padding: 8px 11px; font-size: 12px;
          border: 1.5px solid #e5e7eb; border-radius: 10px;
          background: #fafafa; font-family: inherit; outline: none; box-sizing: border-box;
        }
        .dac-modal-input:focus { border-color: #7c3aed; background: #fff; }
        .dark .dac-modal-input {
          background: #111827; border-color: #1e2d45; color: #e2e8f0;
        }
        .dark .dac-modal-input:focus { border-color: #7c3aed; background: #0d1117; }
        .dac-modal-footer {
          padding: 12px 18px; border-top: 1px solid #f0f0f8;
          display: flex; gap: 10px;
        }
        .dark .dac-modal-footer { border-top-color: #1e2d45; }
        .dac-modal-cancel {
          flex: 1; padding: 9px; border-radius: 10px; font-size: 12px; font-weight: 600;
          background: #f3f4f6; color: #6b7280; border: none; cursor: pointer; font-family: inherit;
        }
        .dark .dac-modal-cancel { background: #111827; color: #94a3b8; }
        .dac-modal-save {
          flex: 1; padding: 9px; border-radius: 10px; font-size: 12px; font-weight: 600;
          background: linear-gradient(135deg,#4f46e5,#6d28d9); color:#fff; border:none; cursor:pointer; font-family:inherit;
        }

        /* ── ERROR LOG PANEL ── */
        .dac-errlog {
          background: #1e1b4b; border-radius: 12px; padding: 12px;
          margin: 10px 14px 0; max-height: 140px; overflow-y: auto;
          font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #fbbf24;
        }
        .dark .dac-errlog { background: #0d1117; border: 1px solid #1e2d45; }
        .dac-errlog-entry { margin-bottom: 4px; opacity: .85; }

        /* ── IMPORT MODAL ── */
        .dac-import-drop {
          border: 2px dashed #c4b5fd; border-radius: 14px;
          padding: 36px 20px; text-align: center; cursor: pointer;
          background: #fafafe; transition: .2s;
        }
        .dac-import-drop:hover { border-color: #7c3aed; background: #f5f3ff; }
        .dark .dac-import-drop { background: #111827; border-color: #3730a3; }
        .dark .dac-import-drop:hover { border-color: #7c3aed; background: #1e1b4b; }

        /* ── RESPONSIVE: above 1920px ── */
        @media (min-width: 1921px) {
          .dac-topbar { height: 64px; padding: 0 32px; }
          .dac-topbar-left { gap: 20px; }
          .dac-back { font-size: 14px; padding: 7px 12px; }
          .dac-agent-pill { padding: 7px 14px; gap: 10px; }
          .dac-agent-dot { width: 9px; height: 9px; }
          .dac-agent-name { font-size: 14px; }
          .dac-topbtn { font-size: 14px; padding: 8px 16px; }
          .dac-msgs { padding: 28px 36px; gap: 16px; }
          .dac-avatar { width: 36px; height: 36px; font-size: 16px; }
          .dac-bubble { font-size: 15px; padding: 13px 17px; }
          .dac-confirm { padding: 18px 20px; }
          .dac-confirm-text { font-size: 15px; }
          .dac-yes, .dac-no { font-size: 14px; padding: 9px 20px; }
          .dac-form-card { padding: 20px; }
          .dac-form-title { font-size: 14px; }
          .dac-form-input { font-size: 13px; padding: 9px 12px; }
          .dac-form-label { font-size: 11px; }
          .dac-ts { font-size: 12px; }
          .dac-ts.ai, .dac-ts.system { padding-left: 46px; }
          .dac-inputzone { padding: 14px 24px 20px; }
          .dac-inputrow { padding: 9px 14px; gap: 12px; }
          .dac-textinput { font-size: 15px; }
          .dac-send { font-size: 14px; padding: 10px 22px; }
          .dac-icon-btn { font-size: 20px; }
          .dac-dash { width: clamp(440px, 30vw, 680px); }
          .dac-dash-header { padding: 16px 20px; }
          .dac-dash-title { font-size: 18px; margin-bottom: 16px; }
          .dac-stats { gap: 10px; margin-bottom: 16px; }
          .dac-filter-section { padding: 14px 16px; }
          .dac-filter-title { font-size: 12px; }
          .dac-filter-label { font-size: 12px; min-width: 76px; }
          .dac-filter-select, .dac-filter-input { font-size: 12px; padding: 7px 10px; }
          .dac-search-btn { font-size: 12px; padding: 7px 16px; }
          .dac-results { padding: 16px 20px; }
          .dac-results-title { font-size: 15px; }
          .dac-table { font-size: 13px; }
          .dac-table th { font-size: 11px; padding: 9px 10px; }
          .dac-table td { padding: 11px 10px; }
          .dac-tbl-btn { font-size: 11px; padding: 4px 10px; }
          .dac-bulk-btn { font-size: 12px; padding: 6px 14px; }
          .dac-modal { max-width: 560px; }
          .dac-modal-title { font-size: 17px; }
          .dac-modal-input { font-size: 13px; padding: 10px 13px; }
          .dac-modal-cancel, .dac-modal-save { font-size: 13px; padding: 11px; }
        }

        /* ── RESPONSIVE: above 2560px (QHD/4K) ── */
        @media (min-width: 2560px) {
          .dac-topbar { height: 72px; padding: 0 48px; }
          .dac-back { font-size: 15px; }
          .dac-agent-name { font-size: 16px; }
          .dac-topbtn { font-size: 15px; padding: 10px 20px; }
          .dac-msgs { padding: 36px 48px; gap: 20px; }
          .dac-avatar { width: 42px; height: 42px; font-size: 18px; }
          .dac-bubble { font-size: 16px; padding: 15px 20px; }
          .dac-confirm-text { font-size: 16px; }
          .dac-yes, .dac-no { font-size: 15px; padding: 10px 24px; }
          .dac-form-input { font-size: 14px; }
          .dac-ts { font-size: 13px; }
          .dac-ts.ai, .dac-ts.system { padding-left: 52px; }
          .dac-inputzone { padding: 18px 32px 24px; }
          .dac-textinput { font-size: 16px; }
          .dac-send { font-size: 15px; padding: 12px 26px; }
          .dac-dash { width: clamp(520px, 32vw, 800px); }
          .dac-dash-title { font-size: 20px; }
          .dac-table { font-size: 14px; }
          .dac-table th { font-size: 12px; }
          .dac-tbl-btn { font-size: 12px; padding: 5px 12px; }
          .dac-bulk-btn { font-size: 13px; padding: 8px 16px; }
        }
      `}</style>

      <div className="dac-root">

        {/* ── TOPBAR ── */}
        <header className="dac-topbar">
          <div className="dac-topbar-left">
            <button className="dac-back" onClick={() => navigate(-1)}>
              <FaArrowLeft size={11} /> Back
            </button>
            <div className="dac-agent-pill">
              <div className="dac-agent-dot" />
              <span className="dac-agent-name">📁 {agentName}</span>
            </div>
          </div>
          <div className="dac-topbar-right">
            <button className={`dac-topbtn dac-btn-dash ${dashboardOpen ? 'active' : ''}`}
              onClick={() => setDashboardOpen(o => !o)}>
              <IoGridOutline size={14} />
              {dashboardOpen ? 'Hide Dashboard' : 'Show Dashboard'}
            </button>
          </div>
        </header>

        {/* ── BODY ── */}
        <div className="dac-body">

          {/* ════ LEFT: CHAT ════ */}
          <div className="dac-chat">

            {/* Messages */}
            <div className="dac-msgs">
              {messages.map(msg => (
                <div key={msg.id}>
                  <div className={`dac-row ${msg.sender}`}>

                    {/* AI avatar */}
                    {msg.sender !== 'user' && (
                      <div className="dac-avatar">D</div>
                    )}

                    {/* TEXT bubble */}
                    {(msg.type === 'text' || msg.type === 'result') && (
                      <div className={`dac-bubble ${msg.sender === 'user' ? 'user' : msg.type === 'result' ? 'result' : 'ai'}`}>
                        {msg.text}
                      </div>
                    )}

                    {msg.type === 'error' && (
                      <div className="dac-bubble error">{msg.text}</div>
                    )}

                    {/* CONFIRM card */}
                    {msg.type === 'confirm' && (
                      <div className={`dac-confirm ${msg.confirmAnswered ? 'dac-answered' : ''}`}>
                        <div className="dac-confirm-text">{msg.text}</div>
                        <div className="dac-confirm-btns">
                          <button className="dac-yes" onClick={() => handleConfirmYes(msg)}>
                            <FaCheck size={11} /> Yes
                          </button>
                          <button className="dac-no" onClick={() => handleConfirmNo(msg)}>
                            <FaTimes size={11} /> No
                          </button>
                        </div>
                      </div>
                    )}

                    {/* INLINE FORM */}
                    {msg.type === 'form' && msg.formFields && (
                      <div className={`dac-form-card ${msg.formSubmitted ? 'dac-form-submitted' : ''}`}>
                        <div className="dac-form-title">
                          <FaUser size={12} /> Create Directory User
                        </div>
                        <div className="dac-form-grid">
                          {msg.formFields.map(field => (
                            <div key={field.name} className={field.name === 'baseDN' || field.name === 'mail' ? 'full' : ''}>
                              <div className="dac-form-label">{field.label}{field.required && ' *'}</div>
                              <input
                                type={field.type}
                                className="dac-form-input"
                                placeholder={field.placeholder}
                                value={field.value}
                                onChange={e => updateFormField(msg.id, field.name, e.target.value)}
                                required={field.required}
                              />
                            </div>
                          ))}
                        </div>
                        <button
                          className="dac-form-submit"
                          onClick={() => handleInlineFormSubmit(msg.id, msg.formFields!)}
                          disabled={msg.formSubmitted}
                        >
                          {msg.formSubmitted ? '✓ Submitted' : '🚀 Create User'}
                        </button>
                      </div>
                    )}

                  </div>
                  <div className={`dac-ts ${msg.sender}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {aiTyping && (
                <div className="dac-row ai">
                  <div className="dac-avatar">D</div>
                  <div className="dac-typing">
                    <div className="dac-dot" /><div className="dac-dot" /><div className="dac-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="dac-inputzone">
              <div className="dac-inputrow">
                <button className="dac-icon-btn" title="Attach"><IoAttachOutline /></button>
                <input
                  type="text" className="dac-textinput"
                  placeholder='Try "create a user" or "delete user jsmith"…'
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                />
                <button className="dac-icon-btn" title="Voice"><IoMicOutline /></button>
                <div className="dac-divider" />
                <button className="dac-send" onClick={handleSend} disabled={!inputValue.trim() || aiTyping}>
                  <IoPaperPlaneOutline size={14} /> Send
                </button>
              </div>
            </div>
          </div>

          {/* ════ RIGHT: DASHBOARD ════ */}
          <div className={`dac-dash ${dashboardOpen ? '' : 'closed'}`}>

            {/* Header: title + stat cards + filter */}
            <div className="dac-dash-header">
              {/* Title row */}
              <div className="dac-dash-title">
                <span>User Management</span>
                <div style={{ display: 'flex', gap: 7 }}>
                  <button className="dac-bulk-btn dac-bulk-import" onClick={() => setShowImport(true)}>
                    <FaFileImport size={11} /> Bulk Import
                  </button>
                  <button className="dac-bulk-btn dac-create-btn"
                    onClick={() => {
                      pushMsg({
                        sender: 'ai', type: 'confirm',
                        text: '👤 Create a new directory user.\n\nWould you like to **fill in the details yourself**, or should I use **dummy data**?',
                        confirmContext: 'create_form_prompt', confirmAnswered: false,
                      });
                      setDashboardOpen(false);
                    }}
                  >
                    <FaPlus size={11} /> Create User
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="dac-stats">
                <StatCard label="Total Users"    value={stats.totalUsers} />
                <StatCard label="Total OU"       value={stats.totalOU || 10} />
                <StatCard label="Users Created"  value={stats.usersCreated} />
                <StatCard label="Users Deleted"  value={stats.usersDeleted} />
              </div>

              {/* Filter section */}
              <div className="dac-filter-section">
                <div className="dac-filter-title">Filter Section</div>
                <div className="dac-filter-row">
                  <span className="dac-filter-label">Parent OU :</span>
                  <select className="dac-filter-select" value={parentOU} onChange={e => setParentOU(e.target.value)}>
                    <option>Ou=Employees, dc=Company, dc=com</option>
                    <option>Ou=Admins, dc=Company, dc=com</option>
                    <option>Ou=Contractors, dc=Company, dc=com</option>
                    <option>Ou=ServiceAccounts, dc=Company, dc=com</option>
                  </select>
                  <span className="dac-filter-label" style={{ minWidth: 'auto' }}>Search By :</span>
                  <select className="dac-filter-select" style={{ maxWidth: 80 }} value={searchBy} onChange={e => setSearchBy(e.target.value)}>
                    <option>UID</option>
                    <option>Name</option>
                    <option>Email</option>
                  </select>
                </div>
                <div className="dac-filter-row">
                  <span className="dac-filter-label">Search Term :</span>
                  <input
                    className="dac-filter-input"
                    placeholder="Search user…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleDashboardSearch()}
                  />
                  <button className="dac-search-btn" onClick={handleDashboardSearch}>Search</button>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="dac-results">
              <div className="dac-results-header">
                <span className="dac-results-title">Directory Results</span>
                <button className="dac-errlogs-btn" onClick={() => setShowErrorLogs(o => !o)}>
                  <FaExclamationTriangle size={10} style={{ display:'inline', marginRight:4 }} />
                  Error Logs {errorLogs.length > 0 && `(${errorLogs.length})`}
                </button>
              </div>

              {/* Error log panel */}
              {showErrorLogs && (
                <div className="dac-errlog">
                  {errorLogs.length === 0
                    ? <div style={{ color: '#6ee7b7' }}>No errors logged.</div>
                    : errorLogs.map((e, i) => <div key={i} className="dac-errlog-entry">{e}</div>)
                  }
                </div>
              )}

              {loadingUsers ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'#9ca3af', fontSize:13 }}>
                  <div style={{ fontSize:26, marginBottom:10 }}>⟳</div>
                  Querying directory…
                </div>
              ) : users.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'#9ca3af' }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>🗄️</div>
                  <div style={{ fontSize:13, fontWeight:600 }}>No users found</div>
                  <div style={{ fontSize:11, marginTop:4 }}>Try a different filter or create a user via chat</div>
                </div>
              ) : (
                <table className="dac-table">
                  <thead>
                    <tr>
                      <th style={{ width:26 }}>
                        <input type="checkbox"
                          onChange={e => setSelectedRows(e.target.checked ? new Set(users.map(u => u.dn)) : new Set())}
                          checked={selectedRows.size === users.length && users.length > 0}
                        />
                      </th>
                      <th>Name</th>
                      <th>UID</th>
                      <th>Actions</th>
                      <th style={{ width:28 }}>
                        <FaTrash size={11} style={{ color: selectedRows.size > 0 ? '#ef4444' : '#d1d5db', cursor: selectedRows.size > 0 ? 'pointer' : 'default' }}
                          onClick={async () => {
                            if (selectedRows.size === 0) return;
                            if (!window.confirm(`Delete ${selectedRows.size} selected user(s)?`)) return;
                            for (const dn of selectedRows) {
                              const u = users.find(u => u.dn === dn);
                              if (u) await deleteUser(dn, displayName(u));
                            }
                            setSelectedRows(new Set());
                          }}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, i) => (
                      <tr key={i}>
                        <td>
                          <input type="checkbox"
                            checked={selectedRows.has(user.dn)}
                            onChange={() => toggleSelectRow(user.dn)}
                          />
                        </td>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                            <div style={{ width:24, height:24, borderRadius:'50%', background:'#ede9fe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#6d28d9', flexShrink:0 }}>
                              {displayName(user).charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight:500, color:'#111827' }}>{displayName(user)}</span>
                          </div>
                        </td>
                        <td><span className="mono">{(user.uid as string) || '—'}</span></td>
                        <td>
                          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                            <button className="dac-tbl-btn update" onClick={() => openEditModal(user)}>Update</button>
                            <button className="dac-tbl-btn reset" onClick={() => handleDashboardPassReset(user)}>Pass reset</button>
                            <button className="dac-tbl-btn del" onClick={() => handleDashboardDelete(user)}>Delete</button>
                          </div>
                        </td>
                        <td />
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* ═══ EDIT MODAL ═══════════════════════════════════════════════════ */}
        {editUser && (
          <div className="dac-modal-overlay" onClick={() => setEditUser(null)}>
            <div className="dac-modal" onClick={e => e.stopPropagation()}>
              <div className="dac-modal-header">
                <span className="dac-modal-title">✏️ Edit User — {displayName(editUser)}</span>
                <button onClick={() => setEditUser(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:18 }}><FaTimes /></button>
              </div>
              <div className="dac-modal-body">
                {[
                  { key:'givenName', label:'First Name' },
                  { key:'sn',       label:'Last Name'  },
                  { key:'mail',     label:'Email',   cls:'dac-modal-full' },
                  { key:'telephoneNumber', label:'Phone' },
                ].map(({ key, label, cls }) => (
                  <div key={key} className={cls}>
                    <div className="dac-modal-label">{label}</div>
                    <input className="dac-modal-input" value={editForm[key] || ''} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))} />
                  </div>
                ))}
                <div className="dac-modal-full">
                  <div className="dac-modal-label">New Password (leave blank to keep)</div>
                  <input type="password" className="dac-modal-input" placeholder="••••••••" onChange={e => setEditForm(p => ({ ...p, userPassword: e.target.value }))} />
                </div>
                <div className="dac-modal-full">
                  <div className="dac-modal-label mono" style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'#9ca3af' }}>{editUser.dn}</div>
                </div>
              </div>
              <div className="dac-modal-footer">
                <button className="dac-modal-cancel" onClick={() => setEditUser(null)}>Cancel</button>
                <button className="dac-modal-save" onClick={handleEditSave}>Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ BULK IMPORT MODAL ════════════════════════════════════════════ */}
        {showImport && (
          <div className="dac-modal-overlay" onClick={() => setShowImport(false)}>
            <div className="dac-modal" onClick={e => e.stopPropagation()}>
              <div className="dac-modal-header">
                <span className="dac-modal-title">📥 Bulk Import Users</span>
                <button onClick={() => setShowImport(false)} style={{ background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:18 }}><FaTimes /></button>
              </div>
              <div style={{ padding:'18px' }}>
                <div className="dac-import-drop" onClick={() => document.getElementById('dac-import-file')?.click()}>
                  <div style={{ fontSize:32, marginBottom:10 }}>📄</div>
                  <div style={{ fontWeight:600, color:'#3730a3', marginBottom:6, fontSize:14 }}>Drop a CSV or LDIF file here</div>
                  <div style={{ fontSize:12, color:'#9ca3af' }}>or click to browse</div>
                  <input id="dac-import-file" type="file" accept=".csv,.ldif" style={{ display:'none' }} />
                </div>
                <div style={{ marginTop:12, fontSize:11, color:'#9ca3af', lineHeight:1.6 }}>
                  <strong style={{ color:'#6b7280' }}>CSV columns:</strong> uid, givenName, sn, mail, telephoneNumber, userPassword, baseDN<br/>
                  <strong style={{ color:'#6b7280' }}>LDIF:</strong> standard RFC 2849 format
                </div>
                <div style={{ display:'flex', gap:10, marginTop:14 }}>
                  <button className="dac-modal-cancel" onClick={() => setShowImport(false)}>Cancel</button>
                  <button className="dac-modal-save" onClick={() => { setShowImport(false); pushAI('📥 Bulk import initiated. Processing file…'); }}>
                    Import
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default DirectoryAgentChat;