import React from 'react';
import { FaCheckCircle, FaStar, FaPlug, FaShieldAlt, FaServer } from 'react-icons/fa';

const IntegrationsPage = () => {
  // Integration categories and data
  const integrations = [
    {
      category: 'OIDC Provider',
      icon: FaShieldAlt,
      items: [
        {
          id: 'pingfederate',
          name: 'Ping Federate',
          description: 'Enterprise federation and SSO platform',
          logo: '🔐',
          verified: true,
          status: 'connected',
          badges: ['SSO', 'Enterprise', 'SAML'],
          connectedSince: '2024-12-01'
        }
      ]
    },
    {
      category: 'Identity Datastores / Directories',
      icon: FaServer,
      items: [
        {
          id: 'pingdirectory',
          name: 'Ping Directory',
          description: 'High-performance LDAP directory service',
          logo: '📚',
          verified: true,
          status: 'connected',
          badges: ['LDAP', 'Directory', 'Sync'],
          connectedSince: '2024-12-05'
        },
        {
          id: 'activedirectory',
          name: 'Active Directory',
          description: 'Microsoft directory services',
          logo: '🏢',
          verified: true,
          status: 'available',
          badges: ['Windows', 'Enterprise']
        }
      ]
    },
    {
      category: 'Cloud Identity',
      icon: FaPlug,
      items: [
        {
          id: 'pingone',
          name: 'Ping One',
          description: 'Cloud-native identity platform',
          logo: '☁️',
          verified: true,
          status: 'connected',
          badges: ['SaaS', 'IDaaS', 'Cloud'],
          connectedSince: '2024-12-10'
        },
        {
          id: 'okta',
          name: 'Okta',
          description: 'Identity and access management platform',
          logo: '⭕',
          verified: true,
          status: 'available',
          badges: ['Cloud', 'SSO']
        },
        {
          id: 'auth0',
          name: 'Auth0',
          description: 'Authentication and authorization platform',
          logo: '🔒',
          verified: true,
          status: 'available',
          badges: ['OAuth', 'OIDC']
        }
      ]
    },
    {
      category: 'Messaging & Notifications',
      icon: FaPlug,
      items: [
        {
          id: 'slack',
          name: 'Slack',
          description: 'Team collaboration and messaging',
          logo: '💬',
          verified: true,
          status: 'connected',
          badges: ['Chat', 'Notifications'],
          connectedSince: '2024-11-20'
        },
        {
          id: 'teams',
          name: 'Microsoft Teams',
          description: 'Enterprise communication platform',
          logo: '👥',
          verified: true,
          status: 'available',
          badges: ['Chat', 'Enterprise']
        }
      ]
    }
  ];

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

  const IntegrationCard = ({ item }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
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
        
        {item.status === 'connected' ? (
          <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-green-700">Connected</span>
          </div>
        ) : (
          <button className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-1.5 rounded-full text-xs font-medium border border-blue-200 transition-colors">
            Connect
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {item.badges.map((badge, index) => (
          <span
            key={index}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getBadgeColors(badge)}`}
          >
            {badge}
          </span>
        ))}
      </div>

      {item.connectedSince && (
        <div className="text-xs text-gray-500 pt-3 border-t border-gray-100">
          Connected since {new Date(item.connectedSince).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}
        </div>
      )}
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

      {/* Stats */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">12</div>
            <div className="text-xs text-gray-500 mt-1">Total Integrations</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">4</div>
            <div className="text-xs text-gray-500 mt-1">Connected</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-600">8</div>
            <div className="text-xs text-gray-500 mt-1">Available</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-purple-600">98.5%</div>
            <div className="text-xs text-gray-500 mt-1">Uptime</div>
          </div>
        </div>

        {/* Integration Categories */}
        <div className="space-y-8">
          {integrations.map((category, index) => {
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
      </div>
    </div>
  );
};

export default IntegrationsPage;