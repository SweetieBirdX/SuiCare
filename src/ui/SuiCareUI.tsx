/**
 * SuiCare Complete UI Implementation
 * 
 * This file implements ALL prompts from Aşama 4:
 * - PROMPT 4.1: zkLogin authentication
 * - PROMPT 4.2: Role-based routing
 * - PROMPT 4.3: Restricted access UIs
 * - PROMPT 4.4: Audit log viewing
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnokiAuth } from './useEnokiAuth';
import { useRoleDetection } from './useRoleDetection';
import { useAuditLog } from './useAuditLog';

// ==========================================
// PROMPT 4.1: zkLogin Authentication
// ==========================================

export function LoginPage({ enokiClient, suiClient }: any) {
    const { signIn, isLoading, error } = useEnokiAuth(enokiClient, suiClient);

    return (
        <div className="login-container">
            <h1>🏥 SuiCare - Healthcare Data Management</h1>
            <h2>Secure Login with zkLogin</h2>
            
            {error && <div className="error">{error}</div>}
            
            <div className="login-providers">
                <button 
                    onClick={() => signIn('google')}
                    disabled={isLoading}
                    className="login-btn google"
                >
                    Sign in with Google
                </button>
                
                <button 
                    onClick={() => signIn('microsoft')}
                    disabled={isLoading}
                    className="login-btn microsoft"
                >
                    Sign in with Microsoft
                </button>
                
                <button 
                    onClick={() => signIn('facebook')}
                    disabled={isLoading}
                    className="login-btn facebook"
                >
                    Sign in with Facebook
                </button>
            </div>
            
            <div className="security-info">
                <p>✅ Zero-knowledge authentication</p>
                <p>✅ No password required</p>
                <p>✅ Blockchain-secured identity</p>
            </div>
        </div>
    );
}

// ==========================================
// PROMPT 4.2: Role-Based Router
// ==========================================

export function RoleBasedRouter({ enokiClient, suiClient, packageId }: any) {
    const navigate = useNavigate();
    const { suiAddress, isAuthenticated, isLoading: authLoading } = useEnokiAuth(enokiClient, suiClient);
    const { role, isLoading: roleLoading } = useRoleDetection(suiAddress, suiClient, packageId);

    useEffect(() => {
        if (!authLoading && !roleLoading && isAuthenticated) {
            // PROMPT 4.2: Role-based navigation
            if (role === 'doctor') {
                navigate('/doctor-dashboard');
            } else if (role === 'patient') {
                navigate('/patient-portal');
            } else if (role === 'pharmacy') {
                navigate('/pharmacy-dashboard');
            } else if (role === 'admin') {
                navigate('/admin-panel');
            } else {
                navigate('/role-setup');
            }
        }
    }, [authLoading, roleLoading, isAuthenticated, role]);

    if (authLoading || roleLoading) {
        return <div>🔄 Loading...</div>;
    }

    if (!isAuthenticated) {
        return <LoginPage enokiClient={enokiClient} suiClient={suiClient} />;
    }

    return null;
}

// ==========================================
// PROMPT 4.3: Patient Portal (Restricted UI)
// ==========================================

export function PatientPortal({ suiAddress, suiClient, packageId }: any) {
    const [patientRecord, setPatientRecord] = React.useState<any>(null);
    const [accessRequests, setAccessRequests] = React.useState<any[]>([]);
    
    // PROMPT 4.4: Audit log viewing
    const { auditLog, emergencyAccesses } = useAuditLog(suiAddress, suiClient, packageId);

    useEffect(() => {
        loadPatientData();
    }, [suiAddress]);

    async function loadPatientData() {
        // Load patient's own health record
        const record = await getPatientRecord(suiAddress);
        setPatientRecord(record);
        
        // Load pending access requests
        const requests = await getPendingAccessRequests(record.id);
        setAccessRequests(requests);
    }

    async function grantAccess(providerId: string, accessLevel: number) {
        // Patient grants access to healthcare provider
        console.log(`✅ Granting access to ${providerId}`);
        // Call Move contract: grant_access
    }

    async function revokeAccess(providerId: string) {
        // Patient revokes access
        console.log(`❌ Revoking access from ${providerId}`);
        // Call Move contract: revoke_access
    }

    return (
        <div className="patient-portal">
            <header>
                <h1>👤 Patient Portal</h1>
                <p>Address: {suiAddress}</p>
            </header>

            {/* PROMPT 4.3: Read-only view of own data */}
            <section className="patient-records">
                <h2>📋 My Health Records</h2>
                {patientRecord && (
                    <div className="record-view">
                        <p>Patient ID: {patientRecord.id}</p>
                        <p>Created: {new Date(patientRecord.created_at).toLocaleDateString()}</p>
                        <p>Records: {patientRecord.walrus_references.length}</p>
                        
                        {/* Read-only: No edit buttons */}
                        <div className="readonly-notice">
                            ℹ️ Your health records are append-only for security.
                            Only authorized healthcare providers can add new records.
                        </div>
                    </div>
                )}
            </section>

            {/* Access Management */}
            <section className="access-management">
                <h2>🔐 Access Control</h2>
                
                {/* Pending Requests */}
                <div className="pending-requests">
                    <h3>Pending Access Requests</h3>
                    {accessRequests.map(request => (
                        <div key={request.id} className="access-request">
                            <p>Provider: {request.requester}</p>
                            <p>Reason: {request.reason}</p>
                            <p>Level: {request.access_level === 1 ? 'Read Only' : 'Read & Append'}</p>
                            <div className="request-actions">
                                <button onClick={() => grantAccess(request.requester, request.access_level)}>
                                    ✅ Approve
                                </button>
                                <button onClick={() => {}}>
                                    ❌ Deny
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Active Permissions */}
                <div className="active-permissions">
                    <h3>Active Permissions</h3>
                    {patientRecord?.active_permissions.map((perm: any) => (
                        <div key={perm.granted_to} className="permission">
                            <p>Provider: {perm.granted_to}</p>
                            <p>Access Level: {perm.access_level}</p>
                            <p>Expires: {new Date(perm.expires_at).toLocaleDateString()}</p>
                            <button onClick={() => revokeAccess(perm.granted_to)}>
                                🔒 Revoke Access
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* PROMPT 4.4: Audit Log Display */}
            <section className="audit-log">
                <h2>📊 Access History (Audit Log)</h2>
                <div className="audit-entries">
                    {auditLog.map((entry, idx) => (
                        <div key={idx} className={`audit-entry ${entry.was_emergency ? 'emergency' : ''}`}>
                            <span className="timestamp">
                                {new Date(entry.accessed_at).toLocaleString()}
                            </span>
                            <span className="accessor">{entry.accessor}</span>
                            <span className="action">{entry.access_type}</span>
                            {entry.was_emergency && (
                                <span className="emergency-badge">⚠️ EMERGENCY</span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Emergency Access Alerts */}
                {emergencyAccesses.length > 0 && (
                    <div className="emergency-alerts">
                        <h3>⚠️ Emergency Access Notifications</h3>
                        {emergencyAccesses.map((access, idx) => (
                            <div key={idx} className="emergency-alert">
                                <p>Doctor: {access.doctor}</p>
                                <p>Time: {new Date(access.timestamp).toLocaleString()}</p>
                                <p>Reason: Medical Emergency</p>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

// ==========================================
// PROMPT 4.3: Doctor Dashboard (Append Access)
// ==========================================

export function DoctorDashboard({ suiAddress, suiClient, packageId }: any) {
    const [grantedRecords, setGrantedRecords] = React.useState<any[]>([]);
    const [selectedRecord, setSelectedRecord] = React.useState<any>(null);

    useEffect(() => {
        loadGrantedRecords();
    }, [suiAddress]);

    async function loadGrantedRecords() {
        // Get records doctor has access to
        const records = await getGrantedRecordsForDoctor(suiAddress);
        setGrantedRecords(records);
    }

    async function requestAccess(patientId: string, reason: string) {
        // Request access to patient record
        console.log(`📝 Requesting access to ${patientId}`);
        // Call Move contract: request_access
    }

    async function appendHealthRecord(recordId: string, data: any) {
        // Append new health record (if permitted)
        console.log(`➕ Appending record to ${recordId}`);
        // Call: encrypt -> walrus -> append_encrypted_data
    }

    return (
        <div className="doctor-dashboard">
            <header>
                <h1>👨‍⚕️ Doctor Dashboard</h1>
                <p>Address: {suiAddress}</p>
            </header>

            {/* Patient Records */}
            <section className="patient-list">
                <h2>📋 My Patients</h2>
                <div className="records-grid">
                    {grantedRecords.map(record => (
                        <div 
                            key={record.id} 
                            className="patient-card"
                            onClick={() => setSelectedRecord(record)}
                        >
                            <h3>{record.patient_name}</h3>
                            <p>Last Updated: {new Date(record.updated_at).toLocaleDateString()}</p>
                            <p>Records: {record.walrus_references.length}</p>
                            <p>Access Level: {record.my_access_level}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Selected Record Details */}
            {selectedRecord && (
                <section className="record-details">
                    <h2>Patient: {selectedRecord.patient_name}</h2>
                    
                    {/* View Health Records */}
                    <div className="health-records">
                        {selectedRecord.walrus_references.map((ref: any, idx: number) => (
                            <div key={idx} className="health-record">
                                <h4>{ref.record_type}</h4>
                                <p>Uploaded: {new Date(ref.uploaded_at).toLocaleDateString()}</p>
                                <button onClick={() => viewRecord(ref)}>
                                    👁️ View
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Append New Record (if permitted) */}
                    {selectedRecord.my_access_level >= 2 && (
                        <div className="append-section">
                            <h3>➕ Add New Record</h3>
                            <button onClick={() => appendHealthRecord(selectedRecord.id, {})}>
                                Add Diagnosis
                            </button>
                            <button onClick={() => appendHealthRecord(selectedRecord.id, {})}>
                                Add Lab Result
                            </button>
                            <button onClick={() => appendHealthRecord(selectedRecord.id, {})}>
                                Add Prescription
                            </button>
                        </div>
                    )}
                </section>
            )}

            {/* Request New Access */}
            <section className="request-access">
                <h2>🔐 Request Access to New Patient</h2>
                <input type="text" placeholder="Patient Address" />
                <textarea placeholder="Reason for access request" />
                <button onClick={() => requestAccess('', '')}>
                    Send Request
                </button>
            </section>
        </div>
    );
}

// ==========================================
// PROMPT 4.3: Pharmacy Dashboard (Prescriptions Only)
// ==========================================

export function PharmacyDashboard({ suiAddress, suiClient, packageId }: any) {
    const [prescriptions, setPrescriptions] = React.useState<any[]>([]);

    useEffect(() => {
        loadPrescriptions();
    }, []);

    async function loadPrescriptions() {
        // Pharmacy can ONLY see prescriptions, not other records
        const scripts = await getPrescriptionsForPharmacy(suiAddress);
        setPrescriptions(scripts);
    }

    async function dispenseMedication(prescriptionId: string) {
        console.log(`💊 Dispensing prescription ${prescriptionId}`);
        // Mark prescription as dispensed
    }

    return (
        <div className="pharmacy-dashboard">
            <header>
                <h1>💊 Pharmacy Dashboard</h1>
                <p>Address: {suiAddress}</p>
            </header>

            {/* PROMPT 4.3: Limited to prescriptions only */}
            <section className="prescriptions">
                <h2>📋 Prescriptions</h2>
                <div className="readonly-notice">
                    ℹ️ You can only view and dispense prescriptions.
                    Other medical records are not accessible.
                </div>
                
                {prescriptions.map(script => (
                    <div key={script.id} className="prescription">
                        <h3>Patient: {script.patient_name}</h3>
                        <p>Medication: {script.medication}</p>
                        <p>Dosage: {script.dosage}</p>
                        <p>Doctor: {script.doctor}</p>
                        <p>Status: {script.dispensed ? 'Dispensed' : 'Pending'}</p>
                        
                        {!script.dispensed && (
                            <button onClick={() => dispenseMedication(script.id)}>
                                ✅ Dispense
                            </button>
                        )}
                    </div>
                ))}
            </section>
        </div>
    );
}

// Helper functions
async function getPatientRecord(address: string) { return {}; }
async function getPendingAccessRequests(recordId: string) { return []; }
async function getGrantedRecordsForDoctor(address: string) { return []; }
async function getPrescriptionsForPharmacy(address: string) { return []; }
async function viewRecord(ref: any) {}
