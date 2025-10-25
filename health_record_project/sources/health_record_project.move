/// Module: health_record_project
/// SuiCare Health Record Management System
/// 
/// This module provides comprehensive healthcare data management with:
/// - Role-Based Access Control (RBAC)
/// - Seal encryption policy integration
/// - Walrus storage references
/// - Emergency access with MasterKey
/// - Immutable audit trail
/// - ZK-proof verification for healthcare providers
module health_record_project::health_record {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use std::string::{Self, String};
    use std::vector;
    use sui::table::{Self, Table};
    use sui::clock::{Self, Clock};

    // ===== Error Constants =====
    
    const E_NOT_AUTHORIZED: u64 = 0;
    const E_PATIENT_NOT_FOUND: u64 = 1;
    const E_RECORD_NOT_FOUND: u64 = 2;
    const E_INVALID_ACCESS: u64 = 3;
    const E_NOT_DOCTOR: u64 = 4;
    const E_NOT_PATIENT: u64 = 5;
    const E_ALREADY_HAS_ACCESS: u64 = 6;
    const E_INVALID_MASTER_KEY: u64 = 7;
    const E_EMERGENCY_ONLY: u64 = 8;
    const E_IMMUTABLE_RECORD: u64 = 9;

    // ===== Role Structs =====

    /// Doctor capability with ZK-proof verification
    public struct DoctorCapability has key, store {
        id: UID,
        doctor_address: address,
        license_number: String,
        specialization: String,
        hospital: String,
        verified: bool,
        issued_at: u64,
    }

    /// Pharmacy capability
    public struct PharmacyCapability has key, store {
        id: UID,
        pharmacy_address: address,
        license_number: String,
        name: String,
        verified: bool,
    }

    /// Emergency access master key
    public struct MasterKey has key, store {
        id: UID,
        authorized_address: address,
        valid_until: u64,
        emergency_only: bool,
    }

    // ===== Data Structs =====

    /// Patient health record with RBAC and Seal/Walrus integration
    public struct PatientRecord has key, store {
        id: UID,
        patient_address: address,
        
        // Walrus references to encrypted data (immutable history)
        encrypted_walrus_references: vector<WalrusReference>,
        
        // Seal encryption policy ID (on-chain reference)
        seal_policy_id: String,
        
        // RBAC: Active access permissions
        active_permissions: Table<address, Permission>,
        
        // Pending access requests
        pending_requests: vector<AccessRequest>,
        
        // Audit trail
        access_history: vector<AccessLog>,
        
        created_at: u64,
    }

    /// Walrus storage reference with metadata
    public struct WalrusReference has store, copy, drop {
        walrus_blob_id: String,
        record_type: String, // "diagnosis", "lab_result", "prescription", etc.
        uploaded_by: address,
        uploaded_at: u64,
        data_hash: vector<u8>, // Hash of encrypted data for integrity
    }

    /// Access permission details
    public struct Permission has store, copy, drop {
        granted_by: address, // Patient who granted access
        granted_to: address, // Healthcare provider
        access_level: u8, // 1=read_only, 2=read_append, 3=emergency
        granted_at: u64,
        expires_at: u64,
    }

    /// Access request from healthcare provider
    public struct AccessRequest has store, copy, drop {
        requester: address,
        reason: String,
        requested_at: u64,
        access_level: u8,
    }

    /// Audit log entry (immutable)
    public struct AccessLog has store, copy, drop {
        accessor: address,
        access_type: String, // "read", "append", "emergency"
        accessed_at: u64,
        was_emergency: bool,
    }

    /// Global registry
    public struct HealthRegistry has key {
        id: UID,
        patient_records: Table<address, UID>, // patient_address -> record_id
        doctor_registry: Table<address, bool>,
        pharmacy_registry: Table<address, bool>,
    }

    // ===== Events =====

    public struct PatientRecordCreated has copy, drop {
        record_id: UID,
        patient_address: address,
        seal_policy_id: String,
        created_at: u64,
    }

    public struct AccessRequested has copy, drop {
        record_id: UID,
        requester: address,
        reason: String,
        requested_at: u64,
    }

    public struct AccessGranted has copy, drop {
        record_id: UID,
        patient_address: address,
        provider_address: address,
        access_level: u8,
        granted_at: u64,
    }

    public struct DataAppended has copy, drop {
        record_id: UID,
        walrus_blob_id: String,
        record_type: String,
        appended_by: address,
        appended_at: u64,
    }

    public struct EmergencyAccess has copy, drop {
        record_id: UID,
        accessing_doctor: address,
        master_key_used: bool,
        accessed_at: u64,
    }

    public struct AccessRevoked has copy, drop {
        record_id: UID,
        provider_address: address,
        revoked_by: address,
        revoked_at: u64,
    }

    // ===== Functions =====

    /// Initialize the health record registry
    public fun init(ctx: &mut TxContext) {
        let registry = HealthRecordRegistry {
            id: object::new(ctx),
            patients: table::new(ctx),
            records: table::new(ctx),
            access_policies: table::new(ctx),
        };

        transfer::share_object(registry);
    }

    /// Create a new patient record
    public fun create_patient(
        registry: &mut HealthRecordRegistry,
        patient_id: String,
        name: String,
        date_of_birth: String,
        encrypted_data_id: String,
        ctx: &mut TxContext
    ) {
        let now = 0; // TODO: Use proper clock when available

        let patient = Patient {
            id: patient_id,
            name,
            date_of_birth,
            encrypted_data_id,
            created_at: now,
            updated_at: now,
        };

        table::add(&mut registry.patients, patient_id, patient);

        event::emit(PatientCreated {
            patient_id,
            name,
            created_at: now,
        });
    }

    /// Add a health record for a patient
    public fun add_health_record(
        registry: &mut HealthRecordRegistry,
        cap: &HealthRecordCap,
        record_id: String,
        patient_id: String,
        record_type: String,
        encrypted_content: String,
        ctx: &mut TxContext
    ) {
        // Check if patient exists
        assert!(table::contains(&registry.patients, patient_id), E_PATIENT_NOT_FOUND);

        // Check access permissions
        assert!(table::contains(&registry.access_policies, patient_id), E_NOT_AUTHORIZED);
        let authorized_providers = table::borrow(&registry.access_policies, patient_id);
        assert!(vector::contains(authorized_providers, &cap.provider_id), E_NOT_AUTHORIZED);

        let now = 0; // TODO: Use proper clock when available

        let record = HealthRecord {
            id: record_id,
            patient_id,
            record_type,
            encrypted_content,
            created_by: cap.provider_id,
            created_at: now,
            updated_at: now,
        };

        table::add(&mut registry.records, record_id, record);

        event::emit(HealthRecordAdded {
            record_id,
            patient_id,
            record_type,
            created_by: cap.provider_id,
            created_at: now,
        });
    }

    /// Grant access to a patient's records to a healthcare provider
    public fun grant_access(
        registry: &mut HealthRecordRegistry,
        patient_id: String,
        provider_id: String,
        ctx: &mut TxContext
    ) {
        assert!(table::contains(&registry.patients, patient_id), E_PATIENT_NOT_FOUND);

        if (!table::contains(&registry.access_policies, patient_id)) {
            table::add(&mut registry.access_policies, patient_id, vector::empty());
        };

        let authorized_providers = table::borrow_mut(&mut registry.access_policies, patient_id);
        vector::push_back(authorized_providers, provider_id);

        event::emit(AccessGranted {
            patient_id,
            provider_id,
            granted_at: 0, // TODO: Use proper clock when available
        });
    }

    /// Get patient information (public data only)
    public fun get_patient_info(
        registry: &HealthRecordRegistry,
        patient_id: String
    ): (String, String, String, u64, u64) {
        assert!(table::contains(&registry.patients, patient_id), E_PATIENT_NOT_FOUND);
        let patient = table::borrow(&registry.patients, patient_id);
        
        (patient.id, patient.name, patient.date_of_birth, patient.created_at, patient.updated_at)
    }

    /// Check if a provider has access to a patient's records
    public fun has_access(
        registry: &HealthRecordRegistry,
        patient_id: String,
        provider_id: String
    ): bool {
        if (!table::contains(&registry.access_policies, patient_id)) {
            return false
        };
        
        let authorized_providers = table::borrow(&registry.access_policies, patient_id);
        vector::contains(authorized_providers, &provider_id)
    }
}
