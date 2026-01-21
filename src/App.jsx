import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';  
import LoginPage from './features/LoginPage.jsx';
import Callback from './features/Callback.jsx';
import MouseMove from './effects/MouseMove.jsx';
import TopBar from './layouts/TopBar.jsx';
import Sidebar from './layouts/Sidebar.jsx';
import Dashboard from './features/Dashboard.jsx';
import Agents from './features/Agents.jsx';
import AgentChat from './features/AgentChat.jsx';  // ADDED
import AiAssist from './features/AiAssist.jsx';  // ADDED
import TaskExecute from './features/TaskExecute.jsx';  // ADDED
import AdvancedIntegrations from './features/AdvancedIntegrations.jsx';  // ADDED
import AgentTypeSelection from './features/AgentTypeSelection.jsx';  // ADDED
import AgentCreationForm from './features/AgentCreationForm.jsx';  // ADDED
import ChatPage from './features/ChatPage.jsx';
import IntegrationBay from "./features/IntegrationBay.jsx";
import DataUplink from './features/DataUplink.jsx';
import AuditLogs from './features/AuditLogs.jsx';
import Settings from './features/Settings.jsx';
import Logout from './features/Logout.jsx';
import TopBarNotification from './features/NotificationDropdown.jsx';
import { auth } from './utils/auth'; 

// Protected Route Component
function ProtectedRoute({ children }) {
  // Later - Auth0 authentication
  const { isAuthenticated: auth0Authenticated, isLoading: auth0Loading } = useAuth0();
  const isLocalAuthenticated = auth.isAuthenticated();
  const isAuth = auth0Authenticated || isLocalAuthenticated;

  // Later - Auth0 loading state
  if (auth0Loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Later - Auth0 authentication check
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  // Temporary: Allow access without authentication for development
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
          <Routes>
            {/* Temporary: Redirect to dashboard instead of login for development */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
            
            {/* ADDED: Agent Chat Route */}
            <Route 
              path="/agents/agentchat" 
              element={
                <ProtectedRoute>
                  <AgentChat />
                </ProtectedRoute>
              } 
            />
            
            {/* ADDED: AI Assist Route */}
            <Route 
              path="/agents/agentchat/aiassist" 
              element={
                <ProtectedRoute>
                  <AiAssist />
                </ProtectedRoute>
              } 
            />
            
            {/* ADDED: Task Execute Route */}
            <Route 
              path="/agents/agentchat/execute" 
              element={
                <ProtectedRoute>
                  <TaskExecute />
                </ProtectedRoute>
              } 
            />
            
            {/* ADDED: Create Agent Route */}
            <Route 
              path="/agents/createagent" 
              element={
                <ProtectedRoute>
                  <AdvancedIntegrations />
                </ProtectedRoute>
              } 
            />
            
            {/* ADDED: Agent Type Selection Route */}
            <Route 
              path="/agents/createagent/:integrationId" 
              element={
                <ProtectedRoute>
                  <AgentTypeSelection />
                </ProtectedRoute>
              } 
            />
            
            {/* ADDED: Agent Creation Form Route */}
            <Route 
              path="/agents/create/:integrationId/:agentType" 
              element={
                <ProtectedRoute>
                  <AgentCreationForm />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <ChatPage />
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
            
            <Route path="/logout" element={<Logout />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;