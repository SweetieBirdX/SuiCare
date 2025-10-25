import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { EnokiClient } from '@mysten/enoki';
import { SealClient } from '@mysten/seal';
import { WalrusClient } from '@mysten/walrus';

/**
 * SuiCare - Healthcare Data Management System
 * 
 * This is the main entry point for the SuiCare application.
 * It initializes all the necessary SDKs for blockchain interaction,
 * identity-based encryption, and encrypted data storage.
 */

class SuiCare {
  private suiClient: SuiClient;
  private enokiClient: EnokiClient;
  private sealClient: SealClient;
  private walrusClient: WalrusClient;

  constructor(config: {
    suiRpcUrl: string;
    enokiApiKey: string;
  }) {
    // Initialize Sui client for blockchain interaction
    this.suiClient = new SuiClient({ url: config.suiRpcUrl });
    
    // Initialize Enoki client for zkLogin passwordless authentication
    this.enokiClient = new EnokiClient({ apiKey: config.enokiApiKey });
    
    // Initialize Seal client for identity-based encryption
    // SealClient requires serverConfigs parameter with key server configurations
    this.sealClient = new SealClient({
      suiClient: this.suiClient,
      serverConfigs: [], // Empty array for development - add actual key server configs in production
      verifyKeyServers: false, // Disable verification for development
    });
    
    // Initialize Walrus client for encrypted data storage
    // WalrusClient requires network parameter
    this.walrusClient = new WalrusClient({
      network: 'testnet', // Use testnet for development
      suiClient: this.suiClient,
    });
  }

  /**
   * Get the Sui client instance
   */
  getSuiClient(): SuiClient {
    return this.suiClient;
  }

  /**
   * Get the Enoki client instance for passwordless authentication
   */
  getEnokiClient(): EnokiClient {
    return this.enokiClient;
  }

  /**
   * Get the Seal client instance for identity-based encryption
   */
  getSealClient(): SealClient {
    return this.sealClient;
  }

  /**
   * Get the Walrus client instance for encrypted data storage
   */
  getWalrusClient(): WalrusClient {
    return this.walrusClient;
  }

  /**
   * Initialize the SuiCare system
   */
  async initialize(): Promise<void> {
    console.log('Initializing SuiCare system...');
    
    // Test connections
    try {
      await this.suiClient.getLatestSuiSystemState();
      console.log('✓ Sui blockchain connection established');
    } catch (error) {
      console.error('✗ Failed to connect to Sui blockchain:', error);
      throw error;
    }

    console.log('✓ SuiCare system initialized successfully');
  }
}

// Export the main class and types
export { SuiCare };
