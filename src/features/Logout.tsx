import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { auth } from '../utils/auth';
import { api } from '../utils/api';

const Logout: React.FC = () => {
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
    <div className="bg-gray-50 min-h-screen p-6 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Logged Out</h1>
        <p className="text-gray-600">You have been successfully logged out.</p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Redirecting...</p>
        </div>
      </div>
    </div>
  );
};

export default Logout;