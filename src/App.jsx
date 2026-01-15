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
import IntegrationBay from "./features/IntegrationBay.jsx";
import DataUplink from './features/DataUplink.jsx';
import AuditLogs from './features/AuditLogs.jsx';
import Settings from './features/Settings.jsx';
import Logout from './features/Logout.jsx';
import { auth } from './utils/auth';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated: auth0Authenticated, isLoading: auth0Loading } = useAuth0();
  const isLocalAuthenticated = auth.isAuthenticated();
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