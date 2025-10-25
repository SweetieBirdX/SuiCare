#!/usr/bin/env ts-node

/**
 * Enoki zkLogin Integration Test
 * 
 * Tests Enoki authentication flow and verifies configuration.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.testnet') });

import { EnokiManager, type OAuthProvider } from '../enoki-integration';
import { currentConfig } from '../config';

console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║         🔐 Enoki zkLogin Integration Test 🔐              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

// ============================================================
// Configuration Check
// ============================================================

console.log('\n📋 Configuration Check');
console.log('─'.repeat(60));

console.log(`  Enoki Client ID: ${currentConfig.enoki.clientId}`);
console.log(`  Enoki API Key: ${currentConfig.enoki.apiKey ? '***' + currentConfig.enoki.apiKey.slice(-4) : '(not set)'}`);
console.log(`  Sui Network: ${currentConfig.sui.network}`);
console.log(`  Sui RPC: ${currentConfig.sui.rpcUrl}`);

if (!currentConfig.enoki.apiKey || currentConfig.enoki.apiKey === 'YOUR_ENOKI_API_KEY_HERE') {
  console.log('\n❌ ERROR: Enoki API Key not configured!');
  console.log('   Get your API key from: https://enoki.mystenlabs.com/');
  console.log('   Then update .env.testnet: ENOKI_API_KEY=<your_key>');
  process.exit(1);
}

// ============================================================
// Initialize Enoki Manager
// ============================================================

let enokiManager: EnokiManager;

try {
  enokiManager = new EnokiManager();
  console.log('\n✅ Enoki Manager initialized successfully');
} catch (error) {
  console.error('\n❌ Failed to initialize Enoki Manager:', error);
  process.exit(1);
}

// ============================================================
// Check Existing Session
// ============================================================

console.log('\n🔍 Checking for existing session...');
console.log('─'.repeat(60));

const existingSession = enokiManager.getSession();

if (existingSession) {
  console.log('✅ Active session found!');
  console.log(`   Address: ${existingSession.address}`);
  console.log(`   Provider: ${existingSession.provider}`);
  console.log(`   Expires: ${new Date(existingSession.expiresAt).toLocaleString()}`);
  
  // Get user balance
  enokiManager.getUserBalance().then(balance => {
    console.log(`   Balance: ${balance} SUI`);
  });
  
  // Show session management options
  showSessionMenu();
} else {
  console.log('ℹ️  No active session');
  console.log('   You need to authenticate first');
  
  // Show authentication options
  showAuthMenu();
}

// ============================================================
// Menu Functions
// ============================================================

function showAuthMenu() {
  console.log('\n📱 Authentication Options:');
  console.log('─'.repeat(60));
  console.log('  1. Sign in with Google');
  console.log('  2. Sign in with Facebook');
  console.log('  3. Sign in with Twitch');
  console.log('  4. Sign in with Apple');
  console.log('  5. Manual callback (if you have auth code)');
  console.log('  0. Exit');
  console.log('');
  
  promptUser('Select an option (0-5): ', async (choice) => {
    switch (choice) {
      case '1':
        await startAuth('google');
        break;
      case '2':
        await startAuth('facebook');
        break;
      case '3':
        await startAuth('twitch');
        break;
      case '4':
        await startAuth('apple');
        break;
      case '5':
        await manualCallback();
        break;
      case '0':
        console.log('\n👋 Goodbye!');
        process.exit(0);
        break;
      default:
        console.log('❌ Invalid choice');
        showAuthMenu();
    }
  });
}

function showSessionMenu() {
  console.log('\n🔑 Session Management:');
  console.log('─'.repeat(60));
  console.log('  1. View user profile');
  console.log('  2. Get zkLogin proof');
  console.log('  3. Check balance');
  console.log('  4. Sign out');
  console.log('  0. Exit');
  console.log('');
  
  promptUser('Select an option (0-4): ', async (choice) => {
    switch (choice) {
      case '1':
        await viewProfile();
        break;
      case '2':
        await getProof();
        break;
      case '3':
        await checkBalance();
        break;
      case '4':
        signOut();
        break;
      case '0':
        console.log('\n👋 Goodbye!');
        process.exit(0);
        break;
      default:
        console.log('❌ Invalid choice');
        showSessionMenu();
    }
  });
}

// ============================================================
// Action Functions
// ============================================================

async function startAuth(provider: OAuthProvider) {
  try {
    console.log(`\n🔐 Starting authentication with ${provider}...`);
    console.log('─'.repeat(60));
    
    // Generate auth URL (this would redirect in browser)
    await enokiManager.startAuthentication(provider, 'http://localhost:3000/callback');
    
    console.log('\n✅ Authorization URL created');
    console.log('\n⚠️  In a real application, you would be redirected to the OAuth provider.');
    console.log('   After authentication, you\'ll receive an authorization code.');
    console.log('\n💡 For testing, use option 5 to manually input the auth code.');
    
    setTimeout(() => showAuthMenu(), 2000);
  } catch (error) {
    console.error('\n❌ Authentication failed:', error);
    setTimeout(() => showAuthMenu(), 2000);
  }
}

async function manualCallback() {
  console.log('\n🔑 Manual Callback');
  console.log('─'.repeat(60));
  console.log('   Enter the authorization code from OAuth callback:');
  console.log('');
  
  promptUser('Auth Code: ', async (code) => {
    if (!code || code.length < 10) {
      console.log('❌ Invalid authorization code');
      setTimeout(() => showAuthMenu(), 1000);
      return;
    }
    
    try {
      console.log('\n⏳ Processing callback...');
      const profile = await enokiManager.handleCallback(code);
      
      console.log('\n✅ Authentication successful!');
      console.log(`   Sui Address: ${profile.suiAddress}`);
      console.log(`   Provider: ${profile.provider}`);
      
      setTimeout(() => showSessionMenu(), 2000);
    } catch (error) {
      console.error('\n❌ Callback failed:', error);
      setTimeout(() => showAuthMenu(), 2000);
    }
  });
}

async function viewProfile() {
  console.log('\n👤 User Profile');
  console.log('─'.repeat(60));
  
  try {
    const profile = await enokiManager.getUserProfile();
    if (profile) {
      console.log(`  Address: ${profile.suiAddress}`);
      console.log(`  Provider: ${profile.provider}`);
      console.log(`  Created: ${new Date(profile.createdAt).toLocaleString()}`);
    }
  } catch (error) {
    console.error('❌ Failed to load profile:', error);
  }
  
  setTimeout(() => showSessionMenu(), 2000);
}

async function getProof() {
  console.log('\n🔐 zkLogin Proof');
  console.log('─'.repeat(60));
  
  try {
    const proof = await enokiManager.getZkLoginProof();
    console.log(`  Proof Length: ${proof.length} bytes`);
    console.log(`  Proof (hex): 0x${Buffer.from(proof).toString('hex').slice(0, 32)}...`);
  } catch (error) {
    console.error('❌ Failed to get proof:', error);
  }
  
  setTimeout(() => showSessionMenu(), 2000);
}

async function checkBalance() {
  console.log('\n💰 SUI Balance');
  console.log('─'.repeat(60));
  
  try {
    const balance = await enokiManager.getUserBalance();
    console.log(`  Balance: ${balance} SUI`);
  } catch (error) {
    console.error('❌ Failed to check balance:', error);
  }
  
  setTimeout(() => showSessionMenu(), 2000);
}

function signOut() {
  console.log('\n👋 Signing Out');
  console.log('─'.repeat(60));
  
  enokiManager.signOut();
  console.log('✅ Signed out successfully');
  
  setTimeout(() => showAuthMenu(), 1000);
}

// ============================================================
// Utility Functions
// ============================================================

function promptUser(question: string, callback: (answer: string) => void) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question(question, (answer) => {
    rl.close();
    callback(answer.trim());
  });
}

