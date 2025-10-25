/**
 * Access Control UI Components
 * 
 * Implements normal and emergency access flows with Move contract integration
 * - Normal Access Flow: Doctor request → Patient approval
 * - Emergency Access Flow: MasterKey emergency access → Patient revocation
 */

import React, { useState, useEffect } from 'react';
import { SuiClient } from '@mysten/sui/client';

// ==========================================
// Types and Interfaces
// ==========================================

export interface AccessRequest {
    id: string;
    doctorAddress: string;
    doctorName: string;
    patientAddress: string;
    reason: string;
    accessLevel: number; // 1: Read-only, 2: Read & Append
    timestamp: number;
    status: 'pending' | 'approved' | 'denied' | 'expired';
}

export interface EmergencyAccess {
    id: string;
    doctorAddress: string;
    doctorName: string;
    patientAddress: string;
    reason: string;
    timestamp: number;
    isActive: boolean;
    masterKeyUsed: boolean;
}

export interface AccessPermission {
    id: string;
    doctorAddress: string;
    doctorName: string;
    accessLevel: number;
    grantedAt: number;
    expiresAt: number;
    isActive: boolean;
}

// ==========================================
// Normal Access Flow Components
// ==========================================

/**
 * Doctor Access Request Component
 * Allows doctors to request access to patient records
 */
export function DoctorAccessRequest({ 
    suiAddress, 
    suiClient, 
    packageId, 
    onRequestSent 
}: {
    suiAddress: string;
    suiClient: SuiClient;
    packageId: string;
    onRequestSent: (request: AccessRequest) => void;
}) {
    const [patientAddress, setPatientAddress] = useState('');
    const [reason, setReason] = useState('');
    const [accessLevel, setAccessLevel] = useState<number>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function submitAccessRequest() {
        if (!patientAddress.trim() || !reason.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            console.log('📝 Submitting access request...');
            console.log(`   Doctor: ${suiAddress}`);
            console.log(`   Patient: ${patientAddress}`);
            console.log(`   Reason: ${reason}`);
            console.log(`   Access Level: ${accessLevel}`);

            // Call Move contract: request_access
            const requestId = await callRequestAccess(patientAddress, reason, accessLevel);
            
            const newRequest: AccessRequest = {
                id: requestId,
                doctorAddress: suiAddress,
                doctorName: 'Dr. ' + suiAddress.substring(0, 8),
                patientAddress: patientAddress,
                reason: reason,
                accessLevel: accessLevel,
                timestamp: Date.now(),
                status: 'pending'
            };

            console.log('✅ Access request submitted successfully');
            console.log(`   Request ID: ${requestId}`);
            
            onRequestSent(newRequest);
            
            // Reset form
            setPatientAddress('');
            setReason('');
            setAccessLevel(1);
            
        } catch (error) {
            console.error('❌ Failed to submit access request:', error);
            alert('Failed to submit access request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function callRequestAccess(patientAddr: string, reason: string, level: number): Promise<string> {
        // In production, this would call the actual Move contract
        // For now, simulate the transaction
        const requestId = 'req-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
        
        console.log('🔗 Calling Move contract: request_access');
        console.log(`   Package: ${packageId}`);
        console.log(`   Function: request_access`);
        console.log(`   Patient: ${patientAddr}`);
        console.log(`   Reason: ${reason}`);
        console.log(`   Level: ${level}`);
        
        // Simulate transaction delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return requestId;
    }

    return (
        <div className="access-request-form">
            <h3>📝 Request Patient Access</h3>
            <p>Request access to a patient's health records for medical consultation.</p>
            
            <div className="form-group">
                <label htmlFor="patient-address">Patient Sui Address *</label>
                <input
                    id="patient-address"
                    type="text"
                    value={patientAddress}
                    onChange={(e) => setPatientAddress(e.target.value)}
                    placeholder="0x1234567890abcdef..."
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label htmlFor="reason">Reason for Access *</label>
                <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe why you need access to this patient's records..."
                    className="form-textarea"
                    rows={3}
                />
            </div>

            <div className="form-group">
                <label htmlFor="access-level">Access Level</label>
                <select
                    id="access-level"
                    value={accessLevel}
                    onChange={(e) => setAccessLevel(Number(e.target.value))}
                    className="form-select"
                >
                    <option value={1}>Read Only - View existing records</option>
                    <option value={2}>Read & Append - View and add new records</option>
                </select>
            </div>

            <button
                onClick={submitAccessRequest}
                disabled={isSubmitting || !patientAddress.trim() || !reason.trim()}
                className="submit-button"
            >
                {isSubmitting ? 'Submitting...' : 'Submit Access Request'}
            </button>

            <div className="request-info">
                <p>ℹ️ The patient will be notified and can approve or deny your request.</p>
                <p>ℹ️ Access requests expire after 7 days if not responded to.</p>
            </div>
        </div>
    );
}

/**
 * Patient Access Approval Component
 * Allows patients to approve or deny access requests
 */
export function PatientAccessApproval({ 
    suiAddress, 
    suiClient, 
    packageId, 
    accessRequests, 
    onRequestProcessed 
}: {
    suiAddress: string;
    suiClient: SuiClient;
    packageId: string;
    accessRequests: AccessRequest[];
    onRequestProcessed: (requestId: string, approved: boolean) => void;
}) {
    async function approveRequest(request: AccessRequest) {
        try {
            console.log('✅ Approving access request...');
            console.log(`   Request ID: ${request.id}`);
            console.log(`   Doctor: ${request.doctorAddress}`);
            console.log(`   Access Level: ${request.accessLevel}`);

            // Call Move contract: grant_access
            await callGrantAccess(request.id, request.doctorAddress, request.accessLevel);
            
            console.log('✅ Access granted successfully');
            onRequestProcessed(request.id, true);
            
        } catch (error) {
            console.error('❌ Failed to approve access request:', error);
            alert('Failed to approve access request. Please try again.');
        }
    }

    async function denyRequest(request: AccessRequest) {
        try {
            console.log('❌ Denying access request...');
            console.log(`   Request ID: ${request.id}`);
            console.log(`   Doctor: ${request.doctorAddress}`);

            // Call Move contract: deny_access
            await callDenyAccess(request.id);
            
            console.log('✅ Access request denied');
            onRequestProcessed(request.id, false);
            
        } catch (error) {
            console.error('❌ Failed to deny access request:', error);
            alert('Failed to deny access request. Please try again.');
        }
    }

    async function callGrantAccess(requestId: string, doctorAddr: string, level: number): Promise<void> {
        console.log('🔗 Calling Move contract: grant_access');
        console.log(`   Package: ${packageId}`);
        console.log(`   Function: grant_access`);
        console.log(`   Request ID: ${requestId}`);
        console.log(`   Doctor: ${doctorAddr}`);
        console.log(`   Level: ${level}`);
        
        // Simulate transaction delay
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    async function callDenyAccess(requestId: string): Promise<void> {
        console.log('🔗 Calling Move contract: deny_access');
        console.log(`   Package: ${packageId}`);
        console.log(`   Function: deny_access`);
        console.log(`   Request ID: ${requestId}`);
        
        // Simulate transaction delay
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    const pendingRequests = accessRequests.filter(req => req.status === 'pending');

    return (
        <div className="access-approval">
            <h3>🔐 Pending Access Requests</h3>
            <p>Review and approve or deny access requests from healthcare providers.</p>
            
            {pendingRequests.length === 0 ? (
                <div className="no-requests">
                    <p>✅ No pending access requests</p>
                </div>
            ) : (
                <div className="requests-list">
                    {pendingRequests.map(request => (
                        <div key={request.id} className="access-request-card">
                            <div className="request-header">
                                <h4>Request from {request.doctorName}</h4>
                                <span className="request-time">
                                    {new Date(request.timestamp).toLocaleString()}
                                </span>
                            </div>
                            
                            <div className="request-details">
                                <p><strong>Doctor Address:</strong> {request.doctorAddress}</p>
                                <p><strong>Reason:</strong> {request.reason}</p>
                                <p><strong>Access Level:</strong> {
                                    request.accessLevel === 1 ? 'Read Only' : 'Read & Append'
                                }</p>
                            </div>
                            
                            <div className="request-actions">
                                <button
                                    onClick={() => approveRequest(request)}
                                    className="approve-button"
                                >
                                    ✅ Approve Access
                                </button>
                                <button
                                    onClick={() => denyRequest(request)}
                                    className="deny-button"
                                >
                                    ❌ Deny Access
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ==========================================
// Emergency Access Flow Components
// ==========================================

/**
 * Emergency Access Component
 * Allows emergency doctors to access patient records using MasterKey
 */
export function EmergencyAccess({ 
    suiAddress, 
    suiClient, 
    packageId, 
    onEmergencyAccess 
}: {
    suiAddress: string;
    suiClient: SuiClient;
    packageId: string;
    onEmergencyAccess: (access: EmergencyAccess) => void;
}) {
    const [patientAddress, setPatientAddress] = useState('');
    const [reason, setReason] = useState('');
    const [isAccessing, setIsAccessing] = useState(false);
    const [hasMasterKey, setHasMasterKey] = useState(false);

    useEffect(() => {
        checkMasterKeyAccess();
    }, [suiAddress]);

    async function checkMasterKeyAccess() {
        try {
            // Check if doctor has MasterKey capability
            const hasKey = await checkMasterKeyCapability(suiAddress);
            setHasMasterKey(hasKey);
            
            if (hasKey) {
                console.log('✅ MasterKey capability confirmed');
            } else {
                console.log('❌ No MasterKey capability found');
            }
        } catch (error) {
            console.error('Failed to check MasterKey capability:', error);
            setHasMasterKey(false);
        }
    }

    async function checkMasterKeyCapability(address: string): Promise<boolean> {
        // In production, this would check the blockchain for MasterKey ownership
        // For now, simulate based on address pattern
        return address.includes('emergency') || address.endsWith('e');
    }

    async function initiateEmergencyAccess() {
        if (!patientAddress.trim() || !reason.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        if (!hasMasterKey) {
            alert('You do not have MasterKey capability for emergency access');
            return;
        }

        setIsAccessing(true);
        try {
            console.log('🚨 Initiating emergency access...');
            console.log(`   Emergency Doctor: ${suiAddress}`);
            console.log(`   Patient: ${patientAddress}`);
            console.log(`   Reason: ${reason}`);

            // Call Move contract: emergency_access
            const accessId = await callEmergencyAccess(patientAddress, reason);
            
            const emergencyAccess: EmergencyAccess = {
                id: accessId,
                doctorAddress: suiAddress,
                doctorName: 'Dr. ' + suiAddress.substring(0, 8),
                patientAddress: patientAddress,
                reason: reason,
                timestamp: Date.now(),
                isActive: true,
                masterKeyUsed: true
            };

            console.log('✅ Emergency access granted');
            console.log(`   Access ID: ${accessId}`);
            console.log('⚠️ Patient will be notified of this emergency access');
            
            onEmergencyAccess(emergencyAccess);
            
            // Reset form
            setPatientAddress('');
            setReason('');
            
        } catch (error) {
            console.error('❌ Failed to initiate emergency access:', error);
            alert('Failed to initiate emergency access. Please try again.');
        } finally {
            setIsAccessing(false);
        }
    }

    async function callEmergencyAccess(patientAddr: string, reason: string): Promise<string> {
        console.log('🔗 Calling Move contract: emergency_access');
        console.log(`   Package: ${packageId}`);
        console.log(`   Function: emergency_access`);
        console.log(`   Patient: ${patientAddr}`);
        console.log(`   Reason: ${reason}`);
        console.log(`   MasterKey: Used`);
        
        // Simulate transaction delay
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        return 'emergency-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    }

    if (!hasMasterKey) {
        return (
            <div className="emergency-access-denied">
                <h3>🚨 Emergency Access</h3>
                <div className="access-denied">
                    <p>❌ You do not have MasterKey capability for emergency access.</p>
                    <p>Only authorized emergency doctors can use this feature.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="emergency-access-form">
            <h3>🚨 Emergency Access</h3>
            <div className="emergency-warning">
                <p>⚠️ <strong>EMERGENCY ACCESS ONLY</strong></p>
                <p>This feature should only be used in genuine medical emergencies when the patient is unconscious or unable to provide consent.</p>
            </div>
            
            <div className="form-group">
                <label htmlFor="emergency-patient-address">Patient Sui Address *</label>
                <input
                    id="emergency-patient-address"
                    type="text"
                    value={patientAddress}
                    onChange={(e) => setPatientAddress(e.target.value)}
                    placeholder="0x1234567890abcdef..."
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label htmlFor="emergency-reason">Emergency Reason *</label>
                <textarea
                    id="emergency-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe the medical emergency requiring immediate access..."
                    className="form-textarea"
                    rows={3}
                />
            </div>

            <button
                onClick={initiateEmergencyAccess}
                disabled={isAccessing || !patientAddress.trim() || !reason.trim()}
                className="emergency-button"
            >
                {isAccessing ? 'Accessing...' : '🚨 Initiate Emergency Access'}
            </button>

            <div className="emergency-info">
                <p>⚠️ This action will be logged and the patient will be notified.</p>
                <p>⚠️ Emergency access can be revoked by the patient when they regain consciousness.</p>
            </div>
        </div>
    );
}

/**
 * Emergency Access Revocation Component
 * Allows patients to revoke emergency access granted to doctors
 */
export function EmergencyAccessRevocation({ 
    suiAddress, suiClient, packageId, emergencyAccesses, onAccessRevoked 
}: {
    suiAddress: string;
    suiClient: SuiClient;
    packageId: string;
    emergencyAccesses: EmergencyAccess[];
    onAccessRevoked: (accessId: string) => void;
}) {
    async function revokeEmergencyAccess(access: EmergencyAccess) {
        try {
            console.log('🔒 Revoking emergency access...');
            console.log(`   Access ID: ${access.id}`);
            console.log(`   Doctor: ${access.doctorAddress}`);

            // Call Move contract: revoke_access
            await callRevokeAccess(access.id);
            
            console.log('✅ Emergency access revoked successfully');
            onAccessRevoked(access.id);
            
        } catch (error) {
            console.error('❌ Failed to revoke emergency access:', error);
            alert('Failed to revoke emergency access. Please try again.');
        }
    }

    async function callRevokeAccess(accessId: string): Promise<void> {
        console.log('🔗 Calling Move contract: revoke_access');
        console.log(`   Package: ${packageId}`);
        console.log(`   Function: revoke_access`);
        console.log(`   Access ID: ${accessId}`);
        
        // Simulate transaction delay
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    const activeEmergencyAccesses = emergencyAccesses.filter(access => access.isActive);

    return (
        <div className="emergency-revocation">
            <h3>🔒 Emergency Access Management</h3>
            <p>Review and revoke emergency access granted to healthcare providers.</p>
            
            {activeEmergencyAccesses.length === 0 ? (
                <div className="no-emergency-access">
                    <p>✅ No active emergency access</p>
                </div>
            ) : (
                <div className="emergency-access-list">
                    {activeEmergencyAccesses.map(access => (
                        <div key={access.id} className="emergency-access-card">
                            <div className="access-header">
                                <h4>Emergency Access by {access.doctorName}</h4>
                                <span className="access-time">
                                    {new Date(access.timestamp).toLocaleString()}
                                </span>
                            </div>
                            
                            <div className="access-details">
                                <p><strong>Doctor Address:</strong> {access.doctorAddress}</p>
                                <p><strong>Reason:</strong> {access.reason}</p>
                                <p><strong>MasterKey Used:</strong> {access.masterKeyUsed ? 'Yes' : 'No'}</p>
                            </div>
                            
                            <div className="access-actions">
                                <button
                                    onClick={() => revokeEmergencyAccess(access)}
                                    className="revoke-button"
                                >
                                    🔒 Revoke Emergency Access
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ==========================================
// Access Management Dashboard
// ==========================================

/**
 * Complete Access Control Dashboard
 * Combines all access control components
 */
export function AccessControlDashboard({ 
    suiAddress, 
    suiClient, 
    packageId, 
    userRole 
}: {
    suiAddress: string;
    suiClient: SuiClient;
    packageId: string;
    userRole: 'patient' | 'doctor' | 'pharmacy' | 'admin';
}) {
    const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
    const [emergencyAccesses, setEmergencyAccesses] = useState<EmergencyAccess[]>([]);
    const [activePermissions, setActivePermissions] = useState<AccessPermission[]>([]);

    useEffect(() => {
        loadAccessData();
    }, [suiAddress]);

    async function loadAccessData() {
        // Load access requests, emergency accesses, and active permissions
        // This would typically query the blockchain for real data
        console.log('📊 Loading access control data...');
        
        // Mock data for demonstration
        setAccessRequests([
            {
                id: 'req-001',
                doctorAddress: '0xdoctor123...',
                doctorName: 'Dr. Smith',
                patientAddress: suiAddress,
                reason: 'Routine checkup and follow-up',
                accessLevel: 2,
                timestamp: Date.now() - 3600000,
                status: 'pending'
            }
        ]);
        
        setEmergencyAccesses([
            {
                id: 'emergency-001',
                doctorAddress: '0xemergency456...',
                doctorName: 'Dr. Emergency',
                patientAddress: suiAddress,
                reason: 'Patient unconscious, critical condition',
                timestamp: Date.now() - 1800000,
                isActive: true,
                masterKeyUsed: true
            }
        ]);
    }

    function handleRequestSent(request: AccessRequest) {
        setAccessRequests(prev => [...prev, request]);
    }

    function handleRequestProcessed(requestId: string, approved: boolean) {
        setAccessRequests(prev => 
            prev.map(req => 
                req.id === requestId 
                    ? { ...req, status: approved ? 'approved' : 'denied' }
                    : req
            )
        );
    }

    function handleEmergencyAccess(access: EmergencyAccess) {
        setEmergencyAccesses(prev => [...prev, access]);
    }

    function handleAccessRevoked(accessId: string) {
        setEmergencyAccesses(prev => 
            prev.map(access => 
                access.id === accessId 
                    ? { ...access, isActive: false }
                    : access
            )
        );
    }

    return (
        <div className="access-control-dashboard">
            <header>
                <h2>🔐 Access Control Management</h2>
                <p>Manage access permissions for health records</p>
            </header>

            <div className="dashboard-content">
                {/* Doctor Components */}
                {userRole === 'doctor' && (
                    <section className="doctor-section">
                        <DoctorAccessRequest
                            suiAddress={suiAddress}
                            suiClient={suiClient}
                            packageId={packageId}
                            onRequestSent={handleRequestSent}
                        />
                        
                        <EmergencyAccess
                            suiAddress={suiAddress}
                            suiClient={suiClient}
                            packageId={packageId}
                            onEmergencyAccess={handleEmergencyAccess}
                        />
                    </section>
                )}

                {/* Patient Components */}
                {userRole === 'patient' && (
                    <section className="patient-section">
                        <PatientAccessApproval
                            suiAddress={suiAddress}
                            suiClient={suiClient}
                            packageId={packageId}
                            accessRequests={accessRequests}
                            onRequestProcessed={handleRequestProcessed}
                        />
                        
                        <EmergencyAccessRevocation
                            suiAddress={suiAddress}
                            suiClient={suiClient}
                            packageId={packageId}
                            emergencyAccesses={emergencyAccesses}
                            onAccessRevoked={handleAccessRevoked}
                        />
                    </section>
                )}

                {/* Admin Components */}
                {userRole === 'admin' && (
                    <section className="admin-section">
                        <h3>🔧 System Administration</h3>
                        <p>Access control administration features would be implemented here.</p>
                    </section>
                )}
            </div>
        </div>
    );
}
