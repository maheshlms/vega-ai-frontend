import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useAuth0 } from '@auth0/auth0-react';
import { auth } from '../../utils/auth';
import { api } from '../../utils/api';

const Logout: React.FC = () => {
  const navigate = useNavigate();
  // const { logout: auth0Logout, isAuthenticated: isAuth0 } = useAuth0();

  useEffect(() => {
    const performLogout = async (): Promise<void> => {
      // Get current user details and session ID before clearing
      const currentUser = auth.getCurrentUser();
      const sessionId = auth.getSessionId();

      // Call logout endpoint if we have user data
      if (currentUser && sessionId) {
        console.log('📡 Calling /api/v1/logout endpoint...');
        try {
          await api.logoutUser(currentUser, sessionId);
          console.log('✅ Logout endpoint called successfully');
        } catch (error) {
          console.error('⚠️ Logout endpoint failed:', error);
          // Continue with logout even if endpoint fails
        }
      }

      // Clear local storage
      auth.logout();

      // Auth0 logout disabled - always redirect to login
      // if (isAuth0) {
      //   auth0Logout({ logoutParams: { returnTo: window.location.origin + '/login' } });
      // } else {
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      // }
    };

    performLogout();
  }, [navigate]);

  return (
    <div className="bg-gray-50 min-h-screen p-6 flex items-center justify-center">
      <style>{`
        /* ═══════════════════════════════════════════════════════════════
           RESPONSIVE RULES — Logout
           Baseline: 1920×1080. This is a centered card UI.
           The card, text, and spinner scale proportionally across all
           non-mobile viewport widths. No JSX, logic, or classes changed.
        ═══════════════════════════════════════════════════════════════ */

        /* Global box-sizing safety */
        .logout-card-wrap, .logout-card-wrap * { box-sizing: border-box; }

        /* ── Card wrapper: centered, constrained ── */
        .logout-card-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 100vh;
          padding: 24px;
        }

        /* ── Card: scales with viewport ── */
        .logout-card {
          width: 100%;
          max-width: 420px;
          padding: clamp(24px, 3vw, 40px);
          border-radius: clamp(12px, 1vw, 16px);
        }

        /* ── Heading ── */
        .logout-h1 {
          font-size: clamp(18px, 2vw, 28px);
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }

        /* ── Body text ── */
        .logout-body {
          font-size: clamp(13px, 1vw, 16px);
        }

        /* ── Redirect text ── */
        .logout-redirect {
          font-size: clamp(11px, 0.8vw, 14px);
        }

        /* ── Tablet: 768–1023px ── */
        @media (min-width: 768px) and (max-width: 1023px) {
          .logout-card { max-width: 360px; padding: 24px; }
          .logout-h1   { font-size: 18px; }
        }

        /* ── Small laptop: 1024–1279px ── */
        @media (min-width: 1024px) and (max-width: 1279px) {
          .logout-card { max-width: 380px; }
        }

        /* ── 1920px baseline lock ── */
        @media (min-width: 1920px) and (max-width: 2559px) {
          .logout-card { max-width: 420px; padding: 40px; }
          .logout-h1   { font-size: 28px; }
          .logout-body { font-size: 16px; }
        }

        /* ── QHD: 2560–3839px ── */
        @media (min-width: 2560px) and (max-width: 3839px) {
          .logout-card      { max-width: 560px; padding: 56px; border-radius: 22px; }
          .logout-h1        { font-size: 38px; }
          .logout-body      { font-size: 20px; }
          .logout-redirect  { font-size: 16px; }
        }

        /* ── 4K+: 3840px+ ── */
        @media (min-width: 3840px) {
          .logout-card      { max-width: 760px; padding: 80px; border-radius: 30px; }
          .logout-h1        { font-size: 56px; }
          .logout-body      { font-size: 28px; }
          .logout-redirect  { font-size: 22px; }
        }
      `}</style>
      <div className="bg-white rounded-xl shadow p-8 text-center logout-card">
        <h1 className="text-2xl font-bold mb-4 logout-h1">Logged Out</h1>
        <p className="text-gray-600 logout-body">You have been successfully logged out.</p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2 logout-redirect">Redirecting...</p>
        </div>
      </div>
    </div>
  );
};

export default Logout;