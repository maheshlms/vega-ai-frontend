import React from 'react';

// Icon imports from react-icons
import { 
  MdSecurity,
  MdOutlineShield
} from 'react-icons/md';

import { 
  HiUserGroup,
  HiDocumentText
} from 'react-icons/hi';

import { 
  IoMdRefreshCircle,
  IoMdSettings
} from 'react-icons/io';

import { 
  IoNotifications
} from 'react-icons/io5';

import { RiRobotFill } from 'react-icons/ri';
import { FaUsersCog, FaPlug } from 'react-icons/fa';
import { FaArrowRightLong } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';
import { useUser } from '../utils/UserContext'; // Import the context hook

const Settings = () => {
  const { userName } = useUser(); // Get userName from context
  const navigate = useNavigate();

  const topcard = [
    { key: "User Name", value: userName, role: "User Role", roleval: "Admin", btn: "Rename", path: "/settings/rename" },
    { key: "Agents", value: "4", role: "Agent Health", roleval: "Active", btn: "View Agents", path: "/agents" },
    { key: "Plan", value: "Basic", role: "Expires On", roleval: "19/10/2026", btn: "View Plans", path: "/setting/plans" }
  ];

  const iamSettings = [
    {
      id: 'authentication',
      title: 'Authentication',
      description: 'MFA, password policies, session timeout, SSO',
      icon: MdSecurity,
      route: '/settings/authentication'
    },
    {
      id: 'identity-providers',
      title: 'Identity Providers',
      description: 'PingOne, Okta, Azure AD, SAML/OIDC setup',
      icon: HiUserGroup,
      route: '/settings/identity-providers'
    },
    {
      id: 'provisioning',
      title: 'Provisioning',
      description: 'Auto-provisioning, user sync, deprovisioning, workflows',
      icon: IoMdRefreshCircle,
      route: '/settings/provisioning'
    },
    {
      id: 'ai-agents',
      title: 'AI Agents',
      description: 'Agent settings, permissions, expert mode, behaviors',
      icon: RiRobotFill,
      route: '/settings/ai-agents'
    },
    {
      id: 'security',
      title: 'Security',
      description: 'IP whitelisting, 2FA, API security, session management',
      icon: MdOutlineShield,
      route: '/settings/security'
    },
    {
      id: 'users-groups',
      title: 'Users & Groups',
      description: 'User management, group sync, roles, permissions',
      icon: FaUsersCog,
      route: '/settings/users-groups'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Email alerts, Slack, security alerts, activity notifications',
      icon: IoNotifications,
      route: '/settings/notifications'
    },
    {
      id: 'audit-logs',
      title: 'Audit & Logs',
      description: 'Audit logging, activity history, compliance reports',
      icon: HiDocumentText,
      route: '/settings/audit-logs'
    },
    {
      id: 'api-integrations',
      title: 'API & Integrations',
      description: 'API keys, webhooks, connected apps, rate limits',
      icon: FaPlug,
      route: '/settings/api-integrations'
    },
    {
      id: 'general',
      title: 'General',
      description: 'Organization profile, timezone, language, branding',
      icon: IoMdSettings,
      route: '/settings/general'
    }
  ];

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="w-250 rounded-md h-270">
        <div className="p-4 flex items-center">
          <h1 className="text-2xl font-semibold px-2 text-gray-800">Settings</h1>
        </div>
        
        <div className="aboutagentand userw-full h-45 p-7 flex items-center gap-6">
          {topcard.map((items, index) => {
            return (
              <div 
                className="card1 bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg hover:shadow-xl w-65 h-35 rounded-xl hover:scale-105 hover:shadow-indigo-500/50 transition-all duration-300 cursor-pointer" 
                key={index}
              >
                <div className="p-3">
                  <h1 className="text-white/90 text-sm font-medium">{items.key}</h1>
                  <h1 className="text-white text-2xl font-bold mt-1">{items.value}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <h1 className="text-white/80 text-xs">{items.role} : </h1>
                    <p className="text-white text-xs font-semibold">{items.roleval}</p>
                  </div>
                  <button 
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-1 rounded-lg text-white mt-3 px-3 text-sm font-medium transition-all duration-200 hover:scale-105 shadow-md" 
                    onClick={() => navigate(items.path)}
                  >
                    {items.btn}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="w-full h-200">
          <div className="p-7">
            {iamSettings.map((items, index) => {
              return (
                <div 
                  className="w-[99%] h-18 bg-white border border-gray-200 shadow-md hover:shadow-lg hover:shadow-indigo-200/50 rounded-xl mb-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-indigo-300 transition-all duration-300 cursor-pointer group" 
                  key={index}
                  onClick={() => navigate(items.route)}
                > 
                  <div className="flex items-center justify-between px-4-">
                    <div className="flex items-center gap-6 p-2">
                      <span className="px-4 text-indigo-600 group-hover:text-indigo-700 transition-colors duration-200">
                        <items.icon size={22} />
                      </span>
                      <div className="px-2">
                        <h1 className="text-gray-800 font-semibold group-hover:text-indigo-700 transition-colors duration-200">{items.title}</h1>
                        <p className="text-gray-500 text-sm group-hover:text-gray-600 transition-colors duration-200">{items.description}</p>
                      </div>
                    </div>
                    <div className="px-4">
                      <span className="text-xs text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all duration-200 inline-block">
                        <FaArrowRightLong size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;