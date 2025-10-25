# SuiCare - Healthcare Data Management on Sui Blockchain

SuiCare is a decentralized healthcare data management system built on the Sui blockchain, utilizing identity-based encryption and secure data storage.

## Features

- **Identity-based Encryption**: Using Mysten Seal SDK for secure patient data encryption
- **Decentralized Storage**: Leveraging Walrus for cost-effective, high-performance encrypted data storage
- **Passwordless Authentication**: zkLogin integration for seamless user experience
- **Patient Data NFTs**: Move-based smart contracts for patient data objects and access policies

## Architecture

### SDKs Used

- `@mysten/sui`: Core Sui blockchain interaction
- `@mysten/enoki`: zkLogin passwordless wallet integration
- `@mysten/seal`: Identity-based encryption for patient data
- `@mysten/walrus`: Encrypted data storage and retrieval

### Move Modules

- `health_record_project`: Core Move smart contracts for patient data management

## Installation

```bash
npm install
```

## Development

```bash
# Build Move contracts
sui move build

# Test Move contracts
sui move test

# Start development server
npm run dev
```

## Project Structure

```
SuiCare/
├── health_record_project/     # Move smart contracts
│   ├── Move.toml
│   ├── sources/
│   └── tests/
├── src/                      # TypeScript/JavaScript source code
├── package.json
└── README.md
```

## Security

This project implements multiple layers of security:
- Identity-based encryption for data protection
- Blockchain-based access control
- Zero-knowledge authentication
- Encrypted data storage with proof of integrity
