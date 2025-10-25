#!/bin/bash

# ============================================================
# SuiCare Wallet Setup Script for Testnet
# ============================================================
# This script helps you set up a Sui wallet for Testnet deployment

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║         🏥 SuiCare Wallet Setup (Testnet) 🏥              ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================
# Check if Sui CLI is installed
# ============================================================

if ! command -v sui &> /dev/null; then
    echo "❌ Sui CLI not found!"
    echo ""
    echo "Install Sui CLI:"
    echo "  cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui"
    echo ""
    echo "Or download from: https://docs.sui.io/guides/developer/getting-started/sui-install"
    exit 1
fi

echo "✅ Sui CLI found: $(sui --version)"
echo ""

# ============================================================
# Check if Walrus CLI is installed
# ============================================================

if ! command -v walrus &> /dev/null; then
    echo "⚠️  Walrus CLI not found (optional for storage)"
    echo ""
    echo "Install Walrus CLI:"
    echo "  cargo install --git https://github.com/MystenLabs/walrus-docs.git walrus"
    echo ""
    WALRUS_INSTALLED=false
else
    echo "✅ Walrus CLI found: $(walrus --version 2>&1 | head -n 1 || echo 'version check failed')"
    WALRUS_INSTALLED=true
fi
echo ""

# ============================================================
# Step 1: Create or Use Existing Address
# ============================================================

echo "════════════════════════════════════════════════════════════"
echo "STEP 1: Sui Address Setup"
echo "════════════════════════════════════════════════════════════"
echo ""

read -p "Do you want to create a NEW address? (y/n): " create_new

if [ "$create_new" = "y" ] || [ "$create_new" = "Y" ]; then
    echo ""
    echo "Creating new Ed25519 address..."
    sui client new-address ed25519
    echo ""
    echo "✅ New address created!"
    echo ""
    echo "⚠️  IMPORTANT: Back up your recovery phrase above!"
    echo ""
else
    echo ""
    echo "Using existing addresses. Run 'sui client addresses' to see them."
fi

echo ""
echo "Current active address:"
sui client active-address
echo ""

ACTIVE_ADDRESS=$(sui client active-address)

# ============================================================
# Step 2: Switch to Testnet
# ============================================================

echo "════════════════════════════════════════════════════════════"
echo "STEP 2: Network Configuration"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "Switching to Testnet..."
sui client switch --env testnet
echo ""
echo "✅ Connected to Testnet"
echo ""

# ============================================================
# Step 3: Request SUI from Faucet
# ============================================================

echo "════════════════════════════════════════════════════════════"
echo "STEP 3: Requesting Testnet SUI"
echo "════════════════════════════════════════════════════════════"
echo ""

read -p "Request SUI from faucet? (y/n): " request_sui

if [ "$request_sui" = "y" ] || [ "$request_sui" = "Y" ]; then
    echo ""
    echo "Requesting SUI from faucet..."
    
    # Try curl first
    echo "Attempting via curl..."
    FAUCET_RESPONSE=$(curl -s --location --request POST 'https://faucet.testnet.sui.io/gas' \
        --header 'Content-Type: application/json' \
        --data-raw "{\"FixedAmountRequest\":{\"recipient\":\"$ACTIVE_ADDRESS\"}}")
    
    echo "Response: $FAUCET_RESPONSE"
    echo ""
    
    # Also try Sui CLI faucet
    echo "Attempting via Sui CLI..."
    sui client faucet --address "$ACTIVE_ADDRESS" || echo "⚠️  CLI faucet request may have failed"
    echo ""
    
    echo "✅ Faucet requests sent!"
    echo ""
    echo "If automatic faucet fails, you can also:"
    echo "  1. Join Sui Discord: https://discord.gg/sui"
    echo "  2. Go to #testnet-faucet channel"
    echo "  3. Type: !faucet $ACTIVE_ADDRESS"
    echo ""
fi

# Wait for balance to update
echo "Waiting 10 seconds for balance to update..."
sleep 10
echo ""

# ============================================================
# Step 4: Check Balance
# ============================================================

echo "════════════════════════════════════════════════════════════"
echo "STEP 4: Checking Balance"
echo "════════════════════════════════════════════════════════════"
echo ""

sui client gas
echo ""

# ============================================================
# Step 5: Get WAL Tokens
# ============================================================

if [ "$WALRUS_INSTALLED" = true ]; then
    echo "════════════════════════════════════════════════════════════"
    echo "STEP 5: Getting WAL Tokens (for Walrus storage)"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    
    read -p "Get WAL tokens? (requires SUI balance) (y/n): " get_wal
    
    if [ "$get_wal" = "y" ] || [ "$get_wal" = "Y" ]; then
        echo ""
        echo "Getting WAL tokens..."
        walrus get-wal --network testnet || echo "⚠️  WAL acquisition failed. Make sure you have SUI balance."
        echo ""
    fi
else
    echo "════════════════════════════════════════════════════════════"
    echo "STEP 5: WAL Tokens (skipped - Walrus CLI not installed)"
    echo "════════════════════════════════════════════════════════════"
    echo ""
fi

# ============================================================
# Step 6: Export Private Key
# ============================================================

echo "════════════════════════════════════════════════════════════"
echo "STEP 6: Export Private Key (for .env.testnet)"
echo "════════════════════════════════════════════════════════════"
echo ""

read -p "Export private key? (SENSITIVE - only do in secure environment) (y/n): " export_key

if [ "$export_key" = "y" ] || [ "$export_key" = "Y" ]; then
    echo ""
    echo "⚠️  WARNING: Your private key will be displayed!"
    echo "   Do NOT share this with anyone!"
    echo ""
    read -p "Press Enter to continue..."
    echo ""
    
    echo "Exporting private key for address: $ACTIVE_ADDRESS"
    sui keytool export --key-identity "$ACTIVE_ADDRESS" --json false
    echo ""
    
    echo "════════════════════════════════════════════════════════════"
    echo "Copy the Base64 private key above to your .env.testnet file:"
    echo "  DEPLOYER_PRIVATE_KEY=<paste_here>"
    echo "  DEPLOYER_SUI_ADDRESS=$ACTIVE_ADDRESS"
    echo "════════════════════════════════════════════════════════════"
    echo ""
fi

# ============================================================
# Summary
# ============================================================

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║                    ✅ Setup Complete!                      ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Your Sui Address: $ACTIVE_ADDRESS"
echo ""
echo "Next Steps:"
echo "  1. Verify your SUI balance: sui client gas"
echo "  2. Update .env.testnet with your private key and address"
echo "  3. Get Enoki API key: https://enoki.mystenlabs.com/"
echo "  4. Request Seal key server access: https://docs.mystenlabs.com/seal"
echo "  5. Run deployment: npm run deploy:testnet"
echo ""
echo "════════════════════════════════════════════════════════════"

