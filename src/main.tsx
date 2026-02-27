import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { Auth0Provider, AppState } from '@auth0/auth0-react';

// const domain = import.meta.env.VITE_AUTH0_DOMAIN || ''
// const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || ''
// const audience = import.meta.env.VITE_AUTH0_AUDIENCE || ''

// // Validation: Check if Auth0 env variables are set
// if (!domain || !clientId) {
//   console.error('❌ Auth0 environment variables are missing!');
//   console.error('Please check your .env file has:');
//   console.error('- VITE_AUTH0_DOMAIN');
//   console.error('- VITE_AUTH0_CLIENT_ID');
//   console.error('- VITE_AUTH0_AUDIENCE (optional but recommended)');
// }

// // Log Auth0 configuration (without sensitive data)
// console.log('🔐 Auth0 Configuration:');
// console.log('Domain:', domain || '❌ NOT SET');
// console.log('Client ID:', clientId ? '✅ SET' : '❌ NOT SET');
// console.log('Audience:', audience || '⚠️ NOT SET (optional)');
// console.log('Redirect URI:', `${window.location.origin}/callback`);

// // Auth0 error handler
// const onRedirectCallback = (appState) => {
//   console.log('🔄 Auth0 redirect callback:', appState);
//   window.history.replaceState(
//     {},
//     document.title,
//     appState?.returnTo || window.location.pathname
//   );
// };

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <Auth0Provider
//       domain={domain}
//       clientId={clientId}
//       authorizationParams={{
//         redirect_uri: `${window.location.origin}/callback`,
//         audience: audience,
//         // scope: "openid profile email"  // Added explicit scopes
//         scope: "openid profile email offline_access"
//       }}
//       useRefreshTokens={true}
//       cacheLocation="localstorage"
//       onRedirectCallback={onRedirectCallback}
//     >
//       <App />
//     </Auth0Provider>
//   </StrictMode>,
// )

import { ThemeProvider } from './state/ThemeContext' 

const domain = import.meta.env.VITE_AUTH0_DOMAIN || ''
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || ''
const audience = import.meta.env.VITE_AUTH0_AUDIENCE || ''

// Validation: Check if Auth0 env variables are set
if (!domain || !clientId) {
  console.error('❌ Auth0 environment variables are missing!');
  console.error('Please check your .env file has:');
  console.error('- VITE_AUTH0_DOMAIN');
  console.error('- VITE_AUTH0_CLIENT_ID');
  console.error('- VITE_AUTH0_AUDIENCE (optional but recommended)');
}

// Log Auth0 configuration (without sensitive data)
console.log('🔐 Auth0 Configuration:');
console.log('Domain:', domain || '❌ NOT SET');
console.log('Client ID:', clientId ? '✅ SET' : '❌ NOT SET');
console.log('Audience:', audience || '⚠️ NOT SET (optional)');
console.log('Redirect URI:', `${window.location.origin}/callback`);

// Auth0 error handler
const onRedirectCallback = (appState?: AppState): void => {
  console.log('🔄 Auth0 redirect callback:', appState);
  window.history.replaceState(
    {},
    document.title,
    appState?.returnTo || window.location.pathname
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <Auth0Provider
    domain={domain}
    clientId={clientId}
    authorizationParams={{
      redirect_uri: `${window.location.origin}/callback`,
      audience: audience,
      scope: "openid profile email offline_access"
    }}
    useRefreshTokens={true}
    cacheLocation="localstorage"
    onRedirectCallback={onRedirectCallback}
  >
     <ThemeProvider>

    <App />

     </ThemeProvider>
  </Auth0Provider>
);
