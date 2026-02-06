import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { auth } from './auth';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const { user: auth0User, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initializationComplete, setInitializationComplete] = useState(false);

  useEffect(() => {
    const initializeUser = async () => {
      console.log('🔄 UserContext: Initializing user state...');
      console.log('Auth0 isAuthenticated:', isAuthenticated);
      console.log('Auth0 isLoading:', isLoading);
      
      if (isLoading) {
        console.log('⏳ Auth0 still loading, waiting...');
        return;
      }

      if (isAuthenticated && auth0User) {
        try {
          console.log('✅ Auth0 user authenticated:', auth0User.email);
          
          // Get fresh token from Auth0
          const accessToken = await getAccessTokenSilently({
              authorizationParams: {
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
    scope: "openid profile email offline_access"
  },
            cacheMode: 'off' // Force fresh token
          });
          
          console.log('🎫 Access token retrieved from Auth0');
          
          // Store in state
          setUser(auth0User);
          setToken(accessToken);
          
          // Store in localStorage for persistence
          auth.storeAuth0Data(accessToken, auth0User);
          
          console.log('💾 User data stored in localStorage');
          console.log('👤 User context initialized for:', auth0User.email);
          
        } catch (error) {
          console.error('❌ Error getting access token:', error);
          
          // Fallback to localStorage if token fetch fails
          const storedUser = auth.getCurrentUser();
          const storedToken = auth.getToken();
          
          if (storedUser && storedToken) {
            console.log('⚠️ Using stored credentials as fallback');
            setUser(storedUser);
            setToken(storedToken);
          }
        }
      } else if (!isAuthenticated) {
        console.log('🔍 Not authenticated via Auth0, checking localStorage...');
        
        // Try to load from localStorage if Auth0 is not authenticated
        const storedUser = auth.getCurrentUser();
        const storedToken = auth.getToken();
        
        if (storedUser && storedToken) {
          console.log('✅ User loaded from localStorage:', storedUser.email);
          setUser(storedUser);
          setToken(storedToken);
        } else {
          console.log('❌ No valid authentication found');
          setUser(null);
          setToken(null);
        }
      }
      
      setInitializationComplete(true);
    };

    initializeUser();
  }, [isAuthenticated, auth0User, isLoading, getAccessTokenSilently]);

  // Refresh token periodically if authenticated
  useEffect(() => {
    if (!isAuthenticated || !auth0User) return;

    const refreshInterval = setInterval(async () => {
      try {
        console.log('🔄 Refreshing access token...');
        const accessToken = await getAccessTokenSilently({
            authorizationParams: {
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
    scope: "openid profile email offline_access"
  },
          cacheMode: 'off'
        });
        
        setToken(accessToken);
        auth.storeAuth0Data(accessToken, auth0User);
        console.log('✅ Token refreshed successfully');
      } catch (error) {
        console.error('❌ Failed to refresh token:', error);
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, auth0User, getAccessTokenSilently]);

  const value = {
    user,
    token,
    isAuthenticated: isAuthenticated || auth.isAuthenticated(),
    isLoading: isLoading || !initializationComplete,
    isAdmin: () => auth.isAdmin(),
    hasRole: (role) => auth.hasRole(role),
    logout: () => {
      setUser(null);
      setToken(null);
      auth.logout();
    }
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

export default UserContext;