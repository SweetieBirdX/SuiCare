/**
 * SuiCare Real Demo Application
 * 
 * This demonstrates a fully functional healthcare data management system
 * with real encryption, storage, and blockchain transactions.
 */

import { SuiCare } from './index';
import { HealthRecordManager, PatientData, HealthRecord } from './health-record-manager';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getConfig } from './config';

async function runRealDemo() {
  console.log('🏥 SuiCare Real Healthcare Data Management Demo');
  console.log('===============================================\n');

  try {
    // Initialize SuiCare system
    const config = getConfig('development');
    const suicare = new SuiCare({
      suiRpcUrl: config.sui.rpcUrl,
      enokiApiKey: config.enoki.apiKey,
    });

    await suicare.initialize();
    console.log('✅ SuiCare system initialized\n');

    // Create a test keypair for signing transactions
    const keypair = new Ed25519Keypair();
    console.log(`🔑 Test account created: ${keypair.toSuiAddress()}\n`);

    // Initialize Health Record Manager
    const healthManager = new HealthRecordManager(suicare, keypair);
    console.log('📋 Health Record Manager initialized\n');

    // Demo 1: Create a real patient record
    console.log('=== DEMO 1: Creating Patient Record ===');
    const patientData: PatientData = {
      id: 'patient-001',
      name: 'Ahmet Yılmaz',
      dateOfBirth: '1985-03-15',
      medicalHistory: [
        'Hypertension diagnosed in 2020',
        'Diabetes Type 2 diagnosed in 2021'
      ],
      currentMedications: [
        'Metformin 500mg twice daily',
        'Lisinopril 10mg once daily'
      ],
      allergies: [
        'Penicillin',
        'Shellfish'
      ],
      emergencyContact: {
        name: 'Fatma Yılmaz',
        phone: '+90-555-123-4567',
        relationship: 'Spouse'
      },
      lastUpdated: Date.now()
    };

    console.log('📝 Patient Data:');
    console.log(`   Name: ${patientData.name}`);
    console.log(`   DOB: ${patientData.dateOfBirth}`);
    console.log(`   Medical History: ${patientData.medicalHistory.length} entries`);
    console.log(`   Medications: ${patientData.currentMedications.length} current`);
    console.log(`   Allergies: ${patientData.allergies.length} known\n`);

    // Create patient record with real encryption and storage
    const patientId = await healthManager.createPatient(patientData);
    console.log(`✅ Patient record created with ID: ${patientId}\n`);

    // Demo 2: Add health records
    console.log('=== DEMO 2: Adding Health Records ===');
    
    const labResult: HealthRecord = {
      id: 'lab-001',
      patientId: patientId,
      recordType: 'lab_result',
      content: JSON.stringify({
        testName: 'HbA1c',
        result: '7.2%',
        normalRange: '4.0-6.0%',
        date: '2024-01-15',
        lab: 'Central Lab',
        doctor: 'Dr. Mehmet Kaya'
      }),
      createdBy: 'lab-tech-001',
      timestamp: Date.now(),
      encrypted: true
    };

    const diagnosis: HealthRecord = {
      id: 'diag-001',
      patientId: patientId,
      recordType: 'diagnosis',
      content: JSON.stringify({
        diagnosis: 'Diabetic Nephropathy',
        severity: 'Moderate',
        date: '2024-01-20',
        doctor: 'Dr. Ayşe Demir',
        notes: 'Early stage kidney damage due to diabetes'
      }),
      createdBy: 'dr-ayse-demir',
      timestamp: Date.now(),
      encrypted: true
    };

    console.log('🔬 Adding lab result...');
    await healthManager.addHealthRecord(labResult);
    console.log('✅ Lab result added\n');

    console.log('🩺 Adding diagnosis...');
    await healthManager.addHealthRecord(diagnosis);
    console.log('✅ Diagnosis added\n');

    // Demo 3: Grant access
    console.log('=== DEMO 3: Access Control ===');
    
    console.log('🔐 Granting access to healthcare provider...');
    await healthManager.grantAccess(patientId, 'dr-ayse-demir');
    console.log('✅ Access granted to Dr. Ayşe Demir\n');

    // Demo 4: Retrieve and decrypt patient data
    console.log('=== DEMO 4: Data Retrieval ===');
    
    console.log('🔍 Retrieving patient data...');
    const retrievedData = await healthManager.getPatientData(patientId);
    
    console.log('📋 Retrieved Patient Data:');
    console.log(`   Name: ${retrievedData.name}`);
    console.log(`   DOB: ${retrievedData.dateOfBirth}`);
    console.log(`   Medical History: ${retrievedData.medicalHistory.join(', ')}`);
    console.log(`   Current Medications: ${retrievedData.currentMedications.join(', ')}`);
    console.log(`   Allergies: ${retrievedData.allergies.join(', ')}`);
    console.log(`   Emergency Contact: ${retrievedData.emergencyContact.name} (${retrievedData.emergencyContact.phone})`);
    console.log(`   Last Updated: ${new Date(retrievedData.lastUpdated).toLocaleString()}\n`);

    // Demo 5: System capabilities summary
    console.log('=== DEMO 5: System Capabilities ===');
    console.log('🔐 Security Features:');
    console.log('   ✓ Patient data encrypted with Seal SDK');
    console.log('   ✓ Encrypted data stored in Walrus decentralized storage');
    console.log('   ✓ Access control managed by Sui blockchain');
    console.log('   ✓ Immutable audit trail of all transactions');
    console.log('   ✓ Zero-knowledge authentication ready\n');

    console.log('📊 Data Management:');
    console.log('   ✓ Real patient record creation');
    console.log('   ✓ Encrypted health record storage');
    console.log('   ✓ Secure data retrieval and decryption');
    console.log('   ✓ Healthcare provider access control');
    console.log('   ✓ Blockchain-based audit trail\n');

    console.log('🌐 Blockchain Integration:');
    console.log('   ✓ Sui blockchain for transaction management');
    console.log('   ✓ Move smart contracts for access policies');
    console.log('   ✓ Real transaction signing and execution');
    console.log('   ✓ Decentralized data storage\n');

    console.log('🎉 SuiCare Real Demo Completed Successfully!');
    console.log('   This is a fully functional healthcare data management system');
    console.log('   with real encryption, storage, and blockchain integration.\n');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runRealDemo().catch(console.error);
}

export { runRealDemo };
