/**
 * Layout.tsx
 *
 * Drop-in wrapper that renders the Sidebar + a content area that is always
 * offset by the exact sidebar width at every breakpoint.
 *
 * Sidebar widths (must stay in sync with Sidebar.tsx):
 *   default  → w-44   = 176 px
 *   lg       → 216 px  (custom value, not a default Tailwind step)
 *   xl       → w-60   = 240 px
 *   2xl      → w-64   = 256 px
 *
 * Navbar heights (must match your Navbar component):
 *   default  → h-14  = 56 px
 *   lg       → 72 px
 *   xl       → h-20  = 80 px
 *   2xl      → 88 px
 *
 * Usage — wrap every authenticated route with <Layout>:
 *
 *   <Route path="/agent_dashboard" element={<Layout><AdminAgentControll /></Layout>} />
 *   <Route path="/agents"          element={<Layout><Agents /></Layout>} />
 *   <Route path="/audits"          element={<Layout><AuditLogs /></Layout>} />
 *   <Route path="/integration"     element={<Layout><IntegrationsPage /></Layout>} />
 *   <Route path="/admin"           element={<Layout><AdminSidebar /></Layout>} />
 */

import React from 'react';
import Sidebar from './Sidebar';          // adjust path if needed
import { useTheme } from '../state/ThemeContext'; // adjust path if needed

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isDark } = useTheme();

  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: isDark ? '#0d1117' : '#f9fafb' }}
    >
      {/* ── Fixed sidebar (rendered once here, remove from individual pages) ── */}
      <Sidebar />

      {/*
        ── Main content area ──
        Left margin mirrors the sidebar width at every breakpoint so the
        content is never hidden behind the fixed sidebar panel.

        Tailwind classes used (must match sidebar widths in Sidebar.tsx):
          ml-44           → 176 px  (default)
          lg:ml-[216px]   → 216 px
          xl:ml-60        → 240 px
          2xl:ml-64       → 256 px

        Top padding mirrors the navbar height:
          pt-14           → 56 px  (default)
          lg:pt-[72px]    → 72 px
          xl:pt-20        → 80 px
          2xl:pt-[88px]   → 88 px
      */}
      <main
        className="
          flex-1 min-w-0
          ml-44 lg:ml-[216px] xl:ml-60 2xl:ml-64
          pt-14 lg:pt-[72px] xl:pt-20 2xl:pt-[88px]
        "
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;