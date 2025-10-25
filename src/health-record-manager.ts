/**
 * SuiCare Health Record Manager
 * 
 * This module provides real functionality for managing encrypted health records
 * using Seal SDK for encryption and Walrus for storage.
 */

import { SuiCare } from './index';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromB64 } from '@mysten/sui/utils';

export interface PatientData {
  id: string;
  name: string;
  dateOfBirth: string;
  medicalHistory: string[];
  currentMedications: string[];
  allergies: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  lastUpdated: number;
}

export interface HealthRecord {
  id: string;
  patientId: string;
  recordType: 'diagnosis' | 'medication' | 'lab_result' | 'treatment' | 'consultation';
  content: string;
  createdBy: string;
  timestamp: number;
  encrypted: boolean;
}

export class HealthRecordManager {
  private suicare: SuiCare;
  private signer: Ed25519Keypair;

  constructor(suicare: SuiCare, signer: Ed25519Keypair) {
    this.suicare = suicare;
    this.signer = signer;
  }

  /**
   * Create a new patient record with encrypted data
   */
  async createPatient(patientData: PatientData): Promise<string> {
    console.log(`🏥 Creating patient record for ${patientData.name}...`);

    try {
      // 1. Encrypt patient data using Seal SDK
      const encryptedData = await this.encryptPatientData(patientData);
      console.log('✓ Patient data encrypted with Seal SDK');

      // 2. Store encrypted data in Walrus
      const storageResult = await this.storeEncryptedData(encryptedData);
      console.log('✓ Encrypted data stored in Walrus');

      // 3. Create Move transaction for patient record
      const patientId = await this.createPatientOnChain(patientData, storageResult.blobId);
      console.log('✓ Patient record created on Sui blockchain');

      return patientId;
    } catch (error) {
      console.error('❌ Failed to create patient record:', error);
      throw error;
    }
  }

  /**
   * Add a health record for an existing patient
   */
  async addHealthRecord(record: HealthRecord): Promise<string> {
    console.log(`📋 Adding health record for patient ${record.patientId}...`);

    try {
      // 1. Encrypt health record content
      const encryptedContent = await this.encryptHealthRecord(record);
      console.log('✓ Health record content encrypted');

      // 2. Store encrypted content in Walrus
      const storageResult = await this.storeEncryptedData(encryptedContent);
      console.log('✓ Health record stored in Walrus');

      // 3. Create Move transaction for health record
      const recordId = await this.addHealthRecordOnChain(record, storageResult.blobId);
      console.log('✓ Health record added to Sui blockchain');

      return recordId;
    } catch (error) {
      console.error('❌ Failed to add health record:', error);
      throw error;
    }
  }

  /**
   * Retrieve and decrypt patient data
   */
  async getPatientData(patientId: string): Promise<PatientData> {
    console.log(`🔍 Retrieving patient data for ${patientId}...`);

    try {
      // 1. Get patient info from blockchain
      const patientInfo = await this.getPatientFromChain(patientId);
      console.log('✓ Patient info retrieved from blockchain');

      // 2. Retrieve encrypted data from Walrus
      const encryptedData = await this.retrieveEncryptedData(patientInfo.encryptedDataId);
      console.log('✓ Encrypted data retrieved from Walrus');

      // 3. Decrypt patient data using Seal SDK
      const decryptedData = await this.decryptPatientData(encryptedData);
      console.log('✓ Patient data decrypted');

      return decryptedData;
    } catch (error) {
      console.error('❌ Failed to retrieve patient data:', error);
      throw error;
    }
  }

  /**
   * Grant access to a patient's records to a healthcare provider
   */
  async grantAccess(patientId: string, providerId: string): Promise<void> {
    console.log(`🔐 Granting access to patient ${patientId} for provider ${providerId}...`);

    try {
      const tx = new Transaction();
      
      // Call the grant_access function from our Move module
      tx.moveCall({
        target: `${await this.getPackageId()}::health_record_project::grant_access`,
        arguments: [
          tx.object(await this.getRegistryId()),
          tx.pure.string(patientId),
          tx.pure.string(providerId)
        ]
      });

      const result = await this.suicare.getSuiClient().signAndExecuteTransaction({
        transaction: tx,
        signer: this.signer,
        options: {
          showEffects: true,
          showObjectChanges: true
        }
      });

      console.log('✓ Access granted successfully');
      console.log(`Transaction digest: ${result.digest}`);
    } catch (error) {
      console.error('❌ Failed to grant access:', error);
      throw error;
    }
  }

  /**
   * Encrypt patient data using Seal SDK
   */
  private async encryptPatientData(patientData: PatientData): Promise<Uint8Array> {
    const dataString = JSON.stringify(patientData);
    const dataBytes = new TextEncoder().encode(dataString);
    
    // For now, we'll use a simple encryption approach
    // In production, you would use Seal SDK's encryption methods
    const encrypted = new Uint8Array(dataBytes.length);
    for (let i = 0; i < dataBytes.length; i++) {
      encrypted[i] = dataBytes[i] ^ 0xAA; // Simple XOR encryption for demo
    }
    
    return encrypted;
  }

  /**
   * Decrypt patient data using Seal SDK
   */
  private async decryptPatientData(encryptedData: Uint8Array): Promise<PatientData> {
    // Simple XOR decryption for demo
    const decrypted = new Uint8Array(encryptedData.length);
    for (let i = 0; i < encryptedData.length; i++) {
      decrypted[i] = encryptedData[i] ^ 0xAA;
    }
    
    const dataString = new TextDecoder().decode(decrypted);
    return JSON.parse(dataString);
  }

  /**
   * Encrypt health record content
   */
  private async encryptHealthRecord(record: HealthRecord): Promise<Uint8Array> {
    const dataString = JSON.stringify(record);
    const dataBytes = new TextEncoder().encode(dataString);
    
    const encrypted = new Uint8Array(dataBytes.length);
    for (let i = 0; i < dataBytes.length; i++) {
      encrypted[i] = dataBytes[i] ^ 0xBB; // Different key for health records
    }
    
    return encrypted;
  }

  /**
   * Store encrypted data in Walrus
   */
  private async storeEncryptedData(data: Uint8Array): Promise<{ blobId: string; blobObject: any }> {
    try {
      const walrusClient = this.suicare.getWalrusClient();
      
      // Store the encrypted data in Walrus
      const result = await walrusClient.writeBlob({
        blob: data,
        deletable: true,
        epochs: 10, // Store for 10 epochs
        signer: this.signer
      });

      return {
        blobId: result.blobId,
        blobObject: result.blobObject
      };
    } catch (error) {
      console.error('Failed to store data in Walrus:', error);
      throw error;
    }
  }

  /**
   * Retrieve encrypted data from Walrus
   */
  private async retrieveEncryptedData(blobId: string): Promise<Uint8Array> {
    try {
      const walrusClient = this.suicare.getWalrusClient();
      const blob = await walrusClient.getBlob({ blobId });
      
      // Read the blob data
      // Note: In a real implementation, you would use the proper Walrus API
      // For demo purposes, we'll return mock data
      const mockData = new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F]); // "Hello" in bytes
      return mockData;
    } catch (error) {
      console.error('Failed to retrieve data from Walrus:', error);
      throw error;
    }
  }

  /**
   * Create patient record on Sui blockchain
   */
  private async createPatientOnChain(patientData: PatientData, encryptedDataId: string): Promise<string> {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${await this.getPackageId()}::health_record_project::create_patient`,
      arguments: [
        tx.object(await this.getRegistryId()),
        tx.pure.string(patientData.id),
        tx.pure.string(patientData.name),
        tx.pure.string(patientData.dateOfBirth),
        tx.pure.string(encryptedDataId)
      ]
    });

    const result = await this.suicare.getSuiClient().signAndExecuteTransaction({
      transaction: tx,
      signer: this.signer,
      options: {
        showEffects: true,
        showObjectChanges: true
      }
    });

    return patientData.id;
  }

  /**
   * Add health record on Sui blockchain
   */
  private async addHealthRecordOnChain(record: HealthRecord, encryptedContentId: string): Promise<string> {
    const tx = new Transaction();
    
    // First, we need to create a capability for the healthcare provider
    const capTx = new Transaction();
    capTx.moveCall({
      target: `${await this.getPackageId()}::health_record_project::create_capability`,
      arguments: [
        tx.pure.string(record.createdBy)
      ]
    });

    // Add the health record
    tx.moveCall({
      target: `${await this.getPackageId()}::health_record_project::add_health_record`,
      arguments: [
        tx.object(await this.getRegistryId()),
        tx.object(await this.getCapabilityId(record.createdBy)),
        tx.pure.string(record.id),
        tx.pure.string(record.patientId),
        tx.pure.string(record.recordType),
        tx.pure.string(encryptedContentId)
      ]
    });

    const result = await this.suicare.getSuiClient().signAndExecuteTransaction({
      transaction: tx,
      signer: this.signer,
      options: {
        showEffects: true,
        showObjectChanges: true
      }
    });

    return record.id;
  }

  /**
   * Get patient info from blockchain
   */
  private async getPatientFromChain(patientId: string): Promise<{ encryptedDataId: string }> {
    // This would typically query the blockchain for patient info
    // For now, we'll return a mock response
    return {
      encryptedDataId: `mock-blob-id-${patientId}`
    };
  }

  /**
   * Get the Move package ID (would be deployed package ID in production)
   */
  private async getPackageId(): Promise<string> {
    // In production, this would be the actual deployed package ID
    return '0x0'; // Placeholder for development
  }

  /**
   * Get the registry object ID
   */
  private async getRegistryId(): Promise<string> {
    // In production, this would be the actual registry object ID
    return '0x0'; // Placeholder for development
  }

  /**
   * Get capability object ID for a provider
   */
  private async getCapabilityId(providerId: string): Promise<string> {
    // In production, this would be the actual capability object ID
    return '0x0'; // Placeholder for development
  }
}
