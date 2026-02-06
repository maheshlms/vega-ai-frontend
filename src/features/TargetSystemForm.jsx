import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave } from 'react-icons/fa';

const TargetSystemForm = ({ system = null, typeOptions = [], availableAuthMethods = [], integrationValue = null, integrationId = null, integrationName = null, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: integrationValue || '',
    integration_id: integrationId || '',
    environment: 'production',
    auth_method: 'BearerToken',
    host: '',
    port: 443,
    access_token: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (system) {
      setFormData({
        name: system.name || '',
        type: system.type || '',
        integration_id: system.integration_id || '',
        environment: system.environment || 'production',
        auth_method: system.auth_method || 'BearerToken',
        host: system.host || '',
        port: system.port || 443,
        access_token: '', // Don't pre-fill token for security
        description: system.description || ''
      });
    }
  }, [system]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'port' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.type || !formData.host || !formData.access_token) {
        setError('Please fill in all required fields (Name, Type, Host, Access Token)');
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

      // Build submit data in the format expected by API
      const submitData = {
        name: formData.name,
        type: typeToSnakeCase(formData.type),  // Convert to snake_case
        integration_id: formData.integration_id,  // UUID reference to integration
        base_url: base_url,
        auth_method: authMethodToSnakeCase(formData.auth_method),  // Convert to snake_case
        credentials: {
          access_token: formData.access_token
        },
        environment: formData.environment,
        description: formData.description
      };

      await onSubmit(submitData);
    } catch (err) {
      setError(err.message || 'Failed to save target system');
      setLoading(false);
    }
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

  // Helper function to convert snake_case to readable format
  const capitalizeSnakeCase = (str) => {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  };

  // Convert available auth methods to display format
  const authMethodOptions = availableAuthMethods.length > 0 
    ? availableAuthMethods.map(method => ({
        value: capitalizeSnakeCase(method),
        label: capitalizeSnakeCase(method),
        snakeCase: method
      }))
    : [
        { value: 'BearerToken', label: 'Bearer Token', snakeCase: 'bearer_token' },
        { value: 'APIKey', label: 'API Key', snakeCase: 'api_key' },
        { value: 'OAuth2', label: 'OAuth2', snakeCase: 'oauth2' },
        { value: 'ClientCredentials', label: 'Client Credentials', snakeCase: 'client_credentials' }
      ];

  return (
    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-100 px-8 py-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {system ? 'Edit Target System' : 'Create Target System'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {system ? 'Update your target system configuration' : 'Add a new target system to your environment'}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
          title="Close"
        >
          <FaTimes size={20} />
        </button>
      </div>

      {/* Form Content - Scrollable */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-6">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              System Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Production PingFederate"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              System Type <span className="text-red-500">*</span>
            </label>
            {integrationName ? (
              <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium">
                {integrationName}
              </div>
            ) : (
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                required
              >
                <option value="">Select a type...</option>
                {defaultTypeOptions.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Environment */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Environment
            </label>
            <select
              name="environment"
              value={formData.environment}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>

          {/* Auth Method */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Authentication Method
            </label>
            <select
              name="auth_method"
              value={formData.auth_method}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
            >
              {authMethodOptions.map(method => (
                <option key={method.snakeCase} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Host */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Host/Domain <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="host"
              value={formData.host}
              onChange={handleChange}
              placeholder="e.g., api.example.com"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
            <p className="text-xs text-gray-500 mt-2">Enter the hostname or domain without the protocol</p>
          </div>

          {/* Port */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Port
            </label>
            <input
              type="number"
              name="port"
              value={formData.port}
              onChange={handleChange}
              placeholder="443"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              min="1"
              max="65535"
            />
          </div>

          {/* Access Token */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Access Token <span className="text-red-500">*</span>
              {system && <span className="text-xs text-gray-500 ml-2 font-normal">(leave empty to keep existing)</span>}
            </label>
            <textarea
              name="access_token"
              value={formData.access_token}
              onChange={handleChange}
              placeholder="Paste your access token here..."
              rows="4"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm"
              required={!system}
            />
            <p className="text-xs text-gray-500 mt-2">Your access token will be securely encrypted and stored</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add notes about this system..."
              rows="3"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </form>

      {/* Footer Buttons */}
      <div className="bg-gray-50 border-t-2 border-gray-100 px-8 py-6 flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
        >
          <FaSave />
          {loading ? 'Saving...' : system ? 'Update System' : 'Create System'}
        </button>
      </div>
    </div>
  );
};

export default TargetSystemForm;