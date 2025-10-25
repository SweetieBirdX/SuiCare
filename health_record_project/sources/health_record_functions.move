/// Health Record Functions Module
/// 
/// This module contains all the core functions for:
/// - Patient record creation
/// - Access request and grant
/// - Data appending (immutable)
/// - Emergency access
/// - RBAC verification

module health_record_project::health_record_functions {
    use health_record_project::health_record::{
        PatientRecord, WalrusReference, Permission, AccessRequest, AccessLog,
        DoctorCapability, MasterKey, HealthRegistry
    };
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use sui::event;
    use std::string::String;
    use std::vector;

    // Error constants
    const E_NOT_PATIENT: u64 = 5;
    const E_NOT_DOCTOR: u64 = 4;
    const E_NOT_AUTHORIZED: u64 = 0;

    /// Create a new patient record with Seal policy
    public entry fun create_patient_record(
        registry: &mut HealthRegistry,
        seal_policy_id: String,
        ctx: &mut TxContext
    ) {
        let patient_addr = tx_context::sender(ctx);
        let now = 0; // In production, use Clock
        
        let record = PatientRecord {
            id: object::new(ctx),
            patient_address: patient_addr,
            encrypted_walrus_references: vector::empty(),
            seal_policy_id,
            active_permissions: table::new(ctx),
            pending_requests: vector::empty(),
            access_history: vector::empty(),
            created_at: now,
        };

        // Store record ID in registry
        table::add(&mut registry.patient_records, patient_addr, object::uid_to_inner(&record.id));
        
        // Transfer ownership to patient
        transfer::transfer(record, patient_addr);
    }

    /// Doctor requests access to patient record
    public entry fun request_access(
        record: &mut PatientRecord,
        doctor_cap: &DoctorCapability,
        reason: String,
        access_level: u8,
        ctx: &mut TxContext
    ) {
        let doctor_addr = tx_context::sender(ctx);
        assert!(doctor_cap.doctor_address == doctor_addr, E_NOT_DOCTOR);
        assert!(doctor_cap.verified, E_NOT_AUTHORIZED);
        
        let request = AccessRequest {
            requester: doctor_addr,
            reason,
            requested_at: 0, // Use Clock in production
            access_level,
        };
        
        vector::push_back(&mut record.pending_requests, request);
    }

    /// Patient grants access to healthcare provider
    public entry fun grant_access(
        record: &mut PatientRecord,
        provider_address: address,
        access_level: u8,
        duration_hours: u64,
        ctx: &mut TxContext
    ) {
        let patient_addr = tx_context::sender(ctx);
        assert!(record.patient_address == patient_addr, E_NOT_PATIENT);
        
        let now = 0; // Use Clock in production
        let expires_at = now + (duration_hours * 3600);
        
        let permission = Permission {
            granted_by: patient_addr,
            granted_to: provider_address,
            access_level,
            granted_at: now,
            expires_at,
        };
        
        table::add(&mut record.active_permissions, provider_address, permission);
        
        // Remove from pending requests if exists
        let i = 0;
        let len = vector::length(&record.pending_requests);
        while (i < len) {
            let req = vector::borrow(&record.pending_requests, i);
            if (req.requester == provider_address) {
                vector::remove(&mut record.pending_requests, i);
                break
            };
            i = i + 1;
        };
    }

    /// Append new encrypted data (immutable)
    public entry fun append_encrypted_data(
        record: &mut PatientRecord,
        doctor_cap: &DoctorCapability,
        walrus_blob_id: String,
        record_type: String,
        data_hash: vector<u8>,
        ctx: &mut TxContext
    ) {
        let doctor_addr = tx_context::sender(ctx);
        
        // Verify doctor has permission
        assert!(table::contains(&record.active_permissions, doctor_addr), E_NOT_AUTHORIZED);
        
        let permission = table::borrow(&record.active_permissions, doctor_addr);
        assert!(permission.access_level >= 2, E_NOT_AUTHORIZED); // Need read_append
        
        let now = 0; // Use Clock in production
        
        let walrus_ref = WalrusReference {
            walrus_blob_id,
            record_type,
            uploaded_by: doctor_addr,
            uploaded_at: now,
            data_hash,
        };
        
        // Append to immutable history (never modify existing)
        vector::push_back(&mut record.encrypted_walrus_references, walrus_ref);
        
        // Add audit log
        let log = AccessLog {
            accessor: doctor_addr,
            access_type: string::utf8(b"append"),
            accessed_at: now,
            was_emergency: false,
        };
        vector::push_back(&mut record.access_history, log);
    }

    /// Emergency access with MasterKey
    public entry fun emergency_access(
        record: &mut PatientRecord,
        master_key: &MasterKey,
        doctor_cap: &DoctorCapability,
        ctx: &mut TxContext
    ) {
        let doctor_addr = tx_context::sender(ctx);
        
        // Verify MasterKey is valid
        assert!(master_key.authorized_address == doctor_addr, E_NOT_AUTHORIZED);
        assert!(master_key.emergency_only, E_NOT_AUTHORIZED);
        
        let now = 0; // Use Clock in production
        
        // Grant temporary emergency access
        let emergency_permission = Permission {
            granted_by: record.patient_address, // System granted
            granted_to: doctor_addr,
            access_level: 3, // Emergency level
            granted_at: now,
            expires_at: now + 3600, // 1 hour
        };
        
        if (!table::contains(&record.active_permissions, doctor_addr)) {
            table::add(&mut record.active_permissions, doctor_addr, emergency_permission);
        };
        
        // Add emergency audit log
        let log = AccessLog {
            accessor: doctor_addr,
            access_type: string::utf8(b"emergency"),
            accessed_at: now,
            was_emergency: true,
        };
        vector::push_back(&mut record.access_history, log);
    }

    /// Revoke access from provider
    public entry fun revoke_access(
        record: &mut PatientRecord,
        provider_address: address,
        ctx: &mut TxContext
    ) {
        let patient_addr = tx_context::sender(ctx);
        assert!(record.patient_address == patient_addr, E_NOT_PATIENT);
        
        if (table::contains(&record.active_permissions, provider_address)) {
            table::remove(&mut record.active_permissions, provider_address);
        };
    }

    /// Get access history (audit trail)
    public fun get_access_history(record: &PatientRecord): &vector<AccessLog> {
        &record.access_history
    }

    /// Check if provider has access
    public fun has_access(record: &PatientRecord, provider: address): bool {
        table::contains(&record.active_permissions, provider)
    }

    /// Get Walrus references
    public fun get_walrus_references(record: &PatientRecord): &vector<WalrusReference> {
        &record.encrypted_walrus_references
    }
}
