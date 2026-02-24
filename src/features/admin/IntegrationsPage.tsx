import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaStar } from 'react-icons/fa';

// Type Definitions
interface IntegrationItem {
  id: string;
  value: string;
  name: string;
  description: string;
  logo: string;
  verified: boolean;
  status: string;
  badges: string[];
  auth_methods: string[];
}

interface IntegrationCardProps {
  item: IntegrationItem;
}

// Static integrations data
const STATIC_INTEGRATIONS: IntegrationItem[] = [
  {
    id: '1',
    value: 'pingfederate',
    name: 'Ping Federate',
    description: 'Ping Identity Federation Server',
    logo: '/logos/pingfederate.png',
    verified: true,
    status: 'connected',
    badges: ['SSO', 'Enterprise'],
    auth_methods: ['basic_auth', 'bearer_token']
  },
  {
    id: '2',
    value: 'okta',
    name: 'Okta',
    description: 'Okta Identity Management',
    logo: '/logos/okta.png',
    verified: true,
    status: 'connected',
    badges: ['Cloud', 'Auth'],
    auth_methods: ['oauth2']
  },
  {
    id: '3',
    value: 'keycloak',
    name: 'Keycloak',
    description: 'Open Source Identity and Access Management',
    logo: '/logos/keycloak.png',
    verified: true,
    status: 'connected',
    badges: ['IAM', 'Open Source'],
    auth_methods: ['oauth2', 'bearer_token']
  },
  {
    id: '4',
    value: 'pingdirectory',
    name: 'Ping Directory',
    description: 'Ping Identity Directory Server',
    logo: '/logos/pingdirectory.png',
    verified: true,
    status: 'connected',
    badges: ['LDAP', 'Directory'],
    auth_methods: ['basic_auth']
  },
  {
    id: '5',
    value: 'activedirectory',
    name: 'Active Directory',
    description: 'Microsoft Active Directory',
    logo: '/logos/activedirectory.png',
    verified: true,
    status: 'connected',
    badges: ['Domain', 'Microsoft'],
    auth_methods: ['basic_auth']
  },
  {
    id: '6',
    value: 'aws',
    name: 'AWS Directory Services',
    description: 'Amazon Web Services Directory Services',
    logo: '/logos/aws.png',
    verified: true,
    status: 'connected',
    badges: ['AWS', 'Cloud'],
    auth_methods: ['bearer_token']
  },
  {
    id: '7',
    value: 'pingone',
    name: 'Ping One',
    description: 'Ping Identity Cloud Platform',
    logo: '/logos/pingone.png',
    verified: true,
    status: 'connected',
    badges: ['SaaS', 'IDaaS', 'Cloud'],
    auth_methods: ['oauth2']
  },
  {
    id: '8',
    value: 'azure',
    name: 'Azure AD',
    description: 'Microsoft Azure Active Directory',
    logo: '/logos/azure.png',
    verified: true,
    status: 'connected',
    badges: ['Cloud', 'Microsoft'],
    auth_methods: ['oauth2']
  },
  {
    id: '9',
    value: 'googlecloud',
    name: 'Google Cloud Identity',
    description: 'Google Cloud Identity Platform',
    logo: '/logos/googlecloud.png',
    verified: true,
    status: 'connected',
    badges: ['IDaaS', 'Google'],
    auth_methods: ['oauth2']
  },
  {
    id: '10',
    value: 'britive',
    name: 'Britive',
    description: 'Britive Cloud Privilege Access Management',
    logo: '/logos/britive.png',
    verified: true,
    status: 'connected',
    badges: ['Cloud', 'Auth'],
    auth_methods: ['oauth2', 'api_key']
  },
  {
    id: '11',
    value: 'strivacity',
    name: 'Strivacity',
    description: 'Strivacity Customer Identity Platform',
    logo: '/logos/strivacity.png',
    verified: true,
    status: 'connected',
    badges: ['Cloud', 'Auth'],
    auth_methods: ['oauth2']
  },
  {
    id: '12',
    value: 'aembit',
    name: 'Aembit',
    description: 'Aembit Workload Identity Platform',
    logo: '/logos/aembit.png',
    verified: true,
    status: 'connected',
    badges: ['Cloud', 'Identity'],
    auth_methods: ['oauth2', 'bearer_token']
  }
];

const IntegrationsPage: React.FC = () => {
  const navigate = useNavigate();

  const getBadgeColors = (badge: string): string => {
    const colors: { [key: string]: string } = {
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
      'Notifications': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'Auth': 'bg-indigo-100 text-indigo-700 border-indigo-300',
      'IAM': 'bg-violet-100 text-violet-700 border-violet-300',
      'Open Source': 'bg-green-100 text-green-700 border-green-300',
      'Google': 'bg-red-100 text-red-700 border-red-300',
      'AWS': 'bg-orange-100 text-orange-700 border-orange-300',
      'Microsoft': 'bg-blue-100 text-blue-700 border-blue-300',
      'Domain': 'bg-gray-100 text-gray-700 border-gray-300',
      'Identity': 'bg-pink-100 text-pink-700 border-pink-300'
    };
    return colors[badge] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const handleIntegrationSelect = (integrationId: string, integrationName: string, integrationValue: string, authMethods: string[]): void => {
    navigate(`/integration/target-systems/${integrationId}`, {
      state: { integrationName, integrationValue, authMethods }
    });
  };

  const IntegrationCard: React.FC<IntegrationCardProps> = ({ item }) => {
    return (
      <div
        // onClick={() => handleIntegrationSelect(item.id, item.name, item.value, item.auth_methods)}
        className="bg-white rounded-[5%] shadow-sm border border-gray-200 p-4 2xl:p-5 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer flex flex-col items-start"
      >
        {/* Logo - Larger, centered at the top */}
        <div className="w-full flex justify-center mb-3 2xl:mb-4">
          <div className="w-full h-40 2xl:h-48 bg-white rounded-[5%] flex items-center justify-center overflow-hidden p-4 2xl:p-5">
            <img
              src={item.logo}
              alt={`${item.name} logo`}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Integration Name + Status */}
        <div className="w-full mb-2 2xl:mb-3">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-sm 2xl:text-base">
              {item.name}
            </h3>
            {item.status === 'connected' && (
              <span className="text-green-600 text-xs 2xl:text-sm">✓(Configured)</span>
            )}
          </div>
          {item.verified && (
            <div className="flex items-center gap-1.5 text-green-600">
              <FaCheckCircle className="text-sm 2xl:text-base" />
              <span className="text-xs 2xl:text-sm font-medium">Verified</span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="w-full flex flex-wrap gap-2 2xl:gap-2.5">
          {item.badges.map((badge, index) => (
            <span
              key={index}
              className={`px-3 py-1 2xl:px-3.5 2xl:py-1.5 rounded-md text-xs 2xl:text-sm font-medium border ${getBadgeColors(badge)}`}
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 2xl:px-20 py-6 2xl:py-10">
          <div className="flex items-center gap-2 mb-1">
            <FaStar className="text-yellow-500 2xl:text-xl" />
            <h1 className="text-2xl 2xl:text-4xl font-bold text-gray-900">
              Integrations MarketPlace
            </h1>
            <h2 className="text-gray-600 2xl:text-xl">&nbsp;(Future Release)</h2>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm 2xl:text-base text-gray-500">
              Connect your IAM systems and manage integrations
            </p>
          </div>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="px-6 2xl:px-20 py-6 2xl:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 2xl:gap-6">
          {STATIC_INTEGRATIONS.map((item) => (
            <IntegrationCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPage;