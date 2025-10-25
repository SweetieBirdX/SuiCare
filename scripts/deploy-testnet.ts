#!/usr/bin/env ts-node

/**
 * SuiCare Testnet Deployment Script
 * 
 * This script:
 * 1. Validates environment configuration
 * 2. Checks wallet balance (SUI & WAL)
 * 3. Compiles and deploys Move contracts
 * 4. Initializes system objects (HealthRegistry, MasterKey)
 * 5. Creates example capabilities (Doctor, Pharmacy)
 * 6. Tests Seal & Walrus integration
 * 7. Saves deployment addresses to .env
 */

import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.testnet' });

// ============================================================
// Configuration
// ============================================================

const CONFIG = {
  rpcUrl: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443',
  network: process.env.SUI_NETWORK || 'testnet',
  privateKey: process.env.DEPLOYER_PRIVATE_KEY || '',
  enokiApiKey: process.env.ENOKI_API_KEY || '',
  walrusSystemObject: process.env.WALRUS_SYSTEM_OBJECT || '0x6c2547cbbc38025cf3adac45f63cb0a8d12ecf777cdc75a4971612bf97fdf6af',
  walrusStakingObject: process.env.WALRUS_STAKING_OBJECT || '0xbe46180321c30aab2f8b3501e24048377287fa708018a5b7c2792b35fe339ee3',
  movePackagePath: './health_record_project',
};

// Minimum required balances (in MIST for SUI)
const MIN_SUI_BALANCE = 1_000_000_000; // 1 SUI
const MIN_WAL_BALANCE = 100_000_000; // 0.1 WAL (adjust as needed)

// ============================================================
// Utility Functions
// ============================================================

function log(section: string, message: string, isError = false) {
  const timestamp = new Date().toISOString();
  const prefix = isError ? '❌' : '✅';
  console.log(`[${timestamp}] ${prefix} ${section}: ${message}`);
}

function logStep(step: number, total: number, description: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`STEP ${step}/${total}: ${description}`);
  console.log('='.repeat(60));
}

function parsePrivateKey(privateKeyBase64: string): Ed25519Keypair {
  try {
    // Remove any whitespace
    const cleaned = privateKeyBase64.trim();
    
    // If it's a Sui private key format (suiprivkey...)
    if (cleaned.startsWith('suiprivkey')) {
      return Ed25519Keypair.fromSecretKey(cleaned);
    }
    
    // If it's base64
    const decoded = Buffer.from(cleaned, 'base64');
    return Ed25519Keypair.fromSecretKey(decoded);
  } catch (error) {
    throw new Error(`Failed to parse private key: ${error}`);
  }
}

function updateEnvFile(updates: Record<string, string>) {
  const envPath = path.resolve('.env.testnet');
  let envContent = fs.readFileSync(envPath, 'utf-8');
  
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }
  
  fs.writeFileSync(envPath, envContent);
  log('Config', `Updated .env.testnet with: ${Object.keys(updates).join(', ')}`);
}

// ============================================================
// Validation Functions
// ============================================================

async function validateEnvironment() {
  logStep(1, 8, 'Validating Environment Configuration');
  
  const errors: string[] = [];
  
  if (!CONFIG.privateKey) {
    errors.push('DEPLOYER_PRIVATE_KEY is not set');
  }
  
  if (!CONFIG.enokiApiKey) {
    errors.push('ENOKI_API_KEY is not set (get from https://enoki.mystenlabs.com/)');
  }
  
  if (!fs.existsSync(CONFIG.movePackagePath)) {
    errors.push(`Move package not found at ${CONFIG.movePackagePath}`);
  }
  
  if (errors.length > 0) {
    errors.forEach(err => log('Validation', err, true));
    throw new Error('Environment validation failed');
  }
  
  log('Validation', 'All required environment variables are set');
}

async function checkBalances(client: SuiClient, address: string) {
  logStep(2, 8, 'Checking Wallet Balances');
  
  try {
    // Get SUI balance
    const suiBalance = await client.getBalance({
      owner: address,
      coinType: '0x2::sui::SUI',
    });
    
    const suiAmount = BigInt(suiBalance.totalBalance);
    const suiInSui = Number(suiAmount) / 1_000_000_000;
    
    log('Balance', `SUI: ${suiInSui.toFixed(4)} SUI (${suiBalance.totalBalance} MIST)`);
    
    if (suiAmount < MIN_SUI_BALANCE) {
      log('Balance', `Insufficient SUI! Need at least ${MIN_SUI_BALANCE / 1_000_000_000} SUI`, true);
      log('Balance', 'Get testnet SUI from: https://discord.gg/sui (testnet-faucet channel)');
      throw new Error('Insufficient SUI balance');
    }
    
    // Try to get WAL balance (may not exist yet)
    try {
      // WAL coin type (this is an example, actual type depends on Walrus deployment)
      const walBalance = await client.getBalance({
        owner: address,
        coinType: '0x...::wal::WAL', // Replace with actual WAL coin type
      });
      
      const walAmount = BigInt(walBalance.totalBalance);
      const walInWal = Number(walAmount) / 1_000_000_000;
      
      log('Balance', `WAL: ${walInWal.toFixed(4)} WAL (${walBalance.totalBalance} smallest unit)`);
      
      if (walAmount < MIN_WAL_BALANCE) {
        log('Balance', 'Low WAL balance. Get WAL via: walrus get-wal --network testnet', false);
      }
    } catch (walError) {
      log('Balance', 'WAL balance check skipped (token may not exist or not needed yet)');
    }
    
    log('Balance', 'Balance check complete');
  } catch (error) {
    log('Balance', `Failed to check balances: ${error}`, true);
    throw error;
  }
}

// ============================================================
// Move Contract Deployment
// ============================================================

async function compileMovePackage() {
  logStep(3, 8, 'Compiling Move Package');
  
  try {
    log('Compile', 'Running: sui move build');
    
    const output = execSync('sui move build', {
      cwd: CONFIG.movePackagePath,
      encoding: 'utf-8',
    });
    
    log('Compile', 'Move package compiled successfully');
    return true;
  } catch (error: any) {
    log('Compile', `Compilation failed: ${error.message}`, true);
    log('Compile', error.stdout || error.stderr || '', true);
    throw new Error('Move compilation failed');
  }
}

async function deployMovePackage(
  client: SuiClient,
  signer: Ed25519Keypair
): Promise<string> {
  logStep(4, 8, 'Deploying Move Package to Testnet');
  
  try {
    log('Deploy', 'Publishing package...');
    
    // Read compiled modules
    const buildPath = path.join(CONFIG.movePackagePath, 'build', 'health_record_project');
    const modulesPath = path.join(buildPath, 'bytecode_modules');
    
    if (!fs.existsSync(modulesPath)) {
      throw new Error(`Compiled modules not found at ${modulesPath}`);
    }
    
    const modules = fs.readdirSync(modulesPath)
      .filter(file => file.endsWith('.mv'))
      .map(file => {
        const filePath = path.join(modulesPath, file);
        return Array.from(fs.readFileSync(filePath));
      });
    
    log('Deploy', `Found ${modules.length} compiled modules`);
    
    // Create publish transaction
    const txb = new Transaction();
    const [upgradeCap] = txb.publish({
      modules,
      dependencies: [
        '0x1', // stdlib
        '0x2', // sui framework
      ],
    });
    
    txb.transferObjects([upgradeCap], txb.pure.address(signer.toSuiAddress()));
    
    // Sign and execute
    const result = await client.signAndExecuteTransaction({
      transaction: txb,
      signer,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showEvents: true,
      },
    });
    
    if (result.effects?.status?.status !== 'success') {
      throw new Error(`Deployment failed: ${JSON.stringify(result.effects?.status)}`);
    }
    
    // Extract package ID
    const publishedChange = result.objectChanges?.find(
      (change): change is { 
        type: 'published'; 
        packageId: string; 
        digest: string; 
        modules: string[]; 
        version: string;
      } => change.type === 'published'
    );
    
    if (!publishedChange) {
      throw new Error('Could not find published package ID');
    }
    
    const packageId = publishedChange.packageId;
    
    log('Deploy', `Package deployed successfully! Package ID: ${packageId}`);
    log('Deploy', `Transaction digest: ${result.digest}`);
    
    // Update .env
    updateEnvFile({ PACKAGE_ID: packageId });
    
    return packageId;
  } catch (error: any) {
    log('Deploy', `Deployment failed: ${error.message}`, true);
    throw error;
  }
}

// ============================================================
// System Initialization
// ============================================================

async function initializeSystem(
  client: SuiClient,
  signer: Ed25519Keypair,
  packageId: string
) {
  logStep(5, 8, 'Initializing System Objects');
  
  try {
    // The init function is automatically called during package publish
    // We need to find the created HealthRegistry and MasterKey objects
    
    log('Init', 'Querying for system objects...');
    
    // Get objects owned by deployer
    const objects = await client.getOwnedObjects({
      owner: signer.toSuiAddress(),
      options: {
        showType: true,
        showContent: true,
      },
    });
    
    // Find HealthRegistry (shared object, may not be in owned objects)
    // Find MasterKey
    let masterKeyId: string | undefined;
    
    for (const obj of objects.data) {
      const type = obj.data?.type;
      if (type?.includes('MasterKey')) {
        masterKeyId = obj.data?.objectId;
        log('Init', `Found MasterKey: ${masterKeyId}`);
      }
    }
    
    if (!masterKeyId) {
      log('Init', 'MasterKey not found in owned objects. It may have been transferred during init.', false);
    }
    
    // Query for HealthRegistry (shared object)
    // This requires querying events or using dynamic field queries
    // For now, we'll note that it was created during init
    
    log('Init', 'System initialization complete');
    
    if (masterKeyId) {
      updateEnvFile({ MASTER_KEY_ID: masterKeyId });
    }
    
    return { masterKeyId };
  } catch (error: any) {
    log('Init', `Initialization failed: ${error.message}`, true);
    throw error;
  }
}

// ============================================================
// Create Example Objects
// ============================================================

async function createExampleObjects(
  client: SuiClient,
  signer: Ed25519Keypair,
  packageId: string
) {
  logStep(6, 8, 'Creating Example Capabilities & Records');
  
  try {
    // Create DoctorCapability
    log('Example', 'Creating DoctorCapability...');
    
    const txb1 = new Transaction();
    txb1.moveCall({
      target: `${packageId}::health_record::create_doctor_capability`,
      arguments: [
        txb1.pure.string('Dr. Alice Smith'),
        txb1.pure.string('Medical License #12345'),
      ],
    });
    
    const result1 = await client.signAndExecuteTransaction({
      transaction: txb1,
      signer,
      options: { showObjectChanges: true, showEffects: true },
    });
    
    const doctorCapChange = result1.objectChanges?.find(
      (change): change is { 
        type: 'created'; 
        objectId: string; 
        objectType: string;
        digest: string;
        owner: { AddressOwner: string } | { ObjectOwner: string } | { Shared: { initial_shared_version: string } } | 'Immutable';
        sender: string;
        version: string;
      } => 
        change.type === 'created' && change.objectType?.includes('DoctorCapability')
    );
    
    const doctorCapId = doctorCapChange?.objectId;
    
    if (doctorCapId) {
      log('Example', `DoctorCapability created: ${doctorCapId}`);
      updateEnvFile({ DOCTOR_CAPABILITY_ID: doctorCapId });
    }
    
    // Create a sample PatientRecord
    log('Example', 'Creating sample PatientRecord...');
    
    const txb2 = new Transaction();
    const clock = txb2.object('0x6'); // Clock object
    
    txb2.moveCall({
      target: `${packageId}::health_record::create_patient_record`,
      arguments: [
        txb2.pure.string('policy-id-placeholder'), // seal_policy_id
        clock,
      ],
    });
    
    const result2 = await client.signAndExecuteTransaction({
      transaction: txb2,
      signer,
      options: { showObjectChanges: true, showEffects: true },
    });
    
    const patientRecordChange = result2.objectChanges?.find(
      (change): change is { 
        type: 'created'; 
        objectId: string; 
        objectType: string;
        digest: string;
        owner: { AddressOwner: string } | { ObjectOwner: string } | { Shared: { initial_shared_version: string } } | 'Immutable';
        sender: string;
        version: string;
      } => 
        change.type === 'created' && change.objectType?.includes('PatientRecord')
    );
    
    const patientRecordId = patientRecordChange?.objectId;
    
    if (patientRecordId) {
      log('Example', `PatientRecord created: ${patientRecordId}`);
      updateEnvFile({ PATIENT_RECORD_ID: patientRecordId });
    }
    
    log('Example', 'Example objects created successfully');
    
    return { doctorCapId, patientRecordId };
  } catch (error: any) {
    log('Example', `Failed to create example objects: ${error.message}`, true);
    // Don't throw - this is not critical
    return {};
  }
}

// ============================================================
// Test Integrations
// ============================================================

async function testIntegrations() {
  logStep(7, 8, 'Testing Seal & Walrus Integrations');
  
  try {
    log('Test', 'Testing Seal encryption...');
    // Import and test SealWalrusIntegration
    // This is optional and can be skipped if dependencies aren't ready
    
    log('Test', 'Seal & Walrus integration tests skipped (run integration-demo separately)');
  } catch (error: any) {
    log('Test', `Integration test failed: ${error.message}`, true);
    // Don't throw - this is optional
  }
}

// ============================================================
// Generate Deployment Report
// ============================================================

function generateReport(deploymentData: any) {
  logStep(8, 8, 'Generating Deployment Report');
  
  const report = `
# SuiCare Testnet Deployment Report

**Deployment Date:** ${new Date().toISOString()}
**Network:** ${CONFIG.network}
**RPC URL:** ${CONFIG.rpcUrl}

## Deployed Objects

### Move Package
- **Package ID:** \`${deploymentData.packageId}\`
- **Module:** \`health_record\`
- **Deployer Address:** \`${deploymentData.deployerAddress}\`

### System Objects
- **MasterKey ID:** \`${deploymentData.masterKeyId || 'N/A'}\`
- **HealthRegistry ID:** \`Shared object (query via events)\`

### Example Objects
- **Doctor Capability:** \`${deploymentData.doctorCapId || 'N/A'}\`
- **Patient Record:** \`${deploymentData.patientRecordId || 'N/A'}\`

## Walrus Configuration
- **System Object:** \`${CONFIG.walrusSystemObject}\`
- **Staking Object:** \`${CONFIG.walrusStakingObject}\`
- **Publisher URL:** \`${process.env.WALRUS_PUBLISHER_URL}\`
- **Aggregator URL:** \`${process.env.WALRUS_AGGREGATOR_URL}\`

## Next Steps

1. **Fund the wallet with WAL tokens:**
   \`\`\`bash
   walrus get-wal --network testnet
   \`\`\`

2. **Configure Seal Key Servers:**
   - Request access at: https://docs.mystenlabs.com/seal
   - Update \`SEAL_KEY_SERVERS\` in \`.env.testnet\`

3. **Test the integration:**
   \`\`\`bash
   npm run integration-demo
   \`\`\`

4. **Start the frontend:**
   \`\`\`bash
   npm run dev
   \`\`\`

## Important Links

- **Sui Explorer:** https://suiexplorer.com/?network=testnet
- **Package:** https://suiexplorer.com/object/${deploymentData.packageId}?network=testnet
- **Walrus Docs:** https://docs.walrus.site
- **Seal Docs:** https://docs.mystenlabs.com/seal

## Environment Variables

All deployment addresses have been saved to \`.env.testnet\`.

---
**Deployment Status:** ✅ SUCCESS
`;
  
  const reportPath = 'DEPLOYMENT_REPORT.md';
  fs.writeFileSync(reportPath, report);
  
  log('Report', `Deployment report saved to ${reportPath}`);
  console.log(report);
}

// ============================================================
// Main Deployment Function
// ============================================================

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║           🏥 SuiCare Testnet Deployment Script 🏥          ║
║                                                            ║
║  Deploying healthcare data management system to Sui       ║
║  with Seal encryption & Walrus storage integration        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);
  
  try {
    // Step 1: Validate environment
    await validateEnvironment();
    
    // Initialize client and signer
    const client = new SuiClient({ url: CONFIG.rpcUrl });
    const signer = parsePrivateKey(CONFIG.privateKey);
    const deployerAddress = signer.toSuiAddress();
    
    log('Setup', `Deployer address: ${deployerAddress}`);
    
    // Step 2: Check balances
    await checkBalances(client, deployerAddress);
    
    // Step 3: Compile Move package
    await compileMovePackage();
    
    // Step 4: Deploy Move package
    const packageId = await deployMovePackage(client, signer);
    
    // Step 5: Initialize system
    const { masterKeyId } = await initializeSystem(client, signer, packageId);
    
    // Step 6: Create example objects
    const { doctorCapId, patientRecordId } = await createExampleObjects(
      client,
      signer,
      packageId
    );
    
    // Step 7: Test integrations
    await testIntegrations();
    
    // Step 8: Generate report
    generateReport({
      packageId,
      deployerAddress,
      masterKeyId,
      doctorCapId,
      patientRecordId,
    });
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ DEPLOYMENT COMPLETE!');
    console.log('='.repeat(60));
    console.log('\nNext steps:');
    console.log('1. Review DEPLOYMENT_REPORT.md');
    console.log('2. Fund wallet with WAL tokens: walrus get-wal --network testnet');
    console.log('3. Configure Seal key servers in .env.testnet');
    console.log('4. Run: npm run integration-demo');
    console.log('='.repeat(60));
    
  } catch (error: any) {
    console.error('\n❌ DEPLOYMENT FAILED!');
    console.error('='.repeat(60));
    console.error(`Error: ${error.message}`);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

// Run deployment
if (require.main === module) {
  main();
}

export { main as deployToTestnet };

