import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { FaCheckCircle, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS WORKS (and why `require()` didn't):
//
//   Vite uses ES modules. `require()` in a .tsx file silently returns {} at
//   runtime in Vite because there is no CommonJS runtime — so the manifest
//   was always empty, causing the code to always fall through to the HeyGen API.
//
//   `import.meta.glob` with `{ eager: true }` is a Vite build-time feature:
//   Vite statically analyses the glob, bundles the matched files into the JS
//   chunk, and makes them available SYNCHRONOUSLY — zero network request,
//   zero useEffect, zero loading state.
//
//   Result: avatars are ready before React renders the first frame.
// ─────────────────────────────────────────────────────────────────────────────
const manifestModules = import.meta.glob<{ default: Record<string, string> }>(
  '../../data/avatarManifest.json',
  { eager: true },
);
const avatarManifest: Record<string, string> =
  Object.values(manifestModules)[0]?.default ?? {};

// ─── Classification helpers ────────────────────────────────────────────────────
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

// ─── AvatarOption type ─────────────────────────────────────────────────────────
interface AvatarOption {
  id: string;
  name: string;
  img: string;
  color: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build avatar list ONCE at module load — synchronous, no useEffect needed.
// Called exactly once when the JS module is first evaluated.
// ─────────────────────────────────────────────────────────────────────────────
const EXCLUDED_NAMES = ['santa', 'claus', 'holiday', 'christmas', 'xmas'];

function buildAvatarListFromManifest(): AvatarOption[] {
  const keys = Object.keys(avatarManifest);
  if (keys.length === 0) return [];

  // 1. Keep formal only, exclude holiday/costume avatars
  const formal = keys.filter(id => {
    if (classifyVariant(id) !== 'formal') return false;
    const l = id.toLowerCase();
    if (EXCLUDED_NAMES.some(k => l.includes(k))) return false;
    return true;
  });

  // 2. Deduplicate by first name — prefer local /avatars/ path over CDN URL
  const byName = new Map<string, { id: string; img: string }>();
  for (const id of formal) {
    const img   = avatarManifest[id];
    const first = extractFirstName(id);
    const existing = byName.get(first);
    if (!existing) {
      byName.set(first, { id, img });
    } else {
      // Local /avatars/ file beats CDN URL
      const existingLocal = existing.img.startsWith('/avatars/');
      const newLocal      = img.startsWith('/avatars/');
      if (newLocal && !existingLocal) byName.set(first, { id, img });
    }
  }

  // 3. Sort: local files first, then CDN URLs, then initials-only
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

// Module-level constant — computed once, reused forever
const MANIFEST_AVATARS: AvatarOption[] = buildAvatarListFromManifest();

// Shown when manifest is empty AND no HeyGen API key
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

// ─── Other interfaces ──────────────────────────────────────────────────────────
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

// ─── Image state hook ──────────────────────────────────────────────────────────
type ImgState = 'loading' | 'loaded' | 'error';

function useImgState(src: string): [ImgState, () => void, () => void] {
  const [state, setState] = React.useState<ImgState>(src ? 'loading' : 'error');
  React.useEffect(() => { setState(src ? 'loading' : 'error'); }, [src]);
  return [state, () => setState('loaded'), () => setState('error')];
}

// ─── Circle avatar ─────────────────────────────────────────────────────────────
const AvatarCircleImage: React.FC<{
  avatar: AvatarOption;
  textSize?: string;
  eager?: boolean;
}> = ({ avatar, textSize = 'text-2xl', eager = false }) => {
  const [state, onLoad, onError] = useImgState(avatar.img);
  return (
    <>
      {/* Initials always rendered — visible instantly, image fades over it */}
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
            // @ts-ignore — fetchPriority is valid HTML but TS types lag
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

// ─── Large preview panel ───────────────────────────────────────────────────────
const AvatarLargePreview: React.FC<{ avatar: AvatarOption | null }> = ({ avatar }) => {
  const [state, onLoad, onError] = useImgState(avatar?.img ?? '');
  if (!avatar) {
    return (
      <div className="aspect-[3/4] rounded-2xl flex flex-col items-center justify-center gap-4 border-2 border-dashed border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="w-20 h-20 rounded-full bg-white shadow-inner flex items-center justify-center">
          <span className="text-4xl">🤖</span>
        </div>
        <div className="text-center px-4">
          <p className="text-sm font-semibold text-gray-400">No Avatar Selected</p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">Click any avatar in the carousel to preview it here</p>
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

// ─── Avatar Carousel ───────────────────────────────────────────────────────────
const AvatarCarousel: React.FC<{
  avatars: AvatarOption[];
  selectedId: string;
  onSelect: (id: string, name: string, img: string) => void;
}> = ({ avatars, selectedId, onSelect }) => {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-semibold text-gray-900">
          Choose Your Avatar <span className="text-red-500">*</span>
        </label>
        <div className="hidden sm:flex items-center gap-1 text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full select-none">
          <span>🖱️</span><span>scroll or use arrows</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={() => scrollBy('left')}
          className="flex-shrink-0 w-9 h-9 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-lg transition-all duration-150"
          style={{ opacity: canLeft ? 1 : 0.25, pointerEvents: canLeft ? 'auto' : 'none' }}>
          <FaChevronLeft size={13} />
        </button>

        <div className="relative flex-1 min-w-0">
          <div className="absolute left-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, white 20%, transparent)', opacity: canLeft ? 1 : 0 }} />
          <div className="absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, white 20%, transparent)', opacity: canRight ? 1 : 0 }} />

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
                      ? { boxShadow: `0 0 0 3px white, 0 0 0 5px ${avatar.color}, 0 6px 20px ${avatar.color}44` }
                      : { border: '2px solid #e5e7eb', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                    {/* First 5 visible on initial render → load eagerly */}
                    <AvatarCircleImage avatar={avatar} textSize="text-xl" eager={index < 5} />
                    <div className="absolute top-0 left-0 text-white text-[8px] font-black px-1 py-0.5 rounded-br-md z-30 leading-none"
                      style={{ background: '#6366f1' }}>F</div>
                    {isSelected && (
                      <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-md z-30">
                        <FaCheckCircle size={11} style={{ color: avatar.color }} />
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium leading-tight text-center w-[80px] truncate transition-colors ${
                    isSelected ? 'text-indigo-600 font-semibold' : 'text-gray-500 group-hover:text-gray-800'
                  }`}>
                    {avatar.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button type="button" onClick={() => scrollBy('right')}
          className="flex-shrink-0 w-9 h-9 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-lg transition-all duration-150"
          style={{ opacity: canRight ? 1 : 0.25, pointerEvents: canRight ? 'auto' : 'none' }}>
          <FaChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const AgentCreationForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { agentTypeId } = useParams<{ agentTypeId?: string }>();
  const locState = location.state as LocationState | undefined;
  const integrationIdForFilter = locState?.integrationId;
  const integrationTypeFromNav = locState?.integrationType ?? '';

  const [showSuccess,            setShowSuccess]            = React.useState(false);
  const [submitting,             setSubmitting]             = React.useState(false);
  const [error,                  setError]                  = React.useState('');
  const [availableTargetSystems, setAvailableTargetSystems] = React.useState<TargetSystem[]>([]);
  const [loadingTargetSystems,   setLoadingTargetSystems]   = React.useState(false);

  // ── Avatar state ─────────────────────────────────────────────────────────────
  // If manifest loaded → avatars available immediately, no spinner needed.
  // If manifest empty  → async HeyGen fetch (rare; only on first run before caching).
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

  // ── CHANGE 1: removed createdAgentId state — no longer navigating to agent chat ──

  // ── Only hit HeyGen API when manifest is absent (first-time setup) ──────────
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

  // ── Target systems ──────────────────────────────────────────────────────────
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

  // ── Handlers ────────────────────────────────────────────────────────────────
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
      // ── CHANGE 2: just await the call, no need to capture returned agent id ──
      await api.llmRuntime.createAgent(payload);
      setShowSuccess(true);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create agent');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAvatarObj = avatars.find(a => a.id === formData.selectedAvatarId) ?? null;

  const agentLabel = agentTypeId
    ? agentTypeId.charAt(0).toUpperCase() + agentTypeId.slice(1)
    : 'License';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
        .acf-font { font-family: 'DM Sans', sans-serif; }

        @keyframes acf-rise {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .acf-card { animation: acf-rise 0.35s ease both; }

        @keyframes acf-fade { from { opacity:0 } to { opacity:1 } }
        .acf-modal-in { animation: acf-fade 0.2s ease-out; }

        .acf-accent-bar {
          height: 3px;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }
        .acf-card:hover .acf-accent-bar { transform: scaleX(1); }

        .acf-input {
          width: 100%;
          padding: 10px 14px;
          font-size: 13.5px;
          font-family: inherit;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          background: #fff;
          color: #111;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .acf-input:hover  { border-color: #D1D5DB; }
        .acf-input:focus  { border-color: #6366F1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
        .acf-input:disabled,
        .acf-input[readonly] { background: #F9FAFB; color: #9CA3AF; cursor: not-allowed; }

        .acf-label {
          display: block;
          font-size: 12.5px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
          letter-spacing: 0.01em;
        }

        @keyframes int-pulse-green {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .acf-pulse { animation: int-pulse-green 2s ease infinite; }

        .avatar-scroll::-webkit-scrollbar { display: none; }
        .avatar-scroll { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>

      <div className="acf-font min-h-screen bg-[#FAFAFA] text-[#111]">

        {/* ── Success Modal ── */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 acf-modal-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border border-gray-200">
              <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle size={24} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-[#0A0A0A] mb-1">Agent Created!</h2>
              <p className="text-[13.5px] text-gray-500 mb-6">Your agent is now active and monitoring.</p>
              <div className="bg-[#FAFAFA] rounded-xl border border-gray-200 p-4 mb-6 text-left space-y-3">
                {([
                  ['Avatar',        selectedAvatarObj?.name ?? ''],
                  ['Agent Name',    formData.agentName],
                  ['Environment',   formData.environment],
                  ['Target System', formData.selectedTargetSystem?.name ?? ''],
                  ...(agentTypeId !== 'connection' ? [['Notification Window', `${formData.notificationWindow} days`]] : []),
                ] as [string, string][]).map(([label, value], i) => (
                  <div key={i} className={`flex items-center justify-between ${i > 0 ? 'border-t border-gray-100 pt-3' : ''}`}>
                    <span className="text-[12.5px] text-gray-400">{label}</span>
                    <span className="text-[13px] font-semibold text-[#0A0A0A]">{value}</span>
                  </div>
                ))}
              </div>
              {/* ── CHANGE 3: always navigate to /agents list, user opens agent when they want ── */}
              <button
                onClick={() => {
                  setShowSuccess(false);
                  navigate('/agents');
                }}
                className="w-full bg-[#111] hover:bg-[#222] text-white px-6 py-3 rounded-xl text-[13.5px] font-semibold transition-colors"
              >
                View Agents
              </button>
            </div>
          </div>
        )}

        {/* ── Page Header ── */}
        <div className="bg-white border-b border-gray-200 px-12 max-md:px-5">
          <div className="max-w-[1200px] mx-auto pt-10 pb-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#0A0A0A] max-md:text-3xl">
                    Create {agentLabel} Agent
                  </h1>
                  {integrationTypeFromNav && (
                    <span className="self-center text-[11px] font-semibold tracking-[0.06em] uppercase text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                      {integrationTypeFromNav.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </span>
                  )}
                </div>
                <p className="text-[15px] text-gray-500 font-normal max-w-[480px] leading-relaxed m-0">
                  Configure your AI agent — choose an avatar, set the environment, and link a target system.
                </p>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="flex-shrink-0 mt-1 w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-all"
              >
                <FaTimes size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="max-w-[1200px] mx-auto px-12 pt-10 pb-20 max-md:px-5">
          <div className="flex gap-6 items-start">

            {/* ── Left: Form Card ── */}
            <div className="flex-1 min-w-0 acf-card bg-white border border-gray-200 rounded-2xl overflow-hidden">
              {/* Accent bar */}
              <div
                className="acf-accent-bar"
                style={{ background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }}
              />

              <form onSubmit={handleSubmit} className="px-8 py-7 space-y-7">
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-[13px]">{error}</div>
                )}

                {/* 1. Avatar carousel */}
                {loadingAvatars ? (
                  <div>
                    <label className="acf-label">
                      Choose Your Avatar <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4 py-3 overflow-hidden">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2" style={{ minWidth: 88 }}>
                          <div className="w-[72px] h-[72px] rounded-full bg-gray-100 animate-pulse" />
                          <div className="w-14 h-2.5 bg-gray-100 rounded-full animate-pulse" />
                        </div>
                      ))}
                    </div>
                    <p className="text-[11.5px] text-gray-400 flex items-center gap-2 mt-1">
                      <span className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin inline-block" />
                      Fetching avatars from HeyGen…
                    </p>
                  </div>
                ) : (
                  <AvatarCarousel
                    avatars={avatars}
                    selectedId={formData.selectedAvatarId}
                    onSelect={handleAvatarSelect}
                  />
                )}

                {/* 2. Agent Name */}
                <div>
                  <label className="acf-label">
                    Agent Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" name="agentName" value={formData.agentName}
                    onChange={handleInputChange} required
                    placeholder={selectedAvatarObj ? `${selectedAvatarObj.name} Agent` : 'Select an avatar to auto-fill…'}
                    className="acf-input"
                  />
                  <p className="text-[11.5px] text-gray-400 mt-1.5 flex items-center gap-1">
                    <span>💡</span><span>Auto-filled from avatar — edit anytime</span>
                  </p>
                </div>

                {/* 3. Environment */}
                <div>
                  <label className="acf-label">
                    Environment <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="environment" value={formData.environment}
                    onChange={handleInputChange} required
                    className="acf-input cursor-pointer"
                  >
                    <option value="">Select Environment</option>
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>

                {/* 4. Target System */}
                {formData.environment && (
                  <div>
                    <label className="acf-label">
                      Target System <span className="text-red-500">*</span>
                    </label>
                    {loadingTargetSystems ? (
                      <div className="flex items-center gap-3 px-4 py-3 bg-[#FAFAFA] rounded-xl border border-gray-200">
                        <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
                        <span className="text-[13px] text-gray-500">Loading systems…</span>
                      </div>
                    ) : availableTargetSystems.length === 0 ? (
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <p className="text-[13px] text-amber-700">No connected systems for <strong>{formData.environment}</strong>.</p>
                      </div>
                    ) : (
                      <select
                        value={formData.selectedTargetSystem?._id ?? formData.selectedTargetSystem?.id ?? ''}
                        onChange={e => {
                          const s = availableTargetSystems.find(sys => (sys._id ?? sys.id) === e.target.value);
                          setFormData(p => ({ ...p, selectedTargetSystem: s ?? null }));
                        }}
                        required
                        className="acf-input cursor-pointer"
                      >
                        <option value="">Select a target system…</option>
                        {availableTargetSystems.map(s => {
                          const id = s._id ?? s.id;
                          return <option key={id} value={id}>{s.name} ({s.base_url ?? s.hostname ?? s.host ?? 'n/a'})</option>;
                        })}
                      </select>
                    )}
                    {formData.selectedTargetSystem && (
                      <div className="mt-2 p-3 bg-green-50 rounded-xl border border-green-200 flex items-center gap-2.5">
                        <FaCheckCircle className="text-green-500 flex-shrink-0" size={14} />
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-semibold text-green-900 truncate">{formData.selectedTargetSystem.name}</p>
                          <p className="text-[11.5px] text-green-700 truncate">{formData.selectedTargetSystem.base_url ?? formData.selectedTargetSystem.hostname}</p>
                          {(formData.selectedTargetSystem.type || integrationTypeFromNav) && (
                            <p className="text-[11.5px] text-indigo-600 font-medium mt-0.5">
                              {(formData.selectedTargetSystem.type || integrationTypeFromNav)?.replace(/_/g, ' ')}
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
                    <label className="acf-label">
                      Notification Window (days) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number" name="notificationWindow" value={formData.notificationWindow}
                      onChange={handleInputChange} min="1" max="365" required
                      className="acf-input"
                    />
                    <p className="text-[11.5px] text-gray-400 mt-1.5 flex items-center gap-1">
                      <span>💡</span><span>Days before license expiry to start alerting</span>
                    </p>
                  </div>
                )}

                {/* 6. Notification Channel */}
                <div>
                  <label className="acf-label">Notification Channel</label>
                  <div className="relative">
                    <input type="text" value="Slack" readOnly className="acf-input pr-10" />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-lg">💬</div>
                  </div>
                  <p className="text-[11.5px] text-gray-400 mt-1.5 flex items-center gap-1">
                    <span>💡</span><span>Alerts go to: {formData.slackChannel}</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-5 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setFormData({
                      agentName: '', selectedAvatarId: '', selectedAvatarImg: '',
                      selectedAvatarName: '', environment: '', notificationWindow: 30,
                      slackChannel: '#alerts', selectedTargetSystem: null,
                    })}
                    className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-[13px] font-medium hover:bg-gray-50 hover:border-gray-300 transition-all font-[inherit]"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !formData.selectedTargetSystem || !formData.selectedAvatarId}
                    className="flex-1 px-5 py-2.5 bg-[#111] hover:bg-[#222] text-white rounded-xl text-[13px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-[inherit]"
                  >
                    {submitting ? 'Creating…' : 'Create Agent'}
                  </button>
                </div>
              </form>
            </div>

            {/* ── Right: Live Preview ── */}
            <div className="hidden lg:flex flex-col w-68 2xl:w-72 flex-shrink-0 gap-4 sticky top-8">
              <div className="acf-card bg-white border border-gray-200 rounded-2xl overflow-hidden" style={{ animationDelay: '0.1s' }}>
                <div className="acf-accent-bar" style={{ background: '#6366F1' }} />
                <div className="p-5">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="acf-pulse w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                    Avatar Preview
                  </p>
                  <AvatarLargePreview avatar={selectedAvatarObj} />
                  {selectedAvatarObj && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11.5px] text-gray-400">Selected</span>
                        <span className="text-[12px] font-bold truncate ml-2" style={{ color: selectedAvatarObj.color }}>
                          {selectedAvatarObj.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11.5px] text-gray-400">Style</span>
                        <span className="text-[12px] font-medium text-gray-600">👔 Formal</span>
                      </div>
                      {(formData.selectedTargetSystem?.type || integrationTypeFromNav) && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11.5px] text-gray-400">Category</span>
                          <span className="text-[12px] font-medium text-indigo-600">
                            {(formData.selectedTargetSystem?.type || integrationTypeFromNav)
                              ?.replace(/_/g, ' ')
                              .replace(/\b\w/g, (c: string) => c.toUpperCase())}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-[11.5px] text-gray-400">Source</span>
                        <span className="text-[12px] font-medium text-gray-600">
                          {selectedAvatarObj.img.startsWith('/avatars/') ? '📁 Local'
                           : selectedAvatarObj.img.startsWith('http') ? '🌐 CDN'
                           : '🔤 Initials'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="acf-card bg-white border border-gray-200 rounded-2xl p-5" style={{ animationDelay: '0.15s' }}>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Tips</p>
                <ul className="space-y-2 text-[12.5px] text-gray-500 leading-relaxed">
                  <li className="flex gap-2"><span className="text-gray-300">—</span><span>Click any avatar to preview it here</span></li>
                  <li className="flex gap-2"><span className="text-gray-300">—</span><span>Agent name is auto-filled from avatar choice</span></li>
                  <li className="flex gap-2"><span className="text-gray-300">—</span><span>Integration type is set automatically</span></li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default AgentCreationForm;