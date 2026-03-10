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

  const handleCreate = async (data: TargetSystemData): Promise<void> => {
    console.log('[CreateTargetSystem] handleCreate called with data:', data);
    setLoading(true);
    try {
      const result = await api.targetSystems.create(data);
      console.log('[CreateTargetSystem] Create successful:', result);
      toast.success('Target system created successfully!');
      navigate('/systems');
    } catch (err) {
      console.error('[CreateTargetSystem] Error creating target system:', err);
      toast.error('Failed to create target system: ' + (err as Error).message);
      setLoading(false);
      // Re-throw so TargetSystemForm knows the submission failed and won't show success modal
      throw err;
    }
  };

  const handleCancel = (): void => {
    console.log('[CreateTargetSystem] Cancel clicked');
    navigate('/systems/targetsys');
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
      `}</style>
      <div className="cts-font min-h-screen bg-[#FAFAFA]">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-12 max-md:px-5">
          <div className="max-w-[1400px] mx-auto pt-10 pb-8">
            <button
              onClick={() => navigate('/systems/targetsys')}
              className="flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-700 mb-3 transition-colors"
            >
              <FaArrowLeft size={12} />
              <span>Back to Integrations</span>
            </button>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#0A0A0A] max-md:text-3xl mb-2">
              {integrationName ? `Configure ${integrationName}` : 'Create Target System'}
            </h1>
            <p className="text-[15px] text-gray-500 font-normal leading-relaxed m-0">
              {integrationName
                ? `Set up your ${integrationName} connection`
                : 'Configure a new target system connection'}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-[1400px] mx-auto px-12 py-10 max-md:px-5">
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