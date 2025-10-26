/**
 * SuiCare Configuration
 * 
 * This file contains configuration settings for the SuiCare application.
 * Values are loaded from .env.testnet file for Testnet deployment.
 */

export interface SuiCareConfig {
  // Sui blockchain configuration
  sui: {
    rpcUrl: string;
    network: 'mainnet' | 'testnet' | 'devnet' | 'local';
    movePackageId: string;
  };
  
  // Move Contract IDs (from deployment)
  contract: {
    packageId: string;
    healthRegistryId: string;
    masterKeyId: string;
  };
  
  // Enoki configuration for zkLogin
  enoki: {
    apiKey: string;
    clientId: string;
    clientSecret: string;
    provider: 'google' | 'facebook' | 'twitch' | 'microsoft';
  };
  
  // Seal configuration for identity-based encryption
  seal: {
    apiKey: string;
    baseUrl: string;
    encryptionPolicy: string;
  };
  
  // Walrus configuration for encrypted data storage
  walrus: {
    publisherUrl: string;
    apiKey: string;
    maxFileSize: number;
  };
}

// Load environment variables
// For Node.js (backend/scripts)
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // Try process.env first (Node.js / dotenv)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] || defaultValue;
  }
  // For Vite frontend, variables would be injected at build time
  // This is handled during the build process
  return defaultValue;
};

// Parse Seal key servers from JSON string
const parseSealKeyServers = (jsonString: string): string[] => {
  try {
    return JSON.parse(jsonString);
  } catch {
    return [];
  }
};

// Default configuration loaded from .env.testnet
export const defaultConfig: SuiCareConfig = {
  sui: {
    rpcUrl: getEnvVar('VITE_SUI_FULLNODE_URL', 'https://fullnode.testnet.sui.io:443'),
    network: (getEnvVar('VITE_SUI_NETWORK_TYPE', 'testnet') as 'mainnet' | 'testnet' | 'devnet' | 'local'),
    movePackageId: getEnvVar('VITE_MOVE_PACKAGE_ID', '0x2'),
  },
  contract: {
    packageId: getEnvVar('VITE_MOVE_PACKAGE_ID', '0x86ebb7b748ab29230aecde35a6cbd4ffcfe1a6e8e156ef8300ea1097e271b654'),
    healthRegistryId: getEnvVar('VITE_HEALTH_REGISTRY_ID', '0xa73bcfe08eaee4b7f0a0fe0af3a6c799246d8451ae89f138210ebc5d0a6ede62'),
    masterKeyId: getEnvVar('VITE_MASTER_KEY_ID', '0x6b1ca1dbd036c04f8aec2b2e60c60f5f84359ca2d02f98f7fae104632acecc19'),
  },
  enoki: {
    apiKey: getEnvVar('ENOKI_API_KEY', ''),
    clientId: getEnvVar('VITE_ENOKI_CLIENT_ID', 'enoki_public_0e8f38059b082ce8258648da45c14ede'),
    clientSecret: getEnvVar('VITE_ENOKI_CLIENT_SECRET', ''),
    provider: 'google',
  },
  seal: {
    apiKey: getEnvVar('VITE_SEAL_API_KEY', 'YOUR_SEAL_API_KEY_HERE'),
    baseUrl: getEnvVar('VITE_SEAL_BASE_URL', 'https://api.seal.io'),
    encryptionPolicy: getEnvVar('VITE_SEAL_ENCRYPTION_POLICY', 'identity-based'),
  },
  walrus: {
    publisherUrl: getEnvVar('VITE_WALRUS_PUBLISHER_URL', 'https://publisher.walrus-testnet.walrus.space'),
    apiKey: getEnvVar('VITE_WALRUS_API_KEY', 'YOUR_WALRUS_API_KEY_HERE'),
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
};

// Environment-specific configurations
export const configs = {
  development: {
    ...defaultConfig,
    sui: {
      ...defaultConfig.sui,
      rpcUrl: 'https://fullnode.devnet.sui.io:443',
      network: 'devnet' as const,
    },
  },
  
  testnet: {
    ...defaultConfig,
    // Testnet already configured via .env.testnet
  },
  
  mainnet: {
    ...defaultConfig,
    sui: {
      ...defaultConfig.sui,
      rpcUrl: 'https://fullnode.mainnet.sui.io:443',
      network: 'mainnet' as const,
    },
  },
};

/**
 * Get configuration based on environment
 */
export function getConfig(environment: keyof typeof configs = 'testnet'): SuiCareConfig {
  return configs[environment];
}

/**
 * Export current config (defaults to testnet from .env.testnet)
 */
export const currentConfig = getConfig('testnet');
