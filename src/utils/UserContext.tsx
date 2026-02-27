import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { useAuth0, User as Auth0User } from '@auth0/auth0-react';
import { auth } from './auth';

interface User {
  email?: string;
  name?: string;
  picture?: string;
  sub?: string;
  [key: string]: any;
}

interface UserContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: () => boolean;
  hasRole: (role: string) => boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  // const { user: auth0User, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initializationComplete, setInitializationComplete] = useState<boolean>(false);

  useEffect(() => {
    const initializeUser = async (): Promise<void> => {
      console.log('🔄 UserContext: Initializing user state...');

      // Load from localStorage (native auth)
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

      setInitializationComplete(true);
    };

    initializeUser();
  }, []);

  // // Refresh token periodically if authenticated (Auth0 disabled)
  // useEffect(() => {
  //   if (!isAuthenticated || !auth0User) return;
  //   const refreshInterval = setInterval(async () => {
  //     try {
  //       const accessToken = await getAccessTokenSilently({ ... });
  //       setToken(accessToken);
  //       auth.storeAuth0Data(accessToken, auth0User);
  //     } catch (error) {
  //       console.error('❌ Failed to refresh token:', error);
  //     }
  //   }, 15 * 60 * 1000);
  //   return () => clearInterval(refreshInterval);
  // }, [isAuthenticated, auth0User, getAccessTokenSilently]);

  const value: UserContextType = {
    user,
    token,
    isAuthenticated: auth.isAuthenticated(),
    isLoading: !initializationComplete,
    isAdmin: () => auth.isAdmin(),
    hasRole: (role: string) => auth.hasRole(role),
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

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

export default UserContext;