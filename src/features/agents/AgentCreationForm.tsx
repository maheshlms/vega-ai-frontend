import React, { useCallback, useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { FaCheckCircle, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const manifestModules = import.meta.glob<{ default: Record<string, string> }>(
  '../../data/avatarManifest.json',
  { eager: true },
);
const avatarManifest: Record<string, string> =
  Object.values(manifestModules)[0]?.default ?? {};

const FORMAL_KEYWORDS = ['professional', 'formal', 'pro', 'suit', 'business', 'front'];
const CASUAL_KEYWORDS = ['casual', 'lite', 'summer', 'vacation', 'street', 'incasual', 'relaxed'];

function classifyVariant(id: string): 'formal' | 'casual' | 'unknown' {
  const l = id.toLowerCase();
  if (FORMAL_KEYWORDS.some(k => l.includes(k))) return 'formal';
  if (CASUAL_KEYWORDS.some(k => l.includes(k))) return 'casual';
  return 'unknown';
}

function extractFirstName(id: string): string {
  return id.split(/[_\-]/)[0].toLowerCase();
}

function friendlyName(id: string): string {
  const first = extractFirstName(id);
  return first.charAt(0).toUpperCase() + first.slice(1);
}

const COLORS = [
  '#6366f1','#818cf8','#10b981','#34d399','#f59e0b','#fbbf24',
  '#ef4444','#fca5a5','#8b5cf6','#a78bfa','#06b6d4','#67e8f9',
  '#ec4899','#f9a8d4','#84cc16','#bef264','#f97316','#fdba74',
  '#14b8a6','#5eead4',
];

interface AvatarOption {
  id: string;
  name: string;
  img: string;
  color: string;
}

const EXCLUDED_NAMES = ['santa', 'claus', 'holiday', 'christmas', 'xmas'];

function buildAvatarListFromManifest(): AvatarOption[] {
  const keys = Object.keys(avatarManifest);
  if (keys.length === 0) return [];

  const formal = keys.filter(id => {
    if (classifyVariant(id) !== 'formal') return false;
    const l = id.toLowerCase();
    if (EXCLUDED_NAMES.some(k => l.includes(k))) return false;
    return true;
  });

  const byName = new Map<string, { id: string; img: string }>();
  for (const id of formal) {
    const img   = avatarManifest[id];
    const first = extractFirstName(id);
    const existing = byName.get(first);
    if (!existing) {
      byName.set(first, { id, img });
    } else {
      const existingLocal = existing.img.startsWith('/avatars/');
      const newLocal      = img.startsWith('/avatars/');
      if (newLocal && !existingLocal) byName.set(first, { id, img });
    }
  }

  const rank = (img: string) => img.startsWith('/avatars/') ? 2 : img.startsWith('http') ? 1 : 0;
  return Array.from(byName.entries())
    .sort(([, a], [, b]) => rank(b.img) - rank(a.img))
    .slice(0, 20)
    .map(([, { id, img }], i) => ({
      id, img,
      name:  friendlyName(id),
      color: COLORS[i % COLORS.length],
    }));
}

const MANIFEST_AVATARS: AvatarOption[] = buildAvatarListFromManifest();

const HARDCODED_FALLBACKS: AvatarOption[] = [
  { id: 'Marianne_ProfessionalLook_public',   name: 'Marianne',   img: '', color: '#6366f1' },
  { id: 'Katya_ProfessionalLook_public',      name: 'Katya',      img: '', color: '#10b981' },
  { id: 'Alessandra_ProfessionalLook_public', name: 'Alessandra', img: '', color: '#f59e0b' },
  { id: 'Tyler_ProfessionalLook_public',      name: 'Tyler',      img: '', color: '#fca5a5' },
  { id: 'Anna_public_3_20240108',             name: 'Anna',       img: '', color: '#8b5cf6' },
  { id: 'Eric_public_pro1_20230608',          name: 'Eric',       img: '', color: '#06b6d4' },
  { id: 'Susan_public_2_20240328',            name: 'Susan',      img: '', color: '#ec4899' },
  { id: 'Shelly_public_20240408',             name: 'Shelly',     img: '', color: '#f97316' },
  { id: 'Wayne_20240711_public',              name: 'Wayne',      img: '', color: '#14b8a6' },
];

interface TargetSystem {
  _id?: string;
  id?: string;
  name: string;
  status: string;
  integration_id?: string;
  type?: string;
  base_url?: string;
  host?: string;
  hostname?: string;
}

interface FormData {
  agentName: string;
  selectedAvatarId: string;
  selectedAvatarImg: string;
  selectedAvatarName: string;
  environment: string;
  notificationWindow: number;
  slackChannel: string;
  selectedTargetSystem: TargetSystem | null;
}

interface LocationState {
  integrationId?: string;
  integrationType?: string;
}

interface AgentCreationPayload {
  name: string;
  type: string;
  status: string;
  description: string;
  checkInterval: number;
  config: {
    environment: string;
    notificationWindow: number;
    slackChannel: string;
    targetId: string;
    targetSystemName: string;
    agentTypeId?: string;
    integrationType?: string;
    selectedAvatarId?: string;
    selectedAvatarImg?: string;
    selectedAvatarName?: string;
  };
}

interface TargetSystemsResponse { systems?: TargetSystem[]; }

type ImgState = 'loading' | 'loaded' | 'error';

function useImgState(src: string): [ImgState, () => void, () => void] {
  const [state, setState] = React.useState<ImgState>(src ? 'loading' : 'error');
  React.useEffect(() => { setState(src ? 'loading' : 'error'); }, [src]);
  return [state, () => setState('loaded'), () => setState('error')];
}

function useIsDark() {
  const [isDark, setIsDark] = React.useState(() =>
    document.documentElement.classList.contains('dark')
  );
  React.useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

const AvatarCircleImage: React.FC<{
  avatar: AvatarOption;
  textSize?: string;
  eager?: boolean;
}> = ({ avatar, textSize = 'text-2xl', eager = false }) => {
  const [state, onLoad, onError] = useImgState(avatar.img);
  return (
    <>
      <div
        className={`absolute inset-0 flex items-center justify-center text-white font-bold ${textSize}`}
        style={{ background: `linear-gradient(135deg, ${avatar.color}cc, ${avatar.color})` }}
      >
        {avatar.name[0].toUpperCase()}
      </div>

      {avatar.img && state !== 'error' && (
        <>
          {state === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center z-10"
              style={{ background: `${avatar.color}55` }}>
              <div className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <img
            src={avatar.img}
            alt={avatar.name}
            loading={eager ? 'eager' : 'lazy'}
            // @ts-ignore
            fetchPriority={eager ? 'high' : 'auto'}
            decoding={eager ? 'sync' : 'async'}
            className={`absolute inset-0 w-full h-full object-cover object-top z-20 transition-opacity duration-200 ${
              state === 'loaded' ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={onLoad}
            onError={onError}
          />
        </>
      )}
    </>
  );
};

const AvatarLargePreview: React.FC<{ avatar: AvatarOption | null }> = ({ avatar }) => {
  const [state, onLoad, onError] = useImgState(avatar?.img ?? '');
  if (!avatar) {
    return (
      <div className="aspect-[3/4] rounded-2xl flex flex-col items-center justify-center gap-4 border-2 border-dashed border-gray-200 dark:border-[#1e2d45] bg-gradient-to-b from-gray-50 dark:from-[#111827] to-gray-100 dark:to-[#0d1117]">
        <div className="w-20 h-20 rounded-full bg-white dark:bg-[#1a2234] shadow-inner flex items-center justify-center">
          <span className="text-4xl">🤖</span>
        </div>
        <div className="text-center px-4">
          <p className="text-sm font-semibold text-gray-400 dark:text-slate-500">No Avatar Selected</p>
          <p className="text-xs text-gray-400 dark:text-slate-600 mt-1 leading-relaxed">Click any avatar in the carousel to preview it here</p>
        </div>
      </div>
    );
  }
  return (
    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl"
      style={{ background: `linear-gradient(160deg, ${avatar.color}22, ${avatar.color}88)` }}>
      <div className="absolute inset-0 flex items-center justify-center font-black text-white select-none"
        style={{ fontSize: '7rem', background: `linear-gradient(135deg, ${avatar.color}99, ${avatar.color})` }}>
        {avatar.name[0].toUpperCase()}
      </div>
      {avatar.img && state !== 'error' && (
        <>
          {state === 'loading' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
              style={{ backdropFilter: 'blur(6px)', background: `${avatar.color}33` }}>
              <div className="w-10 h-10 rounded-full border-t-white border-white/40 animate-spin"
                style={{ borderWidth: 3, borderStyle: 'solid' }} />
              <span className="text-white/80 text-xs font-medium">Loading…</span>
            </div>
          )}
          <img src={avatar.img} alt={avatar.name} loading="eager"
            // @ts-ignore
            fetchPriority="high"
            className={`absolute inset-0 w-full h-full object-cover object-top z-20 transition-all duration-400 ${
              state === 'loaded' ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
            onLoad={onLoad} onError={onError}
          />
        </>
      )}
      <div className="absolute bottom-0 left-0 right-0 z-30 p-5"
        style={{ background: `linear-gradient(to top, ${avatar.color}f0 0%, ${avatar.color}88 60%, transparent 100%)` }}>
        <p className="text-white font-bold text-xl leading-tight drop-shadow-sm">{avatar.name}</p>
        <p className="text-white/80 text-sm mt-0.5">👔 Formal look</p>
      </div>
      <div className="absolute top-3 right-3 z-30 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg"
        style={{ background: '#6366f1dd', backdropFilter: 'blur(8px)' }}>
        Formal
      </div>
      {state === 'loaded' && (
        <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full">
          <div className={`w-1.5 h-1.5 rounded-full ${avatar.img.startsWith('/avatars/') ? 'bg-green-400' : 'bg-blue-400'}`} />
          {avatar.img.startsWith('/avatars/') ? 'Cached' : 'CDN'}
        </div>
      )}
    </div>
  );
};

const AvatarCarousel: React.FC<{
  avatars: AvatarOption[];
  selectedId: string;
  onSelect: (id: string, name: string, img: string) => void;
  isDark: boolean;
}> = ({ avatars, selectedId, onSelect, isDark }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const rafRef    = React.useRef<number>(0);
  const [canLeft,  setCanLeft]  = React.useState(false);
  const [canRight, setCanRight] = React.useState(true);

  const update = React.useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      setCanLeft(p  => { const n = el.scrollLeft > 2;                                   return p !== n ? n : p; });
      setCanRight(p => { const n = el.scrollLeft < el.scrollWidth - el.clientWidth - 2; return p !== n ? n : p; });
    });
  }, []);

  React.useEffect(() => { update(); }, [avatars, update]);
  React.useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const scrollBy = (dir: 'left' | 'right') =>
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });

  const handleWheel = React.useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      el.scrollBy({ left: e.deltaY * 1.5, behavior: 'auto' });
    }
  }, []);

  const cardBg    = isDark ? '#1a2234' : 'white';
  const fadeLeft  = `linear-gradient(to right, ${cardBg} 20%, transparent)`;
  const fadeRight = `linear-gradient(to left,  ${cardBg} 20%, transparent)`;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
          Choose Your Avatar <span className="text-red-500">*</span>
        </label>
        <div className="hidden sm:flex items-center gap-1 text-[10px] text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-[#111827] px-2 py-0.5 rounded-full select-none">
          <span>🖱️</span><span>scroll or use arrows</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={() => scrollBy('left')}
          className="flex-shrink-0 w-9 h-9 bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1e2d45] rounded-full shadow-md flex items-center justify-center text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg transition-all duration-150"
          style={{ opacity: canLeft ? 1 : 0.25, pointerEvents: canLeft ? 'auto' : 'none' }}>
          <FaChevronLeft size={13} />
        </button>

        <div className="relative flex-1 min-w-0">
          <div className="absolute left-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
            style={{ background: fadeLeft, opacity: canLeft ? 1 : 0 }} />
          <div className="absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
            style={{ background: fadeRight, opacity: canRight ? 1 : 0 }} />

          <div ref={scrollRef} onScroll={update} onWheel={handleWheel}
            className="flex gap-2 overflow-x-auto py-3 px-1 avatar-scroll">
            {avatars.map((avatar, index) => {
              const isSelected = selectedId === avatar.id;
              return (
                <button key={avatar.id} type="button"
                  onClick={() => onSelect(avatar.id, avatar.name, avatar.img)}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 group transition-all duration-200"
                  style={{ minWidth: 84 }}>
                  <div
                    className={`relative w-[68px] h-[68px] rounded-full overflow-hidden transition-all duration-300 ${
                      isSelected ? 'scale-110' : 'hover:scale-105'
                    }`}
                    style={isSelected
                      ? { boxShadow: `0 0 0 3px ${cardBg}, 0 0 0 5px ${avatar.color}, 0 6px 20px ${avatar.color}44` }
                      : { border: isDark ? '2px solid #1e2d45' : '2px solid #e5e7eb', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                    <AvatarCircleImage avatar={avatar} textSize="text-xl" eager={index < 5} />
                    <div className="absolute top-0 left-0 text-white text-[8px] font-black px-1 py-0.5 rounded-br-md z-30 leading-none"
                      style={{ background: '#6366f1' }}>F</div>
                    {isSelected && (
                      <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center shadow-md z-30"
                        style={{ background: cardBg }}>
                        <FaCheckCircle size={11} style={{ color: avatar.color }} />
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium leading-tight text-center w-[80px] truncate transition-colors ${
                    isSelected
                      ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-gray-500 dark:text-slate-500 group-hover:text-gray-800 dark:group-hover:text-slate-200'
                  }`}>
                    {avatar.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button type="button" onClick={() => scrollBy('right')}
          className="flex-shrink-0 w-9 h-9 bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1e2d45] rounded-full shadow-md flex items-center justify-center text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg transition-all duration-150"
          style={{ opacity: canRight ? 1 : 0.25, pointerEvents: canRight ? 'auto' : 'none' }}>
          <FaChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};

const AgentCreationForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { agentTypeId } = useParams<{ agentTypeId?: string }>();
  const locState = location.state as LocationState | undefined;
  const integrationIdForFilter = locState?.integrationId;
  const integrationTypeFromNav = locState?.integrationType ?? '';

  const isDark = useIsDark();

  const [showSuccess,            setShowSuccess]            = React.useState(false);
  const [submitting,             setSubmitting]             = React.useState(false);
  const [error,                  setError]                  = React.useState('');
  const [availableTargetSystems, setAvailableTargetSystems] = React.useState<TargetSystem[]>([]);
  const [loadingTargetSystems,   setLoadingTargetSystems]   = React.useState(false);

  const hasManifest = MANIFEST_AVATARS.length > 0;

  const [avatars,        setAvatars]        = React.useState<AvatarOption[]>(
    hasManifest ? MANIFEST_AVATARS : []
  );
  const [loadingAvatars, setLoadingAvatars] = React.useState(!hasManifest);
  const [avatarSource,   setAvatarSource]   = React.useState<'local' | 'cdn' | 'fallback'>(() => {
    if (!hasManifest) return 'fallback';
    return MANIFEST_AVATARS.some(a => a.img.startsWith('/avatars/')) ? 'local' : 'cdn';
  });

  const [formData, setFormData] = React.useState<FormData>({
    agentName: '', selectedAvatarId: '', selectedAvatarImg: '',
    selectedAvatarName: '', environment: '', notificationWindow: 30,
    slackChannel: '#alerts', selectedTargetSystem: null,
  });

  React.useEffect(() => {
    if (hasManifest) return;

    const go = async () => {
      const apiKey = import.meta.env.VITE_HEYGEN_API_KEY;
      if (!apiKey) {
        setAvatars(HARDCODED_FALLBACKS);
        setAvatarSource('fallback');
        setLoadingAvatars(false);
        return;
      }
      try {
        const res = await fetch('/heygen-api/v1/streaming/avatar.list', {
          headers: { 'x-api-key': apiKey },
        });
        if (!res.ok) throw new Error(`HeyGen ${res.status}`);
        const data = await res.json();
        const raw: any[] =
          Array.isArray(data?.data)          ? data.data :
          Array.isArray(data?.data?.avatars) ? data.data.avatars :
          Array.isArray(data?.avatars)       ? data.avatars : [];
        if (!raw.length) throw new Error('empty');

        const byName = new Map<string, AvatarOption>();
        raw.forEach((a: any, i: number) => {
          const id = a.avatar_id ?? a.id ?? a.pose_id ?? '';
          if (!id || classifyVariant(id) !== 'formal') return;
          const first = extractFirstName(id);
          if (byName.has(first)) return;
          const cdnUrl = a.normal_preview ?? a.preview_image_url ?? a.thumbnail_image_url ??
            a.headshot_image_url ?? a.image_url ?? a.thumbnail ?? a.preview ?? '';
          const img = cdnUrl && !String(cdnUrl).match(/\.(mp4|webm|mov)(\?|$)/i) ? String(cdnUrl) : '';
          byName.set(first, { id, img, name: friendlyName(id), color: COLORS[i % COLORS.length] });
        });
        setAvatars(Array.from(byName.values()).slice(0, 20));
        setAvatarSource('cdn');
      } catch {
        setAvatars(HARDCODED_FALLBACKS);
        setAvatarSource('fallback');
      } finally {
        setLoadingAvatars(false);
      }
    };
    go();
  }, [hasManifest]);

  React.useEffect(() => {
    if (!formData.environment || !integrationIdForFilter) { setAvailableTargetSystems([]); return; }
    setLoadingTargetSystems(true);
    api.targetSystems.list({ environment: formData.environment, limit: 50 })
      .then((res: TargetSystem[] | TargetSystemsResponse) => {
        const systems = Array.isArray(res) ? res : (res as TargetSystemsResponse).systems ?? [];
        setAvailableTargetSystems(
          systems.filter(s => s.status === 'connected' && s.integration_id === integrationIdForFilter)
        );
      })
      .catch(() => setAvailableTargetSystems([]))
      .finally(() => setLoadingTargetSystems(false));
  }, [formData.environment, integrationIdForFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'notificationWindow' ? parseInt(value) || 0 : value,
      ...(name === 'environment' ? { selectedTargetSystem: null } : {}),
    }));
  };

  const handleAvatarSelect = (id: string, name: string, img: string) => {
    setFormData(prev => ({
      ...prev,
      selectedAvatarId: id, selectedAvatarImg: img, selectedAvatarName: name,
      agentName:
        prev.agentName === '' || avatars.some(a => prev.agentName === `${a.name} Agent`)
          ? `${name} Agent`
          : prev.agentName,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.selectedTargetSystem) { setError('Please select a target system'); return; }
    if (!formData.selectedAvatarId)     { setError('Please select an avatar');       return; }
    setSubmitting(true); setError('');
    try {
      const resolvedIntegrationType =
        formData.selectedTargetSystem.type?.trim() ||
        integrationTypeFromNav?.trim()             ||
        agentTypeId || '';

      const payload: AgentCreationPayload = {
        name: formData.agentName, type: agentTypeId ?? 'license', status: 'active',
        description: `${agentTypeId ?? 'License'} agent for ${formData.environment}`,
        checkInterval: 3600,
        config: {
          environment: formData.environment, notificationWindow: formData.notificationWindow,
          slackChannel: formData.slackChannel,
          targetId: String(formData.selectedTargetSystem._id ?? formData.selectedTargetSystem.id),
          targetSystemName: formData.selectedTargetSystem.name,
          agentTypeId, integrationType: resolvedIntegrationType,
          selectedAvatarId: formData.selectedAvatarId,
          selectedAvatarImg: formData.selectedAvatarImg,
          selectedAvatarName: formData.selectedAvatarName,
        },
      };
      await api.llmRuntime.createAgent(payload);
      setShowSuccess(true);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create agent');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAvatarObj = avatars.find(a => a.id === formData.selectedAvatarId) ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-[#0d1117] dark:via-[#0d1117] dark:to-[#0d1117] relative overflow-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 dark:bg-blue-950/50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-200 dark:bg-purple-950/50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-200 dark:bg-pink-950/50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      {/* ── Success Modal ── */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white/95 dark:bg-[#1a2234] backdrop-blur-xl rounded-2xl shadow-2xl
            max-w-sm xl:max-w-md 2xl:max-w-lg
            w-full p-6 xl:p-8 2xl:p-10
            text-center border border-white/20 dark:border-[#1e2d45]">
            <h2 className="text-xl xl:text-2xl 2xl:text-3xl font-semibold text-gray-900 dark:text-white mb-2">Agent Created!</h2>
            <p className="text-sm xl:text-base text-gray-500 dark:text-slate-400 mb-5 xl:mb-6">Your agent is now active and monitoring.</p>
            <div className="bg-gray-50 dark:bg-[#111827] rounded-xl p-3 xl:p-4 mb-5 xl:mb-6 text-left space-y-3 border border-gray-100 dark:border-[#1e2d45]">
              {([
                ['Avatar',        selectedAvatarObj?.name ?? ''],
                ['Agent Name',    formData.agentName],
                ['Environment',   formData.environment],
                ['Target System', formData.selectedTargetSystem?.name ?? ''],
                ...(agentTypeId !== 'connection' ? [['Notification Window', `${formData.notificationWindow} days`]] : []),
              ] as [string, string][]).map(([label, value], i) => (
                <div key={i} className={`flex items-center justify-between ${i > 0 ? 'border-t border-gray-200 dark:border-[#1e2d45] pt-3' : ''}`}>
                  <span className="text-xs xl:text-sm text-gray-500 dark:text-slate-400">{label}</span>
                  <span className="text-xs xl:text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => { setShowSuccess(false); navigate('/agents'); }}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2.5 xl:py-3 rounded-xl font-medium transition-all shadow-lg text-sm xl:text-base">
              View Agents
            </button>
          </div>
        </div>
      )}

      {/* ── Page ── */}
      <div className="relative z-10 flex items-start justify-center min-h-screen
        p-4 xl:p-8 2xl:p-14">
        <div className="w-full max-w-3xl xl:max-w-5xl 2xl:max-w-6xl">
          <button onClick={() => navigate(-1)}
            className="group text-gray-700 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mb-4 xl:mb-6 flex items-center gap-2 text-xs xl:text-sm font-medium transition-all">
            <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span> Back
          </button>

          <div className="flex gap-4 xl:gap-6 items-start">

            {/* ── Left: Form ── */}
            <div className="flex-1 min-w-0 bg-white/80 dark:bg-[#1a2234] backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-[#1e2d45] overflow-hidden">

              {/* Form header */}
              <div className="flex items-center justify-between
                px-5 xl:px-8 2xl:px-12
                py-4 xl:py-6
                border-b border-gray-100 dark:border-[#1e2d45]"
                style={{
                  background: isDark
                    ? 'linear-gradient(90deg, rgba(26,34,52,0.8), rgba(88,28,135,0.1))'
                    : 'linear-gradient(90deg, rgba(255,255,255,0.5), rgba(250,245,255,0.3))',
                }}>
                <div>
                  <div className="flex items-center gap-2 text-xs xl:text-sm text-gray-500 dark:text-slate-400 mb-1.5 xl:mb-2">
                    <span className="w-5 h-5 xl:w-6 xl:h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">+</span>
                    <span className="font-medium">Create Your AI Agent</span>
                  </div>
                  <h1 className="text-xl xl:text-2xl 2xl:text-3xl font-bold text-gray-900 dark:text-white">
                    {agentTypeId ? agentTypeId.charAt(0).toUpperCase() + agentTypeId.slice(1) : 'License'} Agent
                  </h1>
                  {integrationTypeFromNav && (
                    <div className="mt-1.5 xl:mt-2 inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-[#1e1b4b] border border-indigo-200 dark:border-[#3730a3] text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-2.5 xl:px-3 py-1 rounded-full">
                      🔐 {integrationTypeFromNav.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </div>
                  )}
                </div>
                <button onClick={() => navigate(-1)}
                  className="w-8 h-8 xl:w-10 xl:h-10 flex items-center justify-center rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-all">
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="
                px-5 xl:px-8 2xl:px-12
                py-4 xl:py-6 2xl:py-8
                space-y-5 xl:space-y-7">
                {error && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 text-xs xl:text-sm">{error}</div>
                )}

                {/* 1. Avatar carousel */}
                {loadingAvatars ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      Choose Your Avatar <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4 py-3 overflow-hidden">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2" style={{ minWidth: 88 }}>
                          <div className="w-[72px] h-[72px] rounded-full bg-gray-200 dark:bg-[#111827] animate-pulse" />
                          <div className="w-14 h-2.5 bg-gray-200 dark:bg-[#111827] rounded-full animate-pulse" />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-2 mt-1">
                      <span className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin inline-block" />
                      Fetching avatars from HeyGen…
                    </p>
                  </div>
                ) : (
                  <AvatarCarousel
                    avatars={avatars}
                    selectedId={formData.selectedAvatarId}
                    onSelect={handleAvatarSelect}
                    isDark={isDark}
                  />
                )}

                {/* 2. Agent Name */}
                <div>
                  <label className="block text-xs xl:text-sm font-semibold text-gray-900 dark:text-white mb-1.5 xl:mb-2">
                    Agent Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="agentName" value={formData.agentName}
                    onChange={handleInputChange} required
                    placeholder={selectedAvatarObj ? `${selectedAvatarObj.name} Agent` : 'Select an avatar to auto-fill…'}
                    className="w-full px-3 xl:px-4 py-2.5 xl:py-3 text-xs xl:text-sm border-2 border-gray-200 dark:border-[#1e2d45] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-slate-600 bg-white/70 dark:bg-[#111827] text-gray-900 dark:text-white transition-all hover:border-gray-300 dark:hover:border-slate-600" />
                  <p className="text-xs text-gray-500 dark:text-slate-500 mt-1.5 flex items-center gap-1">
                    <span>💡</span><span>Auto-filled from avatar — edit anytime</span>
                  </p>
                </div>

                {/* 3. Environment */}
                <div>
                  <label className="block text-xs xl:text-sm font-semibold text-gray-900 dark:text-white mb-1.5 xl:mb-2">
                    Environment <span className="text-red-500">*</span>
                  </label>
                  <select name="environment" value={formData.environment}
                    onChange={handleInputChange} required
                    className="w-full px-3 xl:px-4 py-2.5 xl:py-3 text-xs xl:text-sm border-2 border-gray-200 dark:border-[#1e2d45] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/70 dark:bg-[#111827] text-gray-900 dark:text-white hover:border-gray-300 dark:hover:border-slate-600 cursor-pointer">
                    <option value="">Select Environment</option>
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>

                {/* 4. Target System */}
                {formData.environment && (
                  <div>
                    <label className="block text-xs xl:text-sm font-semibold text-gray-900 dark:text-white mb-1.5 xl:mb-2">
                      Target System <span className="text-red-500">*</span>
                    </label>
                    {loadingTargetSystems ? (
                      <div className="flex items-center gap-3 px-3 xl:px-4 py-2.5 xl:py-3 bg-gray-50 dark:bg-[#111827] rounded-xl border-2 border-gray-200 dark:border-[#1e2d45]">
                        <div className="animate-spin h-5 w-5 border-b-2 border-blue-600 rounded-full" />
                        <span className="text-xs xl:text-sm text-gray-600 dark:text-slate-400">Loading…</span>
                      </div>
                    ) : availableTargetSystems.length === 0 ? (
                      <div className="p-3 xl:p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border-2 border-yellow-200 dark:border-yellow-700/50">
                        <p className="text-xs xl:text-sm text-yellow-700 dark:text-yellow-400">No connected systems for <strong>{formData.environment}</strong>.</p>
                      </div>
                    ) : (
                      <select
                        value={formData.selectedTargetSystem?._id ?? formData.selectedTargetSystem?.id ?? ''}
                        onChange={e => {
                          const s = availableTargetSystems.find(sys => (sys._id ?? sys.id) === e.target.value);
                          setFormData(p => ({ ...p, selectedTargetSystem: s ?? null }));
                        }}
                        required
                        className="w-full px-3 xl:px-4 py-2.5 xl:py-3 text-xs xl:text-sm border-2 border-gray-200 dark:border-[#1e2d45] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/70 dark:bg-[#111827] text-gray-900 dark:text-white hover:border-gray-300 dark:hover:border-slate-600 cursor-pointer">
                        <option value="">Select a target system…</option>
                        {availableTargetSystems.map(s => {
                          const id = s._id ?? s.id;
                          return <option key={id} value={id}>{s.name} ({s.base_url ?? s.hostname ?? s.host ?? 'n/a'})</option>;
                        })}
                      </select>
                    )}
                    {formData.selectedTargetSystem && (
                      <div className="mt-2 p-2.5 xl:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/50 flex items-center gap-2">
                        <FaCheckCircle className="text-green-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-green-900 dark:text-green-300 truncate">{formData.selectedTargetSystem.name}</p>
                          <p className="text-xs text-green-700 dark:text-green-400 truncate">{formData.selectedTargetSystem.base_url ?? formData.selectedTargetSystem.hostname}</p>
                          {(formData.selectedTargetSystem.type || integrationTypeFromNav) && (
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                              🏷️ Category: {(formData.selectedTargetSystem.type || integrationTypeFromNav)?.replace(/_/g, ' ')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Notification Window */}
                {agentTypeId !== 'connection' && (
                  <div>
                    <label className="block text-xs xl:text-sm font-semibold text-gray-900 dark:text-white mb-1.5 xl:mb-2">
                      Notification Window (days) <span className="text-red-500">*</span>
                    </label>
                    <input type="number" name="notificationWindow" value={formData.notificationWindow}
                      onChange={handleInputChange} min="1" max="365" required
                      className="w-full px-3 xl:px-4 py-2.5 xl:py-3 text-xs xl:text-sm border-2 border-gray-200 dark:border-[#1e2d45] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/70 dark:bg-[#111827] text-gray-900 dark:text-white hover:border-gray-300 dark:hover:border-slate-600" />
                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1.5 flex items-center gap-1">
                      <span>💡</span><span>Days before license expiry to start alerting</span>
                    </p>
                  </div>
                )}

                {/* 6. Notification Channel */}
                <div>
                  <label className="block text-xs xl:text-sm font-semibold text-gray-900 dark:text-white mb-1.5 xl:mb-2">Notification Channel</label>
                  <div className="relative">
                    <input type="text" value="Slack" readOnly
                      className="w-full px-3 xl:px-4 py-2.5 xl:py-3 text-xs xl:text-sm border-2 border-gray-200 dark:border-[#1e2d45] rounded-xl bg-gray-50 dark:bg-[#0d1117] text-gray-500 dark:text-slate-500 cursor-not-allowed" />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xl">💬</div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-500 mt-1.5 flex items-center gap-1">
                    <span>💡</span><span>Alerts go to: {formData.slackChannel}</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 xl:gap-4 pt-3 xl:pt-4 border-t border-gray-100 dark:border-[#1e2d45]">
                  <button type="button"
                    onClick={() => setFormData({
                      agentName: '', selectedAvatarId: '', selectedAvatarImg: '',
                      selectedAvatarName: '', environment: '', notificationWindow: 30,
                      slackChannel: '#alerts', selectedTargetSystem: null,
                    })}
                    className="flex-1 px-4 xl:px-6 py-2.5 xl:py-3 bg-gray-50 dark:bg-[#111827] hover:bg-gray-100 dark:hover:bg-[#1e2d45] border-2 border-gray-200 dark:border-[#1e2d45] text-gray-700 dark:text-slate-300 rounded-xl text-xs xl:text-sm font-semibold transition-all flex items-center justify-center gap-2">
                    <span>🔄</span> Reset
                  </button>
                  <button type="submit"
                    disabled={submitting || !formData.selectedTargetSystem || !formData.selectedAvatarId}
                    className="flex-1 px-4 xl:px-6 py-2.5 xl:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-xs xl:text-sm font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                    {submitting ? 'Creating…' : 'Create Agent'}
                  </button>
                </div>
              </form>
            </div>

            {/* ── Right: Live Preview ── */}
            <div className="hidden lg:flex flex-col
              w-56 xl:w-72 2xl:w-80
              flex-shrink-0 gap-3 xl:gap-4 sticky top-8">
              <div className="bg-white/80 dark:bg-[#1a2234] backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-[#1e2d45] p-4 xl:p-5">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 xl:mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
                  Avatar Preview
                </p>
                <AvatarLargePreview avatar={selectedAvatarObj} />
                {selectedAvatarObj && (
                  <div className="mt-3 xl:mt-4 pt-3 xl:pt-4 border-t border-gray-100 dark:border-[#1e2d45] space-y-2 xl:space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 dark:text-slate-500">Selected</span>
                      <span className="text-xs font-bold truncate ml-2" style={{ color: selectedAvatarObj.color }}>
                        {selectedAvatarObj.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 dark:text-slate-500">Style</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-slate-300">👔 Formal</span>
                    </div>
                    {(formData.selectedTargetSystem?.type || integrationTypeFromNav) && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 dark:text-slate-500">Category</span>
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                          {(formData.selectedTargetSystem?.type || integrationTypeFromNav)
                            ?.replace(/_/g, ' ')
                            .replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 dark:text-slate-500">Image source</span>
                      <span className="text-xs font-medium text-gray-600 dark:text-slate-400">
                        {selectedAvatarObj.img.startsWith('/avatars/') ? '📁 Local cache'
                         : selectedAvatarObj.img.startsWith('http') ? '🌐 CDN'
                         : '🔤 Initials only'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-[#1e1b4b]/50 dark:to-[#1e1b4b]/30 rounded-2xl border border-indigo-100 dark:border-[#3730a3]/40 p-4 xl:p-5">
                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 mb-2 xl:mb-3">💡 Tips</p>
                <ul className="space-y-1.5 xl:space-y-2 text-xs text-indigo-600/90 dark:text-indigo-400/80 leading-relaxed">
                  <li className="flex gap-2"><span>•</span><span>Click any avatar to preview it here</span></li>
                  <li className="flex gap-2"><span>•</span><span>Agent name is auto-filled from avatar choice</span></li>
                  <li className="flex gap-2"><span>•</span><span>The category (PingFederate etc.) is set automatically</span></li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(30px,-50px) scale(1.1); }
          66%      { transform: translate(-20px,20px) scale(0.9); }
        }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        .animate-blob   { animation: blob 7s infinite; }
        .animate-fadeIn { animation: fadeIn .3s ease-out; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .avatar-scroll::-webkit-scrollbar { display: none; }
        .avatar-scroll { -ms-overflow-style:none; scrollbar-width:none; }

        /* ── Screens smaller than 1920 ── */
        @media (max-width: 1535px) {
          /* tighten the preview panel on 1280-1535 */
        }

        /* ── Screens above 1920 ── */
        @media (min-width: 1921px) {
          .acf-page-wrap { padding: 4rem 6rem; }
        }
        @media (min-width: 2560px) {
          .acf-page-wrap { padding: 5rem 8rem; }
        }
      `}</style>
    </div>
  );
};

export default AgentCreationForm;