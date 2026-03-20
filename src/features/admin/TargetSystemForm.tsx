import React, { useState, useEffect } from 'react';
// CHANGE 1 of 4: Added FaExclamationTriangle to existing import (needed for failed-state icon in modal)
import { FaTimes, FaCheckCircle, FaShieldAlt, FaKey, FaLock, FaFingerprint, FaEye, FaEyeSlash, FaClipboard, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { IconType } from 'react-icons';
// CHANGE 2 of 4: Added api import so we can call api.targetSystems.testConnection after create/update
import api from '../../utils/api';

interface TypeOption {
  value: string;
  label: string;
}

interface AuthMethodOption {
  value: string;
  label: string;
  snakeCase: string;
  icon?: IconType;
  description?: string;
}

interface System {
  name?: string;
  type?: string;
  integration_id?: string;
  environment?: string;
  auth_method?: string;
  host?: string;  // Deprecated: use hostname
  hostname?: string;  // Backend returns this field
  port?: number;  // Deprecated: use default_port
  default_port?: number;  // Backend returns this field
  base_url?: string;
  engine_port?: number;
  description?: string;
  credentials?: {
    username?: string;  // For basic_auth (non-sensitive)
    client_id?: string;  // For bearer_token (non-sensitive)
    // Note: passwords, secrets, and api_keys are never returned by backend
    [key: string]: any;
  };
}

interface FormData {
  name: string;
  type: string;
  integration_id: string;
  environment: string;
  auth_method: string;
  host: string;
  port: number;
  engine_port: number;
  username: string;
  password: string;
  client_id: string;
  client_secret: string;
  api_key: string;
  description: string;
  // PingDirectory / LDAP specific
  server_url: string;       // combined "ldap://host:port" field (matches screenshot)
  ldap_host: string;        // hostname only (derived from server_url)
  ldaps_port: number;       // LDAPS port (default 636)
  base_dn: string;
  bind_dn: string;
  bind_password: string;
  enable_ssl: boolean;      // "Enable SSL (LDAPS)" checkbox
  // LDAPS-specific SSL config (shown only when enable_ssl = true)
  ssl_trust_mode: string;   // 'trustAll' | 'trustStore' | 'certificate'
  ssl_certificate: string;  // PEM certificate text (when ssl_trust_mode = 'certificate')
  ssl_truststore_path: string; // path to JKS/PKCS12 trust store
  ssl_truststore_password: string;
  // PingOne specific
  region: string;
  environment_id: string;
  // Okta / Auth0 specific
  domain: string;
  // AzureAD specific
  tenant_id: string;
}

interface SubmitData {
  name: string;
  type: string;
  integration_id: string;
  base_url: string;
  auth_method: string;
  credentials: {
    username?: string;
    password?: string;
    client_id?: string;
    client_secret?: string;
    api_key?: string;
    token?: string;
  };
  environment: string;
  description: string;
  engine_port?: number;
  // extra per-type metadata
  server_url?: string;
  ldaps_port?: number;
  base_dn?: string;
  enable_ssl?: boolean;
  ssl_trust_mode?: string;
  ssl_certificate?: string;
  ssl_truststore_path?: string;
  ssl_truststore_password?: string;
  region?: string;
  environment_id?: string;
  domain?: string;
  tenant_id?: string;
}

interface TargetSystemFormProps {
  system?: System | null;
  typeOptions?: TypeOption[];
  availableAuthMethods?: string[];
  integrationValue?: string | null;
  integrationId?: string | null;
  integrationName?: string | null;
  // CHANGE 3 of 4: onSubmit return type changed from Promise<void> to Promise<any>
  // so the parent can return the created/updated system object (with _id) for auto-testing
  onSubmit: (data: SubmitData) => Promise<any>;
  onCancel?: () => void;
  isModal?: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Per-integration canonical defaults                                          */
/* ─────────────────────────────────────────────────────────────────────────── */
interface IntegrationDefaults {
  port: number;
  engine_port?: number;
  defaultAuthMethod: string;
  allowedAuthMethods: string[];
  placeholders: Partial<Record<keyof FormData, string>>;
  hints: Partial<Record<string, string>>;
}

const INTEGRATION_DEFAULTS: Record<string, IntegrationDefaults> = {
  PingFederate: {
    port: 9999,
    engine_port: 9031,
    defaultAuthMethod: 'BearerToken',
    allowedAuthMethods: ['BearerToken', 'BasicAuth'],
    placeholders: {
      host: 'e.g., pingfederate.example.com',
      port: '9999',
      engine_port: '9031',
      client_id: 'Enter OAuth client ID',
      client_secret: 'Paste client secret…',
      username: 'Administrator',
      password: 'Enter admin password',
    },
    hints: {
      host: 'Hostname of your PingFederate Admin server',
      port: 'PingFederate Admin API port (default 9999)',
      engine_port: 'PingFederate Engine/Runtime port (default 9031)',
      client_id: 'OAuth 2.0 Client ID registered in PingFederate',
      client_secret: 'OAuth 2.0 Client Secret (stored encrypted)',
    },
  },
  PingDirectory: {
    port: 1443,
    defaultAuthMethod: 'AssertionJwtExchange',
    allowedAuthMethods: ['AssertionJwtExchange', 'BearerToken', 'BasicAuth'],
    placeholders: {
      host: 'e.g., directory.example.com',
      base_dn: 'dc=example,dc=com',
      username: 'cn=Directory Manager',
      password: 'Enter bind password',
    },
    hints: {
      host: 'Hostname of your PingDirectory server',
      base_dn: 'Root DN of your directory tree',
      username: 'Distinguished Name used to authenticate (e.g. cn=Directory Manager)',
      password: 'Password for the bind account (stored encrypted)',
    },
  },
  PingOne: {
    port: 443,
    defaultAuthMethod: 'BearerToken',
    allowedAuthMethods: ['BearerToken', 'APIKey'],
    placeholders: {
      host: 'api.pingone.com',
      region: 'e.g., NA, EU, AP',
      environment_id: 'e.g., xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      client_id: 'Enter PingOne client ID',
      client_secret: 'Paste client secret…',
    },
    hints: {
      host: 'PingOne API host (usually api.pingone.com)',
      region: 'Your PingOne region: NA, EU, or AP',
      environment_id: 'PingOne Environment UUID from the admin console',
      client_id: 'Worker App client ID',
      client_secret: 'Worker App client secret (stored encrypted)',
    },
  },
  Okta: {
    port: 443,
    defaultAuthMethod: 'APIKey',
    allowedAuthMethods: ['APIKey', 'BearerToken'],
    placeholders: {
      host: 'e.g., yourorg.okta.com',
      domain: 'yourorg.okta.com',
      api_key: 'Paste your Okta API token…',
      client_id: 'Enter Okta client ID',
      client_secret: 'Paste client secret…',
    },
    hints: {
      host: 'Your Okta organisation domain',
      domain: 'Okta domain (same as host)',
      api_key: 'Okta API token (generated in Security → API)',
    },
  },
  AzureAD: {
    port: 443,
    defaultAuthMethod: 'BearerToken',
    allowedAuthMethods: ['BearerToken', 'ClientCredentials'],
    placeholders: {
      host: 'graph.microsoft.com',
      tenant_id: 'e.g., xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      client_id: 'Enter Azure App client ID',
      client_secret: 'Paste client secret…',
    },
    hints: {
      host: 'Microsoft Graph API host (graph.microsoft.com)',
      tenant_id: 'Azure Active Directory Tenant ID (UUID)',
      client_id: 'Azure App Registration Application (client) ID',
      client_secret: 'Azure App Registration client secret (stored encrypted)',
    },
  },
  Auth0: {
    port: 443,
    defaultAuthMethod: 'BearerToken',
    allowedAuthMethods: ['BearerToken', 'ClientCredentials'],
    placeholders: {
      host: 'e.g., yourtenancy.auth0.com',
      domain: 'yourtenancy.auth0.com',
      client_id: 'Enter Auth0 client ID',
      client_secret: 'Paste client secret…',
    },
    hints: {
      host: 'Your Auth0 tenant domain',
      domain: 'Auth0 domain (same as host)',
    },
  },
  LDAP: {
    port: 636,
    defaultAuthMethod: 'BasicAuth',
    allowedAuthMethods: ['BasicAuth'],
    placeholders: {
      host: 'e.g., ldap.example.com',
      port: '636',
      ldaps_port: '636',
      base_dn: 'dc=example,dc=com',
      bind_dn: 'cn=admin,dc=example,dc=com',
      bind_password: 'Enter bind password',
    },
    hints: {
      host: 'Hostname of your LDAP server',
      ldaps_port: 'SSL LDAP port (default 636)',
      base_dn: 'Root DN of your directory tree',
      bind_dn: 'Distinguished Name used to authenticate',
    },
  },
  Custom: {
    port: 443,
    defaultAuthMethod: 'BearerToken',
    allowedAuthMethods: ['BearerToken', 'BasicAuth', 'APIKey', 'OAuth2', 'ClientCredentials'],
    placeholders: {
      host: 'e.g., api.example.com',
    },
    hints: {
      host: 'Hostname or IP of the target system',
    },
  },
};

/* look up defaults tolerantly (handles ping_federate, PingFederate, etc.) */
const getIntegrationDefaults = (type: string): IntegrationDefaults => {
  const map: Record<string, string> = {
    ping_federate: 'PingFederate', pingfederate: 'PingFederate',
    ping_directory: 'PingDirectory', pingdirectory: 'PingDirectory',
    ping_one: 'PingOne', pingone: 'PingOne',
    azure_ad: 'AzureAD', azuread: 'AzureAD',
    auth0: 'Auth0',
    okta: 'Okta',
    ldap: 'LDAP',
    custom: 'Custom',
  };
  const key = map[type?.toLowerCase()] ?? type;
  return INTEGRATION_DEFAULTS[key] ?? INTEGRATION_DEFAULTS.Custom;
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* Helper Components (defined outside to prevent re-creation on render)       */
/* ─────────────────────────────────────────────────────────────────────────── */
const SecureNote = () => (
  <p className="tsf-hint-text text-gray-500 mt-2 flex items-center gap-1">
    <span>🔒</span>
    <span>This value will be securely encrypted and stored</span>
  </p>
);

const Hint = ({ text }: { text: string }) => (
  <p className="tsf-hint-text text-gray-500 mt-2 flex items-center gap-1">
    <span>💡</span>
    <span>{text}</span>
  </p>
);

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string | null;
  subLabel?: string;
  children: React.ReactNode;
}

const Field = ({ label, required, hint, subLabel, children }: FieldProps) => (
  <div className="group">
    <label className="tsf-field-label block font-semibold text-gray-900 mb-2">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
      {subLabel && <span className="tsf-sublabel text-gray-500 ml-2 font-normal">{subLabel}</span>}
    </label>
    {children}
    {hint && <Hint text={hint} />}
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────── */
/* Component                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */
const TargetSystemForm: React.FC<TargetSystemFormProps> = ({
  system = null,
  typeOptions = [],
  availableAuthMethods = [],
  integrationValue = null,
  integrationId = null,
  integrationName = null,
  onSubmit,
  onCancel,
  isModal = false,
}) => {
  /* ── helpers ── */
  const snakeToPascal = (str: string): string =>
    str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');

  const normalizeType = (typeStr: string): string => {
    if (!typeStr) return '';
    const typeMap: Record<string, string> = {
      ping_federate: 'PingFederate', pingfederate: 'PingFederate',
      'ping federate': 'PingFederate', 'ping-federate': 'PingFederate',
      ping_directory: 'PingDirectory', pingdirectory: 'PingDirectory',
      'ping directory': 'PingDirectory', 'ping-directory': 'PingDirectory',
      ping_one: 'PingOne', pingone: 'PingOne',
      'ping one': 'PingOne', 'ping-one': 'PingOne',
      azure_ad: 'AzureAD', azuread: 'AzureAD',
      'azure ad': 'AzureAD', 'azure-ad': 'AzureAD',
    };
    const normalized = typeMap[typeStr.toLowerCase()];
    if (normalized) return normalized;
    if (!typeStr.includes('_') && !typeStr.includes('-') && !typeStr.includes(' ')) return typeStr;
    return snakeToPascal(typeStr);
  };

  const snakeToLabel = (str: string): string =>
    str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  /* ── derive the current integration type key ── */
  const resolvedType = normalizeType(
    system?.type || integrationValue || ''
  );
  const integDefaults = getIntegrationDefaults(resolvedType);

  /* ── state ── */
  const emptyForm: FormData = {
    name: '',
    type: integrationValue ? normalizeType(integrationValue) : '',
    integration_id: integrationId || '',
    environment: 'production',
    auth_method: 'AssertionJwtExchange',
    host: '',
    port: integDefaults.port,
    engine_port: integDefaults.engine_port ?? 9031,
    username: '',
    password: '',
    client_id: '',
    client_secret: '',
    api_key: '',
    description: '',
    // PingDirectory / LDAP
    server_url: '',
    ldap_host: '',
    ldaps_port: 636,
    base_dn: '',
    bind_dn: '',
    bind_password: '',
    enable_ssl: false,
    ssl_trust_mode: 'trustAll',
    ssl_certificate: '',
    ssl_truststore_path: '',
    ssl_truststore_password: '',
    // PingOne
    region: '',
    environment_id: '',
    // Okta / Auth0
    domain: '',
    // AzureAD
    tenant_id: '',
  };

  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [tokenProviderConfig, setTokenProviderConfig] = useState<any>(null);
  const [loadingTokenConfig, setLoadingTokenConfig] = useState<boolean>(false);
  const [expandInstructions, setExpandInstructions] = useState<boolean>(false);
  const [showIntrospectionSecret, setShowIntrospectionSecret] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  // CHANGE 4 of 4 (part a): New state for auto connection-test after CREATE or UPDATE
  // 'idle'      = not running (edit mode where parent returned no _id, or plain fallback)
  // 'testing'   = test in-flight — spinner shown, Done button disabled
  // 'connected' = test passed
  // 'failed'    = test failed
  const [connTestStatus, setConnTestStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
  const [connTestMessage, setConnTestMessage] = useState<string>('');

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

  /* ── load existing system ── */
  useEffect(() => {
    if (system) {
      const credentials = system.credentials || {};
      console.log('[TargetSystemForm] Credentials from backend:', credentials);
      console.log('[TargetSystemForm] Username:', credentials.username, 'Client ID:', credentials.client_id);
      
      // Extract host and port - backend returns hostname and default_port
      console.log('[TargetSystemForm] Raw from backend - hostname:', system.hostname, 'default_port:', system.default_port, 'base_url:', system.base_url);
      let host = system.hostname || system.host || '';
      let port = system.default_port || system.port || 443;
      
      // Fallback: parse from base_url if host/port not available
      if (!host && system.base_url) {
        try {
          const url = new URL(system.base_url);
          host = url.hostname;
          port = url.port ? parseInt(url.port) : 443;
        } catch {}
      }
      
      console.log('[TargetSystemForm] Final extracted host:', host, 'port:', port);
      
      // Normalize the type to match form options
      const rawType = system.type;
      const typeValue = rawType ? normalizeType(rawType) : '';
      
      console.log('[TargetSystemForm] Type conversion: raw="' + rawType + '" -> normalized="' + typeValue + '"');
      
      setFormData({
        name: system.name || '',
        type: typeValue,
        integration_id: system.integration_id || '',
        environment: system.environment || 'production',
        auth_method: system.auth_method ? snakeToPascal(system.auth_method) : integDefaults.defaultAuthMethod,
        host,
        port,
        engine_port: system.engine_port || integDefaults.engine_port || 9031,
        username: credentials.username || '',
        client_id: credentials.client_id || '',
        description: system.description || '',
        password: '',
        client_secret: '',
        api_key: '',
        // Directory / LDAP fields
        server_url: system.base_url || '',
        ldap_host: host,
        ldaps_port: port === 636 ? port : 636,
        base_dn: (system as any).config?.base_dn || '',
        bind_dn: credentials.bind_dn || '',
        bind_password: credentials.bind_password || '',
        enable_ssl: false,
        ssl_trust_mode: 'trustAll',
        ssl_certificate: '',
        ssl_truststore_path: '',
        ssl_truststore_password: '',
        // PingOne
        region: (system as any).region || '',
        environment_id: (system as any).environment_id || '',
        // Okta / Auth0
        domain: (system as any).domain || '',
        // AzureAD
        tenant_id: (system as any).tenant_id || ''
      });
      
      console.log('[TargetSystemForm] Form data updated with type:', typeValue);
      
      // Load token provider config if the system uses AssertionJwtExchange
      if (system.auth_method && 
          (system.auth_method === 'assertion_jwt_exchange' || system.auth_method === 'AssertionJwtExchange')) {
        setLoadingTokenConfig(true);
        fetch('/api/v1/token-provider-config', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        })
          .then(response => response.ok ? response.json() : null)
          .then(result => {
            if (result?.success && result?.data) {
              setTokenProviderConfig(result.data);
              console.log('[TargetSystemForm] Token provider config loaded:', result.data);
            }
          })
          .catch(err => console.error('[TargetSystemForm] Error loading token provider config:', err))
          .finally(() => setLoadingTokenConfig(false));
      }
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
  }, [system]);

  /* ── handlers ── */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const isCheckbox = (e.target as HTMLInputElement).type === 'checkbox';
    const checked    = (e.target as HTMLInputElement).checked;

    setFormData(prev => {
      const updated: FormData = {
        ...prev,
        [name]: isCheckbox
          ? checked
          : (name === 'port' || name === 'engine_port' || name === 'ldaps_port')
            ? (value === '' ? prev[name as keyof FormData] : (parseInt(value) || prev[name as keyof FormData]))
            : value,
      };

      return updated;
    });
  };

  // Load token provider config when auth method is AssertionJwtExchange
  useEffect(() => {
    if (formData.auth_method === 'AssertionJwtExchange' && !tokenProviderConfig && !loadingTokenConfig) {
      console.log('[TargetSystemForm] useEffect: Auth method is AssertionJwtExchange, loading token config');
      setLoadingTokenConfig(true);
      
      fetch('/api/v1/token-provider-config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })
        .then(response => {
          console.log('[TargetSystemForm] Token config response status:', response.status);
          return response.ok ? response.json() : null;
        })
        .then(result => {
          console.log('[TargetSystemForm] Token config fetch result:', result);
          if (result?.success && result?.data) {
            setTokenProviderConfig(result.data);
            console.log('[TargetSystemForm] Token provider config loaded in useEffect:', result.data);
          }
        })
        .catch(err => console.error('[TargetSystemForm] Error loading token provider config in useEffect:', err))
        .finally(() => setLoadingTokenConfig(false));
    }
  }, [formData.auth_method]);

  // Handle AuthMethod change to set defaults
  const handleAuthMethodChange = async (method: string): Promise<void> => {
    const updates: Partial<FormData> = { auth_method: method };
    const isPF = formData.type === 'PingFederate';
    if (isPF && method === 'BearerToken') {
      // Only reset port/engine_port to defaults if the user hasn't customised them
      const currentDefaults = getIntegrationDefaults('PingFederate');
      if (formData.port === getIntegrationDefaults(formData.type).port) {
        updates.port = currentDefaults.port;
      }
      if (formData.engine_port === (getIntegrationDefaults(formData.type).engine_port ?? 9031)) {
        updates.engine_port = currentDefaults.engine_port ?? 9031;
      }
    }
    setFormData(prev => ({ ...prev, ...updates }));
    
    // Fetch token provider config if AssertionJwtExchange is selected
    if (method === 'AssertionJwtExchange') {
      setLoadingTokenConfig(true);
      try {
        const response = await fetch('/api/v1/token-provider-config', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setTokenProviderConfig(result.data);
            console.log('[TargetSystemForm] Token provider config loaded:', result.data);
          }
        } else {
          console.error('[TargetSystemForm] Failed to load token provider config:', response.statusText);
          setTokenProviderConfig(null);
        }
      } catch (err) {
        console.error('[TargetSystemForm] Error loading token provider config:', err);
        setTokenProviderConfig(null);
      } finally {
        setLoadingTokenConfig(false);
      }
    } else {
      setTokenProviderConfig(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (typeof onSubmit !== 'function') { setError('Form submission handler is not properly configured'); return; }
    setError(null);
    setLoading(true);

    try {
      if (!formData.name || !formData.type) {
        setError('Please fill in all required fields (Name, Type)');
        setLoading(false);
        return;
      }

      // Directory types validate host + auth credentials + base_dn
      if (isDirectory(formData.type)) {
        if (!formData.ldap_host) {
          setError('Directory Host is required');
          setLoading(false);
          return;
        }
        if (formData.auth_method === 'BasicAuth' && (!formData.username || (!system && !formData.password))) {
          setError('Username and Password are required');
          setLoading(false);
          return;
        }
        if (formData.auth_method === 'BearerToken' && !system && !formData.client_secret) {
          setError('Bearer Token is required');
          setLoading(false);
          return;
        }
        if (!formData.base_dn) {
          setError('Base DN is required');
          setLoading(false);
          return;
        }
      } else {
        if (!formData.host) {
          setError('Host is required');
          setLoading(false);
          return;
        }
      }

      // Validate port number
      const portNum = Number(formData.port);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        setError('Port must be a valid number between 1 and 65535');
        setLoading(false);
        return;
      }
      
      // Validate engine_port if present
      if (formData.engine_port) {
        const enginePortNum = Number(formData.engine_port);
        if (isNaN(enginePortNum) || enginePortNum < 1 || enginePortNum > 65535) {
          setError('Engine port must be a valid number between 1 and 65535');
          setLoading(false);
          return;
        }
      }
      
      // For CREATE mode, validate all auth fields are present
      // For EDIT mode, only validate non-secret fields
      if (!system) {
        // CREATE mode - all auth fields required (except AssertionJwtExchange)
        if (formData.auth_method === 'BearerToken' && (!formData.client_id || !formData.client_secret)) {
          setError('Client ID and Client Secret are required for BearerToken');
          setLoading(false);
          return;
        }

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

        // AssertionJwtExchange doesn't require credentials - uses token provider config
        if (formData.auth_method === 'AssertionJwtExchange') {
          if (!tokenProviderConfig) {
            setError('Token Provider Configuration is required for Assertion JWT Exchange. Please configure it first.');
            setLoading(false);
            return;
          }
        }
      } else {
        // EDIT mode - only validate non-secret fields (username, client_id always required if present)
        if (formData.auth_method === 'BearerToken' && !formData.client_id) {
          setError('Client ID is required');
          setLoading(false);
          return;
        }

        if (formData.auth_method === 'BasicAuth' && !formData.username) {
          setError('Username is required');
          setLoading(false);
          return;
        }
      }

      /* type → snake_case */
      const typeToSnake = (t: string): string => {
        const m: Record<string, string> = {
          PingFederate: 'ping_federate', PingDirectory: 'ping_directory',
          PingOne: 'ping_one', Okta: 'okta', AzureAD: 'azure_ad',
          Auth0: 'auth0', LDAP: 'ldap', Custom: 'custom',
        };
        return m[t] || t.toLowerCase().replace(/\s+/g, '_');
      };

      // Convert auth_method to snake_case for API
      const authMethodToSnakeCase = (method: string): string => {
        const mapping: Record<string, string> = {
          'BasicAuth': 'basic_auth',
          'APIKey': 'api_key',
          'OAuth2': 'oauth2',
          'ClientCredentials': 'client_credentials',
          'BearerToken': 'bearer_token',
          'Certificate': 'certificate',
          'AssertionJwtExchange': 'assertion_jwt_exchange'
        };
        return mapping[method] || method.toLowerCase().replace(/\s+/g, '_');
      };

      // For directory types build HTTPS admin URL (REST API runs on port 1443)
      let base_url: string;
      if (isDirectory(formData.type)) {
        base_url = `https://${formData.ldap_host}:1443`;
      } else {
        const protocol = (formData.host.startsWith('https://') || formData.host.startsWith('http://')) ? '' : 'https://';
        const cleanHost = formData.host.replace(/^https?:\/\//, '');
        base_url = `${protocol}${cleanHost}:${formData.port}`;
      }

      /* credentials */
      let credentials: SubmitData['credentials'] = {};
      if (formData.auth_method === 'BasicAuth') {
        credentials = { username: formData.username, password: formData.password };
      } else if (isDirectory(formData.type) && formData.auth_method === 'BearerToken') {
        credentials = { token: formData.client_secret };
      } else if (formData.auth_method === 'BearerToken' || formData.auth_method === 'ClientCredentials') {
        credentials = { client_id: formData.client_id, client_secret: formData.client_secret };
      } else if (formData.auth_method === 'APIKey') {
        credentials = { api_key: formData.api_key };
      }

      // Build submit data in the format expected by API
      const submitData: any = {
        name: formData.name,
        type: typeToSnake(formData.type),
        integration_id: formData.integration_id,
        base_url,
        auth_method: authMethodToSnakeCase(formData.auth_method),
        credentials,
        environment: formData.environment,
        description: formData.description,
      };

      // Add use_assertion_jwt_exchange flag if using AssertionJwtExchange
      if (formData.auth_method === 'AssertionJwtExchange') {
        submitData.use_assertion_jwt_exchange = true;
      }

      // Add engine_port for PingFederate with BearerToken
      const isPingFederateType = typeToSnake(formData.type) === 'ping_federate';
      if (isPingFederateType && formData.auth_method === 'BearerToken') {
        submitData.engine_port = formData.engine_port;
      }
      if (isDirectory(formData.type)) {
        submitData.config = {
          ...(submitData.config || {}),
          base_dn: formData.base_dn,
        };
      }
      if (formData.type === 'PingOne') {
        submitData.region         = formData.region;
        submitData.environment_id = formData.environment_id;
      }
      if (formData.type === 'AzureAD') {
        submitData.tenant_id = formData.tenant_id;
      }
      if (formData.type === 'Okta' || formData.type === 'Auth0') {
        submitData.domain = formData.domain;
      }

      // ── Call parent onSubmit and ONLY show success if it resolves without throwing ──
      const savedSystem = await onSubmit(submitData);

      // If we reach here, the API call succeeded
      setLoading(false);

      // Backend may return the ID as "_id" (MongoDB) or "id" (REST) — handle both.
      // Also unwrap nested shapes like { data: { _id: ... } } or { system: { id: ... } }
      const savedId =
        savedSystem?._id ||
        savedSystem?.id ||
        savedSystem?.data?._id ||
        savedSystem?.data?.id ||
        savedSystem?.system?._id ||
        savedSystem?.system?.id;

      console.log('[TargetSystemForm] save response:', JSON.stringify(savedSystem), '→ resolved id:', savedId);

      // CHANGE 4 of 4 (part b): Show connection-test modal for BOTH create and update.
      // Fast path: api layer already embedded _connectionTest (create or update both do this).
      // Fallback: run the test ourselves when the api layer skipped it (no _id returned, etc.)
      const embeddedTest = savedSystem?._connectionTest;

      if (embeddedTest) {
        // api.targetSystems.create() and api.targetSystems.update() both embed this
        setConnTestStatus(embeddedTest.success ? 'connected' : 'failed');
        setConnTestMessage(embeddedTest.message || '');
        setShowSuccess(true);
      } else if (savedId) {
        // Fallback: fire the test ourselves
        setConnTestStatus('testing');
        setConnTestMessage('Testing connection to your system…');
        setShowSuccess(true);
        try {
          const testResult = await api.targetSystems.testConnection(savedId);
          const msg = testResult?.message || testResult?.detail || '';
          const isFailure =
            testResult?.success === false ||
            testResult?.connected === false ||
            testResult?.status === 'error' ||
            testResult?.status === 'failed' ||
            /fail|error|unable|cannot|unreachable|connection failed/i.test(msg);
          setConnTestStatus(isFailure ? 'failed' : 'connected');
          setConnTestMessage(msg || (isFailure ? 'Connection test failed' : 'Connection established successfully'));
        } catch (testErr: any) {
          const errMsg = testErr?.response?.data?.detail || testErr?.message || 'Connection test failed';
          setConnTestStatus('failed');
          setConnTestMessage(errMsg);
        }
      } else {
        // No ID at all — show plain success modal (no test)
        setConnTestStatus('idle');
        setShowSuccess(true);
      }
    } catch (err) {
      // onSubmit threw (API error) — show the error, do NOT show success
      setError((err as Error).message || 'Failed to save target system');
      setLoading(false);
    }
  };

  // CHANGE 4 of 4 (part c): reset connTest state on close
  const handleSuccess = () => {
    setShowSuccess(false);
    setConnTestStatus('idle');
    setConnTestMessage('');
    if (onCancel) onCancel();
  };

  const handleReset = () => setFormData({
    ...emptyForm,
    type: formData.type,
    integration_id: formData.integration_id,
    auth_method: integDefaults.defaultAuthMethod,
    port: integDefaults.port,
    engine_port: integDefaults.engine_port ?? 9031,
  });
  const handleCopyToClipboard = (text: string, fieldName: string): void => {
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedField(fieldName);
        // Reset the copied indicator after 2 seconds
        setTimeout(() => setCopiedField(null), 2000);
      }).catch(err => {
        console.error('Failed to copy to clipboard:', err);
      });
    }
  };

  /* ── derived flags ── */
  const isPingFederate = (t: string) => t === 'PingFederate' || t === 'ping_federate';
  const isDirectory    = (t: string) => t === 'PingDirectory' || t === 'ping_directory' || t === 'LDAP';
  const isPingOne      = (t: string) => t === 'PingOne' || t === 'ping_one';
  const isAzureAD      = (t: string) => t === 'AzureAD' || t === 'azure_ad';
  const isOktaLike     = (t: string) => t === 'Okta' || t === 'Auth0';

  /* ── auth method options ── */
  const defaultAuthMethodOptions: AuthMethodOption[] = [
    { value: 'BearerToken', label: 'Bearer Token', snakeCase: 'bearer_token', icon: FaShieldAlt, description: 'OAuth 2.0 token-based' },
    { value: 'BasicAuth',   label: 'Basic Auth',   snakeCase: 'basic_auth',   icon: FaKey,       description: 'Username/password' },
    { value: 'APIKey',      label: 'API Key',       snakeCase: 'api_key',      icon: FaFingerprint, description: 'Single API key' },
    { value: 'OAuth2',      label: 'OAuth2',        snakeCase: 'oauth2',       icon: FaLock,      description: 'Full OAuth 2.0 flow' },
    { value: 'ClientCredentials', label: 'Client Credentials', snakeCase: 'client_credentials', icon: FaShieldAlt, description: 'Machine-to-machine' },
  ];

  const typeOptions_final: TypeOption[] = typeOptions.length > 0 ? typeOptions : [
    { value: 'PingFederate', label: 'PingFederate' },
    { value: 'PingDirectory', label: 'PingDirectory' },
    { value: 'PingOne', label: 'PingOne' },
    { value: 'Okta', label: 'Okta' },
    { value: 'AzureAD', label: 'Azure AD' },
    { value: 'Auth0', label: 'Auth0' },
    { value: 'LDAP', label: 'LDAP' },
    { value: 'Custom', label: 'Custom' },
  ];

  /* hint helper */
  const hint = (key: string) =>
    integDefaults.hints[key] ?? null;

  // Convert available auth methods to display format
  const authMethodOptions: AuthMethodOption[] = availableAuthMethods.length > 0 
    ? availableAuthMethods.map(method => {
        const pascalCase = snakeToPascal(method);
        const label = snakeToLabel(method);
        const defaultOption = defaultAuthMethodOptions.find(o => o.value === pascalCase);
        
        return {
          value: pascalCase,
          label: label,
          snakeCase: method,
          icon: defaultOption?.icon,
          description: defaultOption?.description
        };
      })
    : defaultAuthMethodOptions.concat([
        { value: 'AssertionJwtExchange', label: 'Assertion JWT Exchange', snakeCase: 'assertion_jwt_exchange', icon: FaShieldAlt, description: 'RFC 8693 token exchange using assertion JWT' }
      ]);

  const ph = (key: keyof FormData): string =>
    (integDefaults.placeholders[key] as string | undefined) ?? '';

  /* ─────────────────────────────────────────────────────────────────────── */
  /* Auth credential fields — rendered dynamically per auth method           */
  /* For directory types, renderAuthFields renders before renderTypeSpecific  */
  /* so auth fields appear above the connection fields (Host, LDAP Port, DN). */
  /* ─────────────────────────────────────────────────────────────────────── */
  const renderAuthFields = () => {
    switch (formData.auth_method) {
      case 'BasicAuth':
        /* All other types → username + password */
        return (
          <>
            <Field label="Username" required hint={hint('username')}>
              <input
                type="text" name="username" value={formData.username} onChange={handleChange}
                placeholder={ph('username') || 'Enter username'} required
                className={inputCls}
              />
              {system && (
                <p className="tsf-hint-text text-gray-500 mt-2 flex items-center gap-1">
                  <span>ℹ️</span>
                  <span>Username is required - enter new username to replace existing</span>
                </p>
              )}
            </Field>

            <Field label="Password" required hint={hint('password')} subLabel={system ? '(leave empty to keep existing)' : undefined}>
              <input
                type="password" name="password" value={formData.password}
                onChange={handleChange} placeholder="Enter password" required={!system}
                className={inputCls}
              />
              <SecureNote />
            </Field>
          </>
        );

      case 'BearerToken':
        if (isDirectory(formData.type)) {
          return (
            <Field label="Bearer Token" required hint="Paste your directory bearer token" subLabel={system ? '(leave empty to keep existing)' : undefined}>
              <textarea
                name="client_secret" value={formData.client_secret} onChange={handleChange}
                placeholder="Paste your bearer token here..."
                rows={4} required={!system}
                className={`${inputCls} font-mono`}
              />
              <SecureNote />
            </Field>
          );
        }
        return (
          <>
            <Field label="Client ID" required hint={hint('client_id')}>
              <input
                type="text" name="client_id" value={formData.client_id} onChange={handleChange}
                placeholder={ph('client_id') || 'Enter client ID'} required
                className={inputCls}
              />
              {system && (
                <p className="tsf-hint-text text-gray-500 mt-2 flex items-center gap-1">
                  <span>ℹ️</span>
                  <span>Client ID is required - enter new client ID to replace existing</span>
                </p>
              )}
            </Field>

            <Field label="Client Secret" required hint={hint('client_secret')} subLabel={system ? '(leave empty to keep existing)' : undefined}>
              <textarea
                name="client_secret" value={formData.client_secret} onChange={handleChange}
                placeholder={ph('client_secret') || 'Paste your client secret here...'}
                rows={4} required={!system}
                className={`${inputCls} font-mono`}
              />
              <SecureNote />
            </Field>
          </>
        );

      case 'ClientCredentials':
        return (
          <>
            <Field label="Client ID" required hint={hint('client_id')}>
              <input
                type="text" name="client_id" value={formData.client_id} onChange={handleChange}
                placeholder={ph('client_id') || 'Enter client ID'} required
                className={inputCls}
              />
              {system && (
                <p className="tsf-hint-text text-gray-500 mt-2 flex items-center gap-1">
                  <span>ℹ️</span>
                  <span>Client ID is required - enter new client ID to replace existing</span>
                </p>
              )}
            </Field>

            <Field label="Client Secret" required hint={hint('client_secret')} subLabel={system ? '(leave empty to keep existing)' : undefined}>
              <textarea
                name="client_secret" value={formData.client_secret} onChange={handleChange}
                placeholder={ph('client_secret') || 'Paste your client secret here...'}
                rows={4} required={!system}
                className={`${inputCls} font-mono`}
              />
              <SecureNote />
            </Field>
          </>
        );

      case 'APIKey':
        return (
          <Field
            label="API Key" required
            hint={hint('api_key')}
            subLabel={system ? '(leave empty to keep existing)' : undefined}
          >
            <textarea
              name="api_key" value={formData.api_key} onChange={handleChange}
              placeholder={ph('api_key') || 'Paste your API key here...'}
              rows={4} required={!system}
              className={`${inputCls} font-mono`}
            />
            <SecureNote />
          </Field>
        );

      case 'AssertionJwtExchange':
        return (
          <>
            {/* Token Provider Configuration Display */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
              <h3 className="tsf-sm-text font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <span>🔐</span>
                Token Provider Configuration
              </h3>

              {loadingTokenConfig ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                  <span className="tsf-sm-text text-blue-700">Loading configuration...</span>
                </div>
              ) : tokenProviderConfig ? (
                <div className="space-y-4">
                  {/* Introspection Endpoint */}
                  <div className="group">
                    <label className="block text-xs font-semibold text-blue-900 mb-2">
                      Introspection Endpoint
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={tokenProviderConfig.introspectionUrl || ''}
                        readOnly
                        className="w-full px-4 py-2 pr-10 text-sm bg-white border border-blue-300 rounded-lg text-gray-700 cursor-not-allowed opacity-75 font-mono"
                      />
                      {tokenProviderConfig.introspectionUrl && (
                        <button
                          type="button"
                          onClick={() => handleCopyToClipboard(tokenProviderConfig.introspectionUrl, 'introspectionUrl')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Copy to clipboard"
                        >
                          {copiedField === 'introspectionUrl' ? <FaCheck size={16} /> : <FaClipboard size={16} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Introspection Client ID */}
                  <div className="group">
                    <label className="block text-xs font-semibold text-blue-900 mb-2">
                      Introspection Client ID
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={tokenProviderConfig.introspectionClientId || ''}
                        readOnly
                        className="w-full px-4 py-2 pr-10 text-sm bg-white border border-blue-300 rounded-lg text-gray-700 cursor-not-allowed opacity-75 font-mono"
                      />
                      {tokenProviderConfig.introspectionClientId && (
                        <button
                          type="button"
                          onClick={() => handleCopyToClipboard(tokenProviderConfig.introspectionClientId, 'introspectionClientId')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Copy to clipboard"
                        >
                          {copiedField === 'introspectionClientId' ? <FaCheck size={16} /> : <FaClipboard size={16} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Introspection Client Secret */}
                  <div className="group">
                    <label className="block text-xs font-semibold text-blue-900 mb-2">
                      Introspection Client Secret
                    </label>
                    <div className="relative">
                      <input
                        type={showIntrospectionSecret ? "text" : "password"}
                        value={tokenProviderConfig.introspectionClientSecret || ''}
                        readOnly
                        placeholder="(not configured)"
                        className="w-full px-4 py-2 pr-20 text-sm bg-white border border-blue-300 rounded-lg text-gray-700 cursor-not-allowed opacity-75 font-mono"
                      />
                      {tokenProviderConfig.introspectionClientSecret && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                          <button
                            type="button"
                            onClick={() => setShowIntrospectionSecret(!showIntrospectionSecret)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title={showIntrospectionSecret ? 'Hide secret' : 'Show secret'}
                          >
                            {showIntrospectionSecret ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyToClipboard(tokenProviderConfig.introspectionClientSecret, 'introspectionClientSecret')}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Copy to clipboard"
                          >
                            {copiedField === 'introspectionClientSecret' ? <FaCheck size={16} /> : <FaClipboard size={16} />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scope */}
                  <div className="group">
                    <label className="block text-xs font-semibold text-blue-900 mb-2">
                      Scope
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={tokenProviderConfig.scope || ''}
                        readOnly
                        className="w-full px-4 py-2 pr-10 text-sm bg-white border border-blue-300 rounded-lg text-gray-700 cursor-not-allowed opacity-75 font-mono"
                      />
                      {tokenProviderConfig.scope && (
                        <button
                          type="button"
                          onClick={() => handleCopyToClipboard(tokenProviderConfig.scope, 'scope')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Copy to clipboard"
                        >
                          {copiedField === 'scope' ? <FaCheck size={16} /> : <FaClipboard size={16} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 tsf-sm-text text-blue-700">
                  ⚠️ Token provider configuration not found. Please configure it first.
                </div>
              )}
            </div>

            {/* Instructions Section */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandInstructions(!expandInstructions)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-amber-100 transition-colors duration-200"
              >
                <h3 className="tsf-sm-text font-semibold text-amber-900 flex items-center gap-2">
                  <span>📋</span>
                  Configuration Instructions
                </h3>
                <span className={`transform transition-transform duration-300 ${expandInstructions ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {expandInstructions && (
                <div className="px-6 py-4 border-t border-amber-200 bg-white space-y-4">
                  <div className="space-y-3 tsf-sm-text text-gray-700">
                    <p className="font-semibold text-gray-900">General Steps:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-2">
                      <li>Configure your target system to trust the SSL certificate of the Token Provider</li>
                      <li>Set the authentication method to use Assertion JWT Token Exchange (RFC 8693)</li>
                      <li>Configure introspection endpoint details below in your target system</li>
                    </ol>

                    {/* PingFederate Specific Instructions */}
                    {(formData.type === 'PingFederate' || formData.type === 'ping_federate') && (
                      <div className="mt-4 pt-4 border-t border-amber-200">
                        <p className="font-semibold text-gray-900 mb-2">PingFederate Configuration:</p>
                        <ol className="list-decimal list-inside space-y-2 ml-2">
                          <li>Enable OAuth 2.0 in the Admin API settings</li>
                          <li>In your target PingFederate system, configure the following in the introspection details:
                            <div className="mt-2 ml-4 p-3 bg-gray-100 rounded font-mono text-xs space-y-1">
                              <div><strong>Introspection URL:</strong> {tokenProviderConfig?.introspectionUrl}</div>
                              <div><strong>Client ID:</strong> {tokenProviderConfig?.introspectionClientId}</div>
                              <div><strong>Client Secret:</strong> (use from configuration above)</div>
                              <div><strong>Scope:</strong> {tokenProviderConfig?.scope}</div>
                            </div>
                          </li>
                          <li>Set username.attribute.name = "sub"</li>
                          <li>Set role.attribute.name = "groups"</li>
                          <li>Set role.admin = "Vega_Admins"</li>
                          <li>Set role.cryptoManager = "Vega_Admins"</li>
                          <li>Set role.userAdmin = "Vega_Admins"</li>
                          <li>Ensure SSL certificate trust is configured for the Token Provider endpoint</li>
                        </ol>
                      </div>
                    )}

                    {/* Generic Target System Instructions */}
                    {!(formData.type === 'PingFederate' || formData.type === 'ping_federate') && (
                      <div className="mt-4 pt-4 border-t border-amber-200">
                        <p className="font-semibold text-gray-900 mb-2">Target System Configuration:</p>
                        <ol className="list-decimal list-inside space-y-2 ml-2">
                          <li>Configure your {formData.type} system to use RFC 8693 Token Exchange</li>
                          <li>Set the introspection endpoint to: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{tokenProviderConfig?.introspectionUrl}</code></li>
                          <li>Use the introspection client credentials provided above</li>
                          <li>Configure the scope: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{tokenProviderConfig?.scope}</code></li>
                          <li>Map username to the "sub" claim</li>
                          <li>Map roles to the "groups" claim</li>
                          <li>Mark "Vega_Admins" group as administrator role</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        );

      default:
        return null;
    }
  };

  /* ─────────────────────────────────────────────────────────────────────── */
  /* Per-integration extra fields (shown between Auth Method and Auth creds)  */
  /* ─────────────────────────────────────────────────────────────────────── */
  const renderTypeSpecificFields = () => {
    const t = formData.type;

    if (isDirectory(t)) {
      return (
        <>
          {/* ── Directory Host ── */}
          <Field
            label="Directory Host"
            required
            hint="Hostname or IP address of your directory server"
          >
            <input
              type="text"
              name="ldap_host"
              value={formData.ldap_host}
              onChange={handleChange}
              placeholder="e.g., directory.example.com"
              required
              className={inputCls}
            />
          </Field>

          {/* ── Base DN ── */}
          <Field
            label="Base DN"
            required
            hint="Root DN of your directory tree"
          >
            <input
              type="text"
              name="base_dn"
              value={formData.base_dn}
              onChange={handleChange}
              placeholder="dc=company,dc=com"
              required
              className={inputCls}
            />
          </Field>
        </>
      );
    }

    if (isPingOne(t)) {
      return (
        <>
          <Field label="Region" required hint={hint('region')}>
            <select name="region" value={formData.region} onChange={handleChange} required className={`${inputCls} cursor-pointer`}>
              <option value="">Select a region…</option>
              <option value="NA">NA – North America</option>
              <option value="EU">EU – Europe</option>
              <option value="AP">AP – Asia Pacific</option>
              <option value="CA">CA – Canada</option>
            </select>
          </Field>
          <Field label="Environment ID" required hint={hint('environment_id')}>
            <input
              type="text" name="environment_id" value={formData.environment_id} onChange={handleChange}
              placeholder={ph('environment_id') || 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'} required
              className={inputCls}
            />
          </Field>
        </>
      );
    }

    if (isAzureAD(t)) {
      return (
        <Field label="Tenant ID" required hint={hint('tenant_id')}>
          <input
            type="text" name="tenant_id" value={formData.tenant_id} onChange={handleChange}
            placeholder={ph('tenant_id') || 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'} required
            className={inputCls}
          />
        </Field>
      );
    }

    if (isOktaLike(t)) {
      return (
        <Field label={t === 'Auth0' ? 'Auth0 Domain' : 'Okta Domain'} required hint={hint('domain')}>
          <input
            type="text" name="domain" value={formData.domain} onChange={handleChange}
            placeholder={ph('domain') || (t === 'Auth0' ? 'yourtenancy.auth0.com' : 'yourorg.okta.com')} required
            className={inputCls}
          />
        </Field>
      );
    }

    return null;
  };

  /* ─────────────────────────────────────────────────────────────────────── */
  /* Shared style tokens                                                       */
  /* ─────────────────────────────────────────────────────────────────────── */
  const inputCls =
    'w-full tsf-input-p tsf-input-fs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent placeholder:text-gray-400 bg-white transition-colors hover:border-gray-300';

  /* ─────────────────────────────────────────────────────────────────────── */
  /* CHANGE 4 of 4 (part d): Modal title/subtitle helpers                    */
  /* Works for both CREATE (!system) and EDIT (system) flows.                */
  /* ─────────────────────────────────────────────────────────────────────── */
  const modalTitle = (): string => {
    if (connTestStatus === 'testing')   return system ? 'System Updated!' : 'System Created!';
    if (connTestStatus === 'connected') return system ? 'System Updated & Connected!' : 'System Created & Connected!';
    if (connTestStatus === 'failed')    return system ? 'System Updated — Connection Failed' : 'System Created — Connection Failed';
    // idle fallback
    return system ? 'System Updated Successfully!' : 'Target System Created!';
  };

  const modalSubtitle = (): string => {
    if (connTestStatus === 'testing')   return 'Testing connection to your system…';
    if (connTestStatus === 'connected') return connTestMessage || (system ? 'Your target system has been updated' : 'Connection established successfully');
    if (connTestStatus === 'failed')    return 'The system was saved. Check your host / credentials and test again from the dashboard.';
    // idle fallback
    return system ? 'Your target system has been updated' : 'Your target system is now ready to use';
  };

  /* ─────────────────────────────────────────────────────────────────────── */
  /* Render                                                                   */
  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <div className="relative w-full">

      {/* Success Modal — CHANGE 4 of 4 (part e):
          The modal now has 4 states driven by connTestStatus for BOTH create AND update:
          - idle: original green check + original text (no test ran or no ID)
          - testing: blue spinner, "Testing connection…", Done button disabled
          - connected: green check, "System Created/Updated & Connected!"
          - failed: red warning icon, "System Created/Updated — Connection Failed"
          Everything else (summary card, layout, animations) is untouched. */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl tsf-modal-w w-full tsf-modal-p text-center animate-scaleIn border border-white/20">
            <div className="flex justify-center tsf-modal-icon-mb">
              {connTestStatus === 'testing' ? (
                <div className="tsf-modal-icon bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              ) : connTestStatus === 'failed' ? (
                <div className="tsf-modal-icon bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center shadow-lg">
                  <FaExclamationTriangle className="text-white tsf-modal-icon-fs" />
                </div>
              ) : (
                <div className="tsf-modal-icon bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-pulse-gentle">
                  <FaCheckCircle className="text-white tsf-modal-icon-fs" />
                </div>
              )}
            </div>

            {connTestStatus === 'testing' ? (
              <>
                <h2 className="tsf-modal-h2 font-semibold text-gray-900 mb-2">{modalTitle()}</h2>
                <p className="text-gray-500 tsf-modal-sub mb-2">{modalSubtitle()}</p>
                <p className="text-gray-400 text-xs mb-8">Please wait while we verify connectivity</p>
              </>
            ) : connTestStatus === 'connected' ? (
              <>
                <h2 className="tsf-modal-h2 font-semibold text-gray-900 mb-2">{modalTitle()}</h2>
                <p className="text-green-600 tsf-modal-sub font-medium mb-2">{connTestMessage}</p>
                <p className="text-gray-400 text-xs mb-8">{system ? 'Your target system has been updated' : 'Your target system is ready to use'}</p>
              </>
            ) : connTestStatus === 'failed' ? (
              <>
                <h2 className="tsf-modal-h2 font-semibold text-gray-900 mb-2">{modalTitle()}</h2>
                {/* <p className="text-red-600 tsf-modal-sub font-medium mb-2">{connTestMessage}</p> */}
                <p className="text-gray-400 text-xs mb-8">
                  The system was saved. Check your host / credentials and test again from the dashboard.
                </p>
              </>
            ) : (
              /* original text — idle mode (no test ran or no ID returned) */
              <>
                <h2 className="tsf-modal-h2 font-semibold text-gray-900 mb-2">
                  {system ? 'System Updated Successfully!' : 'Target System Created!'}
                </h2>
                <p className="text-gray-600 tsf-modal-sub mb-8">
                  {system ? 'Your target system has been updated' : 'Your target system is now ready to use'}
                </p>
              </>
            )}

            {/* Summary card — completely unchanged */}
            <div className="bg-gradient-to-br from-gray-50 to-purple-50/50 rounded-xl tsf-modal-summary-p mb-8 border border-gray-100">
              {[
                ['System Name', formData.name],
                ['Type', formData.type],
                ['Environment', formData.environment],
                ['Host', formData.host],
                ['Auth Method', authMethodOptions.find(m => m.value === formData.auth_method)?.label ?? formData.auth_method],
              ].map(([label, val], i, arr) => (
                <div
                  key={label}
                  className={`flex items-center justify-between ${i < arr.length - 1 ? 'mb-3 pb-3 border-b border-gray-200' : ''}`}
                >
                  <span className="tsf-sm-text text-gray-600">{label}</span>
                  <span className="font-semibold text-gray-900 tsf-sm-text capitalize">{val}</span>
                </div>
              ))}
            </div>

            {/* Connection result banner — only shown after test completes */}
            {(connTestStatus === 'connected' || connTestStatus === 'failed') && (
              <div className={`rounded-xl px-4 py-3 mb-6 flex items-center gap-3 ${connTestStatus === 'connected' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                {connTestStatus === 'connected'
                  ? <FaCheckCircle className="text-green-500 flex-shrink-0" />
                  : <FaExclamationTriangle className="text-red-500 flex-shrink-0" />
                }
                <p className={`text-sm font-medium ${connTestStatus === 'connected' ? 'text-green-700' : 'text-red-700'}`}>
                  {connTestStatus === 'connected' ? ' Connection verified successfully' : ' Connection could not be established'}
                </p>
              </div>
            )}

            {/* Done button — disabled while test is in flight */}
            <button
              onClick={handleSuccess}
              disabled={connTestStatus === 'testing'}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 tsf-modal-btn-py rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {connTestStatus === 'testing' ? 'Testing connection…' : 'Done'}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 w-full">
        <div className="w-full">

          {/* Form Card */}
          <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-slideUp ${isModal ? 'max-h-[90vh] overflow-y-auto' : ''}`}>

            {/* Header */}
            <div className="flex items-center justify-between tsf-header-px tsf-header-py border-b border-gray-100 bg-white">
              <div>
                <div className="flex items-center gap-2 tsf-sm-text text-gray-500 mb-2">
                  <span className="tsf-header-badge bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                    {system ? '✏️' : '+'}
                  </span>
                  <span className="font-medium">{system ? 'Edit Target System' : 'Create Target System'}</span>
                </div>
                <h1 className="tsf-header-h1 font-bold text-gray-900">
                  {integrationName || 'Target System Configuration'}
                </h1>
              </div>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="tsf-close-btn flex items-center justify-center rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all duration-300 hover:scale-110"
                >
                  <FaTimes className="tsf-close-icon" />
                </button>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="tsf-form-px tsf-form-py">
              {error && (
                <div className="tsf-error-mb rounded-lg bg-red-50 border border-red-100 text-red-700 tsf-error-p tsf-sm-text">
                  {error}
                </div>
              )}

              <div className="tsf-fields-gap">

                {/* ── System Name ── */}
                <Field
                  label="System Name"
                  required
                  hint={`Give your ${integrationName || 'target system'} connection a descriptive name`}
                >
                  <input
                    type="text" name="name" value={formData.name} onChange={handleChange}
                    placeholder={`e.g., Production ${integrationName || 'System'}`} required
                    className={inputCls}
                  />
                </Field>

                {/* ── System Type (locked when editing or integration pre-selected) ── */}
                <Field
                  label="System Type"
                  required
                  hint={system ? 'System type cannot be changed after creation' : 'The type of system you are connecting to'}
                >
                  {system || integrationName ? (
                    <div className={`${inputCls} bg-gray-50/70 text-gray-700 font-medium cursor-not-allowed`}>
                      {integrationName || formData.type}
                    </div>
                  ) : (
                    <select
                      name="type" value={formData.type} onChange={handleChange} required
                      className={`${inputCls} cursor-pointer`}
                    >
                      <option value="">Select a type…</option>
                      {typeOptions_final.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  )}
                </Field>

                {/* ── Environment ── */}
                <Field label="Environment" required hint="The deployment environment for this system">
                  <select
                    name="environment" value={formData.environment} onChange={handleChange} required
                    className={`${inputCls} cursor-pointer`}
                  >
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                </Field>

                {/* Authentication Method - Dropdown */}
                <div className="group">
                  <label className="tsf-field-label block font-semibold text-gray-900 mb-2">
                    Authentication Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="auth_method"
                    value={formData.auth_method}
                    onChange={(e) => handleAuthMethodChange(e.target.value)}
                    required
                    className="w-full tsf-input-p tsf-input-fs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent bg-white transition-colors hover:border-gray-300 cursor-pointer"
                  >
                    {authMethodOptions.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                  <p className="tsf-hint-text text-gray-500 mt-2 flex items-center gap-1">
                    <span>💡</span>
                    <span>Choose the authentication method for your system</span>
                  </p>
                </div>

                {/* Engine Port - Only for PingFederate + BearerToken */}
                {isPingFederate(formData.type) && formData.auth_method === 'BearerToken' && (
                  <div className="group">
                    <label className="tsf-field-label block font-semibold text-gray-900 mb-2">
                      Engine Port
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="engine_port"
                      value={formData.engine_port}
                      onChange={handleChange}
                      placeholder="9031"
                      className="w-full tsf-input-p tsf-input-fs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent placeholder:text-gray-400 bg-white transition-colors hover:border-gray-300"
                    />
                    <p className="tsf-hint-text text-gray-500 mt-2 flex items-center gap-1">
                      <span>💡</span>
                      <span>Engine port for PingFederate admin API (default: 9031)</span>
                    </p>
                  </div>
                )}

                {/* ── Host (hidden for directory types — captured via Server URL) ── */}
                {!isDirectory(formData.type) && (
                  <Field
                    label="Host / Domain"
                    required
                    hint={hint('host') ?? 'Enter the hostname or domain without the protocol'}
                  >
                    <input
                      type="text" name="host" value={formData.host} onChange={handleChange}
                      placeholder={ph('host') || 'e.g., api.example.com'} required
                      className={inputCls}
                    />
                  </Field>
                )}

                {/* ── Port (hidden for directory types — captured via Server URL) ── */}
                {!isDirectory(formData.type) && (
                  <Field
                    label="Port"
                    hint={hint('port') ?? `Default port for this integration is ${integDefaults.port}`}
                  >
                    <input
                      type="number" name="port" value={formData.port} onChange={handleChange}
                      placeholder={String(integDefaults.port)} min="1" max="65535"
                      className={inputCls}
                    />
                  </Field>
                )}

                {/* ── Per-integration extra fields (between Port and Auth) — skip for directory ── */}
                {!isDirectory(formData.type) && renderTypeSpecificFields()}

                {/* ── Auth credential fields ── */}
                {renderAuthFields()}

                {/* ── Directory connection fields (rendered after auth for proper ordering) ── */}
                {isDirectory(formData.type) && renderTypeSpecificFields()}

                {/* ── Description ── */}
                <Field label="Description" hint="Optional notes or documentation about this system">
                  <textarea
                    name="description" value={formData.description} onChange={handleChange}
                    placeholder={`Add notes about this ${integrationName || 'system'}…`}
                    rows={3}
                    className={inputCls}
                  />
                </Field>

              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 tsf-actions-mt tsf-actions-pt border-t border-gray-100">
                <button
                  type="button" onClick={handleReset}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 rounded-lg tsf-btn-fs font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <span className="tsf-btn-icon">🔄</span>
                  <span>Reset</span>
                </button>
                <button
                  type="submit" disabled={loading}
                  className="flex-1 px-6 py-3 bg-[#111] hover:bg-[#333] text-white rounded-lg tsf-btn-fs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving…' : system ? 'Update System' : 'Create System'}
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
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-gentle {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.05); }
        }
        .animate-blob            { animation: blob 7s infinite; }
        .animation-delay-2000    { animation-delay: 2s; }
        .animation-delay-4000    { animation-delay: 4s; }
        .animate-fadeIn          { animation: fadeIn 0.3s ease-out; }
        .animate-scaleIn         { animation: scaleIn 0.3s ease-out; }
        .animate-slideUp         { animation: slideUp 0.5s ease-out; }
        .animate-pulse-gentle    { animation: pulse-gentle 2s ease-in-out infinite; }

        /* =====================================================================
           RESPONSIVE TOKENS — 1920×1080 is the baseline (default :root).
           Replaces all Tailwind 2xl: classes (which fire at 1536px, not 1920px).
           No UI, structure, features, comments, or logic is altered.
           ===================================================================== */

        /* ── BASELINE : 1920×1080 ────────────────────────────────────────── */
        :root {
          --tsf-hint-fs:          12px;
          --tsf-field-label-fs:   14px;
          --tsf-sublabel-fs:      12px;
          --tsf-sm-fs:            14px;
          --tsf-input-px:         16px;
          --tsf-input-py:         12px;
          --tsf-input-fs:         14px;
          --tsf-header-px:        32px;
          --tsf-header-py:        24px;
          --tsf-header-h1-fs:     24px;
          --tsf-header-badge-sz:  24px;
          --tsf-header-badge-fs:  12px;
          --tsf-close-btn-sz:     40px;
          --tsf-close-icon-fs:    20px;
          --tsf-form-px:          32px;
          --tsf-form-py:          24px;
          --tsf-error-px:         16px;
          --tsf-error-py:         12px;
          --tsf-error-mb:         16px;
          --tsf-fields-gap:       20px;
          --tsf-actions-mt:       32px;
          --tsf-actions-pt:       24px;
          --tsf-btn-fs:           13px;
          --tsf-btn-icon-fs:      18px;
          --tsf-checkbox-sz:      16px;
          --tsf-ssl-p:            20px;
          --tsf-ssl-gap:          20px;
          --tsf-ssl-icon-sz:      24px;
          --tsf-mono-fs:          12px;
          --tsf-modal-max-w:      448px;
          --tsf-modal-p:          32px;
          --tsf-modal-icon-sz:    64px;
          --tsf-modal-icon-fs:    30px;
          --tsf-modal-icon-mb:    24px;
          --tsf-modal-h2-fs:      24px;
          --tsf-modal-sub-fs:     16px;
          --tsf-modal-summary-p:  20px;
          --tsf-modal-btn-py:     12px;
        }

        /* ── LARGE DESKTOP / 4K : >1920px ───────────────────────────────── */
        @media (min-width: 1921px) {
          :root {
            --tsf-hint-fs:          14px;
            --tsf-field-label-fs:   16px;
            --tsf-sublabel-fs:      14px;
            --tsf-sm-fs:            16px;
            --tsf-input-px:         20px;
            --tsf-input-py:         16px;
            --tsf-input-fs:         16px;
            --tsf-header-px:        48px;
            --tsf-header-py:        32px;
            --tsf-header-h1-fs:     30px;
            --tsf-header-badge-sz:  32px;
            --tsf-header-badge-fs:  14px;
            --tsf-close-btn-sz:     48px;
            --tsf-close-icon-fs:    24px;
            --tsf-form-px:          48px;
            --tsf-form-py:          32px;
            --tsf-error-px:         20px;
            --tsf-error-py:         16px;
            --tsf-error-mb:         24px;
            --tsf-fields-gap:       28px;
            --tsf-actions-mt:       40px;
            --tsf-actions-pt:       32px;
            --tsf-btn-fs:           15px;
            --tsf-btn-icon-fs:      21px;
            --tsf-checkbox-sz:      20px;
            --tsf-ssl-p:            24px;
            --tsf-ssl-gap:          24px;
            --tsf-ssl-icon-sz:      28px;
            --tsf-mono-fs:          14px;
            --tsf-modal-max-w:      576px;
            --tsf-modal-p:          48px;
            --tsf-modal-icon-sz:    80px;
            --tsf-modal-icon-fs:    40px;
            --tsf-modal-icon-mb:    32px;
            --tsf-modal-h2-fs:      30px;
            --tsf-modal-sub-fs:     18px;
            --tsf-modal-summary-p:  24px;
            --tsf-modal-btn-py:     16px;
          }
        }

        /* ── LAPTOP : 1280–1919px ─────────────────────────────────────────
           Covers MacBook Pro 14" (1512px scaled), 15"/16" (1680px scaled),
           standard 1280–1440 laptops. UI looks identical to 1920 baseline.
        ─────────────────────────────────────────────────────────────────── */
        @media (min-width: 1280px) and (max-width: 1919px) {
          :root {
            --tsf-hint-fs:          11px;
            --tsf-field-label-fs:   13px;
            --tsf-sublabel-fs:      11px;
            --tsf-sm-fs:            13px;
            --tsf-input-px:         14px;
            --tsf-input-py:         10px;
            --tsf-input-fs:         13px;
            --tsf-header-px:        24px;
            --tsf-header-py:        18px;
            --tsf-header-h1-fs:     20px;
            --tsf-header-badge-sz:  20px;
            --tsf-header-badge-fs:  10px;
            --tsf-close-btn-sz:     34px;
            --tsf-close-icon-fs:    17px;
            --tsf-form-px:          24px;
            --tsf-form-py:          20px;
            --tsf-error-px:         14px;
            --tsf-error-py:         10px;
            --tsf-error-mb:         14px;
            --tsf-fields-gap:       16px;
            --tsf-actions-mt:       24px;
            --tsf-actions-pt:       18px;
            --tsf-btn-fs:           12px;
            --tsf-btn-icon-fs:      16px;
            --tsf-checkbox-sz:      14px;
            --tsf-ssl-p:            16px;
            --tsf-ssl-gap:          16px;
            --tsf-ssl-icon-sz:      20px;
            --tsf-mono-fs:          11px;
            --tsf-modal-max-w:      400px;
            --tsf-modal-p:          26px;
            --tsf-modal-icon-sz:    56px;
            --tsf-modal-icon-fs:    26px;
            --tsf-modal-icon-mb:    20px;
            --tsf-modal-h2-fs:      20px;
            --tsf-modal-sub-fs:     14px;
            --tsf-modal-summary-p:  16px;
            --tsf-modal-btn-py:     10px;
          }
        }

        /* ── SMALL LAPTOP : 1024–1279px ─────────────────────────────────── */
        @media (min-width: 1024px) and (max-width: 1279px) {
          :root {
            --tsf-hint-fs:          10.5px;
            --tsf-field-label-fs:   12.5px;
            --tsf-sublabel-fs:      10.5px;
            --tsf-sm-fs:            12.5px;
            --tsf-input-px:         12px;
            --tsf-input-py:         9px;
            --tsf-input-fs:         12.5px;
            --tsf-header-px:        20px;
            --tsf-header-py:        16px;
            --tsf-header-h1-fs:     18px;
            --tsf-header-badge-sz:  18px;
            --tsf-header-badge-fs:  9px;
            --tsf-close-btn-sz:     30px;
            --tsf-close-icon-fs:    15px;
            --tsf-form-px:          20px;
            --tsf-form-py:          18px;
            --tsf-error-px:         12px;
            --tsf-error-py:         9px;
            --tsf-error-mb:         12px;
            --tsf-fields-gap:       14px;
            --tsf-actions-mt:       20px;
            --tsf-actions-pt:       16px;
            --tsf-btn-fs:           11.5px;
            --tsf-btn-icon-fs:      15px;
            --tsf-checkbox-sz:      13px;
            --tsf-ssl-p:            14px;
            --tsf-ssl-gap:          14px;
            --tsf-ssl-icon-sz:      18px;
            --tsf-mono-fs:          10.5px;
            --tsf-modal-max-w:      380px;
            --tsf-modal-p:          22px;
            --tsf-modal-icon-sz:    50px;
            --tsf-modal-icon-fs:    22px;
            --tsf-modal-icon-mb:    18px;
            --tsf-modal-h2-fs:      18px;
            --tsf-modal-sub-fs:     13px;
            --tsf-modal-summary-p:  14px;
            --tsf-modal-btn-py:     9px;
          }
        }

        /* ── TABLET : 768–1023px ─────────────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1023px) {
          :root {
            --tsf-hint-fs:          10px;
            --tsf-field-label-fs:   12px;
            --tsf-sublabel-fs:      10px;
            --tsf-sm-fs:            12px;
            --tsf-input-px:         11px;
            --tsf-input-py:         8px;
            --tsf-input-fs:         12px;
            --tsf-header-px:        16px;
            --tsf-header-py:        14px;
            --tsf-header-h1-fs:     16px;
            --tsf-header-badge-sz:  16px;
            --tsf-header-badge-fs:  8px;
            --tsf-close-btn-sz:     28px;
            --tsf-close-icon-fs:    14px;
            --tsf-form-px:          16px;
            --tsf-form-py:          16px;
            --tsf-error-px:         11px;
            --tsf-error-py:         8px;
            --tsf-error-mb:         11px;
            --tsf-fields-gap:       12px;
            --tsf-actions-mt:       18px;
            --tsf-actions-pt:       14px;
            --tsf-btn-fs:           11px;
            --tsf-btn-icon-fs:      14px;
            --tsf-checkbox-sz:      13px;
            --tsf-ssl-p:            12px;
            --tsf-ssl-gap:          12px;
            --tsf-ssl-icon-sz:      16px;
            --tsf-mono-fs:          10px;
            --tsf-modal-max-w:      360px;
            --tsf-modal-p:          20px;
            --tsf-modal-icon-sz:    48px;
            --tsf-modal-icon-fs:    20px;
            --tsf-modal-icon-mb:    16px;
            --tsf-modal-h2-fs:      16px;
            --tsf-modal-sub-fs:     12px;
            --tsf-modal-summary-p:  12px;
            --tsf-modal-btn-py:     8px;
          }
        }

        /* ── COMPONENT CLASSES — all sizing via CSS vars ─────────────────── */
        .tsf-hint-text    { font-size: var(--tsf-hint-fs); }
        .tsf-field-label  { font-size: var(--tsf-field-label-fs); }
        .tsf-sublabel     { font-size: var(--tsf-sublabel-fs); }
        .tsf-sm-text      { font-size: var(--tsf-sm-fs); }
        .tsf-mono-sm      { font-size: var(--tsf-mono-fs); }

        .tsf-input-p      { padding: var(--tsf-input-py) var(--tsf-input-px); }
        .tsf-input-fs     { font-size: var(--tsf-input-fs); }

        .tsf-header-px    { padding-left: var(--tsf-header-px); padding-right: var(--tsf-header-px); }
        .tsf-header-py    { padding-top: var(--tsf-header-py); padding-bottom: var(--tsf-header-py); }
        .tsf-header-h1    { font-size: var(--tsf-header-h1-fs); }
        .tsf-header-badge { width: var(--tsf-header-badge-sz); height: var(--tsf-header-badge-sz); font-size: var(--tsf-header-badge-fs); }
        .tsf-close-btn    { width: var(--tsf-close-btn-sz); height: var(--tsf-close-btn-sz); }
        .tsf-close-icon   { font-size: var(--tsf-close-icon-fs); }

        .tsf-form-px      { padding-left: var(--tsf-form-px); padding-right: var(--tsf-form-px); }
        .tsf-form-py      { padding-top: var(--tsf-form-py); padding-bottom: var(--tsf-form-py); }

        .tsf-error-p      { padding: var(--tsf-error-py) var(--tsf-error-px); }
        .tsf-error-mb     { margin-bottom: var(--tsf-error-mb); }

        .tsf-fields-gap   { display: flex; flex-direction: column; gap: var(--tsf-fields-gap); }
        .tsf-actions-mt   { margin-top: var(--tsf-actions-mt); }
        .tsf-actions-pt   { padding-top: var(--tsf-actions-pt); }

        .tsf-btn-fs       { font-size: var(--tsf-btn-fs); }
        .tsf-btn-icon     { font-size: var(--tsf-btn-icon-fs); }

        .tsf-checkbox     { width: var(--tsf-checkbox-sz); height: var(--tsf-checkbox-sz); }

        .tsf-ssl-panel    { padding: var(--tsf-ssl-p); display: flex; flex-direction: column; gap: var(--tsf-ssl-gap); }
        .tsf-ssl-icon     { width: var(--tsf-ssl-icon-sz); height: var(--tsf-ssl-icon-sz); }

        .tsf-modal-w          { max-width: var(--tsf-modal-max-w); }
        .tsf-modal-p          { padding: var(--tsf-modal-p); }
        .tsf-modal-icon       { width: var(--tsf-modal-icon-sz); height: var(--tsf-modal-icon-sz); }
        .tsf-modal-icon-fs    { font-size: var(--tsf-modal-icon-fs); }
        .tsf-modal-icon-mb    { margin-bottom: var(--tsf-modal-icon-mb); }
        .tsf-modal-h2         { font-size: var(--tsf-modal-h2-fs); }
        .tsf-modal-sub        { font-size: var(--tsf-modal-sub-fs); }
        .tsf-modal-summary-p  { padding: var(--tsf-modal-summary-p); }
        .tsf-modal-btn-py     { padding-top: var(--tsf-modal-btn-py); padding-bottom: var(--tsf-modal-btn-py); }
      `}</style>  
    </div>
  );
};

export default TargetSystemForm;