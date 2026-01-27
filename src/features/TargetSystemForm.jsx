import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave } from 'react-icons/fa';

const TargetSystemForm = ({ system = null, typeOptions = [], availableAuthMethods = [], integrationValue = null, integrationName = null, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: integrationValue || '',
    environment: 'production',
    auth_method: 'BasicAuth',
    host: '',
    port: 443,
    username: '',
    password: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (system) {
      setFormData({
        name: system.name || '',
        type: system.type || '',
        environment: system.environment || 'production',
        auth_method: system.auth_method || 'BasicAuth',
        host: system.host || '',
        port: system.port || 443,
        username: system.username || '',
        password: '', // Don't pre-fill password for security
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
      if (!formData.name || !formData.type || !formData.host || !formData.username || !formData.password) {
        setError('Please fill in all required fields (Name, Type, Host, Username, Password)');
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
        base_url: base_url,
        auth_method: authMethodToSnakeCase(formData.auth_method),  // Convert to snake_case
        credentials: {
          username: formData.username,
          password: formData.password
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
        { value: 'BasicAuth', label: 'Basic Auth', snakeCase: 'basic_auth' },
        { value: 'APIKey', label: 'API Key', snakeCase: 'api_key' },
        { value: 'OAuth2', label: 'OAuth2', snakeCase: 'oauth2' },
        { value: 'ClientCredentials', label: 'Client Credentials', snakeCase: 'client_credentials' },
        { value: 'BearerToken', label: 'Bearer Token', snakeCase: 'bearer_token' },
        { value: 'Certificate', label: 'Certificate', snakeCase: 'certificate' }
      ];

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">
          {system ? 'Edit Target System' : 'Create Target System'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
          title="Close"
        >
          <FaTimes size={24} />
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            System Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Production PingFederate"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Type */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            System Type *
          </label>
          {integrationName ? (
            // Read-only display when integration is selected
            <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-semibold">
              {integrationName}
            </div>
          ) : (
            // Editable dropdown when no integration is selected
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Environment
          </label>
          <select
            name="environment"
            value={formData.environment}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
        </div>

        {/* Auth Method */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Auth Method
          </label>
          <select
            name="auth_method"
            value={formData.auth_method}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select auth method...</option>
            {authMethodOptions.map(method => (
              <option key={method.snakeCase} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>

        {/* Host */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Host/Domain *
          </label>
          <input
            type="text"
            name="host"
            value={formData.host}
            onChange={handleChange}
            placeholder="e.g., pingfederate.example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Port */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Port
          </label>
          <input
            type="number"
            name="port"
            value={formData.port}
            onChange={handleChange}
            placeholder="443"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
            max="65535"
          />
        </div>

        {/* Username */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Username
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Admin user"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Password
            {system && <span className="text-xs text-gray-500 ml-2">(leave empty to keep existing)</span>}
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add notes about this system..."
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            <FaSave />
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TargetSystemForm;
