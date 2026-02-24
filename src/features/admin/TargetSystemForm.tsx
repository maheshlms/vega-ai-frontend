import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheckCircle, FaShieldAlt, FaKey, FaLock, FaFingerprint, FaEye, FaEyeSlash, FaClipboard, FaCheck } from 'react-icons/fa';
import { IconType } from 'react-icons';

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
  ldap_port: number;        // plain LDAP port (default 389)
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
    bind_dn?: string;
    bind_password?: string;
  };
  environment: string;
  description: string;
  engine_port?: number;
  // extra per-type metadata
  server_url?: string;
  ldap_port?: number;
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
  onSubmit: (data: SubmitData) => Promise<void>;
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
    port: 636,
    defaultAuthMethod: 'BasicAuth',
    allowedAuthMethods: ['BasicAuth', 'BearerToken'],
    placeholders: {
      host: 'e.g., directory.example.com',
      port: '636',
      ldap_port: '389',
      ldaps_port: '636',
      base_dn: 'dc=example,dc=com',
      bind_dn: 'cn=admin,dc=example,dc=com',
      bind_password: 'Enter bind password',
    },
    hints: {
      host: 'Hostname of your PingDirectory server',
      port: 'LDAPS port (default 636)',
      ldap_port: 'Non-SSL LDAP port (default 389)',
      ldaps_port: 'SSL LDAP port (default 636)',
      base_dn: 'Root DN of your directory tree',
      bind_dn: 'Distinguished Name used to bind/authenticate',
      bind_password: 'Password for the bind DN (stored encrypted)',
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
      ldap_port: '389',
      ldaps_port: '636',
      base_dn: 'dc=example,dc=com',
      bind_dn: 'cn=admin,dc=example,dc=com',
      bind_password: 'Enter bind password',
    },
    hints: {
      host: 'Hostname of your LDAP server',
      ldap_port: 'Non-SSL LDAP port (default 389)',
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
    ldap_port: 389,
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
        ldap_port: port === 636 ? 389 : port,  // assumption: LDAPS is 636, LDAP is 389 or other
        ldaps_port: port === 636 ? port : 636,
        base_dn: (system as any).base_dn || '',
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
          : (name === 'port' || name === 'engine_port' || name === 'ldap_port' || name === 'ldaps_port')
            ? parseInt(value) || 0
            : value,
      };

      // When "Enable SSL" checkbox toggles, auto-update server_url port and port field
      if (name === 'enable_ssl' && isDirectory(prev.type)) {
        const newPort  = checked ? prev.ldaps_port : prev.ldap_port;
        const protocol = checked ? 'ldaps' : 'ldap';
        const hostPart = prev.ldap_host || 'localhost';
        updated.server_url = `${protocol}://${hostPart}:${newPort}`;
        updated.port = newPort;
      }

      // When server_url changes, parse it to keep ldap_host / port in sync
      if (name === 'server_url') {
        try {
          const normalized = value.replace(/^ldaps?:\/\//i, match => {
            updated.enable_ssl = match.toLowerCase().startsWith('ldaps');
            return 'https://';
          });
          const parsed = new URL(normalized);
          updated.ldap_host = parsed.hostname;
          const parsedPort = parsed.port ? parseInt(parsed.port) : (updated.enable_ssl ? 636 : 389);
          updated.port = parsedPort;
          if (updated.enable_ssl) updated.ldaps_port = parsedPort;
          else updated.ldap_port = parsedPort;
        } catch { /* leave as-is if URL isn't valid yet */ }
      }

      // When ldap_host changes, keep server_url in sync
      if (name === 'ldap_host' && isDirectory(prev.type)) {
        const protocol = prev.enable_ssl ? 'ldaps' : 'ldap';
        const p = prev.enable_ssl ? prev.ldaps_port : prev.ldap_port;
        updated.server_url = `${protocol}://${value}:${p}`;
      }

      // When ldap_port or ldaps_port changes, update server_url accordingly
      if ((name === 'ldap_port' || name === 'ldaps_port') && isDirectory(prev.type)) {
        const relevantPort = name === 'ldap_port' ? !prev.enable_ssl : prev.enable_ssl;
        if (relevantPort) {
          const protocol = prev.enable_ssl ? 'ldaps' : 'ldap';
          const host = prev.ldap_host || 'localhost';
          updated.server_url = `${protocol}://${host}:${parseInt(value) || 0}`;
        }
      }

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
      updates.port = 9999;
      updates.engine_port = 9031;
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

      // Directory types use server_url instead of plain host
      if (isDirectory(formData.type)) {
        if (!formData.ldap_host) {
          setError('Directory Host is required');
          setLoading(false);
          return;
        }
        if (!formData.server_url) {
          setError('Server URL is required (e.g. ldap://localhost:389)');
          setLoading(false);
          return;
        }
        if (formData.auth_method === 'BasicAuth' && (!formData.bind_dn || !formData.bind_password)) {
          setError('Bind DN and Password are required');
          setLoading(false);
          return;
        }
        if (!formData.base_dn) {
          setError('Base DN is required');
          setLoading(false);
          return;
        }
        if (formData.enable_ssl) {
          if (!formData.ldaps_port) {
            setError('LDAPS Port is required when SSL is enabled');
            setLoading(false);
            return;
          }
          if (formData.ssl_trust_mode === 'certificate' && !formData.ssl_certificate) {
            setError('Server Certificate (PEM) is required for the selected trust mode');
            setLoading(false);
            return;
          }
          if (formData.ssl_trust_mode === 'trustStore' && !formData.ssl_truststore_path) {
            setError('Trust Store Path is required for the selected trust mode');
            setLoading(false);
            return;
          }
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

      // For directory types use the server_url as-is; others build https://host:port
      let base_url: string;
      if (isDirectory(formData.type)) {
        base_url = formData.server_url;
      } else {
        const protocol = (formData.host.startsWith('https://') || formData.host.startsWith('http://')) ? '' : 'https://';
        const cleanHost = formData.host.replace(/^https?:\/\//, '');
        base_url = `${protocol}${cleanHost}:${formData.port}`;
      }

      /* credentials */
      let credentials: SubmitData['credentials'] = {};
      if (formData.auth_method === 'BasicAuth') {
        if (isDirectory(formData.type)) {
          credentials = { bind_dn: formData.bind_dn, bind_password: formData.bind_password };
        } else {
          credentials = { username: formData.username, password: formData.password };
        }
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
        submitData.server_url            = formData.server_url;
        submitData.ldap_port             = formData.ldap_port;
        submitData.ldaps_port            = formData.ldaps_port;
        submitData.base_dn               = formData.base_dn;
        submitData.enable_ssl            = formData.enable_ssl;
        if (formData.enable_ssl) {
          submitData.ssl_trust_mode      = formData.ssl_trust_mode;
          if (formData.ssl_trust_mode === 'certificate') {
            submitData.ssl_certificate   = formData.ssl_certificate;
          }
          if (formData.ssl_trust_mode === 'trustStore') {
            submitData.ssl_truststore_path     = formData.ssl_truststore_path;
            submitData.ssl_truststore_password = formData.ssl_truststore_password;
          }
        }
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

      await onSubmit(submitData);
      setShowSuccess(true);
      setLoading(false);
    } catch (err) {
      setError((err as Error).message || 'Failed to save target system');
      setLoading(false);
    }
  };

  const handleSuccess = () => { setShowSuccess(false); if (onCancel) onCancel(); };

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

  // const handleReset = (): void => {
  //   setFormData({
  //     name: '',
  //     type: integrationValue || '',
  //     integration_id: integrationId || '',
  //     environment: 'production',
  //     auth_method: 'BearerToken',
  //     host: '',
  //     port: 443,
  //     engine_port: 9031,
  //     username: '',
  //     password: '',
  //     client_id: '',
  //     client_secret: '',
  //     api_key: '',
  //     description: ''
  //   });
  // };

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
  /* Directory types (PingDirectory/LDAP) handle credentials inside          */
  /* renderTypeSpecificFields to preserve the exact screenshot field order.  */
  /* ─────────────────────────────────────────────────────────────────────── */
  const renderAuthFields = () => {
    // Directory types render their own credential fields (Bind DN / Password)
    // in renderTypeSpecificFields to match the screenshot field ordering.
    if (isDirectory(formData.type)) return null;

    switch (formData.auth_method) {
      case 'BasicAuth':
        /* PingDirectory / LDAP → use Bind DN instead of username */
        if (isDirectory(formData.type)) {
          return (
            <>
              <Field label="Bind DN" required hint={hint('bind_dn')}>
                <input
                  type="text" name="bind_dn" value={formData.bind_dn} onChange={handleChange}
                  placeholder={ph('bind_dn') || 'cn=admin,dc=example,dc=com'} required
                  className={inputCls}
                />
              </Field>
              <Field
                label="Bind Password"
                required
                hint={hint('bind_password')}
                subLabel={system ? '(leave empty to keep existing)' : undefined}
              >
                <input
                  type="password" name="bind_password" value={formData.bind_password}
                  onChange={handleChange} placeholder="Enter bind password" required={!system}
                  className={inputCls}
                />
                <SecureNote />
              </Field>
            </>
          );
        }
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
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
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
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
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
              <h3 className="text-sm font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <span>🔐</span>
                Token Provider Configuration
              </h3>

              {loadingTokenConfig ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm text-blue-700">Loading configuration...</span>
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
                <div className="text-center py-4 text-sm text-blue-700">
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
                <h3 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                  <span>📋</span>
                  Configuration Instructions
                </h3>
                <span className={`transform transition-transform duration-300 ${expandInstructions ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {expandInstructions && (
                <div className="px-6 py-4 border-t border-amber-200 bg-white space-y-4">
                  <div className="space-y-3 text-sm text-gray-700">
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
          {/* ── Hostname ── */}
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

          {/* ── LDAP Port (plain, shown always) ── */}
          <Field
            label="LDAP Port (plain-text)"
            hint="Non-SSL LDAP port — default is 389"
          >
            <input
              type="number"
              name="ldap_port"
              value={formData.ldap_port}
              onChange={handleChange}
              placeholder="389"
              min="1"
              max="65535"
              className={inputCls}
            />
          </Field>

          {/* ── Server URL (auto-computed, read-only preview) ── */}
          <Field
            label="Server URL"
            required
            hint="Auto-built from Host and Port — or type directly to override"
          >
            <input
              type="text"
              name="server_url"
              value={formData.server_url}
              onChange={handleChange}
              placeholder={formData.enable_ssl ? 'ldaps://directory.example.com:636' : 'ldap://directory.example.com:389'}
              required
              className={inputCls}
            />
          </Field>

          {/* ── Bind DN ── */}
          <Field
            label="Bind DN"
            required
            hint="Distinguished Name used to authenticate with the directory"
          >
            <input
              type="text"
              name="bind_dn"
              value={formData.bind_dn}
              onChange={handleChange}
              placeholder="cn=Directory Manager"
              required
              className={inputCls}
            />
          </Field>

          {/* ── Bind Password ── */}
          <Field
            label="Password"
            required
            hint="Password for the Bind DN (stored encrypted)"
            subLabel={system ? '(leave empty to keep existing)' : undefined}
          >
            <input
              type="password"
              name="bind_password"
              value={formData.bind_password}
              onChange={handleChange}
              placeholder="Enter password"
              required={!system}
              className={inputCls}
            />
            <p className="text-xs 2xl:text-sm text-gray-500 mt-2 flex items-center gap-1">
              <span>🔒</span>
              <span>Your password will be securely encrypted and stored</span>
            </p>
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

          {/* ── Enable SSL checkbox ── */}
          <div className="flex items-start gap-3 pt-1 pb-1">
            <div className="mt-0.5">
              <input
                type="checkbox"
                id="enable_ssl"
                name="enable_ssl"
                checked={formData.enable_ssl}
                onChange={handleChange}
                className="w-4 h-4 2xl:w-5 2xl:h-5 rounded border-2 border-gray-300 focus:ring-2 focus:ring-purple-400 cursor-pointer accent-purple-600"
              />
            </div>
            <div>
              <label htmlFor="enable_ssl" className="text-sm 2xl:text-base font-semibold text-gray-900 cursor-pointer select-none">
                Enable SSL (LDAPS)
              </label>
              <p className="text-xs 2xl:text-sm text-gray-500 mt-0.5">
                💡 Enables an encrypted LDAPS connection. Additional SSL settings will appear below.
              </p>
            </div>
          </div>

          {/* ── LDAPS config panel — only visible when SSL is ON ── */}
          {formData.enable_ssl && (
            <div className="border-2 border-purple-200 bg-gradient-to-br from-purple-50/60 to-indigo-50/40 rounded-xl p-5 2xl:p-6 space-y-5 2xl:space-y-6">
              {/* Section header */}
              <div className="flex items-center gap-2 pb-1 border-b border-purple-200">
                <div className="w-6 h-6 2xl:w-7 2xl:h-7 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">🔐</span>
                </div>
                <h3 className="text-sm 2xl:text-base font-bold text-purple-900">LDAPS / SSL Configuration</h3>
              </div>

              {/* LDAPS port */}
              <Field
                label="LDAPS Port"
                required
                hint="SSL-encrypted LDAP port — default is 636"
              >
                <input
                  type="number"
                  name="ldaps_port"
                  value={formData.ldaps_port}
                  onChange={handleChange}
                  placeholder="636"
                  min="1"
                  max="65535"
                  required
                  className={inputCls}
                />
              </Field>

              {/* Trust mode */}
              <Field
                label="Certificate Trust Mode"
                required
                hint="How the client should validate the server's SSL certificate"
              >
                <select
                  name="ssl_trust_mode"
                  value={formData.ssl_trust_mode}
                  onChange={handleChange}
                  required
                  className={`${inputCls} cursor-pointer`}
                >
                  <option value="trustAll">Trust All (skip verification — dev only)</option>
                  <option value="jvm">Use JVM Default Trust Store</option>
                  <option value="certificate">Provide PEM Certificate</option>
                  <option value="trustStore">Provide Trust Store (JKS / PKCS12)</option>
                </select>
              </Field>

              {/* PEM certificate — only when trust mode = 'certificate' */}
              {formData.ssl_trust_mode === 'certificate' && (
                <Field
                  label="Server Certificate (PEM)"
                  required
                  hint="Paste the PEM-encoded certificate of the directory server or its CA"
                >
                  <textarea
                    name="ssl_certificate"
                    value={formData.ssl_certificate}
                    onChange={handleChange}
                    placeholder={`-----BEGIN CERTIFICATE-----\nMIID…\n-----END CERTIFICATE-----`}
                    rows={6}
                    required
                    className={`${inputCls} font-mono text-xs 2xl:text-sm`}
                  />
                </Field>
              )}

              {/* Trust store fields — only when trust mode = 'trustStore' */}
              {formData.ssl_trust_mode === 'trustStore' && (
                <>
                  <Field
                    label="Trust Store Path"
                    required
                    hint="Absolute path to the JKS or PKCS12 trust store file on the server"
                  >
                    <input
                      type="text"
                      name="ssl_truststore_path"
                      value={formData.ssl_truststore_path}
                      onChange={handleChange}
                      placeholder="/etc/ssl/certs/ldap-truststore.jks"
                      required
                      className={inputCls}
                    />
                  </Field>
                  <Field
                    label="Trust Store Password"
                    hint="Password to open the trust store (stored encrypted)"
                    subLabel={system ? '(leave empty to keep existing)' : undefined}
                  >
                    <input
                      type="password"
                      name="ssl_truststore_password"
                      value={formData.ssl_truststore_password}
                      onChange={handleChange}
                      placeholder="Enter trust store password"
                      className={inputCls}
                    />
                    <p className="text-xs 2xl:text-sm text-gray-500 mt-2 flex items-center gap-1">
                      <span>🔒</span>
                      <span>Trust store password will be securely encrypted</span>
                    </p>
                  </Field>
                </>
              )}

              {/* Trust-all warning */}
              {formData.ssl_trust_mode === 'trustAll' && (
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <span className="text-amber-500 text-base flex-shrink-0 mt-0.5">⚠️</span>
                  <p className="text-xs 2xl:text-sm text-amber-800 leading-relaxed">
                    <strong>Not recommended for production.</strong> Trusting all certificates disables server identity verification and is vulnerable to man-in-the-middle attacks. Use a specific certificate or trust store in production environments.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      );
    }

    if (isPingFederate(t) && formData.auth_method === 'BearerToken') {
      return (
        <Field label="Engine Port" hint={hint('engine_port')}>
          <input
            type="number" name="engine_port" value={formData.engine_port} onChange={handleChange}
            placeholder="9031" min="1" max="65535"
            className={inputCls}
          />
        </Field>
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
    'w-full px-4 py-3 2xl:px-5 2xl:py-4 text-sm 2xl:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder:text-gray-400 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:border-gray-300';

  /* ─────────────────────────────────────────────────────────────────────── */
  /* Small reusable presentational pieces                                     */
  /* ─────────────────────────────────────────────────────────────────────── */
  const SecureNote = () => (
    <p className="text-xs 2xl:text-sm text-gray-500 mt-2 flex items-center gap-1">
      <span>🔒</span>
      <span>This value will be securely encrypted and stored</span>
    </p>
  );

  const Hint = ({ text }: { text: string }) => (
    <p className="text-xs 2xl:text-sm text-gray-500 mt-2 flex items-center gap-1">
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
      <label className="block text-sm 2xl:text-base font-semibold text-gray-900 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {subLabel && <span className="text-xs 2xl:text-sm text-gray-500 ml-2 font-normal">{subLabel}</span>}
      </label>
      {children}
      {hint && <Hint text={hint} />}
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────────── */
  /* Render                                                                   */
  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md 2xl:max-w-xl w-full p-8 2xl:p-12 text-center animate-scaleIn border border-white/20">
            <div className="flex justify-center mb-6 2xl:mb-8">
              <div className="w-16 h-16 2xl:w-20 2xl:h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-pulse-gentle">
                <FaCheckCircle className="text-white text-3xl 2xl:text-4xl" />
              </div>
            </div>
            <h2 className="text-2xl 2xl:text-3xl font-semibold text-gray-900 mb-2">
              {system ? 'System Updated Successfully!' : 'Target System Created!'}
            </h2>
            <p className="text-gray-600 2xl:text-lg mb-8 2xl:mb-10">
              {system ? 'Your target system has been updated' : 'Your target system is now ready to use'}
            </p>

            <div className="bg-gradient-to-br from-gray-50 to-purple-50/50 rounded-xl p-5 2xl:p-6 mb-8 2xl:mb-10 border border-gray-100">
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
                  <span className="text-sm 2xl:text-base text-gray-600">{label}</span>
                  <span className="font-semibold text-gray-900 text-sm 2xl:text-base capitalize">{val}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleSuccess}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 2xl:py-4 2xl:text-lg rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={isModal ? 'relative z-10 w-full' : 'relative z-10 flex items-start justify-center min-h-screen p-8 2xl:p-14'}>
        <div className={isModal ? 'w-full' : 'w-full max-w-4xl 2xl:max-w-5xl'}>
          {!isModal && onCancel && (
            <button
              onClick={onCancel}
              className="group text-gray-700 hover:text-gray-900 mb-6 2xl:mb-8 flex items-center gap-2 transition-all duration-300 text-sm 2xl:text-base font-medium"
            >
              <span className="inline-block transform group-hover:-translate-x-1 transition-transform duration-300">←</span>
              <span>Back</span>
            </button>
          )}

          {/* Form Card */}
          <div className={`bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden animate-slideUp ${isModal ? 'max-h-[90vh] overflow-y-auto' : ''}`}>

            {/* Header */}
            <div className="flex items-center justify-between px-8 2xl:px-12 py-6 2xl:py-8 border-b border-gray-100 bg-gradient-to-r from-white/50 to-purple-50/30">
              <div>
                <div className="flex items-center gap-2 text-sm 2xl:text-base text-gray-500 mb-2">
                  <span className="w-6 h-6 2xl:w-8 2xl:h-8 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs 2xl:text-sm font-bold shadow-sm">
                    {system ? '✏️' : '+'}
                  </span>
                  <span className="font-medium">{system ? 'Edit Target System' : 'Create Target System'}</span>
                </div>
                <h1 className="text-2xl 2xl:text-3xl font-bold text-gray-900">
                  {integrationName || 'Target System Configuration'}
                </h1>
              </div>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="w-10 h-10 2xl:w-12 2xl:h-12 flex items-center justify-center rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all duration-300 hover:scale-110"
                >
                  <FaTimes className="text-xl 2xl:text-2xl" />
                </button>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 2xl:px-12 py-6 2xl:py-8">
              {error && (
                <div className="mb-4 2xl:mb-6 rounded-lg bg-red-50 border border-red-100 text-red-700 px-4 py-3 2xl:px-5 2xl:py-4 text-sm 2xl:text-base">
                  {error}
                </div>
              )}

              <div className="space-y-5 2xl:space-y-7">

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
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    name="port"
                    value={formData.port}
                    onChange={handleChange}
                    placeholder="443"
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder:text-gray-400 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:border-gray-300"
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>💡</span>
                    <span>Default is 443 for HTTPS</span>
                  </p>
                </div>

                {/* Engine Port - Only for PingFederate + BearerToken */}
                {isPingFederate(formData.type) && formData.auth_method === 'BearerToken' && (
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
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
                      className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder:text-gray-400 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:border-gray-300"
                    />
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
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

                {/* ── Per-integration extra fields (between Port and Auth) ── */}
                {renderTypeSpecificFields()}

                {/* ── Auth credential fields ── */}
                {renderAuthFields()}

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
              <div className="flex gap-4 mt-8 2xl:mt-10 pt-6 2xl:pt-8 border-t border-gray-100">
                <button
                  type="button" onClick={handleReset}
                  className="flex-1 px-6 py-3 2xl:px-8 2xl:py-4 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl text-sm 2xl:text-base font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                >
                  <span className="text-lg 2xl:text-xl">🔄</span>
                  <span>Reset</span>
                </button>
                <button
                  type="submit" disabled={loading}
                  className="flex-1 px-6 py-3 2xl:px-8 2xl:py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-sm 2xl:text-base font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
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
      `}</style>
    </div>
  );
};

export default TargetSystemForm;