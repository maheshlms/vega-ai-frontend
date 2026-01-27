import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaStar, FaPlug, FaShieldAlt, FaServer } from 'react-icons/fa';
import api from '../utils/api';

const IntegrationsPage = () => {
  const navigate = useNavigate();
  const [integrationsData, setIntegrationsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch integrations from backend
  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        setLoading(true);
        const response = await api.integrations.list();
        
        console.log('Full integrations response:', response);
        console.log('Integrations array:', response.integrations);
        
        // Create a map of integrations by value for quick lookup of full data with _id
        const integrationsMap = {};
        if (response.integrations && Array.isArray(response.integrations)) {
          response.integrations.forEach(integration => {
            console.log(`Integration "${integration.name}" _id:`, integration._id);
            integrationsMap[integration.value] = integration;
          });
        }
        
        // Transform response to organized categories structure
        const categorized = {};
        if (response.categories) {
          Object.entries(response.categories).forEach(([category, items]) => {
            console.log(`Category "${category}" items:`, items);
            categorized[category] = {
              category,
              icon: getCategoryIcon(category),
              items: items.map(item => {
                // Get the full integration data from the integrations array for complete _id
                const fullIntegration = integrationsMap[item.value];
                const itemId = fullIntegration?._id || item._id || item.id;
                console.log(`Item "${item.name}" (value: ${item.value}) ID:`, itemId);
                return {
                  id: itemId,
                  value: item.value,
                  name: item.name,
                  description: item.description,
                  logo: item.icon || getDefaultIcon(item.value),
                  verified: true,
                  status: 'connected',
                  badges: item.tags || [],
                  auth_methods: item.auth_methods || []
                };
              })
            };
          });
        }
        
        setIntegrationsData(categorized);
      } catch (err) {
        console.error('Failed to fetch integrations:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchIntegrations();
  }, []);

  // Map category names to icons
  const getCategoryIcon = (category) => {
    const iconMap = {
      'OIDC Provider': FaShieldAlt,
      'Identity Datastores / Directories': FaServer,
      'Cloud Identity': FaPlug,
      'Messaging & Notifications': FaPlug
    };
    return iconMap[category] || FaPlug;
  };

  // Get default icon emoji based on integration value
  const getDefaultIcon = (value) => {
    const iconMap = {
      'ping_federate': '🔐',
      'ping_directory': '📚',
      'activedirectory': '🏢',
      'ping_one': '☁️',
      'okta': '⭕',
      'auth0': '🔒',
      'slack': '💬',
      'teams': '👥'
    };
    return iconMap[value] || '🔌';
  };

  const getBadgeColors = (badge) => {
    const colors = {
      'SSO': 'bg-blue-100 text-blue-700 border-blue-300',
      'Enterprise': 'bg-purple-100 text-purple-700 border-purple-300',
      'SAML': 'bg-green-100 text-green-700 border-green-300',
      'LDAP': 'bg-blue-100 text-blue-700 border-blue-300',
      'Directory': 'bg-gray-100 text-gray-700 border-gray-300',
      'Sync': 'bg-cyan-100 text-cyan-700 border-cyan-300',
      'Windows': 'bg-blue-100 text-blue-700 border-blue-300',
      'SaaS': 'bg-blue-100 text-blue-700 border-blue-300',
      'IDaaS': 'bg-purple-100 text-purple-700 border-purple-300',
      'Cloud': 'bg-sky-100 text-sky-700 border-sky-300',
      'OAuth': 'bg-orange-100 text-orange-700 border-orange-300',
      'OIDC': 'bg-pink-100 text-pink-700 border-pink-300',
      'Chat': 'bg-green-100 text-green-700 border-green-300',
      'Notifications': 'bg-yellow-100 text-yellow-700 border-yellow-300'
    };
    return colors[badge] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const handleIntegrationSelect = (integrationId, integrationName, integrationValue, authMethods) => {
    // Navigate to target systems page filtered by integration
    navigate(`/integration/target-systems/${integrationId}`, { 
      state: { integrationName, integrationValue, authMethods } 
    });
  };

  const IntegrationCard = ({ item }) => (
    <div 
      onClick={() => handleIntegrationSelect(item.id, item.name, item.value, item.auth_methods)}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-2xl">
          {item.logo}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{item.name}</h3>
            {item.verified && (
              <FaCheckCircle className="text-green-500 text-sm" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {item.badges.map((badge, index) => (
          <span
            key={index}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getBadgeColors(badge)}`}
          >
            {badge}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center gap-2 mb-1">
            <FaStar className="text-yellow-500" />
            <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          </div>
          <p className="text-sm text-gray-500">
            Connect your IAM systems and manage integrations
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="px-6 py-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="px-6 py-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            Failed to load integrations: {error}
          </div>
        </div>
      )}

      {/* Integration Categories */}
      {!loading && !error && (
        <div className="px-6 py-6">
          {Object.keys(integrationsData).length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-500">No integrations available</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.values(integrationsData).map((category, index) => {
                const CategoryIcon = category.icon;
                return (
                  <div key={index}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <CategoryIcon className="text-gray-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{category.category}</h2>
                        <p className="text-xs text-gray-500">{category.items.length} integration{category.items.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.items.map((item) => (
                        <IntegrationCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IntegrationsPage;