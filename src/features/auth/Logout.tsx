import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { auth } from '../../utils/auth';
import { api } from '../../utils/api';
import { useTheme } from '../../state/ThemeContext';

const Logout: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { logout: auth0Logout, isAuthenticated: isAuth0 } = useAuth0();

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

      // If user was authenticated via Auth0, logout from Auth0
      if (isAuth0) {
        auth0Logout({ 
          logoutParams: { 
            returnTo: window.location.origin + '/login'
          } 
        });
      } else {
        // For local admin, just redirect to login
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    };

    performLogout();
  }, [auth0Logout, isAuth0, navigate]);

  return (
    <div
      className="min-h-screen p-4 lg:p-6 xl:p-8 flex items-center justify-center transition-colors duration-300"
      style={{ backgroundColor: isDark ? '#0d1117' : '#f9fafb' }}
    >
      <div
        className="rounded-xl shadow p-6 lg:p-8 xl:p-10 2xl:p-12 text-center transition-colors duration-300 w-[90%] max-w-[380px] lg:max-w-[420px] xl:max-w-[480px] 2xl:max-w-[520px]"
        style={{
          backgroundColor: isDark ? '#1a2234' : 'white',
          border: `1px solid ${isDark ? '#1e2d45' : '#e5e7eb'}`
        }}
      >
        <h1
          className="text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold mb-3 lg:mb-4"
          style={{ color: isDark ? '#ffffff' : '#111827' }}
        >
          Logged Out
        </h1>
        <p
          className="text-sm lg:text-base xl:text-lg"
          style={{ color: isDark ? '#94a3b8' : '#4b5563' }}
        >
          You have been successfully logged out.
        </p>
        <div className="mt-4 lg:mt-5 xl:mt-6">
          <div className="animate-spin rounded-full h-6 w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p
            className="text-xs lg:text-sm xl:text-base mt-2"
            style={{ color: isDark ? '#64748b' : '#6b7280' }}
          >
            Redirecting...
          </p>
        </div>
      </div>
    </div>
  );
};

export default Logout;