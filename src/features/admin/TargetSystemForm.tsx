import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheckCircle, FaShieldAlt, FaKey, FaLock, FaFingerprint, FaEye, FaEyeSlash, FaClipboard, FaCheck } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { useTheme } from '../../state/ThemeContext';

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
  host?: string;
  hostname?: string;
  port?: number;
  default_port?: number;
  base_url?: string;
  engine_port?: number;
  description?: string;
  credentials?: {
    username?: string;
    client_id?: string;
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
  server_url: string;
  ldap_host: string;
  ldap_port: number;
  ldaps_port: number;
  base_dn: string;
  bind_dn: string;
  bind_password: string;
  enable_ssl: boolean;
  ssl_trust_mode: string;
  ssl_certificate: string;
  ssl_truststore_path: string;
  ssl_truststore_password: string;
  region: string;
  environment_id: string;
  domain: string;
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

const SecureNote = ({ isDark }: { isDark: boolean }) => (
  <p className="text-xs 2xl:text-sm mt-2 flex items-center gap-1" style={{ color: isDark ? '#64748b' : '#6b7280' }}>
    <span>🔒</span>
    <span>This value will be securely encrypted and stored</span>
  </p>
);

const Hint = ({ text, isDark }: { text: string; isDark: boolean }) => (
  <p className="text-xs 2xl:text-sm mt-2 flex items-center gap-1" style={{ color: isDark ? '#64748b' : '#6b7280' }}>
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
  isDark: boolean;
}

const Field = ({ label, required, hint, subLabel, children, isDark }: FieldProps) => (
  <div className="group">
    <label className="block text-sm 2xl:text-base font-semibold mb-2" style={{ color: isDark ? '#e2e8f0' : '#111827' }}>
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
      {subLabel && <span className="text-xs 2xl:text-sm ml-2 font-normal" style={{ color: isDark ? '#64748b' : '#6b7280' }}>{subLabel}</span>}
    </label>
    {children}
    {hint && <Hint text={hint} isDark={isDark} />}
  </div>
);

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
  const { isDark } = useTheme();

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

  const resolvedType = normalizeType(system?.type || integrationValue || '');
  const integDefaults = getIntegrationDefaults(resolvedType);

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
    region: '',
    environment_id: '',
    domain: '',
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

  useEffect(() => {
    console.log('[TargetSystemForm] Props received:', {
      system, typeOptions, availableAuthMethods, integrationValue, integrationId, integrationName,
      onSubmit: typeof onSubmit, onCancel: typeof onCancel
    });
    if (typeof onSubmit !== 'function') {
      console.error('[TargetSystemForm] ERROR: onSubmit is not a function!', onSubmit);
    }
  }, [system, typeOptions, availableAuthMethods, integrationValue, integrationId, integrationName, onSubmit, onCancel]);

  useEffect(() => {
    if (system) {
      const credentials = system.credentials || {};
      console.log('[TargetSystemForm] Credentials from backend:', credentials);
      console.log('[TargetSystemForm] Username:', credentials.username, 'Client ID:', credentials.client_id);
      console.log('[TargetSystemForm] Raw from backend - hostname:', system.hostname, 'default_port:', system.default_port, 'base_url:', system.base_url);
      let host = system.hostname || system.host || '';
      let port = system.default_port || system.port || 443;
      if (!host && system.base_url) {
        try {
          const url = new URL(system.base_url);
          host = url.hostname;
          port = url.port ? parseInt(url.port) : 443;
        } catch {}
      }
      console.log('[TargetSystemForm] Final extracted host:', host, 'port:', port);
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
        server_url: system.base_url || '',
        ldap_host: host,
        ldap_port: port === 636 ? 389 : port,
        ldaps_port: port === 636 ? port : 636,
        base_dn: (system as any).base_dn || '',
        bind_dn: credentials.bind_dn || '',
        bind_password: credentials.bind_password || '',
        enable_ssl: false,
        ssl_trust_mode: 'trustAll',
        ssl_certificate: '',
        ssl_truststore_path: '',
        ssl_truststore_password: '',
        region: (system as any).region || '',
        environment_id: (system as any).environment_id || '',
        domain: (system as any).domain || '',
        tenant_id: (system as any).tenant_id || ''
      });
      console.log('[TargetSystemForm] Form data updated with type:', typeValue);
      if (system.auth_method &&
          (system.auth_method === 'assertion_jwt_exchange' || system.auth_method === 'AssertionJwtExchange')) {
        setLoadingTokenConfig(true);
        fetch('/api/v1/token-provider-config', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        })
          .then(response => response.ok ? response.json() : null)
          .then(result => { if (result?.success && result?.data) { setTokenProviderConfig(result.data); } })
          .catch(err => console.error('[TargetSystemForm] Error loading token provider config:', err))
          .finally(() => setLoadingTokenConfig(false));
      }
    } else {
      if (integrationValue === 'PingFederate' || integrationValue === 'ping_federate') {
        setFormData(prev => ({ ...prev, port: 9999, engine_port: 9031 }));
      }
    }
  }, [system]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isCheckbox = (e.target as HTMLInputElement).type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => {
      const updated: FormData = {
        ...prev,
        [name]: isCheckbox ? checked
          : (name === 'port' || name === 'engine_port' || name === 'ldap_port' || name === 'ldaps_port')
            ? (value === '' ? prev[name as keyof FormData] : (parseInt(value) || prev[name as keyof FormData]))
            : value,
      };
      if (name === 'enable_ssl' && isDirectory(prev.type)) {
        const newPort = checked ? prev.ldaps_port : prev.ldap_port;
        const protocol = checked ? 'ldaps' : 'ldap';
        const hostPart = prev.ldap_host || 'localhost';
        updated.server_url = `${protocol}://${hostPart}:${newPort}`;
        updated.port = newPort;
      }
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
        } catch { }
      }
      if (name === 'ldap_host' && isDirectory(prev.type)) {
        const protocol = prev.enable_ssl ? 'ldaps' : 'ldap';
        const p = prev.enable_ssl ? prev.ldaps_port : prev.ldap_port;
        updated.server_url = `${protocol}://${value}:${p}`;
      }
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

  useEffect(() => {
    if (formData.auth_method === 'AssertionJwtExchange' && !tokenProviderConfig && !loadingTokenConfig) {
      console.log('[TargetSystemForm] useEffect: Auth method is AssertionJwtExchange, loading token config');
      setLoadingTokenConfig(true);
      fetch('/api/v1/token-provider-config', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      })
        .then(response => { console.log('[TargetSystemForm] Token config response status:', response.status); return response.ok ? response.json() : null; })
        .then(result => { console.log('[TargetSystemForm] Token config fetch result:', result); if (result?.success && result?.data) { setTokenProviderConfig(result.data); } })
        .catch(err => console.error('[TargetSystemForm] Error loading token provider config in useEffect:', err))
        .finally(() => setLoadingTokenConfig(false));
    }
  }, [formData.auth_method]);

  const handleAuthMethodChange = async (method: string): Promise<void> => {
    const updates: Partial<FormData> = { auth_method: method };
    const isPF = formData.type === 'PingFederate';
    if (isPF && method === 'BearerToken') {
      const currentDefaults = getIntegrationDefaults('PingFederate');
      if (formData.port === getIntegrationDefaults(formData.type).port) updates.port = currentDefaults.port;
      if (formData.engine_port === (getIntegrationDefaults(formData.type).engine_port ?? 9031)) updates.engine_port = currentDefaults.engine_port ?? 9031;
    }
    setFormData(prev => ({ ...prev, ...updates }));
    if (method === 'AssertionJwtExchange') {
      setLoadingTokenConfig(true);
      try {
        const response = await fetch('/api/v1/token-provider-config', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) { setTokenProviderConfig(result.data); }
        } else { setTokenProviderConfig(null); }
      } catch (err) { setTokenProviderConfig(null); }
      finally { setLoadingTokenConfig(false); }
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
      if (!formData.name || !formData.type) { setError('Please fill in all required fields (Name, Type)'); setLoading(false); return; }
      if (isDirectory(formData.type)) {
        if (!formData.ldap_host) { setError('Directory Host is required'); setLoading(false); return; }
        if (!formData.server_url) { setError('Server URL is required (e.g. ldap://localhost:389)'); setLoading(false); return; }
        if (formData.auth_method === 'BasicAuth' && (!formData.bind_dn || !formData.bind_password)) { setError('Bind DN and Password are required'); setLoading(false); return; }
        if (!formData.base_dn) { setError('Base DN is required'); setLoading(false); return; }
        if (formData.enable_ssl) {
          if (!formData.ldaps_port) { setError('LDAPS Port is required when SSL is enabled'); setLoading(false); return; }
          if (formData.ssl_trust_mode === 'certificate' && !formData.ssl_certificate) { setError('Server Certificate (PEM) is required for the selected trust mode'); setLoading(false); return; }
          if (formData.ssl_trust_mode === 'trustStore' && !formData.ssl_truststore_path) { setError('Trust Store Path is required for the selected trust mode'); setLoading(false); return; }
        }
      } else {
        if (!formData.host) { setError('Host is required'); setLoading(false); return; }
      }
      const portNum = Number(formData.port);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) { setError('Port must be a valid number between 1 and 65535'); setLoading(false); return; }
      if (formData.engine_port) {
        const enginePortNum = Number(formData.engine_port);
        if (isNaN(enginePortNum) || enginePortNum < 1 || enginePortNum > 65535) { setError('Engine port must be a valid number between 1 and 65535'); setLoading(false); return; }
      }
      if (!system) {
        if (formData.auth_method === 'BearerToken' && (!formData.client_id || !formData.client_secret)) { setError('Client ID and Client Secret are required for BearerToken'); setLoading(false); return; }
        if (formData.auth_method === 'BasicAuth' && (!formData.username || !formData.password)) { setError('Username and Password are required for BasicAuth'); setLoading(false); return; }
        if (formData.auth_method === 'APIKey' && !formData.api_key) { setError('API Key is required for APIKey authentication'); setLoading(false); return; }
        if (formData.auth_method === 'AssertionJwtExchange' && !tokenProviderConfig) { setError('Token Provider Configuration is required for Assertion JWT Exchange. Please configure it first.'); setLoading(false); return; }
      } else {
        if (formData.auth_method === 'BearerToken' && !formData.client_id) { setError('Client ID is required'); setLoading(false); return; }
        if (formData.auth_method === 'BasicAuth' && !formData.username) { setError('Username is required'); setLoading(false); return; }
      }
      const typeToSnake = (t: string): string => {
        const m: Record<string, string> = { PingFederate: 'ping_federate', PingDirectory: 'ping_directory', PingOne: 'ping_one', Okta: 'okta', AzureAD: 'azure_ad', Auth0: 'auth0', LDAP: 'ldap', Custom: 'custom' };
        return m[t] || t.toLowerCase().replace(/\s+/g, '_');
      };
      const authMethodToSnakeCase = (method: string): string => {
        const mapping: Record<string, string> = { 'BasicAuth': 'basic_auth', 'APIKey': 'api_key', 'OAuth2': 'oauth2', 'ClientCredentials': 'client_credentials', 'BearerToken': 'bearer_token', 'Certificate': 'certificate', 'AssertionJwtExchange': 'assertion_jwt_exchange' };
        return mapping[method] || method.toLowerCase().replace(/\s+/g, '_');
      };
      let base_url: string;
      if (isDirectory(formData.type)) {
        base_url = formData.server_url;
      } else {
        const protocol = (formData.host.startsWith('https://') || formData.host.startsWith('http://')) ? '' : 'https://';
        const cleanHost = formData.host.replace(/^https?:\/\//, '');
        base_url = `${protocol}${cleanHost}:${formData.port}`;
      }
      let credentials: SubmitData['credentials'] = {};
      if (formData.auth_method === 'BasicAuth') {
        if (isDirectory(formData.type)) { credentials = { bind_dn: formData.bind_dn, bind_password: formData.bind_password }; }
        else { credentials = { username: formData.username, password: formData.password }; }
      } else if (formData.auth_method === 'BearerToken' || formData.auth_method === 'ClientCredentials') {
        credentials = { client_id: formData.client_id, client_secret: formData.client_secret };
      } else if (formData.auth_method === 'APIKey') {
        credentials = { api_key: formData.api_key };
      }
      const submitData: any = {
        name: formData.name, type: typeToSnake(formData.type), integration_id: formData.integration_id,
        base_url, auth_method: authMethodToSnakeCase(formData.auth_method), credentials,
        environment: formData.environment, description: formData.description,
      };
      if (formData.auth_method === 'AssertionJwtExchange') submitData.use_assertion_jwt_exchange = true;
      const isPingFederateType = typeToSnake(formData.type) === 'ping_federate';
      if (isPingFederateType && formData.auth_method === 'BearerToken') submitData.engine_port = formData.engine_port;
      if (isDirectory(formData.type)) {
        submitData.server_url = formData.server_url; submitData.ldap_port = formData.ldap_port;
        submitData.ldaps_port = formData.ldaps_port; submitData.base_dn = formData.base_dn;
        submitData.enable_ssl = formData.enable_ssl;
        if (formData.enable_ssl) {
          submitData.ssl_trust_mode = formData.ssl_trust_mode;
          if (formData.ssl_trust_mode === 'certificate') submitData.ssl_certificate = formData.ssl_certificate;
          if (formData.ssl_trust_mode === 'trustStore') { submitData.ssl_truststore_path = formData.ssl_truststore_path; submitData.ssl_truststore_password = formData.ssl_truststore_password; }
        }
      }
      if (formData.type === 'PingOne') { submitData.region = formData.region; submitData.environment_id = formData.environment_id; }
      if (formData.type === 'AzureAD') submitData.tenant_id = formData.tenant_id;
      if (formData.type === 'Okta' || formData.type === 'Auth0') submitData.domain = formData.domain;
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
    ...emptyForm, type: formData.type, integration_id: formData.integration_id,
    auth_method: integDefaults.defaultAuthMethod, port: integDefaults.port, engine_port: integDefaults.engine_port ?? 9031,
  });

  const handleCopyToClipboard = (text: string, fieldName: string): void => {
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
      }).catch(err => console.error('Failed to copy to clipboard:', err));
    }
  };

  const isPingFederate = (t: string) => t === 'PingFederate' || t === 'ping_federate';
  const isDirectory = (t: string) => t === 'PingDirectory' || t === 'ping_directory' || t === 'LDAP';
  const isPingOne = (t: string) => t === 'PingOne' || t === 'ping_one';
  const isAzureAD = (t: string) => t === 'AzureAD' || t === 'azure_ad';
  const isOktaLike = (t: string) => t === 'Okta' || t === 'Auth0';

  const defaultAuthMethodOptions: AuthMethodOption[] = [
    { value: 'BearerToken', label: 'Bearer Token', snakeCase: 'bearer_token', icon: FaShieldAlt, description: 'OAuth 2.0 token-based' },
    { value: 'BasicAuth', label: 'Basic Auth', snakeCase: 'basic_auth', icon: FaKey, description: 'Username/password' },
    { value: 'APIKey', label: 'API Key', snakeCase: 'api_key', icon: FaFingerprint, description: 'Single API key' },
    { value: 'OAuth2', label: 'OAuth2', snakeCase: 'oauth2', icon: FaLock, description: 'Full OAuth 2.0 flow' },
    { value: 'ClientCredentials', label: 'Client Credentials', snakeCase: 'client_credentials', icon: FaShieldAlt, description: 'Machine-to-machine' },
  ];

  const typeOptions_final: TypeOption[] = typeOptions.length > 0 ? typeOptions : [
    { value: 'PingFederate', label: 'PingFederate' }, { value: 'PingDirectory', label: 'PingDirectory' },
    { value: 'PingOne', label: 'PingOne' }, { value: 'Okta', label: 'Okta' },
    { value: 'AzureAD', label: 'Azure AD' }, { value: 'Auth0', label: 'Auth0' },
    { value: 'LDAP', label: 'LDAP' }, { value: 'Custom', label: 'Custom' },
  ];

  const hint = (key: string) => integDefaults.hints[key] ?? null;

  const authMethodOptions: AuthMethodOption[] = availableAuthMethods.length > 0
    ? availableAuthMethods.map(method => {
        const pascalCase = snakeToPascal(method);
        const label = snakeToLabel(method);
        const defaultOption = defaultAuthMethodOptions.find(o => o.value === pascalCase);
        return { value: pascalCase, label, snakeCase: method, icon: defaultOption?.icon, description: defaultOption?.description };
      })
    : defaultAuthMethodOptions.concat([
        { value: 'AssertionJwtExchange', label: 'Assertion JWT Exchange', snakeCase: 'assertion_jwt_exchange', icon: FaShieldAlt, description: 'RFC 8693 token exchange using assertion JWT' }
      ]);

  const ph = (key: keyof FormData): string => (integDefaults.placeholders[key] as string | undefined) ?? '';

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    border: isDark ? '2px solid #1e2d45' : '2px solid #e5e7eb',
    borderRadius: '12px',
    background: isDark ? '#111827' : 'rgba(255,255,255,0.7)',
    color: isDark ? '#e2e8f0' : '#111827',
    outline: 'none',
    transition: 'all 0.3s',
    backdropFilter: 'blur(8px)',
  };

  const getInputStyle = (extraClass?: string): React.CSSProperties => ({
    ...inputStyle,
    ...(extraClass === 'mono' ? { fontFamily: 'monospace' } : {}),
  });

  const renderAuthFields = () => {
    if (isDirectory(formData.type)) return null;
    switch (formData.auth_method) {
      case 'BasicAuth':
        return (
          <>
            <Field label="Username" required hint={hint('username')} isDark={isDark}>
              <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder={ph('username') || 'Enter username'} required style={getInputStyle()}
                onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#1e2d45' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              {system && (<p className="text-xs mt-2 flex items-center gap-1" style={{ color: isDark ? '#64748b' : '#6b7280' }}><span>ℹ️</span><span>Username is required - enter new username to replace existing</span></p>)}
            </Field>
            <Field label="Password" required hint={hint('password')} subLabel={system ? '(leave empty to keep existing)' : undefined} isDark={isDark}>
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter password" required={!system} style={getInputStyle()}
                onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#1e2d45' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <SecureNote isDark={isDark} />
            </Field>
          </>
        );
      case 'BearerToken':
      case 'ClientCredentials':
        return (
          <>
            <Field label="Client ID" required hint={hint('client_id')} isDark={isDark}>
              <input type="text" name="client_id" value={formData.client_id} onChange={handleChange} placeholder={ph('client_id') || 'Enter client ID'} required style={getInputStyle()}
                onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#1e2d45' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              {system && (<p className="text-xs mt-2 flex items-center gap-1" style={{ color: isDark ? '#64748b' : '#6b7280' }}><span>ℹ️</span><span>Client ID is required - enter new client ID to replace existing</span></p>)}
            </Field>
            <Field label="Client Secret" required hint={hint('client_secret')} subLabel={system ? '(leave empty to keep existing)' : undefined} isDark={isDark}>
              <textarea name="client_secret" value={formData.client_secret} onChange={handleChange} placeholder={ph('client_secret') || 'Paste your client secret here...'} rows={4} required={!system} style={{ ...getInputStyle('mono'), resize: 'vertical' }} 
                onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#1e2d45' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <SecureNote isDark={isDark} />
            </Field>
          </>
        );
      case 'APIKey':
        return (
          <Field label="API Key" required hint={hint('api_key')} subLabel={system ? '(leave empty to keep existing)' : undefined} isDark={isDark}>
            <textarea name="api_key" value={formData.api_key} onChange={handleChange} placeholder={ph('api_key') || 'Paste your API key here...'} rows={4} required={!system} style={{ ...getInputStyle('mono'), resize: 'vertical' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#1e2d45' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            <SecureNote isDark={isDark} />
          </Field>
        );
      case 'AssertionJwtExchange':
        return (
          <>
            <div
              className="border-2 rounded-xl p-6 mb-6"
              style={{
                background: isDark ? 'rgba(59,130,246,0.08)' : '#eff6ff',
                borderColor: isDark ? 'rgba(59,130,246,0.3)' : '#bfdbfe',
              }}
            >
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: isDark ? '#93c5fd' : '#1e3a8a' }}><span>🔐</span>Token Provider Configuration</h3>
              {loadingTokenConfig ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm" style={{ color: isDark ? '#93c5fd' : '#1d4ed8' }}>Loading configuration...</span>
                </div>
              ) : tokenProviderConfig ? (
                <div className="space-y-4">
                  {[
                    { label: 'Introspection Endpoint', field: 'introspectionUrl', type: 'text' },
                    { label: 'Introspection Client ID', field: 'introspectionClientId', type: 'text' },
                    { label: 'Introspection Client Secret', field: 'introspectionClientSecret', type: 'password' },
                    { label: 'Scope', field: 'scope', type: 'text' },
                  ].map(({ label, field, type }) => (
                    <div key={field} className="group">
                      <label className="block text-xs font-semibold mb-2" style={{ color: isDark ? '#93c5fd' : '#1e3a8a' }}>{label}</label>
                      <div className="relative">
                        <input
                          type={field === 'introspectionClientSecret' ? (showIntrospectionSecret ? 'text' : 'password') : type}
                          value={tokenProviderConfig[field] || ''}
                          readOnly
                          placeholder={field === 'introspectionClientSecret' ? '(not configured)' : undefined}
                          style={{
                            width: '100%',
                            padding: '8px 16px',
                            paddingRight: field === 'introspectionClientSecret' ? '80px' : '40px',
                            fontSize: '13px',
                            background: isDark ? '#0d1117' : '#ffffff',
                            border: isDark ? '1px solid rgba(59,130,246,0.3)' : '1px solid #bfdbfe',
                            borderRadius: '8px',
                            color: isDark ? '#94a3b8' : '#374151',
                            cursor: 'not-allowed',
                            opacity: 0.85,
                            fontFamily: 'monospace',
                          }}
                        />
                        {tokenProviderConfig[field] && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                            {field === 'introspectionClientSecret' && (
                              <button type="button" onClick={() => setShowIntrospectionSecret(!showIntrospectionSecret)} style={{ color: isDark ? '#60a5fa' : '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>
                                {showIntrospectionSecret ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                              </button>
                            )}
                            <button type="button" onClick={() => handleCopyToClipboard(tokenProviderConfig[field], field)} style={{ color: isDark ? '#60a5fa' : '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>
                              {copiedField === field ? <FaCheck size={16} /> : <FaClipboard size={16} />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm" style={{ color: isDark ? '#93c5fd' : '#1d4ed8' }}>⚠️ Token provider configuration not found. Please configure it first.</div>
              )}
            </div>
            <div
              className="border-2 rounded-xl overflow-hidden"
              style={{
                background: isDark ? 'rgba(245,158,11,0.05)' : '#fffbeb',
                borderColor: isDark ? 'rgba(245,158,11,0.3)' : '#fde68a',
              }}
            >
              <button
                type="button"
                onClick={() => setExpandInstructions(!expandInstructions)}
                className="w-full px-6 py-4 flex items-center justify-between transition-colors duration-200"
                style={{ background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = isDark ? 'rgba(245,158,11,0.08)' : '#fef3c7'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
              >
                <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: isDark ? '#fbbf24' : '#92400e' }}><span>📋</span>Configuration Instructions</h3>
                <span style={{ color: isDark ? '#fbbf24' : '#92400e', transform: expandInstructions ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s', display: 'inline-block' }}>▼</span>
              </button>
              {expandInstructions && (
                <div
                  className="px-6 py-4 border-t space-y-4"
                  style={{
                    borderColor: isDark ? 'rgba(245,158,11,0.2)' : '#fde68a',
                    background: isDark ? '#0d1117' : '#ffffff',
                  }}
                >
                  <div className="space-y-3 text-sm" style={{ color: isDark ? '#94a3b8' : '#374151' }}>
                    <p className="font-semibold" style={{ color: isDark ? '#e2e8f0' : '#111827' }}>General Steps:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-2">
                      <li>Configure your target system to trust the SSL certificate of the Token Provider</li>
                      <li>Set the authentication method to use Assertion JWT Token Exchange (RFC 8693)</li>
                      <li>Configure introspection endpoint details below in your target system</li>
                    </ol>
                    {(formData.type === 'PingFederate' || formData.type === 'ping_federate') && (
                      <div className="mt-4 pt-4 border-t" style={{ borderColor: isDark ? 'rgba(245,158,11,0.2)' : '#fde68a' }}>
                        <p className="font-semibold mb-2" style={{ color: isDark ? '#e2e8f0' : '#111827' }}>PingFederate Configuration:</p>
                        <ol className="list-decimal list-inside space-y-2 ml-2">
                          <li>Enable OAuth 2.0 in the Admin API settings</li>
                          <li>In your target PingFederate system, configure the following in the introspection details:
                            <div className="mt-2 ml-4 p-3 rounded font-mono text-xs space-y-1" style={{ background: isDark ? '#1a2234' : '#f3f4f6', color: isDark ? '#94a3b8' : '#374151' }}>
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
                    {!(formData.type === 'PingFederate' || formData.type === 'ping_federate') && (
                      <div className="mt-4 pt-4 border-t" style={{ borderColor: isDark ? 'rgba(245,158,11,0.2)' : '#fde68a' }}>
                        <p className="font-semibold mb-2" style={{ color: isDark ? '#e2e8f0' : '#111827' }}>Target System Configuration:</p>
                        <ol className="list-decimal list-inside space-y-2 ml-2">
                          <li>Configure your {formData.type} system to use RFC 8693 Token Exchange</li>
                          <li>Set the introspection endpoint to: <code className="px-2 py-1 rounded text-xs" style={{ background: isDark ? '#1a2234' : '#f3f4f6', color: isDark ? '#94a3b8' : '#374151' }}>{tokenProviderConfig?.introspectionUrl}</code></li>
                          <li>Use the introspection client credentials provided above</li>
                          <li>Configure the scope: <code className="px-2 py-1 rounded text-xs" style={{ background: isDark ? '#1a2234' : '#f3f4f6', color: isDark ? '#94a3b8' : '#374151' }}>{tokenProviderConfig?.scope}</code></li>
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

  const renderTypeSpecificFields = () => {
    const t = formData.type;
    if (isDirectory(t)) {
      return (
        <>
          <Field label="Directory Host" required hint="Hostname or IP address of your directory server" isDark={isDark}>
            <input type="text" name="ldap_host" value={formData.ldap_host} onChange={handleChange} placeholder="e.g., directory.example.com" required style={getInputStyle()}
              onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#1e2d45' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </Field>
          <Field label="LDAP Port (plain-text)" hint="Non-SSL LDAP port — default is 389" isDark={isDark}>
            <input type="number" name="ldap_port" value={formData.ldap_port} onChange={handleChange} placeholder="389" min="1" max="65535" style={getInputStyle()}
              onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#1e2d45' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </Field>
          <Field label="Server URL" required hint="Auto-built from Host and Port — or type directly to override" isDark={isDark}>
            <input type="text" name="server_url" value={formData.server_url} onChange={handleChange} placeholder={formData.enable_ssl ? 'ldaps://directory.example.com:636' : 'ldap://directory.example.com:389'} required style={getInputStyle()}
              onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#1e2d45' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </Field>
          <Field label="Bind DN" required hint="Distinguished Name used to authenticate with the directory" isDark={isDark}>
            <input type="text" name="bind_dn" value={formData.bind_dn} onChange={handleChange} placeholder="cn=Directory Manager" required style={getInputStyle()}
              onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#1e2d45' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </Field>
          <Field label="Password" required hint="Password for the Bind DN (stored encrypted)" subLabel={system ? '(leave empty to keep existing)' : undefined} isDark={isDark}>
            <input type="password" name="bind_password" value={formData.bind_password} onChange={handleChange} placeholder="Enter password" required={!system} style={getInputStyle()}
              onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#1e2d45' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            <p className="text-xs 2xl:text-sm mt-2 flex items-center gap-1" style={{ color: isDark ? '#64748b' : '#6b7280' }}><span>🔒</span><span>Your password will be securely encrypted and stored</span></p>
          </Field>
          <Field label="Base DN" required hint="Root DN of your directory tree" isDark={isDark}>
            <input type="text" name="base_dn" value={formData.base_dn} onChange={handleChange} placeholder="dc=company,dc=com" required style={getInputStyle()}
              onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#1e2d45' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </Field>
          <div className="flex items-start gap-3 pt-1 pb-1">
            <div className="mt-0.5">
              <input type="checkbox" id="enable_ssl" name="enable_ssl" checked={formData.enable_ssl} onChange={handleChange} className="w-4 h-4 2xl:w-5 2xl:h-5 rounded cursor-pointer accent-purple-600" style={{ borderColor: isDark ? '#334155' : '#d1d5db' }} />
            </div>
            <div>
              <label htmlFor="enable_ssl" className="text-sm 2xl:text-base font-semibold cursor-pointer select-none" style={{ color: isDark ? '#e2e8f0' : '#111827' }}>Enable SSL (LDAPS)</label>
              <p className="text-xs 2xl:text-sm mt-0.5" style={{ color: isDark ? '#64748b' : '#6b7280' }}>💡 Enables an encrypted LDAPS connection. Additional SSL settings will appear below.</p>
            </div>
          </div>
          {formData.enable_ssl && (
            <div
              className="rounded-xl p-5 2xl:p-6 space-y-5 2xl:space-y-6"
              style={{
                border: isDark ? '2px solid rgba(168,85,247,0.3)' : '2px solid #e9d5ff',
                background: isDark ? 'rgba(88,28,135,0.08)' : 'rgba(250,245,255,0.6)',
              }}
            >
              <div className="flex items-center gap-2 pb-1 border-b" style={{ borderColor: isDark ? 'rgba(168,85,247,0.2)' : '#e9d5ff' }}>
                <div className="w-6 h-6 2xl:w-7 2xl:h-7 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0"><span className="text-white text-xs">🔐</span></div>
                <h3 className="text-sm 2xl:text-base font-bold" style={{ color: isDark ? '#c4b5fd' : '#6b21a8' }}>LDAPS / SSL Configuration</h3>
              </div>
              <Field label="LDAPS Port" required hint="SSL-encrypted LDAP port — default is 636" isDark={isDark}>
                <input type="number" name="ldaps_port" value={formData.ldaps_port} onChange={handleChange} placeholder="636" min="1" max="65535" required style={getInputStyle()}
                  onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#1e2d45' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </Field>
              <Field label="Certificate Trust Mode" required hint="How the client should validate the server's SSL certificate" isDark={isDark}>
                <select name="ssl_trust_mode" value={formData.ssl_trust_mode} onChange={handleChange} required style={{ ...getInputStyle(), cursor: 'pointer' }}>
                  <option value="trustAll">Trust All (skip verification — dev only)</option>
                  <option value="jvm">Use JVM Default Trust Store</option>
                  <option value="certificate">Provide PEM Certificate</option>
                  <option value="trustStore">Provide Trust Store (JKS / PKCS12)</option>
                </select>
              </Field>
              {formData.ssl_trust_mode === 'certificate' && (
                <Field label="Server Certificate (PEM)" required hint="Paste the PEM-encoded certificate of the directory server or its CA" isDark={isDark}>
                  <textarea name="ssl_certificate" value={formData.ssl_certificate} onChange={handleChange} placeholder={`-----BEGIN CERTIFICATE-----\nMIID…\n-----END CERTIFICATE-----`} rows={6} required style={{ ...getInputStyle('mono'), resize: 'vertical', fontSize: '12px' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#1e2d45' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </Field>
              )}
              {formData.ssl_trust_mode === 'trustStore' && (
                <>
                  <Field label="Trust Store Path" required hint="Absolute path to the JKS or PKCS12 trust store file on the server" isDark={isDark}>
                    <input type="text" name="ssl_truststore_path" value={formData.ssl_truststore_path} onChange={handleChange} placeholder="/etc/ssl/certs/ldap-truststore.jks" required style={getInputStyle()}
                      onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#1e2d45' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </Field>
                  <Field label="Trust Store Password" hint="Password to open the trust store (stored encrypted)" subLabel={system ? '(leave empty to keep existing)' : undefined} isDark={isDark}>
                    <input type="password" name="ssl_truststore_password" value={formData.ssl_truststore_password} onChange={handleChange} placeholder="Enter trust store password" style={getInputStyle()}
                      onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#1e2d45' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                    <p className="text-xs 2xl:text-sm mt-2 flex items-center gap-1" style={{ color: isDark ? '#64748b' : '#6b7280' }}><span>🔒</span><span>Trust store password will be securely encrypted</span></p>
                  </Field>
                </>
              )}
              {formData.ssl_trust_mode === 'trustAll' && (
                <div className="flex items-start gap-2.5 rounded-lg px-4 py-3" style={{ background: isDark ? 'rgba(245,158,11,0.08)' : '#fffbeb', border: isDark ? '1px solid rgba(245,158,11,0.3)' : '1px solid #fde68a' }}>
                  <span className="text-amber-500 text-base flex-shrink-0 mt-0.5">⚠️</span>
                  <p className="text-xs 2xl:text-sm leading-relaxed" style={{ color: isDark ? '#fcd34d' : '#92400e' }}><strong>Not recommended for production.</strong> Trusting all certificates disables server identity verification and is vulnerable to man-in-the-middle attacks.</p>
                </div>
              )}
            </div>
          )}
        </>
      );
    }
    if (isPingFederate(t) && formData.auth_method === 'BearerToken') {
      return (
        <Field label="Engine Port" hint={hint('engine_port')} isDark={isDark}>
          <input type="number" name="engine_port" value={formData.engine_port} onChange={handleChange} placeholder="9031" min="1" max="65535" style={getInputStyle()}
            onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#1e2d45' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </Field>
      );
    }
    if (isPingOne(t)) {
      return (
        <>
          <Field label="Region" required hint={hint('region')} isDark={isDark}>
            <select name="region" value={formData.region} onChange={handleChange} required style={{ ...getInputStyle(), cursor: 'pointer' }}>
              <option value="">Select a region…</option>
              <option value="NA">NA – North America</option>
              <option value="EU">EU – Europe</option>
              <option value="AP">AP – Asia Pacific</option>
              <option value="CA">CA – Canada</option>
            </select>
          </Field>
          <Field label="Environment ID" required hint={hint('environment_id')} isDark={isDark}>
            <input type="text" name="environment_id" value={formData.environment_id} onChange={handleChange} placeholder={ph('environment_id') || 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'} required style={getInputStyle()}
              onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#1e2d45' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </Field>
        </>
      );
    }
    if (isAzureAD(t)) {
      return (
        <Field label="Tenant ID" required hint={hint('tenant_id')} isDark={isDark}>
          <input type="text" name="tenant_id" value={formData.tenant_id} onChange={handleChange} placeholder={ph('tenant_id') || 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'} required style={getInputStyle()}
            onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#1e2d45' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </Field>
      );
    }
    if (isOktaLike(t)) {
      return (
        <Field label={t === 'Auth0' ? 'Auth0 Domain' : 'Okta Domain'} required hint={hint('domain')} isDark={isDark}>
          <input type="text" name="domain" value={formData.domain} onChange={handleChange} placeholder={ph('domain') || (t === 'Auth0' ? 'yourtenancy.auth0.com' : 'yourorg.okta.com')} required style={getInputStyle()}
            onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#1e2d45' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </Field>
      );
    }
    return null;
  };

  // ─── SUCCESS MODAL ───────────────────────────────────────────────────────────
  const successModal = showSuccess && (
    <div className="fixed inset-0 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div
        className="rounded-2xl shadow-2xl w-full p-8 lg:p-10 2xl:p-12 text-center animate-scaleIn"
        style={{
          maxWidth: 'clamp(320px, 90vw, 36rem)',
          background: isDark ? '#1a2234' : 'rgba(255,255,255,0.95)',
          border: isDark ? '1px solid #1e2d45' : '1px solid rgba(255,255,255,0.2)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex justify-center mb-6 2xl:mb-8">
          <div className="w-16 h-16 2xl:w-20 2xl:h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-pulse-gentle">
            <FaCheckCircle className="text-white text-3xl 2xl:text-4xl" />
          </div>
        </div>
        <h2 className="text-2xl 2xl:text-3xl font-semibold mb-2" style={{ color: isDark ? '#f1f5f9' : '#111827' }}>
          {system ? 'System Updated Successfully!' : 'Target System Created!'}
        </h2>
        <p className="2xl:text-lg mb-8 2xl:mb-10" style={{ color: isDark ? '#64748b' : '#4b5563' }}>
          {system ? 'Your target system has been updated' : 'Your target system is now ready to use'}
        </p>
        <div
          className="rounded-xl p-5 2xl:p-6 mb-8 2xl:mb-10"
          style={{
            background: isDark ? '#111827' : 'linear-gradient(135deg, #f9fafb, rgba(250,245,255,0.5))',
            border: isDark ? '1px solid #1e2d45' : '1px solid #f3f4f6',
          }}
        >
          {[
            ['System Name', formData.name],
            ['Type', formData.type],
            ['Environment', formData.environment],
            ['Host', formData.host],
            ['Auth Method', authMethodOptions.find(m => m.value === formData.auth_method)?.label ?? formData.auth_method],
          ].map(([label, val], i, arr) => (
            <div key={label} className={`flex items-center justify-between ${i < arr.length - 1 ? 'mb-3 pb-3 border-b' : ''}`} style={{ borderColor: isDark ? '#1e2d45' : '#e5e7eb' }}>
              <span className="text-sm 2xl:text-base" style={{ color: isDark ? '#64748b' : '#6b7280' }}>{label}</span>
              <span className="font-semibold text-sm 2xl:text-base capitalize" style={{ color: isDark ? '#e2e8f0' : '#111827' }}>{val}</span>
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
  );

  // ─── FORM CONTENT ────────────────────────────────────────────────────────────
  const formContent = (
    <>
      {/* Header — RESPONSIVE: tighter padding on lg/xl, original on 2xl */}
      <div
        className="flex items-center justify-between px-5 lg:px-8 xl:px-8 2xl:px-12 py-5 2xl:py-7 border-b"
        style={{
          background: isDark
            ? 'linear-gradient(90deg, rgba(26,34,52,0.8), rgba(88,28,135,0.1))'
            : 'linear-gradient(90deg, rgba(255,255,255,0.5), rgba(250,245,255,0.3))',
          borderColor: isDark ? '#1e2d45' : '#f3f4f6',
        }}
      >
        <div>
          <div className="flex items-center gap-2 text-sm 2xl:text-base mb-1" style={{ color: isDark ? '#64748b' : '#6b7280' }}>
            <span className="w-6 h-6 2xl:w-8 2xl:h-8 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs 2xl:text-sm font-bold shadow-sm">
              {system ? '✏️' : '+'}
            </span>
            <span className="font-medium">{system ? 'Edit Target System' : 'Create Target System'}</span>
          </div>
          <h1 className="text-xl 2xl:text-2xl font-bold" style={{ color: isDark ? '#f1f5f9' : '#111827' }}>
            {integrationName || formData.type || 'Target System Configuration'}
          </h1>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="w-9 h-9 2xl:w-11 2xl:h-11 flex items-center justify-center rounded-xl transition-all duration-300 hover:scale-110"
            style={{ color: isDark ? '#64748b' : '#9ca3af' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = isDark ? '#64748b' : '#9ca3af'; }}
          >
            <FaTimes className="text-lg 2xl:text-xl" />
          </button>
        )}
      </div>

      {/* Form Body — RESPONSIVE: tighter horizontal padding on lg/xl */}
      <form onSubmit={handleSubmit} className="px-5 lg:px-8 xl:px-8 2xl:px-12 py-6 2xl:py-8">
        {error && (
          <div
            className="mb-4 2xl:mb-6 rounded-lg px-4 py-3 2xl:px-5 2xl:py-4 text-sm 2xl:text-base"
            style={{
              background: isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2',
              border: isDark ? '1px solid rgba(239,68,68,0.3)' : '1px solid #fecaca',
              color: isDark ? '#fca5a5' : '#b91c1c',
            }}
          >
            {error}
          </div>
        )}
        <div className="space-y-5 2xl:space-y-7">
          <Field label="System Name" required hint={`Give your ${integrationName || 'target system'} connection a descriptive name`} isDark={isDark}>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder={`e.g., Production ${integrationName || 'System'}`} required style={getInputStyle()}
              onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#1e2d45' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </Field>

          <Field label="System Type" required hint={system ? 'System type cannot be changed after creation' : 'The type of system you are connecting to'} isDark={isDark}>
            {system || integrationName ? (
              <div style={{ ...getInputStyle(), background: isDark ? '#0d1117' : '#f9fafb', cursor: 'not-allowed', opacity: 0.7 }}>{integrationName || formData.type}</div>
            ) : (
              <select name="type" value={formData.type} onChange={handleChange} required style={{ ...getInputStyle(), cursor: 'pointer' }}>
                <option value="">Select a type…</option>
                {typeOptions_final.map(t => (<option key={t.value} value={t.value}>{t.label}</option>))}
              </select>
            )}
          </Field>

          <Field label="Environment" required hint="The deployment environment for this system" isDark={isDark}>
            <select name="environment" value={formData.environment} onChange={handleChange} required style={{ ...getInputStyle(), cursor: 'pointer' }}>
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </Field>

          <div className="group">
            <label className="block text-sm font-semibold mb-2" style={{ color: isDark ? '#e2e8f0' : '#111827' }}>Authentication Method <span className="text-red-500">*</span></label>
            <select name="auth_method" value={formData.auth_method} onChange={(e) => handleAuthMethodChange(e.target.value)} required style={{ ...getInputStyle(), cursor: 'pointer' }}>
              {authMethodOptions.map((method) => (<option key={method.value} value={method.value}>{method.label}</option>))}
            </select>
            <p className="text-xs mt-2 flex items-center gap-1" style={{ color: isDark ? '#64748b' : '#6b7280' }}><span>💡</span><span>Choose the authentication method for your system</span></p>
          </div>

          {isPingFederate(formData.type) && formData.auth_method === 'BearerToken' && (
            <div className="group">
              <label className="block text-sm font-semibold mb-2" style={{ color: isDark ? '#e2e8f0' : '#111827' }}>Engine Port</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" name="engine_port" value={formData.engine_port} onChange={handleChange} placeholder="9031" style={getInputStyle()}
                onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#1e2d45' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <p className="text-xs mt-2 flex items-center gap-1" style={{ color: isDark ? '#64748b' : '#6b7280' }}><span>💡</span><span>Engine port for PingFederate admin API (default: 9031)</span></p>
            </div>
          )}

          {!isDirectory(formData.type) && (
            <Field label="Host / Domain" required hint={hint('host') ?? 'Enter the hostname or domain without the protocol'} isDark={isDark}>
              <input type="text" name="host" value={formData.host} onChange={handleChange} placeholder={ph('host') || 'e.g., api.example.com'} required style={getInputStyle()}
                onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#1e2d45' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </Field>
          )}

          {!isDirectory(formData.type) && (
            <Field label="Port" hint={hint('port') ?? `Default port for this integration is ${integDefaults.port}`} isDark={isDark}>
              <input type="number" name="port" value={formData.port} onChange={handleChange} placeholder={String(integDefaults.port)} min="1" max="65535" style={getInputStyle()}
                onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#1e2d45' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </Field>
          )}

          {renderTypeSpecificFields()}
          {renderAuthFields()}

          <Field label="Description" hint="Optional notes or documentation about this system" isDark={isDark}>
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder={`Add notes about this ${integrationName || 'system'}…`} rows={3} style={{ ...getInputStyle(), resize: 'vertical' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.2)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = isDark ? '#1e2d45' : '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </Field>
        </div>

        <div
          className="flex gap-4 mt-8 2xl:mt-10 pt-6 2xl:pt-8 border-t"
          style={{ borderColor: isDark ? '#1e2d45' : '#f3f4f6' }}
        >
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 px-6 py-3 2xl:px-8 2xl:py-4 rounded-xl text-sm 2xl:text-base font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md transform hover:scale-[1.02]"
            style={{
              background: isDark ? '#111827' : 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
              border: isDark ? '2px solid #1e2d45' : '2px solid #e5e7eb',
              color: isDark ? '#94a3b8' : '#374151',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = isDark ? '#1e2d45' : 'linear-gradient(135deg, #f3f4f6, #e5e7eb)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = isDark ? '#111827' : 'linear-gradient(135deg, #f9fafb, #f3f4f6)'; }}
          >
            <span className="text-lg 2xl:text-xl">🔄</span><span>Reset</span>
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 2xl:px-8 2xl:py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-sm 2xl:text-base font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Saving…' : system ? 'Update System' : 'Create System'}
          </button>
        </div>
      </form>
    </>
  );

  // ─── ANIMATIONS ──────────────────────────────────────────────────────────────
  const animations = (
    <style>{`
      @keyframes blob {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(30px, -50px) scale(1.1); }
        66% { transform: translate(-20px, 20px) scale(0.9); }
      }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes pulse-gentle { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
      .animate-blob { animation: blob 7s infinite; }
      .animation-delay-2000 { animation-delay: 2s; }
      .animation-delay-4000 { animation-delay: 4s; }
      .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
      .animate-slideUp { animation: slideUp 0.5s ease-out; }
      .animate-pulse-gentle { animation: pulse-gentle 2s ease-in-out infinite; }
    `}</style>
  );

  // ─── MODAL MODE ───────────────────────────────────────────────────────────────
  if (isModal) {
    return (
      <>
        {successModal}
        <div
          className="rounded-2xl shadow-2xl overflow-hidden animate-scaleIn w-full"
          style={{
            background: isDark ? '#1a2234' : '#ffffff',
            border: isDark ? '1px solid #1e2d45' : '1px solid #e5e7eb',
          }}
        >
          {formContent}
        </div>
        {animations}
      </>
    );
  }

  // ─── PAGE MODE ────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #0d1117 0%, #0f172a 50%, #0d1117 100%)'
          : 'linear-gradient(135deg, #f9fafb 0%, rgba(250,245,255,0.3) 50%, rgba(238,242,255,0.3) 100%)',
      }}
    >
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"
          style={{ background: isDark ? '#1e1b4b' : '#e9d5ff' }} />
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"
          style={{ background: isDark ? '#1e1b4b' : '#c7d2fe' }} />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"
          style={{ background: isDark ? '#2e1065' : '#ddd6fe' }} />
      </div>

      {successModal}

      {/* RESPONSIVE: tighter padding on lg/xl, original on 2xl; narrower max-w on lg/xl */}
      <div className="relative z-10 flex items-start justify-center min-h-screen p-5 lg:p-8 xl:p-10 2xl:p-14">
        <div className="w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl">
          {onCancel && (
            <button
              onClick={onCancel}
              className="group mb-6 2xl:mb-8 flex items-center gap-2 transition-all duration-300 text-sm 2xl:text-base font-medium"
              style={{ color: isDark ? '#64748b' : '#374151' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = isDark ? '#e2e8f0' : '#111827'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = isDark ? '#64748b' : '#374151'}
            >
              <span className="inline-block transform group-hover:-translate-x-1 transition-transform duration-300">←</span>
              <span>Back</span>
            </button>
          )}
          <div
            className="rounded-2xl shadow-2xl overflow-hidden animate-slideUp"
            style={{
              background: isDark ? '#1a2234' : 'rgba(255,255,255,0.8)',
              border: isDark ? '1px solid #1e2d45' : '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {formContent}
          </div>
        </div>
      </div>

      {animations}
    </div>
  );
};

export default TargetSystemForm;