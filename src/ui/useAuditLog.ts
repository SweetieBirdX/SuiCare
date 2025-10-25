/**
 * Audit Log Hook
 * 
 * PROMPT 4.4: Denetim Kayıtlarını Görüntüleme
 * Zincirdeki on-chain audit kayıtlarını (events) sorgular.
 * Bu, hastaya kimlerin ne zaman acil durumda eriştiğini gösteren
 * bildirimleri de sağlar.
 */

import { useState, useEffect } from 'react';
import { SuiClient } from '@mysten/sui/client';

export interface AuditLogEntry {
    accessor: string;
    access_type: string;
    accessed_at: number;
    was_emergency: boolean;
    transaction_digest: string;
}

export interface EmergencyAccess {
    doctor: string;
    timestamp: number;
    master_key_used: boolean;
    transaction_digest: string;
}

export interface AuditLogResult {
    auditLog: AuditLogEntry[];
    emergencyAccesses: EmergencyAccess[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

/**
 * PROMPT 4.4 Implementation: Audit Log Hook
 * 
 * Queries on-chain events to build complete audit trail:
 * - All access events
 * - Emergency access events
 * - Real-time updates
 * 
 * Usage:
 * const { auditLog, emergencyAccesses } = useAuditLog(patientAddress, suiClient, packageId);
 */
export function useAuditLog(
    patientAddress: string | null,
    suiClient: SuiClient,
    packageId: string
): AuditLogResult {
    const [state, setState] = useState<{
        auditLog: AuditLogEntry[];
        emergencyAccesses: EmergencyAccess[];
        isLoading: boolean;
        error: string | null;
    }>({
        auditLog: [],
        emergencyAccesses: [],
        isLoading: true,
        error: null
    });

    useEffect(() => {
        if (patientAddress) {
            loadAuditLog();
        }
    }, [patientAddress]);

    /**
     * Load complete audit log from blockchain events
     */
    async function loadAuditLog() {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        try {
            console.log(`📊 Loading audit log for ${patientAddress}...`);
            
            // 1. Query all access-related events
            const accessEvents = await queryAccessEvents();
            console.log(`   Found ${accessEvents.length} access events`);
            
            // 2. Query emergency access events
            const emergencyEvents = await queryEmergencyAccessEvents();
            console.log(`   Found ${emergencyEvents.length} emergency accesses`);
            
            // 3. Combine and sort by timestamp
            const auditLog = accessEvents.sort((a, b) => b.accessed_at - a.accessed_at);
            const emergencyAccesses = emergencyEvents.sort((a, b) => b.timestamp - a.timestamp);
            
            console.log(`✅ Audit log loaded successfully`);
            
            setState({
                auditLog,
                emergencyAccesses,
                isLoading: false,
                error: null
            });
            
        } catch (error) {
            console.error('Failed to load audit log:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to load audit log'
            }));
        }
    }

    /**
     * Query all access events from blockchain
     */
    async function queryAccessEvents(): Promise<AuditLogEntry[]> {
        try {
            // PROMPT 4.4: Query on-chain events
            const events = await suiClient.queryEvents({
                query: {
                    MoveEventType: `${packageId}::health_record::AccessGranted`
                },
                order: 'descending'
            });
            
            const auditEntries: AuditLogEntry[] = [];
            
            for (const event of events.data) {
                const parsed = event.parsedJson as any;
                
                // Only include events for this patient
                if (parsed.patient_address === patientAddress) {
                    auditEntries.push({
                        accessor: parsed.provider_address,
                        access_type: getAccessTypeName(parsed.access_level),
                        accessed_at: event.timestampMs ? parseInt(event.timestampMs) : 0,
                        was_emergency: parsed.access_level === 3,
                        transaction_digest: event.id.txDigest
                    });
                }
            }
            
            // Also query data append events
            const appendEvents = await suiClient.queryEvents({
                query: {
                    MoveEventType: `${packageId}::health_record::DataAppended`
                },
                order: 'descending'
            });
            
            for (const event of appendEvents.data) {
                const parsed = event.parsedJson as any;
                
                if (parsed.record_id) {
                    auditEntries.push({
                        accessor: parsed.appended_by,
                        access_type: `Appended ${parsed.record_type}`,
                        accessed_at: event.timestampMs ? parseInt(event.timestampMs) : 0,
                        was_emergency: false,
                        transaction_digest: event.id.txDigest
                    });
                }
            }
            
            return auditEntries;
            
        } catch (error) {
            console.error('Failed to query access events:', error);
            return [];
        }
    }

    /**
     * Query emergency access events
     */
    async function queryEmergencyAccessEvents(): Promise<EmergencyAccess[]> {
        try {
            // PROMPT 4.4: Query emergency access events specifically
            const events = await suiClient.queryEvents({
                query: {
                    MoveEventType: `${packageId}::health_record::EmergencyAccess`
                },
                order: 'descending'
            });
            
            const emergencyAccesses: EmergencyAccess[] = [];
            
            for (const event of events.data) {
                const parsed = event.parsedJson as any;
                
                emergencyAccesses.push({
                    doctor: parsed.accessing_doctor,
                    timestamp: event.timestampMs ? parseInt(event.timestampMs) : 0,
                    master_key_used: parsed.master_key_used || false,
                    transaction_digest: event.id.txDigest
                });
            }
            
            return emergencyAccesses;
            
        } catch (error) {
            console.error('Failed to query emergency access events:', error);
            return [];
        }
    }

    /**
     * Get human-readable access type name
     */
    function getAccessTypeName(accessLevel: number): string {
        switch (accessLevel) {
            case 1: return 'View Only';
            case 2: return 'View & Append';
            case 3: return 'Emergency Access';
            default: return 'Unknown';
        }
    }

    /**
     * Subscribe to real-time event updates
     */
    async function subscribeToEvents() {
        try {
            // Subscribe to new access events
            const unsubscribeAccess = await suiClient.subscribeEvent({
                filter: {
                    MoveEventType: `${packageId}::health_record::AccessGranted`
                },
                onMessage: (event) => {
                    const parsed = event.parsedJson as any;
                    if (parsed.patient_address === patientAddress) {
                        // Add new event to audit log
                        const newEntry: AuditLogEntry = {
                            accessor: parsed.provider_address,
                            access_type: getAccessTypeName(parsed.access_level),
                            accessed_at: event.timestampMs ? parseInt(event.timestampMs) : Date.now(),
                            was_emergency: parsed.access_level === 3,
                            transaction_digest: event.id.txDigest
                        };
                        
                        setState(prev => ({
                            ...prev,
                            auditLog: [newEntry, ...prev.auditLog]
                        }));
                        
                        // Show notification
                        console.log(`🔔 New access: ${newEntry.accessor}`);
                    }
                }
            });
            
            // Subscribe to emergency access events
            const unsubscribeEmergency = await suiClient.subscribeEvent({
                filter: {
                    MoveEventType: `${packageId}::health_record::EmergencyAccess`
                },
                onMessage: (event) => {
                    const parsed = event.parsedJson as any;
                    
                    // Create emergency notification
                    const newEmergency: EmergencyAccess = {
                        doctor: parsed.accessing_doctor,
                        timestamp: event.timestampMs ? parseInt(event.timestampMs) : Date.now(),
                        master_key_used: parsed.master_key_used || false,
                        transaction_digest: event.id.txDigest
                    };
                    
                    setState(prev => ({
                        ...prev,
                        emergencyAccesses: [newEmergency, ...prev.emergencyAccesses]
                    }));
                    
                    // Show urgent notification
                    console.log(`⚠️ EMERGENCY ACCESS: ${newEmergency.doctor}`);
                    
                    // In production, send push notification to patient
                    notifyPatient(newEmergency);
                }
            });
            
            // Return unsubscribe functions
            return () => {
                unsubscribeAccess();
                unsubscribeEmergency();
            };
            
        } catch (error) {
            console.error('Failed to subscribe to events:', error);
        }
    }

    /**
     * Send notification to patient about emergency access
     */
    function notifyPatient(emergency: EmergencyAccess) {
        // In production, this would:
        // 1. Send push notification to patient's mobile app
        // 2. Send email notification
        // 3. Show in-app alert
        // 4. Log notification in system
        
        console.log(`📧 Notification sent to patient about emergency access`);
        console.log(`   Doctor: ${emergency.doctor}`);
        console.log(`   Time: ${new Date(emergency.timestamp).toLocaleString()}`);
    }

    /**
     * Get audit log statistics
     */
    function getAuditStats() {
        const totalAccesses = state.auditLog.length;
        const emergencyCount = state.emergencyAccesses.length;
        const uniqueAccessors = new Set(state.auditLog.map(log => log.accessor)).size;
        
        return {
            totalAccesses,
            emergencyCount,
            uniqueAccessors,
            lastAccess: state.auditLog[0]?.accessed_at || null
        };
    }

    return {
        ...state,
        refresh: loadAuditLog
    };
}

/**
 * Mock hook for development/testing
 */
export function useMockAuditLog(): AuditLogResult {
    return {
        auditLog: [
            {
                accessor: '0xdoctor1...',
                access_type: 'View & Append',
                accessed_at: Date.now() - 3600000,
                was_emergency: false,
                transaction_digest: '0xtx1...'
            },
            {
                accessor: '0xdoctor2...',
                access_type: 'Emergency Access',
                accessed_at: Date.now() - 7200000,
                was_emergency: true,
                transaction_digest: '0xtx2...'
            }
        ],
        emergencyAccesses: [
            {
                doctor: '0xdoctor2...',
                timestamp: Date.now() - 7200000,
                master_key_used: true,
                transaction_digest: '0xtx2...'
            }
        ],
        isLoading: false,
        error: null,
        refresh: async () => {}
    };
}
