#!/usr/bin/env ts-node

/**
 * Configuration Verification Script
 * 
 * Verifies that all required environment variables are properly loaded
 * and configuration is complete for Testnet deployment.
 */

// Load .env.testnet file
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.testnet
dotenv.config({ path: path.resolve(__dirname, '../../.env.testnet') });

import { currentConfig, defaultConfig } from '../config';

console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║      🔍 SuiCare Configuration Verification 🔍             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

interface VerificationResult {
  section: string;
  checks: { name: string; status: 'ok' | 'warning' | 'error'; value: string }[];
}

const results: VerificationResult[] = [];

// ============================================================
// 1. Sui Network Configuration
// ============================================================
console.log('\n📡 Sui Network Configuration');
console.log('─'.repeat(60));

const suiChecks = [
  {
    name: 'RPC URL',
    value: currentConfig.sui.rpcUrl,
    expected: 'https://fullnode.testnet.sui.io:443',
  },
  {
    name: 'Network Type',
    value: currentConfig.sui.network,
    expected: 'testnet',
  },
];

const suiResults = suiChecks.map(check => {
  const status: 'ok' | 'warning' | 'error' = check.value === check.expected ? 'ok' : 'warning';
  console.log(`  ${status === 'ok' ? '✅' : '⚠️'}  ${check.name}: ${check.value}`);
  return { name: check.name, status, value: check.value };
});

results.push({ section: 'Sui Network', checks: suiResults });

// ============================================================
// 2. Move Contract IDs
// ============================================================
console.log('\n📦 Move Contract Configuration');
console.log('─'.repeat(60));

const contractChecks = [
  {
    name: 'Package ID',
    value: currentConfig.contract.packageId,
    isValid: currentConfig.contract.packageId.startsWith('0x') && currentConfig.contract.packageId.length === 66,
  },
  {
    name: 'Health Registry ID',
    value: currentConfig.contract.healthRegistryId,
    isValid: currentConfig.contract.healthRegistryId.startsWith('0x') && currentConfig.contract.healthRegistryId.length === 66,
  },
  {
    name: 'Master Key ID',
    value: currentConfig.contract.masterKeyId,
    isValid: currentConfig.contract.masterKeyId.startsWith('0x') && currentConfig.contract.masterKeyId.length === 66,
  },
];

const contractResults = contractChecks.map(check => {
  const status: 'ok' | 'warning' | 'error' = check.isValid ? 'ok' : 'error';
  console.log(`  ${status === 'ok' ? '✅' : '❌'}  ${check.name}`);
  console.log(`      ${check.value}`);
  return { name: check.name, status, value: check.value };
});

results.push({ section: 'Move Contracts', checks: contractResults });

// ============================================================
// 3. Enoki (zkLogin) Configuration
// ============================================================
console.log('\n🔐 Enoki (zkLogin) Configuration');
console.log('─'.repeat(60));

const enokiChecks = [
  {
    name: 'Client ID',
    value: currentConfig.enoki.clientId,
    isValid: currentConfig.enoki.clientId.startsWith('enoki_') && currentConfig.enoki.clientId.length > 10,
  },
  {
    name: 'API Key',
    value: currentConfig.enoki.apiKey || '(not set)',
    isValid: currentConfig.enoki.apiKey.length > 0,
  },
];

const enokiResults = enokiChecks.map(check => {
  const status: 'ok' | 'warning' | 'error' = check.isValid ? 'ok' : 'warning';
  console.log(`  ${status === 'ok' ? '✅' : '⚠️'}  ${check.name}: ${check.value === '(not set)' ? check.value : '***' + check.value.slice(-4)}`);
  return { name: check.name, status, value: check.value };
});

results.push({ section: 'Enoki', checks: enokiResults });

// ============================================================
// 4. Seal Configuration
// ============================================================
console.log('\n🔒 Seal (Encryption) Configuration');
console.log('─'.repeat(60));

const sealChecks = [
  {
    name: 'Key Servers',
    value: currentConfig.seal.keyServers.length > 0 ? currentConfig.seal.keyServers.join(', ') : '(empty)',
    isValid: currentConfig.seal.keyServers.length > 0,
  },
  {
    name: 'Encryption Algorithm',
    value: currentConfig.seal.encryptionAlgorithm,
    isValid: true,
  },
];

const sealResults = sealChecks.map(check => {
  const status: 'ok' | 'warning' | 'error' = check.isValid ? 'ok' : 'warning';
  console.log(`  ${status === 'ok' ? '✅' : '⚠️'}  ${check.name}: ${check.value}`);
  return { name: check.name, status, value: check.value };
});

results.push({ section: 'Seal', checks: sealResults });

// ============================================================
// 5. Walrus Configuration
// ============================================================
console.log('\n🐳 Walrus (Storage) Configuration');
console.log('─'.repeat(60));

const walrusChecks = [
  {
    name: 'System Object ID',
    value: currentConfig.walrus.systemObjectId,
    isValid: currentConfig.walrus.systemObjectId.startsWith('0x') && currentConfig.walrus.systemObjectId.length === 66,
  },
  {
    name: 'Staking Object ID',
    value: currentConfig.walrus.stakingObjectId,
    isValid: currentConfig.walrus.stakingObjectId.startsWith('0x') && currentConfig.walrus.stakingObjectId.length === 66,
  },
  {
    name: 'Publisher URL',
    value: currentConfig.walrus.publisherUrl,
    isValid: currentConfig.walrus.publisherUrl.startsWith('https://'),
  },
  {
    name: 'Aggregator URL',
    value: currentConfig.walrus.aggregatorUrl,
    isValid: currentConfig.walrus.aggregatorUrl.startsWith('https://'),
  },
];

const walrusResults = walrusChecks.map(check => {
  const status: 'ok' | 'warning' | 'error' = check.isValid ? 'ok' : 'error';
  const displayValue = check.value.length > 66 ? check.value : `${check.value.slice(0, 10)}...${check.value.slice(-8)}`;
  console.log(`  ${status === 'ok' ? '✅' : '❌'}  ${check.name}`);
  console.log(`      ${displayValue}`);
  return { name: check.name, status, value: check.value };
});

results.push({ section: 'Walrus', checks: walrusResults });

// ============================================================
// Summary
// ============================================================
console.log('\n' + '═'.repeat(60));
console.log('📊 Verification Summary');
console.log('═'.repeat(60));

let totalChecks = 0;
let passedChecks = 0;
let warningChecks = 0;
let errorChecks = 0;

results.forEach(section => {
  section.checks.forEach(check => {
    totalChecks++;
    if (check.status === 'ok') passedChecks++;
    if (check.status === 'warning') warningChecks++;
    if (check.status === 'error') errorChecks++;
  });
});

console.log(`\nTotal Checks: ${totalChecks}`);
console.log(`  ✅ Passed:   ${passedChecks}`);
console.log(`  ⚠️  Warnings: ${warningChecks}`);
console.log(`  ❌ Errors:   ${errorChecks}`);

// ============================================================
// Action Items
// ============================================================
if (warningChecks > 0 || errorChecks > 0) {
  console.log('\n⚠️  Action Items:');
  console.log('─'.repeat(60));
  
  if (!currentConfig.enoki.apiKey) {
    console.log('  1. Get Enoki API Key from: https://enoki.mystenlabs.com/');
    console.log('     Update .env.testnet: ENOKI_API_KEY=<your_key>');
  }
  
  if (currentConfig.seal.keyServers.length === 0) {
    console.log('  2. Request Seal key server access: https://docs.mystenlabs.com/seal');
    console.log('     Update .env.testnet: VITE_SEAL_KEY_SERVER_URLS=["url1","url2"]');
  }
  
  if (errorChecks > 0) {
    console.log('  3. Fix errors above before proceeding with integration');
  }
}

// ============================================================
// Final Status
// ============================================================
console.log('\n' + '═'.repeat(60));
if (errorChecks === 0 && warningChecks === 0) {
  console.log('✅ Configuration Status: READY FOR INTEGRATION');
} else if (errorChecks === 0) {
  console.log('⚠️  Configuration Status: FUNCTIONAL (with warnings)');
} else {
  console.log('❌ Configuration Status: ERRORS DETECTED');
}
console.log('═'.repeat(60) + '\n');

// Exit with appropriate code
process.exit(errorChecks > 0 ? 1 : 0);

