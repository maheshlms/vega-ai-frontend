import React from 'react';
import { FaCheckCircle, FaStar } from 'react-icons/fa';

const CreateAgent = () => {
  // OIDC Provider Data
  const oidcProviders = [
    {
      id: 1,
      logo: "PingFederate",
      title: "Ping Federate",
      verified: true,
      badges: [
        { text: "SSO", color: "blue" },
        { text: "Enterprise", color: "purple" }
      ]
    },
    // {
    //   id: 2,
    //   logo: "okta",
    //   title: "Okta",
    //   verified: true,
    //   badges: [
    //     { text: "Cloud", color: "gray" },
    //     { text: "Auth", color: "blue" }
    //   ]
    // },
    // {
    //   id: 3,
    //   logo: "KEYCLOAK",
    //   title: "Keycloak",
    //   verified: true,
    //   badges: [
    //     { text: "IAM", color: "purple" },
    //     { text: "Open Source", color: "green" }
    //   ]
    // }
  ];

  // Identity Datastores/Directories Data
  const directories = [
    {
      id: 1,
      logo: "PingDirectory",
      title: "Ping Directory",
      verified: true,
      badges: [
        { text: "LDAP", color: "blue" },
        { text: "Directory", color: "gray" }
      ]
    },
    // {
    //   id: 2,
    //   logo: "Active Directory",
    //   title: "Active Directory",
    //   verified: true,
    //   badges: [
    //     { text: "Domain", color: "blue" },
    //     { text: "Microsoft", color: "gray" }
    //   ]
    // },
    // {
    //   id: 3,
    //   logo: "aws",
    //   title: "AWS Directory Services",
    //   verified: true,
    //   badges: [
    //     { text: "AWS", color: "orange" },
    //     { text: "Cloud", color: "gray" }
    //   ]
    // }
  ];

  // Cloud Identity Data
  const cloudIdentity = [
    {
      id: 1,
      logo: "PingOne",
      title: "Ping One",
      verified: true,
      badges: [
        { text: "SaaS", color: "blue" },
        { text: "IDaaS", color: "purple" }
      ]
    },
    // {
    //   id: 2,
    //   logo: "Azure",
    //   title: "Azure AD",
    //   verified: true,
    //   badges: [
    //     { text: "Cloud", color: "blue" },
    //     { text: "Microsoft", color: "gray" }
    //   ]
    // },
    // {
    //   id: 3,
    //   logo: "Google Cloud",
    //   title: "Google Cloud Identity",
    //   verified: true,
    //   badges: [
    //     { text: "IDaaS", color: "blue" },
    //     { text: "Google", color: "gray" }
    //   ]
    // }
  ];

  // Badge color mapping - exact colors from design
  const getBadgeColors = (color) => {
    const colors = {
      blue: "bg-blue-100 text-blue-700 border border-blue-300",
      purple: "bg-purple-100 text-purple-700 border border-purple-300",
      gray: "bg-gray-100 text-gray-700 border border-gray-300",
      green: "bg-green-100 text-green-700 border border-green-300",
      orange: "bg-orange-100 text-orange-700 border border-orange-300"
    };
    return colors[color] || colors.gray;
  };

  // Integration Card Component
  const IntegrationCard = ({ item }) => (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5 hover:shadow-lg transition-shadow cursor-pointer">
      {/* Logo/Text */}
      <div className="flex items-center justify-center h-12 mb-4">
        <span className="text-xl font-bold text-gray-900">{item.logo}</span>
      </div>

      {/* Title */}
      <h3 className="text-left font-semibold text-gray-900 mb-2 text-sm">
        {item.title}
      </h3>

      {/* Badges Row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Verified Badge */}
        {item.verified && (
          <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded">
            <FaCheckCircle className="text-green-600 text-xs" />
            <span className="text-xs text-green-600 font-medium">Verified</span>
          </div>
        )}
        
        {/* Feature Badges */}
        {item.badges.map((badge, index) => (
          <span
            key={index}
            className={`px-2.5 py-0.5 rounded text-xs font-medium ${getBadgeColors(badge.color)}`}
          >
            {badge.text}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="border-b border-gray-200 bg-white">
        <div className="px-6 py-6">
          <div className="flex items-center gap-2 mb-1">
            <FaStar className="text-gray-400 text-sm" />
            <h1 className="text-2xl font-bold text-gray-900">
              Advanced Integrations
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-6">
            Fully autonomous AI agents with advanced capabilities and enterprise-grade integrations
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">
        
        {/* OIDC Provider Section */}
        <div className="mb-10">
          <h2 className="text-base font-semibold text-gray-900 mb-4">OIDC Provider</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {oidcProviders.map((item) => (
              <IntegrationCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Identity Datastores / Directories Section */}
        <div className="mb-10">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Identity Datastores / Directories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {directories.map((item) => (
              <IntegrationCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Cloud Identity Section */}
        <div className="mb-10">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Cloud Identity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cloudIdentity.map((item) => (
              <IntegrationCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAgent;