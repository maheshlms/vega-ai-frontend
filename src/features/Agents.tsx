import React, { useCallback, useState, useEffect } from 'react';
import { FaPlus, FaTrash } from "react-icons/fa6";
import { GoPeople, GoGraph } from "react-icons/go";
import { TiFlashOutline, TiTickOutline } from "react-icons/ti";
import { MdOutlineStar } from "react-icons/md";
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { IconType } from 'react-icons';

interface Agent {
  id: string;
  name: string;
  role: string;
  type: string;
  image: string;
  tasks: string;
  success: string;
  status: string;
  environment?: string;
  isDefault: boolean;
}

interface TargetSystem {
  id?: string;
  _id?: string;
  type?: string;
}

interface StatData {
  icon: IconType;
  value: string;
  description: string;
  sub: string;
  iconcolor: string;
}

const Agents: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);

  // Load agents from LLM Runtime
  useEffect(() => {
    // Helper function to convert system type from snake_case to Title Case
    const formatSystemTypeName = (systemType: string): string => {
      if (!systemType) return 'System';
      return systemType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    const fetchAgents = async () => {
      try {
        // Fetch target systems to create ID->Type mapping
        let targetSystemMap: Record<string, string> = {};
        try {
          const targetSystems = await api.targetSystems.list();
          if (Array.isArray(targetSystems)) {
            targetSystems.forEach((system: TargetSystem) => {
              const id = system.id || system._id;
              if (id && system.type) {
                targetSystemMap[id] = system.type;
              }
            });
          }
        } catch (err) {
          console.warn('Failed to fetch target systems for mapping:', err);
        }

        const remoteAgents = await api.llmRuntime.listAgents();
        const normalized: Agent[] = (remoteAgents || []).map((agent: any) => {
          // Extract target ID from description
          let systemTypeName = `${agent.type} Agent`;
          
          // Try to extract target ID from description (format: "...agent (target <UUID>)")
          const targetMatch = (agent.description || '').match(/\(target\s+([a-f0-9\-]+)\)/);
          if (targetMatch) {
            const targetId = targetMatch[1];
            const systemType = targetSystemMap[targetId];
            if (systemType) {
              // Format the system type name
              systemTypeName = `${formatSystemTypeName(systemType)} Agent`;
            }
          }

          return {
            id: agent.id,
            name: agent.name,
            role: systemTypeName,
            type: agent.type,
            image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop",
            tasks: agent.checkInterval ? Math.max(1, Math.floor(86400 / agent.checkInterval)).toString() : '0',
            success: agent.status === 'active' ? '100%' : '0%',
            status: agent.status || 'active',
            environment: agent.config?.environment,
            isDefault: false
          };
        });

        setAgents(normalized);
      } catch (err) {
        console.error('Failed to fetch agents', err);
        setError('Unable to load agents from runtime');
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const handleCreateAgent = useCallback(() => {
    navigate('/agents/select-target');
  }, [navigate]);

  // Recalculate stats based on actual agents
  const totalAgents = agents.length;
  const activeAgents = agents.filter(a => a.status === 'active').length;
  const totalTasks = agents.reduce((sum, agent) => sum + parseInt(agent.tasks || '0'), 0);

  const data: StatData[] = [
    { icon: GoPeople, value: totalAgents.toString(), description: "Total Agents", sub: "+1 this month", iconcolor: "#60A5FA" },
    { icon: TiFlashOutline, value: activeAgents.toString(), description: "Active Now", sub: "75% uptime", iconcolor: "#22C55E" },
    { icon: TiTickOutline, value: totalTasks.toFixed(0), description: "Tasks Completed", sub: "+12% vs last week", iconcolor: "#A78BFA" },
    { icon: GoGraph, value: "97.5%", description: "Avg Success Rate", sub: "+2.3% improvement", iconcolor: "#F97316" }
  ];

  const handleExecute = useCallback(() => {
    navigate('/agents/agentchat/execute');
  }, [navigate]);

  // Handle delete button click
  const handleDeleteClick = useCallback((e: React.MouseEvent, agent: Agent) => {
    e.stopPropagation(); // Prevent card click from firing
    setAgentToDelete(agent);
    setShowDeleteModal(true);
  }, []);

  // Confirm delete
  const confirmDelete = useCallback(() => {
    if (agentToDelete) {
      const removeAgent = async () => {
        try {
          await api.llmRuntime.deleteAgent(agentToDelete.id);
          setAgents(prev => prev.filter(a => a.id !== agentToDelete.id));
        } catch (err: any) {
          console.error('Failed to delete agent', err);
          alert('Failed to delete agent: ' + err.message);
        } finally {
          setShowDeleteModal(false);
          setAgentToDelete(null);
        }
      };

      removeAgent();
    }
  }, [agentToDelete]);

  // Cancel delete
  const cancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setAgentToDelete(null);
  }, []);

  return (
    <div className="bg-[#F9FAFB] min-h-screen pb-10">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scaleIn">
            {/* Warning Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <FaTrash className="text-red-600 text-2xl" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
              Delete Agent?
            </h2>

            {/* Agent Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <img 
                  src={agentToDelete?.image} 
                  alt={agentToDelete?.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-900">{agentToDelete?.name}</p>
                  <p className="text-sm text-gray-500">{agentToDelete?.role}</p>
                </div>
              </div>
              {agentToDelete?.environment && (
                <p className="text-xs text-gray-500">
                  Environment: <span className="font-medium text-gray-700">{agentToDelete?.environment}</span>
                </p>
              )}
            </div>

            {/* Warning Message */}
            <p className="text-gray-600 text-center mb-8">
              Are you sure you want to delete this agent? This action cannot be undone. 
              All monitoring and automation for this agent will be stopped.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1920px] mx-auto px-6">
        <div className="pt-4">

          {/* HEADER */}
          <div className="heading flex justify-between items-start">
            <div>
              <div className="font-bold text-2xl">AI Agents</div>
              <div className="text-[#9CA3AF]">Manage and monitor your AI-powered IAM agents</div>
            </div>

            <button className="bg-blue-500 px-4 h-10 text-white rounded-md flex items-center gap-2 hover:bg-blue-600 transition-colors whitespace-nowrap"
            onClick={handleCreateAgent}
            >
              <FaPlus />
              <span>Create New Agent</span>
            </button>
          </div>

          {/* STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-6 mb-8">
            {data.map((items, index) => {
              const Icon = items.icon;

              return (
                <div className="rounded-xl h-45 w-50 shadow-xl bg-white p-4" key={index}>
                  {/* Icon at top */}
                  <div className="flex justify-start mb-3">
                    <div className="w-10 h-10 shadow-lg rounded-xl flex items-center justify-center bg-white">
                      <Icon style={{ color: items.iconcolor }} size={20} />
                    </div>
                  </div>

                  {/* Value - Centered */}
                  <div className="flex items-center justify-center text-3xl font-bold text-slate-900 my-2">
                    {items.value}
                  </div>

                  {/* Description and Sub - Centered */}
                  <div className="text-center mt-3">
                    <h2 className="text-[#6B7280] text-sm font-medium">{items.description}</h2>
                    <p className="text-xs text-[#9CA3AF] mt-1">{items.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* EXPERT MODE SECTION */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              {/* Star Icon */}
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <MdOutlineStar className="text-gray-600" size={24} />
              </div>
              {/* Text Content */}
              <div>
                <h2 className="font-bold text-2xl text-black">Available Agents</h2>
              </div>
            </div>
          </div>

          {/* AGENT CARDS */}
          {loading ? (
            <div className="flex items-center justify-center p-12 w-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : agents.length === 0 ? (
            <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-500 text-lg">No agents configured. Ask your admin to create one.</p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-6">
              {agents.map((agent, index) => (
                <div 
                  key={agent.id || index}
                  className="bg-white w-55 h-82 rounded-2xl p-6 shadow-sm border border-gray-200 relative hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => navigate(`/agents/${agent.id}/chat`, { state: { agent } })}
                >
                  {/* Delete Button - Top Left */}
                  <button
                    onClick={(e) => handleDeleteClick(e, agent)}
                    className="absolute top-3 left-3 w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
                    title="Delete agent"
                  >
                    <FaTrash className="text-sm" />
                  </button>

                  {/* Green Active Dot - Top Right */}
                  {agent.status === 'active' && (
                    <div className="absolute top-3 right-3">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    </div>
                  )}

                  {/* Profile Image - Centered */}
                  <div className="flex justify-center mb-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden p-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                      <img 
                        src={agent.image} 
                        alt={agent.name}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop';
                        }}
                      />
                    </div>
                  </div>

                  {/* Type Badge - Centered */}
                  <div className="flex justify-center mb-2">
                    <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded text-xs font-medium">
                      {agent.type}
                    </div>
                  </div>

                  {/* Agent Name - Centered */}
                  <h3 className="text-center text-xl font-bold text-black mb-1">{agent.name}</h3>
                  
                  {/* Agent Role - Centered */}
                  <p className="text-center text-sm text-gray-600 mb-4">{agent.role}</p>

                  {/* Stats - Side by Side */}
                  <div className="flex justify-center items-center gap-8">
                    <div className="text-center w-18 h-12 rounded-md shadow-md flex flex-col justify-center">
                      <div className="text-md font-bold text-black">{agent.tasks || '0'}</div>
                      <div className="text-xs text-gray-500">Task</div>
                    </div>
                    <div className="text-center w-18 h-12 rounded-md shadow-md flex flex-col justify-center">
                      <div className="text-md font-bold text-emerald-600">{agent.success || '100%'}</div>
                      <div className="text-xs text-gray-500">Success</div>
                    </div>
                  </div>

                  {/* Environment Badge (if available) */}
                  {agent.environment && (
                    <div className="mt-4 text-center">
                      <span className="text-xs text-gray-500">
                        Environment: <span className="font-medium text-gray-700">{agent.environment}</span>
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      <style>{`
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

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Agents;