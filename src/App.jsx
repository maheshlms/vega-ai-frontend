import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/LoginPage.jsx';
import MouseMove from './effects/MouseMove.jsx';
import TopBar from './layouts/TopBar.jsx';
import Sidebar from './layouts/Sidebar.jsx';
import Dashboard from './features/Dashboard.jsx';
import Agents from './features/Agents.jsx';
import IntegrationBay from "./features/IntegrationBay.jsx"
import DataUplink from './features/DataUplink.jsx'
import AuditLogs from './features/AuditLogs.jsx'
import Settings from './features/Settings.jsx'
import Logout from './features/Logout.jsx'

function App() {
  return (
    <Router>
      <div className="h-screen overflow-hidden flex flex-col">
        <MouseMove />
        <TopBar />
        
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          
          {/* Main Content Area with left margin for fixed sidebar and its own scroll */}
          <div className="flex-1 ml-[216px] overflow-y-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/integration" element={<IntegrationBay />} />
              <Route path="/data" element={<DataUplink />} />
              <Route path="/audits" element={<AuditLogs />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/logout" element={<Logout />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;