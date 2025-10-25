/*
/// Module: health_record_project
/// SuiCare Health Record Management System
/// 
/// This module provides the core functionality for managing patient health records
/// on the Sui blockchain with privacy-preserving features.
module health_record_project::health_record_project {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use std::string::{Self, String};
    use std::vector;
    use sui::table::{Self, Table};

    // ===== Constants =====
    
    const E_NOT_AUTHORIZED: u64 = 0;
    const E_PATIENT_NOT_FOUND: u64 = 1;
    const E_RECORD_NOT_FOUND: u64 = 2;
    const E_INVALID_ACCESS: u64 = 3;

    // ===== Structs =====

    /// Represents a patient in the system
    public struct Patient has store {
        id: String,
        name: String,
        date_of_birth: String,
        encrypted_data_id: String, // Reference to encrypted data in Walrus
        created_at: u64,
        updated_at: u64,
    }

    /// Represents a health record entry
    public struct HealthRecord has store {
        id: String,
        patient_id: String,
        record_type: String, // e.g., "diagnosis", "medication", "lab_result"
        encrypted_content: String, // Encrypted using Seal SDK
        created_by: String, // Healthcare provider ID
        created_at: u64,
        updated_at: u64,
    }

    /// Main registry for managing patients and records
    public struct HealthRecordRegistry has key {
        id: UID,
        patients: Table<String, Patient>,
        records: Table<String, HealthRecord>,
        access_policies: Table<String, vector<String>>, // patient_id -> authorized_providers
    }

    /// Capability for managing health records
    public struct HealthRecordCap has key, store {
        id: UID,
        provider_id: String,
    }

    // ===== Events =====

    public struct PatientCreated has copy, drop {
        patient_id: String,
        name: String,
        created_at: u64,
    }

    public struct HealthRecordAdded has copy, drop {
        record_id: String,
        patient_id: String,
        record_type: String,
        created_by: String,
        created_at: u64,
    }

    public struct AccessGranted has copy, drop {
        patient_id: String,
        provider_id: String,
        granted_at: u64,
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
