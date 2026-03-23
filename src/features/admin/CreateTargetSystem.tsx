import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import TargetSystemForm from './TargetSystemForm';
import api from '../../utils/api';
import { toast } from 'react-toastify';

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

  // Get integration details from route state
  const locationState = location.state as LocationState | undefined;
  const integrationId = locationState?.integrationId;
  const integrationName = locationState?.integrationName;
  const integrationValue = locationState?.integrationValue;
  const authMethods = locationState?.authMethods || [];

  const [loading, setLoading] = useState<boolean>(false);

  // DO NOT call toast.success or navigate here.
  // api.targetSystems.create() now auto-tests the connection internally.
  // If connection test fails it throws (err._connectionFailed = true).
  // TargetSystemForm shows a modal with the real test result (connected / failed).
  // When the user clicks "Done" in that modal, onCancel fires → handleCancel → navigate.
  const handleCreate = async (data: TargetSystemData): Promise<any> => {
    console.log('[CreateTargetSystem] handleCreate called with data:', data);
    setLoading(true);
    try {
      const created = await api.targetSystems.create(data);
      console.log('[CreateTargetSystem] Create result:', created);
      setLoading(false);
      // Return the created system so TargetSystemForm can read _connectionTest
      return created;
    } catch (err: any) {
      setLoading(false);
      // Connection test failed after save (err._connectionFailed = true):
      // system was saved but is unreachable — show error toast, return created system
      if (err?._connectionFailed) {
        toast.error(err.message || 'System created but connection failed');
        return err._createdSystem;
      }
      // Hard create failure (system not saved at all):
      console.error('[CreateTargetSystem] Error creating target system:', err);
      toast.error('Failed to create target system: ' + (err as Error).message);
      throw err; // re-throw so TargetSystemForm shows the error, not a success modal
    }
  };

  // Called when user clicks "Done" in the success/test-result modal
  const handleCancel = (): void => {
    console.log('[CreateTargetSystem] Cancel/Done clicked, navigating to /systems');
    navigate('/systems');
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
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
        .cts-font { font-family: 'DM Sans', sans-serif; }

        /* =====================================================================
           RESPONSIVE TOKENS — 1920×1080 is the baseline (default :root).
           Only spacing / sizing tokens change across breakpoints.
           No UI, structure, features, comments, or logic is altered.
           ===================================================================== */

        /* ── BASELINE : 1920×1080 ────────────────────────────────────────── */
        :root {
          --cts-page-max-w:   1400px;
          --cts-page-px:      48px;
          --cts-header-pt:    40px;
          --cts-header-pb:    32px;
          --cts-back-fs:      13px;
          --cts-back-mb:      12px;
          --cts-h1-fs:        36px;
          --cts-h1-mb:        8px;
          --cts-subtitle-fs:  15px;
          --cts-form-py:      40px;
        }

        /* ── LARGE DESKTOP / 4K : >1920px ───────────────────────────────── */
        @media (min-width: 1921px) {
          :root {
            --cts-page-max-w:   1800px;
            --cts-page-px:      80px;
            --cts-header-pt:    56px;
            --cts-header-pb:    44px;
            --cts-back-fs:      15px;
            --cts-back-mb:      18px;
            --cts-h1-fs:        52px;
            --cts-h1-mb:        12px;
            --cts-subtitle-fs:  18px;
            --cts-form-py:      56px;
          }
        }

        /* ── LAPTOP : 1280–1919px ─────────────────────────────────────────
           Covers MacBook Pro 14" (1512px scaled), 15"/16" (1680px scaled),
           standard 1280–1440 laptops. Proportionally identical to 1920.
        ─────────────────────────────────────────────────────────────────── */
        @media (min-width: 1280px) and (max-width: 1919px) {
          :root {
            --cts-page-max-w:   1200px;
            --cts-page-px:      36px;
            --cts-header-pt:    28px;
            --cts-header-pb:    22px;
            --cts-back-fs:      12px;
            --cts-back-mb:      10px;
            --cts-h1-fs:        28px;
            --cts-h1-mb:        6px;
            --cts-subtitle-fs:  13.5px;
            --cts-form-py:      28px;
          }
        }

        /* ── SMALL LAPTOP : 1024–1279px ─────────────────────────────────── */
        @media (min-width: 1024px) and (max-width: 1279px) {
          :root {
            --cts-page-max-w:   100%;
            --cts-page-px:      28px;
            --cts-header-pt:    22px;
            --cts-header-pb:    18px;
            --cts-back-fs:      11.5px;
            --cts-back-mb:      9px;
            --cts-h1-fs:        24px;
            --cts-h1-mb:        6px;
            --cts-subtitle-fs:  13px;
            --cts-form-py:      24px;
          }
        }

        /* ── TABLET : 768–1023px ─────────────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1023px) {
          :root {
            --cts-page-max-w:   100%;
            --cts-page-px:      20px;
            --cts-header-pt:    18px;
            --cts-header-pb:    14px;
            --cts-back-fs:      11px;
            --cts-back-mb:      8px;
            --cts-h1-fs:        20px;
            --cts-h1-mb:        5px;
            --cts-subtitle-fs:  12.5px;
            --cts-form-py:      20px;
          }
        }

        /* ── QHD : 2560–3839px ───────────────────────────────────────────────
           The >1920px block fires from 1921px but its 1800px max-width starts
           to feel narrow by 2560px. Override here for spacious QHD layout.
        ─────────────────────────────────────────────────────────────────────── */
        @media (min-width: 2560px) and (max-width: 3839px) {
          :root {
            --cts-page-max-w:   2400px;
            --cts-page-px:      96px;
            --cts-header-pt:    72px;
            --cts-header-pb:    56px;
            --cts-back-fs:      20px;
            --cts-back-mb:      24px;
            --cts-h1-fs:        68px;
            --cts-h1-mb:        16px;
            --cts-subtitle-fs:  24px;
            --cts-form-py:      72px;
          }
        }

        /* ── 4K+ : ≥3840px ───────────────────────────────────────────────────
           Maximum layout expansion — intentionally spacious, not a narrow strip.
        ─────────────────────────────────────────────────────────────────────── */
        @media (min-width: 3840px) {
          :root {
            --cts-page-max-w:   3200px;
            --cts-page-px:      128px;
            --cts-header-pt:    96px;
            --cts-header-pb:    72px;
            --cts-back-fs:      26px;
            --cts-back-mb:      32px;
            --cts-h1-fs:        88px;
            --cts-h1-mb:        20px;
            --cts-subtitle-fs:  32px;
            --cts-form-py:      96px;
          }
        }

        /* ── COMPONENT STYLES ────────────────────────────────────────────── */
        .cts-page-wrap {
          max-width: var(--cts-page-max-w);
          margin: 0 auto;
          padding-left: var(--cts-page-px);
          padding-right: var(--cts-page-px);
          box-sizing: border-box;
        }

        .cts-header-inner {
          padding-top: var(--cts-header-pt);
          padding-bottom: var(--cts-header-pb);
        }

        .cts-back-btn {
          font-size: var(--cts-back-fs);
          margin-bottom: var(--cts-back-mb);
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          box-sizing: border-box;
        }

        .cts-h1 {
          font-size: var(--cts-h1-fs);
          margin-bottom: var(--cts-h1-mb);
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
          line-height: 1.15;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .cts-subtitle {
          font-size: var(--cts-subtitle-fs);
          line-height: 1.6;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .cts-form-wrap {
          padding-top: var(--cts-form-py);
          padding-bottom: var(--cts-form-py);
        }
      `}</style>

      <div className="cts-font min-h-screen bg-[#FAFAFA]">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="cts-page-wrap cts-header-inner">
            <button
              onClick={() => navigate('/systems/targetsys')}
              className="cts-back-btn flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <FaArrowLeft size={12} />
              <span>Back to Integrations</span>
            </button>
            <h1 className="cts-h1 font-bold leading-tight tracking-tight text-[#0A0A0A]">
              {integrationName ? `Configure ${integrationName}` : 'Create Target System'}
            </h1>
            <p className="cts-subtitle text-gray-500 font-normal leading-relaxed m-0">
              {integrationName
                ? `Set up your ${integrationName} connection`
                : 'Configure a new target system connection'}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="cts-page-wrap cts-form-wrap">
          <TargetSystemForm
            system={null}
            typeOptions={[]}
            availableAuthMethods={authMethods}
            integrationValue={integrationValue}
            integrationId={integrationId}
            integrationName={integrationName}
            onSubmit={handleCreate}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </>
  );
};

export default CreateTargetSystem;