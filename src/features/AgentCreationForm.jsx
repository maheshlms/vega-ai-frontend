import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';

const AgentCreationForm = () => {
  const navigate = useNavigate();
  const { targetId, agentTypeId } = useParams();
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [formData, setFormData] = React.useState({
    agentName: '',
    environment: '',
    notificationWindow: 30,
    slackChannel: '#alerts'
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  // Fetch target system and load environment
  React.useEffect(() => {
    const loadTargetEnvironment = async () => {
      try {
        if (!targetId) return;
        const target = await api.targetSystems.get(targetId);
        if (target?.environment) {
          setFormData(prev => ({
            ...prev,
            environment: target.environment
          }));
        }
      } catch (err) {
        console.error('Failed to load target environment:', err);
      }
    };
    loadTargetEnvironment();
  }, [targetId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'notificationWindow' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        name: formData.agentName,
        type: agentTypeId || 'license',
        description: `${agentTypeId ? agentTypeId.charAt(0).toUpperCase() + agentTypeId.slice(1) : 'License'} agent for ${formData.environment || 'environment'} (target ${targetId})`,
        checkInterval: 3600,
        config: {
          environment: formData.environment,
          notificationWindow: formData.notificationWindow,
          slackChannel: formData.slackChannel,
          targetId: targetId,
          agentTypeId: agentTypeId
        }
      };

      await api.llmRuntime.createAgent(payload);
      setShowSuccess(true);
    } catch (err) {
      console.error('Failed to create agent', err);
      setError(err?.message || 'Failed to create agent');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccess = () => {
    setShowSuccess(false);
    navigate('/agents');
  };

  const handleReset = () => {
    setFormData({
      agentName: '',
      environment: '',
      notificationWindow: 30,
      slackChannel: '#alerts'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-scaleIn border border-white/20">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-pulse-gentle">
                <FaCheckCircle className="text-white text-3xl" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              License Agent Created!
            </h2>
            <p className="text-gray-600 mb-8">
              Your license monitoring agent is now active
            </p>
            
            <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-xl p-5 mb-8 border border-gray-100">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">Agent Name</span>
                <span className="font-semibold text-gray-900">{formData.agentName}</span>
              </div>
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">Environment</span>
                <span className="font-semibold text-gray-900">{formData.environment}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Notification Window</span>
                <span className="font-semibold text-gray-900">{formData.notificationWindow} days</span>
              </div>
            </div>

            <button
              onClick={handleSuccess}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 flex items-start justify-center min-h-screen p-8 pt-20">
        <div className="w-full max-w-2xl">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="group text-gray-700 hover:text-gray-900 mb-6 flex items-center gap-2 transition-all duration-300 text-sm font-medium"
          >
            <span className="inline-block transform group-hover:-translate-x-1 transition-transform duration-300">←</span>
            <span>Back</span>
          </button>

          {/* Form Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden animate-slideUp">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-white/50 to-blue-50/30">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <span className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">+</span>
                  <span className="font-medium">Create Your AI Agents</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  License Agent
                </h1>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all duration-300 hover:scale-110"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-6">
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-100 text-red-700 px-4 py-3 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-5">
                {/* Agent Name */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Agent Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="agentName"
                    value={formData.agentName}
                    onChange={handleInputChange}
                    placeholder="e.g., Production License Monitor"
                    required
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-gray-400 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:border-gray-300"
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>💡</span>
                    <span>Give your agent a descriptive name</span>
                  </p>
                </div>

                {/* Environment */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Environment <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="environment"
                    value={formData.environment}
                    onChange={handleInputChange}
                    placeholder="e.g., production, staging, development"
                    required
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-gray-400 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:border-gray-300"
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>💡</span>
                    <span>Specify the deployment environment for this agent</span>
                  </p>
                </div>

                {/* Notification Window (Number Input) */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Notification Window (days) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="notificationWindow"
                    value={formData.notificationWindow}
                    onChange={handleInputChange}
                    min="1"
                    max="365"
                    required
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-300 hover:border-gray-300"
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>💡</span>
                    <span>Number of days before license expiry to send notifications</span>
                  </p>
                </div>

                {/* Slack Channel (Read-only, only option) */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Notification Channel
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="slackChannel"
                      value="Slack"
                      readOnly
                      className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <span className="text-2xl">💬</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>💡</span>
                    <span>Alerts will be sent to your configured Slack channel: {formData.slackChannel}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 px-6 py-3 bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 border-2 border-yellow-200 hover:border-yellow-300 text-yellow-700 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                >
                  <span className="text-lg">🔄</span>
                  <span>Reset</span>
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Create Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-gentle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }

        .animate-pulse-gentle {
          animation: pulse-gentle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AgentCreationForm;