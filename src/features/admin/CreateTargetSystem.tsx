import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import TargetSystemForm from './TargetSystemForm';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { useTheme } from '../../state/ThemeContext';

// Type Definitions
interface LocationState {
  integrationId?: string;
  integrationName?: string;
  integrationValue?: string;
  authMethods?: string[];
}

interface TargetSystemData {
  [key: string]: any;
}

const CreateTargetSystem: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();

  // Get integration details from route state
  const locationState = location.state as LocationState | undefined;
  const integrationId = locationState?.integrationId;
  const integrationName = locationState?.integrationName;
  const integrationValue = locationState?.integrationValue;
  const authMethods = locationState?.authMethods || [];

  const [loading, setLoading] = useState<boolean>(false);

  const handleCreate = async (data: TargetSystemData): Promise<void> => {
    console.log('[CreateTargetSystem] handleCreate called with data:', data);
    setLoading(true);
    try {
      const result = await api.targetSystems.create(data);
      console.log('[CreateTargetSystem] Create successful:', result);
      toast.success('Target system created successfully!');
      navigate('/admin/avatarsys');
    } catch (err: any) {
      console.error('[CreateTargetSystem] Error creating target system:', err);
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to create target system';
      toast.error(errorMessage);
      setLoading(false);
      throw err;
    }
  };

  const handleCancel = (): void => {
    console.log('[CreateTargetSystem] Cancel clicked');
    navigate('/admin/targetsys');
  };

  console.log('[CreateTargetSystem] Rendering with props:', {
    integrationId,
    integrationName,
    integrationValue,
    authMethods
  });

  return (
    <>
      <style>{`
        /* ── Below 1920px (laptops, smaller desktops) ── */
        @media (max-width: 1919px) {
          .cts-back-wrap { padding: 20px 40px 0 !important; }
          .cts-form-wrap { padding: 20px 40px 40px !important; }
          .cts-form-inner { max-width: 680px !important; }
        }

        @media (max-width: 1400px) {
          .cts-back-wrap { padding: 18px 28px 0 !important; }
          .cts-form-wrap { padding: 18px 28px 36px !important; }
          .cts-form-inner { max-width: 620px !important; }
        }

        @media (max-width: 1200px) {
          .cts-back-wrap { padding: 16px 20px 0 !important; }
          .cts-form-wrap { padding: 16px 20px 32px !important; }
          .cts-form-inner { max-width: 560px !important; }
        }

        @media (max-width: 1024px) {
          .cts-back-wrap { padding: 14px 16px 0 !important; }
          .cts-form-wrap { padding: 14px 16px 28px !important; }
          .cts-form-inner { max-width: 100% !important; }
        }

        /* ── Above 1920px (2K, 4K, ultrawide) ── */
        @media (min-width: 1921px) {
          .cts-back-wrap { padding: 40px 80px 0 !important; }
          .cts-back-btn { font-size: 16px !important; gap: 10px !important; }
          .cts-back-btn svg { width: 16px !important; height: 16px !important; }
          .cts-form-wrap { padding: 40px 80px 80px !important; }
          .cts-form-inner { max-width: 900px !important; }
        }

        @media (min-width: 2560px) {
          .cts-back-wrap { padding: 56px 120px 0 !important; }
          .cts-back-btn { font-size: 18px !important; }
          .cts-form-wrap { padding: 56px 120px 100px !important; }
          .cts-form-inner { max-width: 1100px !important; }
        }
      `}</style>
      <div
        className="min-h-screen"
        style={{ background: isDark ? '#0d1117' : '#f9fafb' }}
      >
        {/* Back button */}
        <div className="cts-back-wrap px-6 sm:px-10 lg:px-14 xl:px-16 2xl:px-20 pt-6">
          <button
            onClick={handleCancel}
            className="cts-back-btn group inline-flex items-center gap-2 text-sm font-medium transition-all duration-200"
            style={{ color: isDark ? '#94a3b8' : '#374151' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = isDark ? '#e2e8f0' : '#111827'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = isDark ? '#94a3b8' : '#374151'}
          >
            <FaArrowLeft
              size={13}
              className="transform group-hover:-translate-x-1 transition-transform duration-200"
            />
            <span>Back</span>
          </button>
        </div>

        {/* Form Container */}
        <div className="cts-form-wrap px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-6 sm:py-8 lg:py-10 xl:py-12 2xl:py-16 flex justify-center">
          <div className="cts-form-inner w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl">
            <TargetSystemForm
              system={null}
              typeOptions={[]}
              availableAuthMethods={authMethods}
              integrationValue={integrationValue}
              integrationId={integrationId}
              integrationName={integrationName}
              onSubmit={handleCreate}
              onCancel={handleCancel}
              isModal={true}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateTargetSystem;