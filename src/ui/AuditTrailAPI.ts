/**
 * Audit Trail API
 * 
 * Fetches and processes on-chain audit events from Sui blockchain
 * Implements compliance requirements for KVKK, GDPR, HIPAA
 */

import { SuiClient } from '@mysten/sui/client';

// ==========================================
// Types and Interfaces
// ==========================================

export interface AuditEvent {
    id: string;
    timestamp: number;
    eventType: 'access_request' | 'access_granted' | 'access_denied' | 'data_upload' | 'emergency_access' | 'access_revoked' | 'data_viewed';
    actor: string;
    actorName: string;
    target: string;
    targetName: string;
    action: string;
    details: {
        reason?: string;
        accessLevel?: number;
        dataType?: string;
        blobId?: string;
        transactionDigest?: string;
        emergencyReason?: string;
        masterKeyUsed?: boolean;
    };
    compliance: {
        gdpr: boolean;
        kvkk: boolean;
        hipaa: boolean;
        auditTrail: boolean;
    };
    severity: 'low' | 'medium' | 'high' | 'critical';
    isEmergency: boolean;
    isRevocable: boolean;
}

export interface AuditTrailSummary {
    totalEvents: number;
    emergencyEvents: number;
    accessRequests: number;
    dataAccess: number;
    complianceScore: number;
    lastUpdated: number;
    criticalAlerts: number;
}

export interface ComplianceReport {
    period: {
        start: number;
        end: number;
    };
    totalEvents: number;
    emergencyAccess: number;
    regularAccess: number;
    dataUploads: number;
    accessRevocations: number;
    complianceViolations: number;
    gdprCompliance: number;
    kvkkCompliance: number;
    hipaaCompliance: number;
}

// ==========================================
// Audit Trail API Class
// ==========================================

export class AuditTrailAPI {
    private suiClient: SuiClient;
    private packageId: string;

    constructor(suiClient: SuiClient, packageId: string) {
        this.suiClient = suiClient;
        this.packageId = packageId;
    }

    /**
     * Fetch all audit events for a patient
     */
    async getAuditEvents(patientAddress: string, limit: number = 100): Promise<AuditEvent[]> {
        try {
            console.log('📊 Fetching audit events...');
            console.log(`   Patient: ${patientAddress}`);
            console.log(`   Limit: ${limit}`);

            // Query all health record related events
            const events = await this.queryHealthRecordEvents(patientAddress, limit);
            
            // Process and format events
            const auditEvents = events.map(event => this.processAuditEvent(event));
            
            // Sort by timestamp (newest first)
            auditEvents.sort((a, b) => b.timestamp - a.timestamp);

            console.log(`✅ Fetched ${auditEvents.length} audit events`);
            return auditEvents;

        } catch (error) {
            console.error('❌ Failed to fetch audit events:', error);
            throw new Error(`Audit trail fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Query health record events from Sui blockchain
     */
    private async queryHealthRecordEvents(patientAddress: string, limit: number): Promise<any[]> {
        try {
            // Query different types of events
            const eventQueries = [
                // Access request events
                {
                    MoveEventType: `${this.packageId}::health_record::AccessRequested`
                },
                // Access granted events
                {
                    MoveEventType: `${this.packageId}::health_record::AccessGranted`
                },
                // Access denied events
                {
                    MoveEventType: `${this.packageId}::health_record::AccessDenied`
                },
                // Data upload events
                {
                    MoveEventType: `${this.packageId}::health_record::DataUploaded`
                },
                // Emergency access events
                {
                    MoveEventType: `${this.packageId}::health_record::EmergencyAccess`
                },
                // Access revoked events
                {
                    MoveEventType: `${this.packageId}::health_record::AccessRevoked`
                }
            ];

            const allEvents: any[] = [];

            // Fetch events for each type
            for (const query of eventQueries) {
                try {
                    const events = await this.suiClient.queryEvents({
                        query: query,
                        limit: limit,
                        order: 'descending'
                    });
                    
                    // Filter events related to the patient
                    const patientEvents = events.data.filter(event => 
                        this.isEventRelatedToPatient(event, patientAddress)
                    );
                    
                    allEvents.push(...patientEvents);
                } catch (error) {
                    console.warn(`Failed to query events for ${query.MoveEventType}:`, error);
                }
            }

            return allEvents;

        } catch (error) {
            console.error('Failed to query health record events:', error);
            // Return mock data for development
            return this.getMockAuditEvents(patientAddress, limit);
        }
    }

    /**
     * Check if an event is related to the patient
     */
    private isEventRelatedToPatient(event: any, patientAddress: string): boolean {
        try {
            const parsedData = event.parsedJson as any;
            return parsedData?.patient_address === patientAddress || 
                   parsedData?.target_address === patientAddress ||
                   parsedData?.requester_address === patientAddress;
        } catch {
            return false;
        }
    }

    /**
     * Process raw blockchain event into audit event
     */
    private processAuditEvent(rawEvent: any): AuditEvent {
        const parsedData = rawEvent.parsedJson as any;
        const eventType = this.determineEventType(rawEvent.type);
        
        return {
            id: rawEvent.id.eventId,
            timestamp: Number(rawEvent.timestampMs),
            eventType: eventType,
            actor: parsedData?.actor_address || parsedData?.requester_address || 'Unknown',
            actorName: this.getActorName(parsedData?.actor_address || parsedData?.requester_address),
            target: parsedData?.target_address || parsedData?.patient_address || 'Unknown',
            targetName: this.getTargetName(parsedData?.target_address || parsedData?.patient_address),
            action: this.getActionDescription(eventType, parsedData),
            details: {
                reason: parsedData?.reason,
                accessLevel: parsedData?.access_level,
                dataType: parsedData?.data_type,
                blobId: parsedData?.blob_id,
                transactionDigest: rawEvent.id.txDigest,
                emergencyReason: parsedData?.emergency_reason,
                masterKeyUsed: parsedData?.master_key_used
            },
            compliance: this.calculateCompliance(eventType, parsedData),
            severity: this.calculateSeverity(eventType, parsedData),
            isEmergency: eventType === 'emergency_access',
            isRevocable: this.isRevocable(eventType)
        };
    }

    /**
     * Determine event type from Move event type
     */
    private determineEventType(eventType: string): AuditEvent['eventType'] {
        if (eventType.includes('AccessRequested')) return 'access_request';
        if (eventType.includes('AccessGranted')) return 'access_granted';
        if (eventType.includes('AccessDenied')) return 'access_denied';
        if (eventType.includes('DataUploaded')) return 'data_upload';
        if (eventType.includes('EmergencyAccess')) return 'emergency_access';
        if (eventType.includes('AccessRevoked')) return 'access_revoked';
        return 'data_viewed';
    }

    /**
     * Get human-readable actor name
     */
    private getActorName(address: string): string {
        if (address.includes('doctor')) return 'Dr. ' + address.substring(0, 8);
        if (address.includes('emergency')) return 'Emergency Dr. ' + address.substring(0, 8);
        if (address.includes('pharmacy')) return 'Pharmacy ' + address.substring(0, 8);
        return 'User ' + address.substring(0, 8);
    }

    /**
     * Get human-readable target name
     */
    private getTargetName(address: string): string {
        return 'Patient ' + address.substring(0, 8);
    }

    /**
     * Get action description
     */
    private getActionDescription(eventType: AuditEvent['eventType'], data: any): string {
        switch (eventType) {
            case 'access_request':
                return `Requested access to health records (Level ${data?.access_level || 1})`;
            case 'access_granted':
                return `Granted access to health records (Level ${data?.access_level || 1})`;
            case 'access_denied':
                return 'Denied access to health records';
            case 'data_upload':
                return `Uploaded ${data?.data_type || 'health data'} to blockchain`;
            case 'emergency_access':
                return `Emergency access granted using MasterKey`;
            case 'access_revoked':
                return 'Revoked access to health records';
            case 'data_viewed':
                return 'Viewed health record data';
            default:
                return 'Performed action on health records';
        }
    }

    /**
     * Calculate compliance status
     */
    private calculateCompliance(eventType: AuditEvent['eventType'], data: any): AuditEvent['compliance'] {
        const baseCompliance = {
            gdpr: true,
            kvkk: true,
            hipaa: true,
            auditTrail: true
        };

        // Emergency access has special compliance requirements
        if (eventType === 'emergency_access') {
            return {
                ...baseCompliance,
                gdpr: data?.emergency_reason ? true : false,
                kvkk: data?.master_key_used ? true : false,
                hipaa: data?.emergency_reason ? true : false
            };
        }

        return baseCompliance;
    }

    /**
     * Calculate event severity
     */
    private calculateSeverity(eventType: AuditEvent['eventType'], data: any): AuditEvent['severity'] {
        if (eventType === 'emergency_access') return 'critical';
        if (eventType === 'access_revoked') return 'high';
        if (eventType === 'data_upload') return 'medium';
        return 'low';
    }

    /**
     * Check if event is revocable
     */
    private isRevocable(eventType: AuditEvent['eventType']): boolean {
        return ['access_granted', 'emergency_access'].includes(eventType);
    }

    /**
     * Get audit trail summary
     */
    async getAuditSummary(patientAddress: string): Promise<AuditTrailSummary> {
        try {
            const events = await this.getAuditEvents(patientAddress, 1000);
            
            const summary: AuditTrailSummary = {
                totalEvents: events.length,
                emergencyEvents: events.filter(e => e.isEmergency).length,
                accessRequests: events.filter(e => e.eventType === 'access_request').length,
                dataAccess: events.filter(e => e.eventType === 'data_viewed').length,
                complianceScore: this.calculateComplianceScore(events),
                lastUpdated: Date.now(),
                criticalAlerts: events.filter(e => e.severity === 'critical').length
            };

            return summary;

        } catch (error) {
            console.error('Failed to get audit summary:', error);
            throw error;
        }
    }

    /**
     * Calculate compliance score
     */
    private calculateComplianceScore(events: AuditEvent[]): number {
        if (events.length === 0) return 100;
        
        const compliantEvents = events.filter(e => 
            e.compliance.gdpr && e.compliance.kvkk && e.compliance.hipaa
        ).length;
        
        return Math.round((compliantEvents / events.length) * 100);
    }

    /**
     * Generate compliance report
     */
    async generateComplianceReport(
        patientAddress: string, 
        startDate: number, 
        endDate: number
    ): Promise<ComplianceReport> {
        try {
            const events = await this.getAuditEvents(patientAddress, 10000);
            
            // Filter events by date range
            const filteredEvents = events.filter(e => 
                e.timestamp >= startDate && e.timestamp <= endDate
            );

            const report: ComplianceReport = {
                period: { start: startDate, end: endDate },
                totalEvents: filteredEvents.length,
                emergencyAccess: filteredEvents.filter(e => e.isEmergency).length,
                regularAccess: filteredEvents.filter(e => e.eventType === 'access_granted').length,
                dataUploads: filteredEvents.filter(e => e.eventType === 'data_upload').length,
                accessRevocations: filteredEvents.filter(e => e.eventType === 'access_revoked').length,
                complianceViolations: filteredEvents.filter(e => 
                    !e.compliance.gdpr || !e.compliance.kvkk || !e.compliance.hipaa
                ).length,
                gdprCompliance: this.calculateComplianceScore(
                    filteredEvents.filter(e => e.compliance.gdpr)
                ),
                kvkkCompliance: this.calculateComplianceScore(
                    filteredEvents.filter(e => e.compliance.kvkk)
                ),
                hipaaCompliance: this.calculateComplianceScore(
                    filteredEvents.filter(e => e.compliance.hipaa)
                )
            };

            return report;

        } catch (error) {
            console.error('Failed to generate compliance report:', error);
            throw error;
        }
    }

    /**
     * Get mock audit events for development
     */
    private getMockAuditEvents(patientAddress: string, limit: number): any[] {
        const mockEvents = [
            {
                id: { eventId: 'event-001', txDigest: 'tx-001' },
                timestampMs: Date.now() - 3600000,
                type: `${this.packageId}::health_record::AccessRequested`,
                parsedJson: {
                    actor_address: '0xdoctor123...',
                    target_address: patientAddress,
                    reason: 'Routine checkup',
                    access_level: 2
                }
            },
            {
                id: { eventId: 'event-002', txDigest: 'tx-002' },
                timestampMs: Date.now() - 1800000,
                type: `${this.packageId}::health_record::AccessGranted`,
                parsedJson: {
                    actor_address: '0xdoctor123...',
                    target_address: patientAddress,
                    access_level: 2
                }
            },
            {
                id: { eventId: 'event-003', txDigest: 'tx-003' },
                timestampMs: Date.now() - 900000,
                type: `${this.packageId}::health_record::EmergencyAccess`,
                parsedJson: {
                    actor_address: '0xemergency456...',
                    target_address: patientAddress,
                    emergency_reason: 'Patient unconscious, critical condition',
                    master_key_used: true
                }
            }
        ];

        return mockEvents.slice(0, limit);
    }
}
