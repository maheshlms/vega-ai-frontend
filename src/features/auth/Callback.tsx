import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useAuth0 } from '@auth0/auth0-react';
// import { auth } from '../../utils/auth';
// import { api } from '../../utils/api';

// // Type Definitions
// interface UserDetails {
//   email?: string;
//   name?: string;
//   sub?: string;
//   picture?: string;
// }

const Callback: React.FC = () => {
  // const { isAuthenticated, getAccessTokenSilently, user, isLoading } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    // Auth0 disabled - redirect directly to login
    navigate('/login', { replace: true });

    // const handleCallback = async (): Promise<void> => {
    //   // Wait for Auth0 to finish loading
    //   if (isLoading) {
    //     return;
    //   }

    //   if (isAuthenticated && user) {
    //     try {
    //       // Get Auth0 access token
    //       const accessToken: string = await getAccessTokenSilently();
    //       console.log('='.repeat(80));
    //       console.log('🔐 [FRONTEND] RECEIVED AUTH0 ACCESS TOKEN:');
    //       console.log('Token:', accessToken.substring(0, 50) + '...');
    //       console.log('User:', user.email);
    //       console.log('='.repeat(80));
    //       auth.storeAuth0Data(accessToken, user);
    //       console.log('📡 Calling /api/v1/postlogin endpoint...');
    //       try {
    //         const userDetails: UserDetails = {
    //           email: user.email,
    //           name: user.name,
    //           sub: user.sub,
    //           picture: user.picture
    //         };
    //         const sessionData = await api.postLogin(userDetails as any, accessToken);
    //         console.log('✅ Post-login successful, session data:', sessionData);
    //         auth.storeSessionData(sessionData);
    //       } catch (postLoginError) {
    //         console.error('⚠️ Post-login endpoint failed:', postLoginError);
    //       }
    //       console.log('✅ Auth0 token stored in localStorage, redirecting to dashboard...');
    //       navigate('/agent_dashboard', { replace: true });
    //     } catch (error) {
    //       console.error('Error handling Auth0 callback:', error);
    //       navigate('/login', { replace: true });
    //     }
    //   } else if (!isLoading && !isAuthenticated) {
    //     console.warn('Auth0 callback completed but not authenticated');
    //     navigate('/login', { replace: true });
    //   }
    // };

    // handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Completing login...</p>
      </div>
    </div>
  );
};

export default Callback;