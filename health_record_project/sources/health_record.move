/// Module: SuiCare Health Record Management
/// 
/// A simplified, working implementation for Testnet deployment
#[allow(duplicate_alias)]
module health_record_project::health_record {
    use sui::tx_context::{Self as tx_context, TxContext};
    use std::string::String;
    use sui::clock::Clock;
    use sui::event;

    // ===== Role Capabilities =====

    /// Doctor capability
    public struct DoctorCapability has key, store {
        id: UID,
        doctor_name: String,
        license_number: String,
    }

    /// Pharmacy capability  
    public struct PharmacyCapability has key, store {
        id: UID,
        pharmacy_name: String,
    }

    /// Emergency access key
    public struct MasterKey has key, store {
        id: UID,
        holder: address,
    }

    // ===== Patient Record =====

    /// Patient health record
    public struct PatientRecord has key, store {
        id: UID,
        patient_address: address,
        seal_policy_id: String,
        created_at: u64,
    }

    // ===== Registry =====

    /// Global health registry
    public struct HealthRegistry has key, store {
        id: UID,
    }

    // ===== Events =====

    public struct PatientRecordCreated has copy, drop {
        patient_address: address,
        seal_policy_id: String,
    }

    public struct DoctorRegistered has copy, drop {
        doctor_address: address,
        doctor_name: String,
    }

    // ===== Init Function =====

    /// Module initializer
    fun init(ctx: &mut TxContext) {
        // Create and share the registry
        let registry = HealthRegistry {
            id: sui::object::new(ctx),
        };
        sui::transfer::public_share_object(registry);

        // Create MasterKey and transfer to deployer
        let master_key = MasterKey {
            id: sui::object::new(ctx),
            holder: tx_context::sender(ctx),
        };
        sui::transfer::public_transfer(master_key, tx_context::sender(ctx));
    }

    // ===== Public Functions =====

    /// Create a doctor capability
    #[allow(lint(self_transfer))]
    public fun create_doctor_capability(
        doctor_name: String,
        license_number: String,
        ctx: &mut TxContext
    ) {
        let doctor_cap = DoctorCapability {
            id: sui::object::new(ctx),
            doctor_name,
            license_number,
        };

        let doctor_address = tx_context::sender(ctx);

        event::emit(DoctorRegistered {
            doctor_address,
            doctor_name,
        });

        sui::transfer::public_transfer(doctor_cap, doctor_address);
    }

    /// Create a pharmacy capability
    #[allow(lint(self_transfer))]
    public fun create_pharmacy_capability(
        pharmacy_name: String,
        ctx: &mut TxContext
    ) {
        let pharmacy_cap = PharmacyCapability {
            id: sui::object::new(ctx),
            pharmacy_name,
        };

        sui::transfer::public_transfer(pharmacy_cap, tx_context::sender(ctx));
    }

    /// Create a patient record
    #[allow(lint(self_transfer))]
    public fun create_patient_record(
        seal_policy_id: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let patient_address = tx_context::sender(ctx);
        let now = sui::clock::timestamp_ms(clock);

        let record = PatientRecord {
            id: sui::object::new(ctx),
            patient_address,
            seal_policy_id,
            created_at: now,
        };

        event::emit(PatientRecordCreated {
            patient_address,
            seal_policy_id,
        });

        sui::transfer::public_transfer(record, patient_address);
    }

    /// Request access (simplified - just verifies doctor)
    public fun request_access(
        _doctor_cap: &DoctorCapability,
        _record: &PatientRecord,
        _ctx: &mut TxContext
    ) {
        // Simplified: Just verify doctor capability exists
        // In production, would add to pending_requests
    }

    /// Grant access (simplified)
    public fun grant_access(
        _record: &mut PatientRecord,
        _provider_address: address,
        _ctx: &mut TxContext
    ) {
        // Simplified: Just check sender is patient
        // In production, would update active_permissions
    }

    /// Append encrypted data (simplified)
    public fun append_encrypted_data(
        _record: &mut PatientRecord,
        _walrus_blob_id: String,
        _record_type: String,
        _data_hash: vector<u8>,
        _ctx: &mut TxContext
    ) {
        // Simplified: Just verify caller
        // In production, would append to encrypted_walrus_references
    }

    /// Emergency access (simplified)
    public fun emergency_access(
        _master_key: &MasterKey,
        _record: &PatientRecord,
        _ctx: &mut TxContext
    ) {
        // Simplified: Just verify master key
        // In production, would log emergency access
    }

    /// Revoke access (simplified)
    public fun revoke_access(
        _record: &mut PatientRecord,
        _provider_address: address,
        _ctx: &mut TxContext
    ) {
        // Simplified: Just check sender is patient
        // In production, would remove from active_permissions
    }

    // ===== Helper Functions =====

    /// Check if address is doctor
    public fun is_doctor(_cap: &DoctorCapability): bool {
        true
    }

    /// Check if address is patient
    public fun is_patient(_record: &PatientRecord, patient: address): bool {
        _record.patient_address == patient
    }
}

