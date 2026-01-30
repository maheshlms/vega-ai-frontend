import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { UserProvider } from './utils/UserContext'; // Import UserProvider
import LoginPage from './features/LoginPage.jsx';
import Callback from './features/Callback.jsx';
import MouseMove from './effects/MouseMove.jsx';
import TopBar from './layouts/TopBar.jsx';
import Sidebar from './layouts/Sidebar.jsx';
import Dashboard from './features/Dashboard.jsx';
import Agents from './features/Agents.jsx';
import IntegrationBay from "./features/IntegrationBay.jsx";
import TargetSystems from "./features/TargetSystems.jsx";
import DataUplink from './features/DataUplink.jsx';
import AuditLogs from './features/AuditLogs.jsx';
import Settings from './features/Settings.jsx';
import Logout from './features/Logout.jsx';
import { auth } from './utils/auth';
import SelectTargetSystem from './features/SelectTargetSystem.jsx';
import AgentTypeSelection from './features/AgentTypeSelection.jsx';
import AgentCreationForm from './features/AgentCreationForm.jsx';
import AgentChat from './features/AgentChat.jsx';
import AuthenticationSetting from './features/AuthenticationSetting.jsx';
import IdentityProviderSetting from './features/IdentityProviderSetting.jsx';
import ProvisioningSetting from './features/ProvisioningSetting.jsx';
import AiAgentSetting from './features/AiAgentSetting.jsx';
import SecuritySetting from './features/SecuritySetting.jsx';
import UserGroupSetting from './features/UserGroupSetting.jsx';
import NotificationSetting from './features/NotificationSetting.jsx';
import AuditLogsSetting from './features/AuditLogsSetting.jsx';
import ApiIntegrationSetting from './features/ApiIntigrationSetting.jsx';
import GeneralSetting from './features/GeneralSetting.jsx';
import Plans from './features/Plans.jsx';
import Rename from './features/Rename.jsx';
import ScrollToTop from "./components/ScrollToTop";

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated: auth0Authenticated, isLoading: auth0Loading } = useAuth0();
  const isLocalAuthenticated = auth.isAuthenticated();
  
  // User is authenticated if either:
  // 1. Auth0 confirms authentication, OR
  // 2. We have a valid stored token (from previous Auth0 login)
  const isAuth = auth0Authenticated || isLocalAuthenticated;

  if (auth0Loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const location = useLocation();
  const hideLayout = location.pathname === '/login' || location.pathname === '/' || location.pathname === '/logout' || location.pathname === '/callback';

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <MouseMove />
     
      {!hideLayout && <TopBar />}
      
      <div className="flex flex-1 overflow-hidden">
        {!hideLayout && <Sidebar />}
        
        {/* Main Content Area with left margin for fixed sidebar and its own scroll */}
        <div className={`flex-1 overflow-y-auto ${!hideLayout ? 'ml-[216px]' : ''}`}>
          
             <ScrollToTop />
          <Routes>

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/callback" element={<Callback />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/agents" 
              element={
                <ProtectedRoute>
                  <Agents />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/agents/:agentId/chat" 
              element={
                <ProtectedRoute>
                  <AgentChat />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/agents/select-target" 
              element={
                <ProtectedRoute>
                  <SelectTargetSystem />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/agents/select-type/:targetId" 
              element={
                <ProtectedRoute>
                  <AgentTypeSelection />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/agents/create/:targetId/:agentTypeId" 
              element={
                <ProtectedRoute>
                  <AgentCreationForm />
                </ProtectedRoute>
              } 
            />
            {/* Catch-all under /agents to avoid broken deep-links */}
            <Route path="/agents/*" element={<Navigate to="/agents" replace />} />
            <Route 
              path="/agents/createagent" 
              element={
                <ProtectedRoute>
                  <AgentCreationForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/integration" 
              element={
                <ProtectedRoute>
                  <IntegrationBay />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/integration/target-systems/:integrationId" 
              element={
                <ProtectedRoute>
                  <TargetSystems />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/data" 
              element={
                <ProtectedRoute>
                  <DataUplink />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/audits" 
              element={
                <ProtectedRoute>
                  <AuditLogs />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/settings/authentication" 
              element={
                <ProtectedRoute>
                  <AuthenticationSetting />
                </ProtectedRoute>
              } 
            /> 
            <Route 
              path="/settings/identity-providers" 
              element={
                <ProtectedRoute>
                  <IdentityProviderSetting />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/settings/provisioning" 
              element={
                <ProtectedRoute>
                  <ProvisioningSetting />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/settings/ai-agents" 
              element={
                <ProtectedRoute>
                  <AiAgentSetting />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/settings/security" 
              element={
                <ProtectedRoute>
                  <SecuritySetting />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings/users-groups" 
              element={
                <ProtectedRoute>
                  <UserGroupSetting />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/settings/notifications" 
              element={
                <ProtectedRoute>
                  <NotificationSetting />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/settings/audit-logs" 
              element={
                <ProtectedRoute>
                  <AuditLogsSetting />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/settings/api-integrations" 
              element={
                <ProtectedRoute>
                  <ApiIntegrationSetting />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/settings/general" 
              element={
                <ProtectedRoute>
                  <GeneralSetting />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/setting/plans"
              element={
                <ProtectedRoute>
                  <Plans/>
                </ProtectedRoute>
              }
            />

            <Route 
              path="/settings/rename" 
              element={
                <ProtectedRoute>
                  <Rename/>
                </ProtectedRoute>
              }
            />

            <Route path="/logout" element={<Logout />} />
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