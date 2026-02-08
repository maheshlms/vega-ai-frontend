import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import TargetSystemForm from './TargetSystemForm';
import api from '../utils/api';
import { toast } from 'react-toastify';

const CreateTargetSystem = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get integration details from route state
  const integrationId = location.state?.integrationId;
  const integrationName = location.state?.integrationName;
  const integrationValue = location.state?.integrationValue;
  const authMethods = location.state?.authMethods || [];
  
  const [loading, setLoading] = useState(false);

  const handleCreate = async (data) => {
    console.log('[CreateTargetSystem] handleCreate called with data:', data);
    setLoading(true);
    try {
      const result = await api.targetSystems.create(data);
      console.log('[CreateTargetSystem] Create successful:', result);
      toast.success('Target system created successfully!');
      // Navigate back to the target systems list
      navigate('/admin/avatarsys');
    } catch (err) {
      console.error('[CreateTargetSystem] Error creating target system:', err);
      toast.error('Failed to create target system: ' + err.message);
      setLoading(false);
    }
  };

  const handleCancel = () => {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* <div className="bg-white border-b border-gray-200 px-6 py-6 ">
        <button
          onClick={() => navigate('/admin/targetsys')}
          className="group text-sm text-gray-500 hover:text-gray-900 flex items-center gap-2 transition-colors mb-1"
        >
          <FaArrowLeft className="transform group-hover:-translate-x-1 transition-transform" />
          <span>Back to Integrations</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Create {integrationName || 'Target System'}
          </h1>
          <p className="text-sm text-gray-500">
            Configure your new {integrationName || 'target system'} connection
          </p>
        </div>
      </div> */}

      {/* Form Container */}
      <div className="px-6 py-8 flex justify-center">
        <div className="w-full max-w-2xl">
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
    </div>
  );
};

export default CreateTargetSystem;