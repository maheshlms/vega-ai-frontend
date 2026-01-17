import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';

const AgentCreationForm = () => {
  const navigate = useNavigate();
  const { integrationId, agentTypeId } = useParams();
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [formData, setFormData] = React.useState({
    aiAvatar: 'Astra',
    agentName: '',
    environment: '',
    alertWindow: '30',
    notification: true,
    notificationChannel: 'Slack',
    description: ''
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Creating agent:', formData);
    setShowSuccess(true);
  };

  const handleSuccess = () => {
    setShowSuccess(false);
    navigate('/agents/createagent');
  };

  const handleReset = () => {
    setFormData({
      aiAvatar: 'Astra',
      agentName: '',
      environment: '',
      alertWindow: '30',
      notification: true,
      notificationChannel: 'Slack',
      description: ''
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
              Agent Created Successfully
            </h2>
            <p className="text-gray-600 mb-8">
              Your {agentTypeId} agent is now active and monitoring
            </p>
            
            <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-xl p-5 mb-8 border border-gray-100">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">Agent Name</span>
                <span className="font-semibold text-gray-900">{formData.agentName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Environment</span>
                <span className="font-semibold text-gray-900">{formData.environment}</span>
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
        <div className="w-full max-w-3xl">
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
              <div className="space-y-5">
                {/* AI Avatar */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    AI Avatar <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="aiAvatar"
                    value={formData.aiAvatar}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-300 hover:border-gray-300"
                  >
                    <option value="Astra">Astra</option>
                    <option value="Nova">Nova</option>
                    <option value="Zenith">Zenith</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>💡</span>
                    <span>Choose an AI personality that will represent this agent</span>
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

                {/* Alert Window */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Alert Window <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="alertWindow"
                    value={formData.alertWindow}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-300 hover:border-gray-300"
                  >
                    <option value="30">30 days, 60 days, etc</option>
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>💡</span>
                    <span>Define how far ahead this agent should schedule tasks</span>
                  </p>
                </div>

                {/* Notification */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Notification <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex-1">
                      <input
                        type="radio"
                        name="notification"
                        checked={formData.notification === true}
                        onChange={() => setFormData(prev => ({ ...prev, notification: true }))}
                        className="sr-only peer"
                      />
                      <div className="flex items-center justify-center gap-2 px-5 py-3 text-sm border-2 rounded-xl cursor-pointer transition-all duration-300 peer-checked:border-blue-500 peer-checked:bg-gradient-to-br peer-checked:from-blue-50 peer-checked:to-blue-100/50 peer-checked:text-blue-700 peer-checked:shadow-lg border-gray-200 text-gray-700 hover:border-gray-300 bg-white/70 backdrop-blur-sm">
                        <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center peer-checked:border-blue-500 border-gray-300 transition-all duration-300">
                          {formData.notification === true && <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>}
                        </span>
                        <span className="font-semibold">Yes</span>
                      </div>
                    </label>
                    <label className="flex-1">
                      <input
                        type="radio"
                        name="notification"
                        checked={formData.notification === false}
                        onChange={() => setFormData(prev => ({ ...prev, notification: false }))}
                        className="sr-only peer"
                      />
                      <div className="flex items-center justify-center gap-2 px-5 py-3 text-sm border-2 rounded-xl cursor-pointer transition-all duration-300 peer-checked:border-blue-500 peer-checked:bg-gradient-to-br peer-checked:from-blue-50 peer-checked:to-blue-100/50 peer-checked:text-blue-700 peer-checked:shadow-lg border-gray-200 text-gray-700 hover:border-gray-300 bg-white/70 backdrop-blur-sm">
                        <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center peer-checked:border-blue-500 border-gray-300 transition-all duration-300">
                          {formData.notification === false && <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>}
                        </span>
                        <span className="font-semibold">No</span>
                      </div>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>💡</span>
                    <span>Enable notifications for agent activities and alerts</span>
                  </p>
                </div>

                {/* Notification Channel */}
                {formData.notification && (
                  <div className="animate-fadeIn">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Notification Channel <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="notificationChannel"
                      value={formData.notificationChannel}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-300 hover:border-gray-300"
                    >
                      <option value="Slack">Slack</option>
                      <option value="Email">Email</option>
                      <option value="SMS">SMS</option>
                      <option value="Teams">Teams</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <span>💡</span>
                      <span>Choose where you want to receive notifications</span>
                    </p>
                  </div>
                )}
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  Create Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
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