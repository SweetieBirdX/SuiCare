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
    provider: 'google' | 'facebook' | 'twitch' | 'microsoft';
  };
  
  // Seal configuration for identity-based encryption
  seal: {
    keyDerivation: 'pbkdf2' | 'scrypt' | 'argon2';
    encryptionAlgorithm: 'aes-256-gcm' | 'chacha20-poly1305';
    keyServers: string[]; // Seal key server URLs
  };
  
  // Walrus configuration for encrypted data storage
  walrus: {
    systemObjectId: string;
    stakingObjectId: string;
    publisherUrl: string;
    aggregatorUrl: string;
    storageProvider: 'sui' | 'ipfs' | 'arweave';
    compressionEnabled: boolean;
    maxFileSize: number; // in bytes
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
  },
  contract: {
    packageId: getEnvVar('VITE_MOVE_PACKAGE_ID', '0x86ebb7b748ab29230aecde35a6cbd4ffcfe1a6e8e156ef8300ea1097e271b654'),
    healthRegistryId: getEnvVar('VITE_HEALTH_REGISTRY_ID', '0xa73bcfe08eaee4b7f0a0fe0af3a6c799246d8451ae89f138210ebc5d0a6ede62'),
    masterKeyId: getEnvVar('VITE_MASTER_KEY_ID', '0x6b1ca1dbd036c04f8aec2b2e60c60f5f84359ca2d02f98f7fae104632acecc19'),
  },
  enoki: {
    apiKey: getEnvVar('ENOKI_API_KEY', ''),
    clientId: getEnvVar('VITE_ENOKI_CLIENT_ID', 'enoki_public_0e8f38059b082ce8258648da45c14ede'),
    provider: 'google',
  },
  seal: {
    keyDerivation: 'scrypt',
    encryptionAlgorithm: 'aes-256-gcm',
    keyServers: parseSealKeyServers(
      getEnvVar('VITE_SEAL_KEY_SERVER_URLS', '[]')
    ),
  },
  walrus: {
    systemObjectId: getEnvVar('VITE_WALRUS_SYSTEM_OBJECT_ID', '0x6c2547cbbc38025cf3adac45f63cb0a8d12ecf777cdc75a4971612bf97fdf6af'),
    stakingObjectId: getEnvVar('VITE_WALRUS_STAKING_OBJECT_ID', '0xbe46180321c30aab2f8b3501e24048377287fa708018a5b7c2792b35fe339ee3'),
    publisherUrl: getEnvVar('VITE_WALRUS_PUBLISHER_URL', 'https://publisher.walrus-testnet.walrus.space'),
    aggregatorUrl: getEnvVar('VITE_WALRUS_AGGREGATOR_URL', 'https://aggregator.walrus-testnet.walrus.space'),
    storageProvider: 'sui',
    compressionEnabled: true,
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
