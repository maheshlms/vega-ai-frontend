import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheckCircle, FaShieldAlt, FaKey, FaLock, FaFingerprint } from 'react-icons/fa';

const TargetSystemForm = ({ system = null, typeOptions = [], availableAuthMethods = [], integrationValue = null, integrationId = null, integrationName = null, onSubmit, onCancel }) => {
   // Helper function to convert snake_case to PascalCase
  const snakeToPascal = (str) => {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  };

  // Helper function to convert snake_case to readable label
  const snakeToLabel = (str) => {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  const [formData, setFormData] = useState({
    name: '',
    type: integrationValue || '',
    integration_id: integrationId || '',
    environment: 'production',
    auth_method: 'BearerToken', // Default to BearerToken
    host: '',
    port: 443,
    engine_port: 9031, // For PingFederate BearerToken
    username: '',
    password: '',
    client_id: '',
    client_secret: '',
    api_key: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  

  // Debug: Log props on mount
  useEffect(() => {
    console.log('[TargetSystemForm] Props received:', {
      system,
      typeOptions,
      availableAuthMethods,
      integrationValue,
      integrationId,
      integrationName,
      onSubmit: typeof onSubmit,
      onCancel: typeof onCancel
    });

    if (typeof onSubmit !== 'function') {
      console.error('[TargetSystemForm] ERROR: onSubmit is not a function!', onSubmit);
    }
  }, [system, typeOptions, availableAuthMethods, integrationValue, integrationId, integrationName, onSubmit, onCancel]);

  

  useEffect(() => {
    if (system) {
      // Parse credentials based on auth_method
      const credentials = system.credentials || {};
      
      setFormData({
        name: system.name || '',
        type: system.type || '',
        integration_id: system.integration_id || '',
        environment: system.environment || 'production',
        auth_method: system.auth_method 
          ? snakeToPascal(system.auth_method)
          : 'BearerToken',
        host: system.host || '',
        port: system.port || 443,
        engine_port: system.engine_port || 9031,
        username: credentials.username || '',
        password: '', // Don't pre-fill for security
        client_id: credentials.client_id || '',
        client_secret: '', // Don't pre-fill for security
        api_key: '', // Don't pre-fill for security
        description: system.description || ''
      });
    } else {
      // For new systems, set default port based on type
      if (integrationValue === 'PingFederate' || integrationValue === 'ping_federate') {
        setFormData(prev => ({
          ...prev,
          port: 9999,
          engine_port: 9031
        }));
      }
    }
  }, [system, integrationValue]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'port' || name === 'engine_port') ? parseInt(value) || 0 : value
    }));
  };

  // Handle AuthMethod change to set defaults
  const handleAuthMethodChange = (method) => {
    const updates = { auth_method: method };
    
    // Set default ports for PingFederate + BearerToken
    const isPingFederate = formData.type === 'PingFederate' || formData.type === 'ping_federate';
    if (isPingFederate && method === 'BearerToken') {
      updates.port = 9999;
      updates.engine_port = 9031;
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[TargetSystemForm] handleSubmit called');
    console.log('[TargetSystemForm] onSubmit type:', typeof onSubmit);
    console.log('[TargetSystemForm] formData:', formData);
    
    // Check if onSubmit is a function
    if (typeof onSubmit !== 'function') {
      console.error('[TargetSystemForm] ERROR: onSubmit is not a function!');
      setError('Form submission handler is not properly configured');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Validate required fields based on auth method
      if (!formData.name || !formData.type || !formData.host) {
        setError('Please fill in all required fields (Name, Type, Host)');
        setLoading(false);
        return;
      }
      if (formData.auth_method === 'BearerToken' && (!formData.client_id || !formData.client_secret)) {
        setError('Client ID and Client Secret are required for BearerToken');
        setLoading(false);
        return;
      }

      // Validate auth-specific fields
      if (formData.auth_method === 'BasicAuth' && (!formData.username || !formData.password)) {
        setError('Username and Password are required for BasicAuth');
        setLoading(false);
        return;
      }

   

      if (formData.auth_method === 'APIKey' && !formData.api_key) {
        setError('API Key is required for APIKey authentication');
        setLoading(false);
        return;
      }

      // Convert type to snake_case for API
      const typeToSnakeCase = (type) => {
        const mapping = {
          'PingFederate': 'ping_federate',
          'PingDirectory': 'ping_directory',
          'PingOne': 'ping_one',
          'Okta': 'okta',
          'AzureAD': 'azure_ad',
          'Auth0': 'auth0',
          'LDAP': 'ldap',
          'Custom': 'custom'
        };
        return mapping[type] || type.toLowerCase().replace(/\s+/g, '_');
      };

      // Convert auth_method to snake_case for API
      const authMethodToSnakeCase = (method) => {
        const mapping = {
          'BasicAuth': 'basic_auth',
          'APIKey': 'api_key',
          'OAuth2': 'oauth2',
          'ClientCredentials': 'client_credentials',
          'BearerToken': 'bearer_token',
          'Certificate': 'certificate'
        };
        return mapping[method] || method.toLowerCase().replace(/\s+/g, '_');
      };

      // Construct base_url from host and port
      const protocol = formData.host.startsWith('https://') || formData.host.startsWith('http://') ? '' : 'https://';
      const host = formData.host.replace(/^https?:\/\//, ''); // Remove protocol if present
      const base_url = `${protocol}${host}:${formData.port}`;

      // Build credentials object based on auth method
      let credentials = {};
      
      if (formData.auth_method === 'BasicAuth') {
        credentials = {
          username: formData.username,
          password: formData.password
        };
      } else if (formData.auth_method === 'BearerToken') {
        credentials = {
          client_id: formData.client_id,
          client_secret: formData.client_secret
        };
      } else if (formData.auth_method === 'APIKey') {
        credentials = {
          api_key: formData.api_key
        };
      }

      // Build submit data in the format expected by API
      const submitData = {
        name: formData.name,
        type: typeToSnakeCase(formData.type),
        integration_id: formData.integration_id,
        base_url: base_url,
        auth_method: authMethodToSnakeCase(formData.auth_method),
        credentials: credentials,
        environment: formData.environment,
        description: formData.description
      };

      // Add engine_port for PingFederate with BearerToken
      const isPingFederate = typeToSnakeCase(formData.type) === 'ping_federate';
      if (isPingFederate && formData.auth_method === 'BearerToken') {
        submitData.engine_port = formData.engine_port;
      }

      console.log('[TargetSystemForm] Calling onSubmit with data:', submitData);
      await onSubmit(submitData);
      console.log('[TargetSystemForm] onSubmit completed successfully');
      
      // Show success modal
      setShowSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error('[TargetSystemForm] Error in handleSubmit:', err);
      setError(err.message || 'Failed to save target system');
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setShowSuccess(false);
    if (onCancel) onCancel();
  };

  const handleReset = () => {
    setFormData({
      name: '',
      type: integrationValue || '',
      integration_id: integrationId || '',
      environment: 'production',
      auth_method: 'BearerToken',
      host: '',
      port: 443,
      engine_port: 9031,
      username: '',
      password: '',
      client_id: '',
      client_secret: '',
      api_key: '',
      description: ''
    });
  };

  const defaultTypeOptions = typeOptions.length > 0 ? typeOptions : [
    { value: 'PingFederate', label: 'PingFederate' },
    { value: 'PingDirectory', label: 'PingDirectory' },
    { value: 'PingOne', label: 'PingOne' },
    { value: 'Okta', label: 'Okta' },
    { value: 'AzureAD', label: 'Azure AD' },
    { value: 'Auth0', label: 'Auth0' },
    { value: 'LDAP', label: 'LDAP' },
    { value: 'Custom', label: 'Custom' }
  ];

//   console.log(
//   'availableAuthMethods from backend:',
//   availableAuthMethods
// );   just getting the basic auth and api   thing from the backend 

 

  // Convert available auth methods to display format
  const authMethodOptions = availableAuthMethods.length > 0 
    ? availableAuthMethods.map(method => {
        const pascalCase = snakeToPascal(method);
        const label = snakeToLabel(method);
        
        return {
          value: pascalCase,
          label: label,
          snakeCase: method
        };
      })
    : [
        { value: 'BearerToken', label: 'Bearer Token', snakeCase: 'bearer_token', icon: FaShieldAlt, description: 'OAuth 2.0 token-based authentication' },
        { value: 'BasicAuth', label: 'Basic Auth', snakeCase: 'basic_auth', icon: FaKey, description: 'Username and password authentication' },
        { value: 'APIKey', label: 'API Key', snakeCase: 'api_key', icon: FaFingerprint, description: 'Single API key authentication' },
        { value: 'OAuth2', label: 'OAuth2', snakeCase: 'oauth2', icon: FaLock, description: 'Full OAuth 2.0 flow' },
        { value: 'ClientCredentials', label: 'Client Credentials', snakeCase: 'client_credentials', icon: FaShieldAlt, description: 'Machine-to-machine authentication' }
      ];

  // Check if current type is PingFederate
  const isPingFederate = formData.type === 'PingFederate' || formData.type === 'ping_federate';

  // Render auth-specific fields
  const renderAuthFields = () => {
    switch (formData.auth_method) {
      case 'BasicAuth':
        return (
          <>
            {/* Username */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter username"
                required
                className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder:text-gray-400 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:border-gray-300"
              />
            </div>

            {/* Password */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Password <span className="text-red-500">*</span>
                {system && <span className="text-xs text-gray-500 ml-2 font-normal">(leave empty to keep existing)</span>}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                required={!system}
                className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder:text-gray-400 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:border-gray-300"
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <span>🔒</span>
                <span>Your password will be securely encrypted and stored</span>
              </p>
            </div>
          </>
        );

      case 'BearerToken':
        return (
          <>
            {/* Client ID */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Client ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                placeholder="Enter client ID"
                required
                className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder:text-gray-400 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:border-gray-300"
              />
            </div>

            {/* Client Secret */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Client Secret <span className="text-red-500">*</span>
                {system && <span className="text-xs text-gray-500 ml-2 font-normal">(leave empty to keep existing)</span>}
              </label>
              <textarea
                name="client_secret"
                value={formData.client_secret}
                onChange={handleChange}
                placeholder="Paste your client secret here..."
                rows="4"
                required={!system}
                className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder:text-gray-400 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:border-gray-300 font-mono"
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <span>🔒</span>
                <span>Your client secret will be securely encrypted and stored</span>
              </p>
            </div>
          </>
        );

      case 'APIKey':
        return (
          <div className="group">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              API Key <span className="text-red-500">*</span>
              {system && <span className="text-xs text-gray-500 ml-2 font-normal">(leave empty to keep existing)</span>}
            </label>
            <textarea
              name="api_key"
              value={formData.api_key}
              onChange={handleChange}
              placeholder="Paste your API key here..."
              rows="4"
              required={!system}
              className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder:text-gray-400 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:border-gray-300 font-mono"
            />
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <span>🔒</span>
              <span>Your API key will be securely encrypted and stored</span>
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-scaleIn border border-white/20">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-pulse-gentle">
                <FaCheckCircle className="text-white text-3xl" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {system ? 'System Updated Successfully!' : 'Target System Created!'}
            </h2>
            <p className="text-gray-600 mb-8">
              {system ? 'Your target system has been updated' : 'Your target system is now ready to use'}
            </p>
            
            <div className="bg-gradient-to-br from-gray-50 to-purple-50/50 rounded-xl p-5 mb-8 border border-gray-100">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">System Name</span>
                <span className="font-semibold text-gray-900">{formData.name}</span>
              </div>
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">Environment</span>
                <span className="font-semibold text-gray-900 capitalize">{formData.environment}</span>
              </div>
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">Host</span>
                <span className="font-semibold text-gray-900">{formData.host}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Auth Method</span>
                <span className="font-semibold text-gray-900">{authMethodOptions.find(m => m.value === formData.auth_method)?.label}</span>
              </div>
            </div>

            <button
              onClick={handleSuccess}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 flex items-start justify-center min-h-screen p-8 ">
        <div className="w-full max-w-4xl">
          {/* Back Button */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="group text-gray-700 hover:text-gray-900 mb-6 flex items-center gap-2 transition-all duration-300 text-sm font-medium"
            >
              <span className="inline-block transform group-hover:-translate-x-1 transition-transform duration-300">←</span>
              <span>Back</span>
            </button>
          )}

          {/* Form Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden animate-slideUp">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-white/50 to-purple-50/30">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <span className="w-6 h-6 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {system ? '✏️' : '+'}
                  </span>
                  <span className="font-medium">{system ? 'Edit Target System' : 'Create Target System'}</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {integrationName || 'Target System Configuration'}
                </h1>
              </div>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all duration-300 hover:scale-110"
                >
                  <FaTimes className="text-xl" />
                </button>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-6">
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-100 text-red-700 px-4 py-3 text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-5">
                {/* System Name */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    System Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Production PingFederate"
                    required
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder:text-gray-400 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:border-gray-300"
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>💡</span>
                    <span>Give your target system a descriptive name</span>
                  </p>
                </div>

                {/* System Type */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    System Type <span className="text-red-500">*</span>
                  </label>
                  {integrationName ? (
                    <div className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl bg-gray-50/70 text-gray-700 font-medium backdrop-blur-sm">
                      {integrationName}
                    </div>
                  ) : (
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-300 hover:border-gray-300 cursor-pointer"
                    >
                      <option value="">Select a type...</option>
                      {defaultTypeOptions.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>💡</span>
                    <span>Select the type of system you're connecting to</span>
                  </p>
                </div>

                {/* Environment */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Environment <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="environment"
                    value={formData.environment}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-300 hover:border-gray-300 cursor-pointer"
                  >
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>💡</span>
                    <span>Select the deployment environment</span>
                  </p>
                </div>

                {/* Authentication Method - Dropdown */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Authentication Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="auth_method"
                    value={formData.auth_method}
                    onChange={(e) => handleAuthMethodChange(e.target.value)}
                    required
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-300 hover:border-gray-300 cursor-pointer"
                  >
                    {authMethodOptions.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>💡</span>
                    <span>Choose the authentication method for your system</span>
                  </p>
                </div>

                {/* Host */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Host/Domain <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="host"
                    value={formData.host}
                    onChange={handleChange}
                    placeholder="e.g., api.example.com"
                    required
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder:text-gray-400 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:border-gray-300"
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>💡</span>
                    <span>Enter the hostname or domain without the protocol</span>
                  </p>
                </div>

                {/* Port */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Port
                  </label>
                  <input
                    type="number"
                    name="port"
                    value={formData.port}
                    onChange={handleChange}
                    placeholder="443"
                    min="1"
                    max="65535"
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder:text-gray-400 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:border-gray-300"
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>💡</span>
                    <span>Default is 443 for HTTPS</span>
                  </p>
                </div>

                

                {/* Engine Port - Only for PingFederate + BearerToken */}
                {isPingFederate && formData.auth_method === 'BearerToken' && (
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Engine Port
                    </label>
                    <input
                      type="number"
                      name="engine_port"
                      value={formData.engine_port}
                      onChange={handleChange}
                      placeholder="9031"
                      min="1"
                      max="65535"
                      className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder:text-gray-400 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:border-gray-300"
                    />
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <span>💡</span>
                      <span>Engine port for PingFederate admin API (default: 9031)</span>
                    </p>
                  </div>
                )}

                {/* Dynamic Auth Fields */}
                {renderAuthFields()}

                {/* Description */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Add notes about this system..."
                    rows="3"
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder:text-gray-400 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:border-gray-300"
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>💡</span>
                    <span>Optional notes or documentation about this system</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 px-6 py-3 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                >
                  <span className="text-lg">🔄</span>
                  <span>Reset</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? 'Saving...' : system ? 'Update System' : 'Create System'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-gentle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }

        .animate-pulse-gentle {
          animation: pulse-gentle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default TargetSystemForm;