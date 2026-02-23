import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Location } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { UserProvider } from './utils/UserContext';

// Auth
import LoginPage from './features/auth/LoginPage';
import Callback from './features/auth/Callback';
import Logout from './features/auth/Logout';

// Effects
import MouseMove from './effects/MouseMove';

// Layouts
import TopBar from './layouts/TopBar';
import Sidebar from './layouts/Sidebar';

// Agents
import Agents from './features/agents/Agents';
import AgentChat from './features/agents/AgentChat';
import AgentCreationForm from './features/agents/AgentCreationForm';
import AgentTypeSelection from './features/agents/AgentTypeSelection';
import AiAssist from './features/agents/AiAssist';
import  DirectoryAgentChat from './features/agents/DirectoryAgentChat';
// import TaskExecute from './features/agents/TaskExecute';

// Admin
import AdminSidebar from './features/admin/AdminSidebar';
import AdminAgentControll from './features/admin/AdminAgentControll';
import TargetSystemIntegration from './features/admin/TargetSystemIntegration';
import AvailableIntegration from './features/admin/AvailableIntegration';
import TargetSystemShow from './features/admin/TargetSystemShow';
import CreateTargetSystem from './features/admin/CreateTargetSystem';
import TargetSystems from './features/admin/TargetSystems';
import IntegrationsPage from './features/admin/IntegrationsPage';

// Audit
import AuditLogs from './features/audit/AuditLogs';

// Settings
import Settings from './features/settings/Settings';
import GeneralSetting from './features/settings/GeneralSetting';
import AuthenticationSetting from './features/settings/AuthenticationSetting';
import IdentityProviderSetting from './features/settings/IdentityProviderSetting';
import ProvisioningSetting from './features/settings/ProvisioningSetting';
import AiAgentSetting from './features/settings/AiAgentSetting';
import SecuritySetting from './features/settings/SecuritySetting';
import UserGroupSetting from './features/settings/UserGroupSetting';
import NotificationSetting from './features/settings/NotificationSetting';
import AuditLogsSetting from './features/settings/AuditLogsSetting';
import ApiIntegrationSetting from './features/settings/ApiIntigrationSetting';
import Plans from './features/settings/Plans';
import Rename from './features/settings/Rename';

// Components
import ScrollToTop from './components/ScrollToTop';
import { ToastContainer } from 'react-toastify';
import { auth } from './utils/auth';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth0();
  const location: Location = useLocation();
  
  const isLocalAuthenticated: boolean = auth.isAuthenticated();
  const isAuth: boolean = isAuthenticated || isLocalAuthenticated;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Verifying authentication...</p>
      </div>
    );
  }

  if (!isAuth) {
    console.warn('🔒 Access denied - redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const location: Location = useLocation();
  const hideLayout: boolean = 
    location.pathname === '/login' || 
    location.pathname === '/' || 
    location.pathname === '/logout' || 
    location.pathname === '/callback';

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <MouseMove />
      <ToastContainer />
     
      {!hideLayout && <TopBar />}
      
      <div className="flex flex-1 overflow-hidden">
        {!hideLayout && <Sidebar />}
        
        <div 
          id="app-scroll-container"
          className={`flex-1 overflow-y-auto ${!hideLayout ? 'ml-[216px]' : ''}`}
        >
          <ScrollToTop />
          <Routes>

            {/* Default */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/callback" element={<Callback />} />
            <Route path="/logout" element={<Logout />} />

            {/* Agents */}
            <Route path="/agents" element={<ProtectedRoute><Agents /></ProtectedRoute>} />
            <Route path="/agents/:agentId/chat" element={<ProtectedRoute><AgentChat /></ProtectedRoute>} />
            <Route path="/agents/agentchat" element={<ProtectedRoute><AgentChat /></ProtectedRoute>} />
            {/* <Route path="/agents/agentchat/execute" element={<ProtectedRoute><TaskExecute /></ProtectedRoute>} /> */}
            <Route path="/agents/agentchat/aiassist" element={<ProtectedRoute><AiAssist /></ProtectedRoute>} />
            <Route path="/agents/select-target" element={<ProtectedRoute><AvailableIntegration /></ProtectedRoute>} />
            <Route path="/agents/select-type/:integrationType/:targetId" element={<ProtectedRoute><AgentTypeSelection /></ProtectedRoute>} />
            <Route path="/agents/create/:agentTypeId" element={<ProtectedRoute><AgentCreationForm /></ProtectedRoute>} />
            <Route path="/agents/createagent" element={<ProtectedRoute><AgentCreationForm /></ProtectedRoute>} />
            <Route path="/agents/*" element={<Navigate to="/agents" replace />} />
            <Route path="/agents/directory/:agentTypeId" element={<DirectoryAgentChat />} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute><AdminSidebar /></ProtectedRoute>} />
            <Route path="/admin/targetsys" element={<ProtectedRoute><TargetSystemIntegration /></ProtectedRoute>} />
            <Route path="/admin/createtarsys" element={<ProtectedRoute><CreateTargetSystem /></ProtectedRoute>} />
            <Route path="/admin/avatarsys" element={<ProtectedRoute><TargetSystemShow /></ProtectedRoute>} />
            <Route path="/admin/agent" element={<ProtectedRoute><AdminAgentControll /></ProtectedRoute>} />
            <Route path="/admin/integration/target-systems/:integrationId" element={<ProtectedRoute><TargetSystems /></ProtectedRoute>} />
            <Route path="/agent_dashboard" element={<ProtectedRoute><AdminAgentControll /></ProtectedRoute>} />
            <Route path="/integration" element={<ProtectedRoute><IntegrationsPage /></ProtectedRoute>} />

            {/* Audit */}
            <Route path="/audits" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />

            {/* Settings */}
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/settings/general" element={<ProtectedRoute><GeneralSetting /></ProtectedRoute>} />
            <Route path="/settings/authentication" element={<ProtectedRoute><AuthenticationSetting /></ProtectedRoute>} />
            <Route path="/settings/identity-providers" element={<ProtectedRoute><IdentityProviderSetting /></ProtectedRoute>} />
            <Route path="/settings/provisioning" element={<ProtectedRoute><ProvisioningSetting /></ProtectedRoute>} />
            <Route path="/settings/ai-agents" element={<ProtectedRoute><AiAgentSetting /></ProtectedRoute>} />
            <Route path="/settings/security" element={<ProtectedRoute><SecuritySetting /></ProtectedRoute>} />
            <Route path="/settings/users-groups" element={<ProtectedRoute><UserGroupSetting /></ProtectedRoute>} />
            <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSetting /></ProtectedRoute>} />
            <Route path="/settings/audit-logs" element={<ProtectedRoute><AuditLogsSetting /></ProtectedRoute>} />
            <Route path="/settings/api-integrations" element={<ProtectedRoute><ApiIntegrationSetting /></ProtectedRoute>} />
            <Route path="/setting/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
            <Route path="/settings/rename" element={<ProtectedRoute><Rename /></ProtectedRoute>} />

          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  );
}

export default App;