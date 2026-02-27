import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { auth } from '../../utils/auth';
import { api } from '../../utils/api';
import { useTheme } from '../../state/ThemeContext';

// Type Definitions
interface UserDetails {
  email?: string;
  name?: string;
  sub?: string;
  picture?: string;
}

const Callback: React.FC = () => {
  const { isDark } = useTheme();
  const { isAuthenticated, getAccessTokenSilently, user, isLoading } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async (): Promise<void> => {
      // Wait for Auth0 to finish loading
      if (isLoading) {
        return;
      }

      if (isAuthenticated && user) {
        try {
          // Get Auth0 access token
          const accessToken: string = await getAccessTokenSilently();
          
          // Display token in console
          console.log('='.repeat(80));
          console.log('🔐 [FRONTEND] RECEIVED AUTH0 ACCESS TOKEN:');
          console.log('Token:', accessToken.substring(0, 50) + '...');
          console.log('User:', user.email);
          console.log('='.repeat(80));
          
          // Store Auth0 token and user data locally
          auth.storeAuth0Data(accessToken, user);
          
          // Call postlogin endpoint with user details and access token
          console.log('📡 Calling /api/v1/postlogin endpoint...');
          try {
            const userDetails: UserDetails = {
              email: user.email,
              name: user.name,
              sub: user.sub,
              picture: user.picture
            };
            
            const sessionData = await api.postLogin(userDetails as any, accessToken);
            console.log('✅ Post-login successful, session data:', sessionData);
            
            // Store session data including session_id and roles
            auth.storeSessionData(sessionData);
            
          } catch (postLoginError) {
            console.error('⚠️ Post-login endpoint failed:', postLoginError);
            // Don't block login if postlogin fails - user can still proceed
          }
          
          console.log('✅ Auth0 token stored in localStorage, redirecting to dashboard...');
          
          // Redirect to dashboard
          navigate('/agent_dashboard', { replace: true });
        } catch (error) {
          console.error('Error handling Auth0 callback:', error);
          navigate('/login', { replace: true });
        }
      } else if (!isLoading && !isAuthenticated) {
        // Not authenticated after callback completion
        console.warn('Auth0 callback completed but not authenticated');
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [isAuthenticated, isLoading, user, getAccessTokenSilently, navigate]);

  return (
    <div
      className="flex items-center justify-center min-h-screen transition-colors duration-300"
      style={{ backgroundColor: isDark ? '#0d1117' : '#f9fafb' }}
    >
      <div className="text-center p-4 lg:p-6 xl:p-8">
        <div
          className="animate-spin rounded-full h-8 w-8 lg:h-10 lg:w-10 xl:h-12 xl:w-12 border-b-2 border-blue-600 mx-auto mb-4"
          style={{ borderColor: isDark ? '#3b82f6' : undefined }}
        ></div>
        <p
          className="text-sm lg:text-base xl:text-lg"
          style={{ color: isDark ? '#94a3b8' : '#374151' }}
        >
          Completing login...
        </p>
      </div>
    </div>
  );
};

export default Callback;