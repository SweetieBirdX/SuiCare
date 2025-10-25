/**
 * SuiCare Example Usage
 * 
 * This file demonstrates how to use the SuiCare system for healthcare data management.
 */

import { SuiCare } from './index';
import { getConfig } from './config';

async function example() {
  console.log('🏥 SuiCare Healthcare Data Management System');
  console.log('==========================================\n');

  try {
    // Initialize SuiCare with configuration
    const config = getConfig('development');
    const suicare = new SuiCare({
      suiRpcUrl: config.sui.rpcUrl,
      enokiApiKey: config.enoki.apiKey,
    });

    // Initialize the system
    await suicare.initialize();

    console.log('\n📋 Available SDKs:');
    console.log('• Sui Client: Blockchain interaction');
    console.log('• Enoki Client: Passwordless authentication');
    console.log('• Seal Client: Identity-based encryption');
    console.log('• Walrus Client: Encrypted data storage');

    console.log('\n🔐 Security Features:');
    console.log('• Identity-based encryption for patient data');
    console.log('• Zero-knowledge authentication');
    console.log('• Encrypted data storage with integrity proofs');
    console.log('• Blockchain-based access control');

    console.log('\n📁 Project Structure:');
    console.log('• health_record_project/: Move smart contracts');
    console.log('• src/: TypeScript source code');
    console.log('• dist/: Compiled JavaScript output');

    console.log('\n🚀 Next Steps:');
    console.log('1. Implement patient data encryption with Seal SDK');
    console.log('2. Set up encrypted storage with Walrus SDK');
    console.log('3. Create Move smart contracts for data access policies');
    console.log('4. Integrate zkLogin authentication with Enoki SDK');
    console.log('5. Build the frontend interface');

    console.log('\n✅ SuiCare system is ready for development!');

  } catch (error) {
    console.error('❌ Error initializing SuiCare:', error);
    process.exit(1);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  example().catch(console.error);
}

export { example };
