import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { FaCheckCircle, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// ─────────────────────────────────────────────────────────────────────────────
// AgentCreationForm — Avatar Carousel with LIVE HeyGen thumbnails
//
// KEY FIX: Instead of hardcoded files2.heygen.ai URLs (which are CORS-blocked
// in browsers), we now fetch the avatar list from HeyGen's API at runtime.
// This gives us real thumbnail URLs that actually load in the browser.
//
// Fallback: if the API call fails (no key, network issue), we fall back to
// the FALLBACK_AVATARS list with known-working public avatar IDs and colored
// initials so the form still works.
// ─────────────────────────────────────────────────────────────────────────────

// ── Fallback avatar definitions (used when API is unavailable) ──────────────
// These IDs are the actual HeyGen avatar IDs used in createStartAvatar()
export const FALLBACK_AVATARS = [
  { id: 'Marianne_ProfessionalLook_public',   name: 'Marianne',   color: '#6366f1' },
  { id: 'Katya_ProfessionalLook_public',      name: 'Katya',      color: '#10b981' },
  { id: 'Alessandra_ProfessionalLook_public', name: 'Alessandra', color: '#f59e0b' },
  { id: 'Tyler-incasualsuit-20220722',        name: 'Tyler',      color: '#ef4444' },
  { id: 'Anna_public_3_20240108',             name: 'Anna',       color: '#8b5cf6' },
  { id: 'Eric_public_pro1_20230608',          name: 'Eric',       color: '#06b6d4' },
  { id: 'Susan_public_2_20240328',            name: 'Susan',      color: '#ec4899' },
  { id: 'Josh_lite_20230714',                 name: 'Josh',       color: '#84cc16' },
  { id: 'Shelly_public_20240408',             name: 'Shelly',     color: '#f97316' },
  { id: 'Wayne_20240711_public',              name: 'Wayne',      color: '#14b8a6' },
];

// ── Types ────────────────────────────────────────────────────────────────────
interface AvatarOption {
  id: string;
  name: string;
  img: string;    // thumbnail URL from HeyGen API (empty string = use initials)
  color: string;  // fallback color for initials
}

interface TargetSystem {
  _id?: string;
  id?: string;
  name: string;
  status: string;
  integration_id?: string;
  base_url?: string;
  host?: string;
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
    selectedAvatarId?: string;
    selectedAvatarImg?: string;
    selectedAvatarName?: string;
  };
}

interface TargetSystemsResponse {
  systems?: TargetSystem[];
}

// ── Avatar Carousel ───────────────────────────────────────────────────────────
interface AvatarCarouselProps {
  avatars: AvatarOption[];
  loading: boolean;
  selectedId: string;
  onSelect: (id: string, name: string, img: string) => void;
}

const AvatarCarousel: React.FC<AvatarCarouselProps> = ({ avatars, loading, selectedId, onSelect }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft,  setCanScrollLeft]  = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' });
  };

  return (
    <div>
      <label className="block text-sm 2xl:text-base font-semibold text-gray-900 mb-3">
        Choose Your Avatar <span className="text-red-500">*</span>
      </label>
      <p className="text-xs text-gray-500 mb-3">
        Select an avatar — this will be your AI assistant's appearance in the streaming session
      </p>

      {loading ? (
        <div className="flex items-center gap-3 py-8 px-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 flex-shrink-0" />
          <span className="text-sm text-gray-500">Loading avatars from HeyGen…</span>
        </div>
      ) : (
        <div className="relative">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:shadow-lg transition-all -ml-4"
            >
              <FaChevronLeft size={14} />
            </button>
          )}

          <div
            ref={scrollRef}
            onScroll={updateScrollButtons}
            className="flex gap-4 overflow-x-auto px-1 py-3"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {avatars.map((avatar, i) => {
              const isSelected = selectedId === avatar.id;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => onSelect(avatar.id, avatar.name, avatar.img)}
                  className="flex flex-col items-center gap-2 flex-shrink-0 transition-all duration-200 group"
                  style={{ minWidth: 88 }}
                >
                  <div
                    className={`relative w-20 h-20 2xl:w-24 2xl:h-24 rounded-full overflow-hidden transition-all duration-200 ${
                      isSelected ? 'scale-110 shadow-xl' : 'hover:scale-105'
                    }`}
                    style={
                      isSelected
                        ? { boxShadow: `0 0 0 3px white, 0 0 0 5px ${avatar.color}` }
                        : { border: '2px solid #e5e7eb' }
                    }
                  >
                    {avatar.img ? (
                      // Real photo from HeyGen API
                      <img
                        src={avatar.img}
                        alt={avatar.name}
                        className="w-full h-full object-cover object-top"
                        onError={e => {
                          // If image still fails, show initials
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.initials-fb')) {
                            const fb = document.createElement('div');
                            fb.className = 'initials-fb w-full h-full flex items-center justify-center text-white text-2xl font-bold';
                            fb.style.background = `linear-gradient(135deg, ${avatar.color}cc, ${avatar.color})`;
                            fb.textContent = avatar.name[0].toUpperCase();
                            parent.appendChild(fb);
                          }
                        }}
                      />
                    ) : (
                      // Initials fallback (no API key or API failed)
                      <div
                        className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
                        style={{ background: `linear-gradient(135deg, ${avatar.color}cc, ${avatar.color})` }}
                      >
                        {avatar.name[0].toUpperCase()}
                      </div>
                    )}

                    {isSelected && (
                      <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                        <FaCheckCircle size={14} style={{ color: avatar.color }} />
                      </div>
                    )}
                  </div>

                  <span
                    className={`text-xs 2xl:text-sm font-medium transition-colors ${
                      isSelected ? 'text-indigo-600' : 'text-gray-500 group-hover:text-gray-800'
                    }`}
                  >
                    {avatar.name}
                  </span>
                </button>
              );
            })}
          </div>

          {canScrollRight && (
            <button
              type="button"
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:shadow-lg transition-all -mr-4"
            >
              <FaChevronRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Form ─────────────────────────────────────────────────────────────────
const AgentCreationForm: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { agentTypeId } = useParams<{ agentTypeId?: string }>();
  const integrationDataFromState = location.state as LocationState | undefined;
  const integrationIdForFilter   = integrationDataFromState?.integrationId;

  const [showSuccess, setShowSuccess] = React.useState(false);
  const [formData, setFormData] = React.useState<FormData>({
    agentName:            '',
    selectedAvatarId:     '',
    selectedAvatarImg:    '',
    selectedAvatarName:   '',
    environment:          '',
    notificationWindow:   30,
    slackChannel:         '#alerts',
    selectedTargetSystem: null,
  });
  const [submitting,             setSubmitting]             = React.useState(false);
  const [error,                  setError]                  = React.useState('');
  const [availableTargetSystems, setAvailableTargetSystems] = React.useState<TargetSystem[]>([]);
  const [loadingTargetSystems,   setLoadingTargetSystems]   = React.useState(false);

  // ── Avatar state ─────────────────────────────────────────────────────────
  const [avatars,        setAvatars]        = React.useState<AvatarOption[]>([]);
  const [loadingAvatars, setLoadingAvatars] = React.useState(true);

  // ── Fetch HeyGen avatars on mount ─────────────────────────────────────────
  React.useEffect(() => {
    const fetchHeyGenAvatars = async () => {
      setLoadingAvatars(true);
      const apiKey = import.meta.env.VITE_HEYGEN_API_KEY;

      if (!apiKey) {
        // No API key — use fallback with initials
        console.warn('VITE_HEYGEN_API_KEY not set, using fallback avatars');
        setAvatars(FALLBACK_AVATARS.map(a => ({ ...a, img: '' })));
        setLoadingAvatars(false);
        return;
      }

      try {
        // Try HeyGen's streaming avatar list endpoint via Vite proxy
        // (avoids CORS issues — make sure vite.config.js has /heygen-api proxy)
        const res = await fetch('/heygen-api/v1/streaming/avatar.list', {
          headers: { 'x-api-key': apiKey },
        });

        if (!res.ok) {
          throw new Error(`HeyGen API ${res.status}`);
        }

        const data = await res.json();

        // HeyGen returns avatars in different shapes depending on plan
        const rawAvatars: any[] =
          Array.isArray(data?.data)            ? data.data :
          Array.isArray(data?.data?.avatars)   ? data.data.avatars :
          Array.isArray(data?.avatars)         ? data.avatars :
          [];

        if (rawAvatars.length === 0) {
          throw new Error('No avatars returned from API');
        }

        // Map to our AvatarOption shape
        // HeyGen avatar objects have varied field names across API versions
        const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16','#f97316','#14b8a6'];

        const mapped: AvatarOption[] = rawAvatars.slice(0, 20).map((a: any, i: number) => {
          const id   = a.avatar_id   ?? a.id   ?? a.pose_id   ?? '';
          const name = a.avatar_name ?? a.name ?? a.pose_name ?? id.split('_')[0] ?? `Avatar ${i + 1}`;

          // Thumbnail URL — HeyGen puts it in different fields
          const img  =
            a.preview_image_url ??
            a.thumbnail_image_url ??
            a.thumbnail ??
            a.preview ??
            a.image_url ??
            a.headshot_image_url ??
            '';

          return {
            id,
            name: name.charAt(0).toUpperCase() + name.slice(1),
            img,
            color: COLORS[i % COLORS.length],
          };
        }).filter(a => a.id); // remove any with empty IDs

        console.log(`✅ Loaded ${mapped.length} HeyGen avatars`);
        setAvatars(mapped);

      } catch (err: any) {
        console.warn('HeyGen avatar fetch failed, using fallbacks:', err.message);
        // Use fallback list with initials — still functional, just no photos
        setAvatars(FALLBACK_AVATARS.map(a => ({ ...a, img: '' })));
      } finally {
        setLoadingAvatars(false);
      }
    };

    fetchHeyGenAvatars();
  }, []);

  // ── Target systems ────────────────────────────────────────────────────────
  React.useEffect(() => {
    const fetch_ = async () => {
      if (!formData.environment || !integrationIdForFilter) {
        setAvailableTargetSystems([]);
        return;
      }
      setLoadingTargetSystems(true);
      try {
        const response: TargetSystem[] | TargetSystemsResponse = await api.targetSystems.list({
          environment: formData.environment,
          limit: 50,
        });
        const systems = Array.isArray(response) ? response : response.systems || [];
        const connected = systems.filter(
          s => s.status === 'connected' && s.integration_id === integrationIdForFilter
        );
        setAvailableTargetSystems(connected);
      } catch {
        setAvailableTargetSystems([]);
      } finally {
        setLoadingTargetSystems(false);
      }
    };
    fetch_();
  }, [formData.environment, integrationIdForFilter]);

  // ── Handlers ──────────────────────────────────────────────────────────────
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
      selectedAvatarId:   id,
      selectedAvatarImg:  img,
      selectedAvatarName: name,
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
      const payload: AgentCreationPayload = {
        name:          formData.agentName,
        type:          agentTypeId || 'license',
        status:        'active',
        description:   `${agentTypeId ? agentTypeId.charAt(0).toUpperCase() + agentTypeId.slice(1) : 'License'} agent for ${formData.environment || 'environment'} (target ${formData.selectedTargetSystem._id || formData.selectedTargetSystem.id})`,
        checkInterval: 3600,
        config: {
          environment:        formData.environment,
          notificationWindow: formData.notificationWindow,
          slackChannel:       formData.slackChannel,
          targetId:           String(formData.selectedTargetSystem._id || formData.selectedTargetSystem.id),
          targetSystemName:   formData.selectedTargetSystem.name,
          agentTypeId,
          selectedAvatarId:   formData.selectedAvatarId,    // ← HeyGen avatar ID
          selectedAvatarImg:  formData.selectedAvatarImg,   // ← thumbnail for display
          selectedAvatarName: formData.selectedAvatarName,  // ← display name
        },
      };
      await api.llmRuntime.createAgent(payload);
      setShowSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to create agent');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => setFormData({
    agentName: '', selectedAvatarId: '', selectedAvatarImg: '', selectedAvatarName: '',
    environment: '', notificationWindow: 30, slackChannel: '#alerts', selectedTargetSystem: null,
  });

  const selectedAvatarObj = avatars.find(a => a.id === formData.selectedAvatarId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      {/* ── Success Modal ── */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md 2xl:max-w-xl w-full p-8 2xl:p-12 text-center border border-white/20">
            <div className="flex justify-center mb-4">
              {selectedAvatarObj && (
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-xl">
                  {selectedAvatarObj.img ? (
                    <img src={selectedAvatarObj.img} alt={selectedAvatarObj.name}
                      className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold"
                      style={{ background: `linear-gradient(135deg, ${selectedAvatarObj.color}cc, ${selectedAvatarObj.color})` }}>
                      {selectedAvatarObj.name[0]}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <FaCheckCircle className="text-white text-xl" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Agent Created!</h2>
            <p className="text-gray-600 mb-8">Your agent is now active and monitoring.</p>
            <div className="bg-gray-50 rounded-xl p-5 mb-8 border border-gray-100 text-left space-y-3">
              {selectedAvatarObj && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avatar</span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                      {selectedAvatarObj.img ? (
                        <img src={selectedAvatarObj.img} alt={selectedAvatarObj.name}
                          className="w-full h-full object-cover object-top" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ background: `linear-gradient(135deg, ${selectedAvatarObj.color}cc, ${selectedAvatarObj.color})` }}>
                          {selectedAvatarObj.name[0]}
                        </div>
                      )}
                    </div>
                    <span className="font-semibold text-gray-900 text-sm">{selectedAvatarObj.name}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                <span className="text-sm text-gray-600">Agent Name</span>
                <span className="font-semibold text-gray-900 text-sm">{formData.agentName}</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                <span className="text-sm text-gray-600">Environment</span>
                <span className="font-semibold text-gray-900 text-sm">{formData.environment}</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                <span className="text-sm text-gray-600">Target System</span>
                <span className="font-semibold text-gray-900 text-sm">{formData.selectedTargetSystem?.name}</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                <span className="text-sm text-gray-600">Notification Window</span>
                <span className="font-semibold text-gray-900 text-sm">{formData.notificationWindow} days</span>
              </div>
            </div>
            <button
              onClick={() => { setShowSuccess(false); navigate('/agents'); }}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
            >
              View Agents
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 flex items-start justify-center min-h-screen p-8 2xl:p-14">
        <div className="w-full max-w-4xl 2xl:max-w-5xl">
          <button onClick={() => navigate(-1)}
            className="group text-gray-700 hover:text-gray-900 mb-6 flex items-center gap-2 transition-all text-sm font-medium">
            <span className="inline-block group-hover:-translate-x-1 transition-transform">←</span> Back
          </button>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-8 2xl:px-12 py-6 2xl:py-8 border-b border-gray-100 bg-gradient-to-r from-white/50 to-blue-50/30">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <span className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">+</span>
                  <span className="font-medium">Create Your AI Agent</span>
                </div>
                <h1 className="text-2xl 2xl:text-3xl font-bold text-gray-900">
                  {agentTypeId ? agentTypeId.charAt(0).toUpperCase() + agentTypeId.slice(1) : 'License'} Agent
                </h1>
              </div>
              <button onClick={() => navigate(-1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all">
                <FaTimes className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-8 2xl:px-12 py-6 2xl:py-8">
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-100 text-red-700 px-4 py-3 text-sm">{error}</div>
              )}

              <div className="space-y-7">

                {/* 1. Avatar Carousel — now fetches live from HeyGen */}
                <AvatarCarousel
                  avatars={avatars}
                  loading={loadingAvatars}
                  selectedId={formData.selectedAvatarId}
                  onSelect={handleAvatarSelect}
                />

                {/* Selected avatar preview strip */}
                {selectedAvatarObj && (
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl -mt-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow flex-shrink-0">
                      {selectedAvatarObj.img ? (
                        <img src={selectedAvatarObj.img} alt={selectedAvatarObj.name}
                          className="w-full h-full object-cover object-top" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ background: `linear-gradient(135deg, ${selectedAvatarObj.color}cc, ${selectedAvatarObj.color})` }}>
                          {selectedAvatarObj.name[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-indigo-900">Selected: {selectedAvatarObj.name}</p>
                      <p className="text-xs text-indigo-400">This avatar will speak on your behalf</p>
                    </div>
                    <FaCheckCircle className="text-indigo-400 ml-auto" />
                  </div>
                )}

                {/* 2. Agent Name */}
                <div>
                  <label className="block text-sm 2xl:text-base font-semibold text-gray-900 mb-2">
                    Agent Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" name="agentName" value={formData.agentName}
                    onChange={handleInputChange} required
                    placeholder={formData.selectedAvatarId ? `${selectedAvatarObj?.name} Agent` : 'Select an avatar above to auto-fill, or type a name…'}
                    className="w-full px-4 py-3 2xl:px-5 2xl:py-4 text-sm 2xl:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-gray-400 bg-white/70 transition-all hover:border-gray-300"
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>💡</span><span>Auto-filled from avatar selection — edit anytime</span>
                  </p>
                </div>

                {/* 3. Environment */}
                <div>
                  <label className="block text-sm 2xl:text-base font-semibold text-gray-900 mb-2">
                    Environment <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="environment" value={formData.environment}
                    onChange={handleInputChange} required
                    className="w-full px-4 py-3 2xl:px-5 2xl:py-4 text-sm 2xl:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/70 transition-all hover:border-gray-300 cursor-pointer"
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
                    <label className="block text-sm 2xl:text-base font-semibold text-gray-900 mb-2">
                      Select Target System <span className="text-red-500">*</span>
                    </label>
                    {loadingTargetSystems ? (
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                        <span className="text-sm text-gray-600">Loading target systems…</span>
                      </div>
                    ) : availableTargetSystems.length === 0 ? (
                      <div className="p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                        <p className="text-sm text-yellow-700">
                          No connected target systems for <strong>{formData.environment}</strong>.
                        </p>
                      </div>
                    ) : (
                      <select
                        name="targetSystem"
                        value={formData.selectedTargetSystem?._id || formData.selectedTargetSystem?.id || ''}
                        onChange={e => {
                          const s = availableTargetSystems.find(sys => (sys._id || sys.id) === e.target.value);
                          setFormData(p => ({ ...p, selectedTargetSystem: s || null }));
                        }}
                        required
                        className="w-full px-4 py-3 2xl:px-5 2xl:py-4 text-sm 2xl:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/70 transition-all hover:border-gray-300 cursor-pointer"
                      >
                        <option value="">Select a target system…</option>
                        {availableTargetSystems.map(s => (
                          <option key={s._id || s.id} value={s._id || s.id}>
                            {s.name} ({s.base_url || s.host || 'n/a'})
                          </option>
                        ))}
                      </select>
                    )}
                    {formData.selectedTargetSystem && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 flex items-center gap-2">
                        <FaCheckCircle className="text-green-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-green-900">{formData.selectedTargetSystem.name}</p>
                          <p className="text-xs text-green-700">{formData.selectedTargetSystem.base_url || formData.selectedTargetSystem.host}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Notification Window */}
                <div>
                  <label className="block text-sm 2xl:text-base font-semibold text-gray-900 mb-2">
                    Notification Window (days) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" name="notificationWindow" value={formData.notificationWindow}
                    onChange={handleInputChange} min="1" max="365" required
                    className="w-full px-4 py-3 2xl:px-5 2xl:py-4 text-sm 2xl:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/70 transition-all hover:border-gray-300"
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>💡</span><span>Days before license expiry to send notifications</span>
                  </p>
                </div>

                {/* 6. Notification Channel */}
                <div>
                  <label className="block text-sm 2xl:text-base font-semibold text-gray-900 mb-2">
                    Notification Channel
                  </label>
                  <div className="relative">
                    <input
                      type="text" value="Slack" readOnly
                      className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">💬</div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>💡</span>
                    <span>Alerts will be sent to your configured Slack channel: {formData.slackChannel}</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
                <button
                  type="button" onClick={handleReset}
                  className="flex-1 px-6 py-3 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-lg">🔄</span> Reset
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.selectedTargetSystem || !formData.selectedAvatarId}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating Agent…' : 'Create Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0,0) scale(1); }
          33%       { transform: translate(30px,-50px) scale(1.1); }
          66%       { transform: translate(-20px,20px) scale(0.9); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-blob { animation: blob 7s infinite; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default AgentCreationForm;