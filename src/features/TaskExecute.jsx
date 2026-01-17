import React, { useState } from 'react';
import { IoArrowBackCircle } from "react-icons/io5";
import { FaPlus } from "react-icons/fa6";
import { FaCheckCircle } from "react-icons/fa";
import { GoGraph } from "react-icons/go";
import { TiFlashOutline, TiTickOutline } from "react-icons/ti";
import { GoClock } from "react-icons/go";
import { CiPause1 } from "react-icons/ci";
import { BsChatLeftText } from "react-icons/bs";
import { SiSimpleanalytics } from "react-icons/si";

const TaskExecute = () => {
  // Processing state for task execution
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Agent data
  const [agentData] = useState({
    name: "Astra",
    role: "Ping Federate Agent",
    status: "Awaiting",
    mode: "Expert Mode",
    verified: true,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
  });

  // Stats data
  const stats = [
    { 
      icon: GoClock, 
      value: "4", 
      description: "Task Pending", 
      iconcolor: "#60A5FA",
    },
    { 
      icon: GoGraph, 
      value: "99.5%", 
      description: "Success Rate", 
      iconcolor: "#22C55E",
    },
    { 
      icon: TiFlashOutline, 
      value: "1.2s", 
      description: "Avg Response", 
      iconcolor: "#A78BFA",
    },
    { 
      icon: TiTickOutline, 
      value: "47", 
      description: "Tasks today", 
      iconcolor: "#F97316",
    }
  ];

  // Recent actions
  const recentActions = [
    { 
      id: 1,
      title: "User provisioning approved", 
      time: "2 hours ago",
    },
    { 
      id: 2,
      title: "Access policy review completed", 
      time: "5 hours ago",
    },
    { 
      id: 3,
      title: "Password reset executed", 
      time: "1 day ago",
    }
  ];

  // Execution steps
  const executionSteps = [
    { id: 1, text: "Verify certificate expiration date" },
    { id: 2, text: "Generate new CSR (Certificate Signing Request)" },
    { id: 3, text: "Submit renewal to certificate authority" },
    { id: 4, text: "Install new certificate" },
    { id: 5, text: "Test authentication flow" },
    { id: 6, text: "Update documentation" }
  ];

  // Quick actions
  const quickActions = [
    { 
      id: 1,
      label: "Pause Agent", 
      icon: CiPause1,
    },
    { 
      id: 2,
      label: "Chat with Agent", 
      icon: BsChatLeftText,
    },
    { 
      id: 3,
      label: "View Analytics", 
      icon: SiSimpleanalytics,
    }
  ];

  // Handle task approval
  const handleApproveTask = async () => {
    setIsProcessing(true);
    setIsCompleted(false);
    setShowSuccess(false);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setIsProcessing(false);
            setShowSuccess(true);
          }, 500);
          return 100;
        }
        return prev + 20;
      });
    }, 1000);
  };

  const handleDenyTask = () => {
    alert('Task denied');
  };

  const handleQuickAction = (actionType) => {
    console.log(`Quick action: ${actionType}`);
  };

  const handleCreateNewAgent = () => {
    console.log('Create new agent clicked');
  };

  const handleGoBack = () => {
    console.log('Go back clicked');
  };

  const handleResetTask = () => {
    setIsProcessing(false);
    setIsCompleted(false);
    setShowSuccess(false);
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* SUCCESS OVERLAY - Full Page */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center transform animate-scaleIn">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                <FaCheckCircle className="text-white text-5xl" />
              </div>
            </div>
            
            {/* Success Message */}
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Success!
            </h2>
            
            <p className="text-gray-600 mb-6">
              The SSL certificate renewal has been completed successfully. All systems are operational and secure.
            </p>

            {/* Stats */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">Steps Completed</span>
                <span className="font-bold text-green-600">6/6</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Time Taken</span>
                <span className="font-bold text-green-600">5 seconds</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleResetTask}
              className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <div className="px-4 sm:px-6 lg:px-10 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={handleGoBack}
            className="hover:opacity-70 transition-opacity"
            aria-label="Go back"
          >
            <IoArrowBackCircle className="text-3xl text-gray-700" />
          </button>
          <div>
            <p className="text-xs sm:text-sm text-gray-500">Create Your AI Agents</p>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Agent Control Center
            </h1>
          </div>
        </div>

        <button 
          onClick={handleCreateNewAgent}
          className="bg-blue-500 hover:bg-blue-600 px-4 h-10 text-white rounded-md flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
        >
          <FaPlus />
          <span>Create New Agent</span>
        </button>
      </div>

      {/* STATS SECTION */}
      <div className="px-4 sm:px-6 lg:px-11 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                className="rounded-xl shadow-lg bg-white p-4 sm:p-6 hover:shadow-xl transition-shadow" 
                key={index}
              >
                <div className="flex justify-start mb-3">
                  <div className="w-10 h-10 shadow-md rounded-xl flex items-center justify-center bg-white">
                    <Icon style={{ color: item.iconcolor }} size={20} />
                  </div>
                </div>

                <div className="text-2xl sm:text-3xl font-semibold text-gray-900 my-2">
                  {item.value}
                </div>

                <div className="mt-3">
                  <h2 className="text-gray-500 text-sm font-medium">
                    {item.description}
                  </h2>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="px-4 sm:px-6 lg:px-12 pb-8">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* LEFT COLUMN */}
          <div className="w-full lg:w-[65%] space-y-6">
            
            {/* Agent Card */}
            <div className="bg-white shadow-xl rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-yellow-400 shadow-md flex-shrink-0">
                {!imageError ? (
                  <img
                    src={agentData.avatar}
                    alt={agentData.name}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                    {agentData.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col flex-1">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {agentData.name}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {agentData.role}
                </p>

                {/* Status badges */}
                <div className="flex flex-wrap gap-2 sm:gap-3 mt-4">
                  <span className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-full bg-yellow-100 text-yellow-700 font-medium flex items-center gap-1">
                    <GoClock size={14} />
                    {agentData.status}
                  </span>

                  <span className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-full border-2 border-blue-500 text-blue-500 font-medium">
                    {agentData.mode}
                  </span>

                  {agentData.verified && (
                    <span className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-full bg-green-100 text-green-600 font-medium">
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Task Execution Card - Two States */}
            {isProcessing ? (
              // PROCESSING STATE
              <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                <div className="bg-blue-50 p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                        Agent is executing the approved task
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Please wait while the certificate renewal completes...
                      </p>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-lg font-bold text-blue-600">{progress}%</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>

                    {/* Current Step Info */}
                    <div className="bg-white rounded-lg p-3 mt-4">
                      <p className="text-xs sm:text-sm text-gray-700">
                        <span className="font-semibold">Current Step:</span>{' '}
                        {executionSteps[Math.min(Math.floor(progress / 20), executionSteps.length - 1)]?.text || 'Initializing...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // INITIAL STATE
              <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-orange-50 p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="flex gap-3 sm:gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      ⚠️
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                        Certificate Renewal Request
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        Agent has identified that the SSL certificate for sso.company.com will expire in 2 days
                        and is requesting permission to initiate the renewal process.
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-600 whitespace-nowrap">
                    Low Risk
                  </span>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-5">
                  {/* Affected Systems */}
                  <div className="mb-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Affected Systems
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm text-gray-600">
                        sso.company.com
                      </span>
                      <span className="px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm text-gray-600">
                        Production Environment
                      </span>
                      <span className="px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm text-gray-600">
                        Authentication Service
                      </span>
                    </div>
                  </div>

                  {/* Execution Steps */}
                  <div className="mb-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Execution Steps
                    </h3>

                    <div className="space-y-2">
                      {executionSteps.map((step, i) => (
                        <div 
                          key={step.id} 
                          className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-md p-2 sm:p-3 hover:bg-gray-100 transition-colors"
                        >
                          <span className="w-6 h-6 rounded-full bg-gray-300 text-xs flex items-center justify-center font-medium text-gray-700 flex-shrink-0">
                            {i + 1}
                          </span>
                          <p className="text-xs sm:text-sm text-gray-700">
                            {step.text}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Estimated Time */}
                    <div className="mt-3 flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-md text-xs sm:text-sm">
                      ⏱ Estimated completion time: 15 minutes
                    </div>
                  </div>

                  {/* Confirmation Text */}
                  <div className="border-t border-gray-200 pt-4 text-center text-xs sm:text-sm text-gray-600 mb-4">
                    Are you sure you want the AI Agent to complete this task?
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                    <button 
                      onClick={handleApproveTask}
                      className="flex-1 px-4 sm:px-5 py-2 sm:py-2.5 rounded-md border-2 border-green-500 text-green-600 bg-green-50 hover:bg-green-100 font-semibold text-sm transition-colors"
                    >
                      Yes – Approve & Execute
                    </button>

                    <button 
                      onClick={handleDenyTask}
                      className="flex-1 px-4 sm:px-5 py-2 sm:py-2.5 rounded-md border-2 border-red-500 text-red-600 bg-red-50 hover:bg-red-100 font-semibold text-sm transition-colors"
                    >
                      No & Deny
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="w-full lg:w-[35%] space-y-5">
            {/* Recent Actions */}
            <div className="bg-white rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold">
                <span>⚡</span>
                <span className="text-sm sm:text-base">Recent Actions</span>
              </div>

              <div className="space-y-2">
                {recentActions.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-100 px-3 py-2 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-900 truncate">
                        {item.title}
                      </p>
                      <span className="text-xs text-gray-500">
                        {item.time}
                      </span>
                    </div>
                    <span className="text-green-500 text-lg ml-2 flex-shrink-0">✔</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow-lg rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">
                Quick Actions
              </h3>

              <div className="space-y-2">
                {quickActions.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleQuickAction(item.label)}
                      className="w-full flex items-center justify-center gap-2 bg-white shadow-sm border border-gray-200 rounded-md py-2 sm:py-2.5 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 hover:shadow transition-all"
                    >
                      <IconComponent className="text-base sm:text-lg" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Approval Required Info */}
            <div className="border border-blue-400 bg-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-blue-600 font-semibold mb-2 text-sm">
                <span>ℹ</span>
                <span>Approval Required</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                This agent is in Guided Mode and requires human approval for critical actions.
                You can switch to Expert Mode in agent settings for full autonomy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskExecute;