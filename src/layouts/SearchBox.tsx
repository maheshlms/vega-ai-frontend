import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IoIosSearch, IoIosClose } from 'react-icons/io';
import { FaRobot, FaClock, FaBolt, FaChartBar, FaServer, FaFileAlt, FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { IconType } from 'react-icons';
import api from '../utils/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchBoxProps {
  icon?: IconType;
}

type ResultType = 'agent' | 'page' | 'audit' | 'target';

interface SearchResult {
  type: ResultType;
  icon: string;
  name: string;
  description: string;
  meta?: string;
  avatar?: string;   // image URL for agent avatars
  action: () => void;
}

interface QuickAction {
  icon: IconType;
  label: string;
  shortcut: string;
  action: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RECENT_KEY  = 'vega_recent_searches';
const MAX_RECENT  = 6;
const TYPING_WORDS = ['Search Agents…', 'Search Audit Logs…', 'Search Target Systems…', 'And more…'];

const TYPE_LABELS: Record<ResultType, string> = {
  agent:  '🤖 Agents',
  target: '🖥️ Target Systems',
  page:   '📄 Pages',
  audit:  '📋 Audit Logs',
};

const TYPE_ORDER: ResultType[] = ['agent', 'target', 'page', 'audit'];

// ─── localStorage helpers ─────────────────────────────────────────────────────

const loadRecent = (): string[] => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
  catch { return []; }
};

const persistRecent = (term: string) => {
  const next = [term, ...loadRecent().filter(s => s !== term)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
};

// ─── Static page results (routes) ────────────────────────────────────────────

const buildPageResults = (navigate: ReturnType<typeof useNavigate>): SearchResult[] => [
  { type: 'page', icon: '📊', name: 'Dashboard',     description: 'View analytics & statistics',      action: () => navigate('/agent_dashboard')      },
  { type: 'page', icon: '🤖', name: 'Agents',         description: 'Manage all AI agents',             action: () => navigate('/agents')               },
  { type: 'page', icon: '📋', name: 'Audit Logs',     description: 'View full system audit trail',     action: () => navigate('/audits')               },
  { type: 'page', icon: '⚙️', name: 'Settings',       description: 'Configure account & preferences',  action: () => navigate('/settings')             },
  { type: 'page', icon: '➕', name: 'Create Agent',   description: 'Set up a new AI agent',            action: () => navigate('/agents/select-target') },
  { type: 'page', icon: '🖥️', name: 'Target Systems', description: 'Manage connected target systems',  action: () => navigate('/systems')              },
];

// ─── Same avatar resolver as AdminAgentControll ───────────────────────────────
const resolveAgentAvatarUrl = (name: string, avatarId?: string, storedImg?: string): string => {
  if (storedImg && !storedImg.match(/\.(mp4|webm|mov)(\?|$)/i)) return storedImg;
  if (avatarId && avatarId.trim()) return `/avatars/${avatarId.trim()}.webp`;

  const rawName    = name.trim();
  const firstWord  = rawName.split(/[\s(]/)[0];
  const parenMatch = rawName.match(/\(([^)]+)\)/);
  const parenStyle = parenMatch ? parenMatch[1].replace(/\s+/g, '') : null;
  const withoutFirst = rawName
    .replace(firstWord, '')
    .replace(/agent/gi, '')
    .replace(/\([^)]*\)/g, '')
    .trim();
  const styleWords = withoutFirst
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');

  const style = parenStyle
    ? parenStyle.charAt(0).toUpperCase() + parenStyle.slice(1).toLowerCase() + 'Look'
    : styleWords
    ? styleWords + (styleWords.toLowerCase().includes('look') ? '' : 'Look')
    : 'ProfessionalLook';

  return `/avatars/${firstWord}_${style}_public.webp`;
};

// ─── SearchBox ────────────────────────────────────────────────────────────────

const SearchBox: React.FC<SearchBoxProps> = ({ icon: Icon }) => {
  const navigate = useNavigate();

  // ── Input / UI state ────────────────────────────────────────────────────
  const [inputValue,   setInputValue]   = useState('');
  const [typingText,   setTypingText]   = useState('');
  const [wordIndex,    setWordIndex]    = useState(0);
  const [charIndex,    setCharIndex]    = useState(0);
  const [isFocused,    setIsFocused]    = useState(false);
  const [isDone,       setIsDone]       = useState(false);
  const [isOpen,       setIsOpen]       = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecent);

  // ── Data state ──────────────────────────────────────────────────────────
  const [agentResults,  setAgentResults]  = useState<SearchResult[]>([]);
  const [targetResults, setTargetResults] = useState<SearchResult[]>([]);
  const [auditResults,  setAuditResults]  = useState<SearchResult[]>([]);
  const [isSearching,   setIsSearching]   = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const auditTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch agents + target systems on mount ──────────────────────────────
  useEffect(() => {
    const load = async () => {
      // Agents
      try {
        const remote = await api.llmRuntime.listAgents();
        const mapped: SearchResult[] = (remote || []).map((a: any) => ({
          type:        'agent' as const,
          icon:        '🤖',
          avatar:      resolveAgentAvatarUrl(
                         a.name,
                         a.config?.selectedAvatarId,
                         a.avatar_url || a.config?.selectedAvatarImg,
                       ),
          name:        a.name,
          description: a.type || 'AI Agent',
          meta:        a.config?.environment
                       ? a.config.environment.charAt(0).toUpperCase() + a.config.environment.slice(1)
                       : (a.killswitch_activated ? 'Disabled' : a.status === 'active' ? 'Active' : 'Inactive'),
          action: () => navigate(`/agents/${a.id}/chat`),
        }));
        setAgentResults(mapped);
      } catch {
        setAgentResults([]);
      }

      // Target systems
      try {
        const systems = await api.targetSystems.list();
        const mapped: SearchResult[] = (systems || []).map((s: any) => {
          const id = s.id || s._id;
          return {
            type:        'target' as const,
            icon:        '🖥️',
            name:        s.name || s.type || 'Target System',
            description: s.type || 'System',
            meta:        s.environment || s.status || undefined,
            action: () => navigate(`/systems`),
          };
        });
        setTargetResults(mapped);
      } catch {
        setTargetResults([]);
      }
    };
    load();
  }, []);

  // ── Debounced audit log search ──────────────────────────────────────────
  useEffect(() => {
    if (auditTimerRef.current) clearTimeout(auditTimerRef.current);

    if (!inputValue.trim() || inputValue.trim().length < 2) {
      setAuditResults([]);
      return;
    }

    auditTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await api.audit.queryLogs({
          limit:      5,
          skip:       0,
          sort_order: 'descending',
          event_type: inputValue.trim(),
        });

        // Also try searching by email
        let emailData: any = { logs: [] };
        try {
          emailData = await api.audit.queryLogs({
            limit:      3,
            skip:       0,
            sort_order: 'descending',
            user_email: inputValue.trim(),
          });
        } catch { /* silent */ }

        const rawLogs: any[] = [
          ...(data?.logs || (Array.isArray(data) ? data : [])),
          ...(emailData?.logs || []),
        ];

        // Deduplicate by id
        const seen = new Set<string>();
        const mapped: SearchResult[] = rawLogs
          .filter(log => { const k = log.id || log.timestamp; if (seen.has(k)) return false; seen.add(k); return true; })
          .slice(0, 5)
          .map(log => ({
            type:        'audit' as const,
            icon:        '📋',
            name:        log.event_type || log.action || 'Audit Event',
            description: log.user_email || log.description || '—',
            meta:        log.status || log.severity || undefined,
            action: () => navigate('/audits'),
          }));

        setAuditResults(mapped);
      } catch {
        setAuditResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => { if (auditTimerRef.current) clearTimeout(auditTimerRef.current); };
  }, [inputValue]);

  // ── Combine + filter all results ────────────────────────────────────────
  const pageResults = buildPageResults(navigate);

  const filteredResults: Record<ResultType, SearchResult[]> = React.useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return { agent: [], target: [], page: [], audit: [] };

    const match = (r: SearchResult) =>
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      (r.meta || '').toLowerCase().includes(q);

    return {
      agent:  agentResults.filter(match),
      target: targetResults.filter(match),
      page:   pageResults.filter(match),
      audit:  auditResults,               // already filtered server-side
    };
  }, [inputValue, agentResults, targetResults, auditResults]);

  const totalResults = Object.values(filteredResults).reduce((s, a) => s + a.length, 0);

  // ── Typing animation ────────────────────────────────────────────────────
  useEffect(() => {
    if (isFocused || inputValue || isDone) return;
    const word = TYPING_WORDS[wordIndex];
    if (charIndex < word.length) {
      const t = setTimeout(() => { setTypingText(p => p + word[charIndex]); setCharIndex(p => p + 1); }, 80);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setTypingText(''); setCharIndex(0);
      if (wordIndex === TYPING_WORDS.length - 1) setIsDone(true);
      else setWordIndex(p => p + 1);
    }, 900);
    return () => clearTimeout(t);
  }, [charIndex, wordIndex, isFocused, inputValue, isDone]);

  // ── Close on outside click ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // ── Ctrl+K global shortcut ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleResultClick = useCallback((result: SearchResult) => {
    persistRecent(result.name);
    setRecentSearches(loadRecent());
    result.action();
    setIsOpen(false);
    setInputValue('');
  }, []);

  const handleRecentClick = useCallback((term: string) => {
    setInputValue(term);
    inputRef.current?.focus();
  }, []);

  const handleClearRecent = useCallback((e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    const next = loadRecent().filter(s => s !== term);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    setRecentSearches(next);
  }, []);

  const quickActions: QuickAction[] = [
    { icon: FaRobot,    label: 'Create New Agent', shortcut: 'Ctrl+N', action: () => navigate('/agents/select-target') },
    { icon: FaChartBar, label: 'View Dashboard',   shortcut: 'Ctrl+D', action: () => navigate('/agent_dashboard')   },
    { icon: FaBolt,     label: 'View All Agents',  shortcut: 'Ctrl+A', action: () => navigate('/agents')            },
  ];

  // ── Agent avatar helper ──────────────────────────────────────────────────
  const AgentAvatar = ({ result }: { result: SearchResult }) => {
    const [imgError, setImgError] = useState(false);

    if (result.type === 'agent') {
      if (result.avatar && !imgError) {
        return (
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
            <img
              src={result.avatar}
              alt={result.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
              style={{ objectPosition: '50% 10%' }}
            />
          </div>
        );
      }

      // Initials fallback
      const colors = [
        'from-violet-400 to-purple-500',
        'from-blue-400 to-indigo-500',
        'from-emerald-400 to-teal-500',
        'from-rose-400 to-pink-500',
        'from-amber-400 to-orange-500',
        'from-cyan-400 to-sky-500',
      ];
      const idx = result.name.charCodeAt(0) % colors.length;
      const initials = result.name
        .split(' ')
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? '')
        .join('');
      return (
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${colors[idx]} flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0`}>
          {initials}
        </div>
      );
    }

    // Non-agent: emoji icon tile
    return (
      <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-white flex items-center justify-center text-sm flex-shrink-0 transition-colors border border-transparent group-hover:border-gray-200">
        {result.icon}
      </div>
    );
  };

  // ── Result row renderer ──────────────────────────────────────────────────
  const ResultRow = ({ result }: { result: SearchResult }) => (
    <button
      onMouseDown={() => handleResultClick(result)}   // ← onMouseDown avoids onBlur race
      className="w-full px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-3 text-left group"
    >
      <AgentAvatar result={result} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-gray-900 truncate">{result.name}</div>
        <div className="text-[11px] text-gray-400 truncate">{result.description}</div>
      </div>
      {result.meta && (
        <span className="flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
          {result.meta}
        </span>
      )}
      <span className="text-gray-300 group-hover:text-gray-400 text-xs flex-shrink-0">→</span>
    </button>
  );

  // ── Highlight match helper ───────────────────────────────────────────────
  const highlight = (text: string, query: string) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-100 text-yellow-800 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  const HighlightedResultRow = ({ result }: { result: SearchResult }) => (
    <button
      onMouseDown={() => handleResultClick(result)}
      className="w-full px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-3 text-left group"
    >
      <AgentAvatar result={result} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-gray-900 truncate">
          {highlight(result.name, inputValue)}
        </div>
        <div className="text-[11px] text-gray-400 truncate">
          {highlight(result.description, inputValue)}
        </div>
      </div>
      {result.meta && (
        <span className="flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
          {result.meta}
        </span>
      )}
      <span className="text-gray-300 group-hover:text-gray-400 text-xs flex-shrink-0">→</span>
    </button>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative w-[420px] max-w-full" ref={dropdownRef}>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue || typingText}
        onChange={e => setInputValue(e.target.value)}
        onFocus={() => { setIsFocused(true); setTypingText(''); setIsOpen(true); }}
        onBlur={() => setIsFocused(false)}
        className="w-full h-10 pl-10 pr-16 rounded-md bg-white border border-[#CBD5E1]
          focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-slate-900 text-[13px]
          placeholder:text-gray-400"
      />

      {/* Left icon */}
      {Icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none">
          <Icon size={16} />
        </span>
      )}

      {/* Right: clear button OR Ctrl+K hint */}
      {inputValue ? (
        <button
          onMouseDown={() => { setInputValue(''); inputRef.current?.focus(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <IoIosClose size={18} />
        </button>
      ) : (
        !isFocused && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
            <kbd className="text-[9px] text-gray-400 bg-gray-100 border border-gray-200 rounded px-1 py-0.5 font-mono leading-none">
              Ctrl
            </kbd>
            <kbd className="text-[9px] text-gray-400 bg-gray-100 border border-gray-200 rounded px-1 py-0.5 font-mono leading-none">
              K
            </kbd>
          </span>
        )
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
          style={{ animation: 'searchSlideDown 0.15s ease-out both' }}>

          {/* ── Active search ── */}
          {inputValue.trim() ? (
            <div className="max-h-[420px] overflow-y-auto py-1">

              {/* Searching indicator */}
              {isSearching && (
                <div className="px-4 py-2 flex items-center gap-2 text-[11px] text-gray-400">
                  <FaSpinner className="animate-spin" size={10} />
                  Searching audit logs…
                </div>
              )}

              {totalResults > 0 ? (
                <>
                  {TYPE_ORDER.map(type => {
                    const group = filteredResults[type];
                    if (!group.length) return null;
                    return (
                      <div key={type}>
                        {/* Group header */}
                        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.08em]">
                            {TYPE_LABELS[type]}
                          </span>
                          <span className="text-[10px] text-gray-300">{group.length}</span>
                        </div>
                        {group.map((result, i) => (
                          <HighlightedResultRow key={i} result={result} />
                        ))}
                      </div>
                    );
                  })}
                  <div className="px-4 py-2 border-t border-gray-100 text-[11px] text-gray-400 text-right">
                    {totalResults} result{totalResults !== 1 ? 's' : ''} for "{inputValue}"
                  </div>
                </>
              ) : !isSearching ? (
                <div className="px-4 py-10 text-center">
                  <div className="text-4xl mb-3 opacity-50">🔍</div>
                  <p className="text-[13px] font-medium text-gray-600">
                    No results for "<span className="text-gray-900">{inputValue}</span>"
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Try searching by agent name, event type, user email, or page
                  </p>
                </div>
              ) : null}
            </div>

          ) : (
            /* ── Default state: recent + quick actions ── */
            <div className="max-h-[380px] overflow-y-auto">

              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div className="py-1 border-b border-gray-100">
                  <div className="px-4 py-2 flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.08em]">
                    <FaClock size={9} /> Recent Searches
                  </div>
                  {recentSearches.map((term, i) => (
                    <div key={i}
                      className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-2.5 group cursor-pointer"
                      onMouseDown={() => handleRecentClick(term)}
                    >
                      <IoIosSearch className="text-gray-300 flex-shrink-0" size={13} />
                      <span className="flex-1 text-[13px] text-gray-600 truncate">{term}</span>
                      <button
                        onMouseDown={e => handleClearRecent(e, term)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-gray-500 p-0.5 rounded"
                        title="Remove"
                      >
                        <IoIosClose size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick actions */}
              <div className="py-1">
                <div className="px-4 py-2 flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.08em]">
                  <FaBolt size={9} /> Quick Actions
                </div>
                {quickActions.map((action, i) => {
                  const ActionIcon = action.icon;
                  return (
                    <button
                      key={i}
                      onMouseDown={() => { action.action(); setIsOpen(false); }}
                      className="w-full px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-3 text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">
                        <ActionIcon size={12} />
                      </div>
                      <span className="flex-1 text-[13px] font-medium text-gray-800">{action.label}</span>
                      <kbd className="text-[10px] text-gray-400 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded font-mono">
                        {action.shortcut}
                      </kbd>
                    </button>
                  );
                })}
              </div>

              {/* Footer hint */}
              <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-1.5 text-[10px] text-gray-400">
                <FaServer size={8} />
                Searches agents, target systems, audit logs &amp; pages
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes searchSlideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        mark { background: #fef08a; color: #854d0e; border-radius: 2px; padding: 0 2px; }
      `}</style>
    </div>
  );
};

export default SearchBox;