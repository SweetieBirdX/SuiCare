/**
 * SuiCare Configuration
 * 
 * This file contains configuration settings for the SuiCare application.
 * Update these values according to your environment and requirements.
 */

export interface SuiCareConfig {
  // Sui blockchain configuration
  sui: {
    rpcUrl: string;
    network: 'mainnet' | 'testnet' | 'devnet' | 'local';
  };
  
  // Enoki configuration for zkLogin
  enoki: {
    apiKey: string;
    provider: 'google' | 'facebook' | 'twitch' | 'microsoft';
  };
  
  // Seal configuration for identity-based encryption
  seal: {
    keyDerivation: 'pbkdf2' | 'scrypt' | 'argon2';
    encryptionAlgorithm: 'aes-256-gcm' | 'chacha20-poly1305';
  };
  
  // Walrus configuration for encrypted data storage
  walrus: {
    storageProvider: 'sui' | 'ipfs' | 'arweave';
    compressionEnabled: boolean;
    maxFileSize: number; // in bytes
  };
}

// Default configuration
export const defaultConfig: SuiCareConfig = {
  sui: {
    rpcUrl: 'https://fullnode.testnet.sui.io:443',
    network: 'testnet',
  },
  enoki: {
    apiKey: process.env.ENOKI_API_KEY || '',
    provider: 'google',
  },
  seal: {
    keyDerivation: 'scrypt',
    encryptionAlgorithm: 'aes-256-gcm',
  },
  walrus: {
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
      rpcUrl: 'https://fullnode.devnet.sui.io:443',
      network: 'devnet' as const,
    },
  },
  
  testnet: {
    ...defaultConfig,
    sui: {
      rpcUrl: 'https://fullnode.testnet.sui.io:443',
      network: 'testnet' as const,
    },
  },
  
  mainnet: {
    ...defaultConfig,
    sui: {
      rpcUrl: 'https://fullnode.mainnet.sui.io:443',
      network: 'mainnet' as const,
    },
  },
};

/**
 * Get configuration based on environment
 */
export function getConfig(environment: keyof typeof configs = 'development'): SuiCareConfig {
  return configs[environment];
}
