/**
 * Audit Trail UI Components
 * 
 * Displays comprehensive audit trail for compliance and transparency
 * Implements KVKK, GDPR, HIPAA compliance requirements
 */

import React, { useState, useEffect } from 'react';
import { SuiClient } from '@mysten/sui/client';
import { AuditTrailAPI, AuditEvent, AuditTrailSummary, ComplianceReport } from './AuditTrailAPI';

// ==========================================
// Audit Trail Display Components
// ==========================================

/**
 * Main Audit Trail Dashboard
 */
export function AuditTrailDashboard({ 
    suiAddress, 
    suiClient, 
    packageId 
}: {
    suiAddress: string;
    suiClient: SuiClient;
    packageId: string;
}) {
    const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
    const [summary, setSummary] = useState<AuditTrailSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'emergency' | 'access' | 'data'>('all');
    const [dateRange, setDateRange] = useState<{start: number, end: number} | null>(null);

    const auditAPI = new AuditTrailAPI(suiClient, packageId);

    useEffect(() => {
        loadAuditData();
    }, [suiAddress, filter, dateRange]);

    async function loadAuditData() {
        setIsLoading(true);
        setError(null);
        
        try {
            console.log('📊 Loading audit trail data...');
            
            // Load audit events
            const events = await auditAPI.getAuditEvents(suiAddress, 100);
            setAuditEvents(events);
            
            // Load summary
            const auditSummary = await auditAPI.getAuditSummary(suiAddress);
            setSummary(auditSummary);
            
            console.log(`✅ Loaded ${events.length} audit events`);
            
        } catch (err) {
            console.error('❌ Failed to load audit data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load audit data');
        } finally {
            setIsLoading(false);
        }
    }

    function getFilteredEvents(): AuditEvent[] {
        let filtered = auditEvents;
        
        // Apply event type filter
        if (filter === 'emergency') {
            filtered = filtered.filter(e => e.isEmergency);
        } else if (filter === 'access') {
            filtered = filtered.filter(e => 
                ['access_request', 'access_granted', 'access_denied', 'access_revoked'].includes(e.eventType)
            );
        } else if (filter === 'data') {
            filtered = filtered.filter(e => 
                ['data_upload', 'data_viewed'].includes(e.eventType)
            );
        }
        
        // Apply date range filter
        if (dateRange) {
            filtered = filtered.filter(e => 
                e.timestamp >= dateRange.start && e.timestamp <= dateRange.end
            );
        }
        
        return filtered;
    }

    if (isLoading) {
        return (
            <div className="audit-trail-loading">
                <div className="loading-spinner"></div>
                <p>Loading audit trail data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="audit-trail-error">
                <h3>❌ Error Loading Audit Trail</h3>
                <p>{error}</p>
                <button onClick={loadAuditData} className="retry-button">
                    Retry
                </button>
            </div>
        );
    }

    const filteredEvents = getFilteredEvents();

    return (
        <div className="audit-trail-dashboard">
            <header>
                <h2>📊 Audit Trail Dashboard</h2>
                <p>Complete transparency and compliance tracking</p>
            </header>

            {/* Summary Cards */}
            {summary && (
                <AuditSummaryCards summary={summary} />
            )}

            {/* Filters and Controls */}
            <AuditFilters 
                filter={filter}
                onFilterChange={(newFilter) => setFilter(newFilter as 'all' | 'emergency' | 'access' | 'data')}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
            />

            {/* Audit Events List */}
            <AuditEventsList 
                events={filteredEvents}
                onEventClick={(event) => console.log('Event clicked:', event)}
            />

            {/* Compliance Report */}
            <ComplianceReportSection 
                suiAddress={suiAddress}
                auditAPI={auditAPI}
            />
        </div>
    );
}

/**
 * Audit Summary Cards
 */
function AuditSummaryCards({ summary }: { summary: AuditTrailSummary }) {
    return (
        <div className="audit-summary-cards">
            <div className="summary-card total">
                <h3>Total Events</h3>
                <p className="number">{summary.totalEvents}</p>
            </div>
            
            <div className="summary-card emergency">
                <h3>Emergency Access</h3>
                <p className="number">{summary.emergencyEvents}</p>
            </div>
            
            <div className="summary-card compliance">
                <h3>Compliance Score</h3>
                <p className={`number ${summary.complianceScore >= 90 ? 'good' : summary.complianceScore >= 70 ? 'warning' : 'critical'}`}>
                    {summary.complianceScore}%
                </p>
            </div>
            
            <div className="summary-card alerts">
                <h3>Critical Alerts</h3>
                <p className={`number ${summary.criticalAlerts > 0 ? 'critical' : 'good'}`}>
                    {summary.criticalAlerts}
                </p>
            </div>
        </div>
    );
}

/**
 * Audit Filters
 */
function AuditFilters({ 
    filter, 
    onFilterChange, 
    dateRange, 
    onDateRangeChange 
}: {
    filter: string;
    onFilterChange: (filter: string) => void;
    dateRange: {start: number, end: number} | null;
    onDateRangeChange: (range: {start: number, end: number} | null) => void;
}) {
    function setDateRange(days: number) {
        const end = Date.now();
        const start = end - (days * 24 * 60 * 60 * 1000);
        onDateRangeChange({ start, end });
    }

    return (
        <div className="audit-filters">
            <div className="filter-group">
                <label>Event Type:</label>
                <select 
                    value={filter} 
                    onChange={(e) => onFilterChange(e.target.value)}
                    className="filter-select"
                >
                    <option value="all">All Events</option>
                    <option value="emergency">Emergency Access</option>
                    <option value="access">Access Control</option>
                    <option value="data">Data Operations</option>
                </select>
            </div>

            <div className="filter-group">
                <label>Time Range:</label>
                <div className="date-buttons">
                    <button 
                        onClick={() => onDateRangeChange(null)}
                        className={!dateRange ? 'active' : ''}
                    >
                        All Time
                    </button>
                    <button 
                        onClick={() => setDateRange(7)}
                        className={dateRange && (Date.now() - dateRange.start) <= 7 * 24 * 60 * 60 * 1000 ? 'active' : ''}
                    >
                        Last 7 Days
                    </button>
                    <button 
                        onClick={() => setDateRange(30)}
                        className={dateRange && (Date.now() - dateRange.start) <= 30 * 24 * 60 * 60 * 1000 ? 'active' : ''}
                    >
                        Last 30 Days
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Audit Events List
 */
function AuditEventsList({ 
    events, 
    onEventClick 
}: {
    events: AuditEvent[];
    onEventClick: (event: AuditEvent) => void;
}) {
    if (events.length === 0) {
        return (
            <div className="no-events">
                <p>No audit events found for the selected criteria.</p>
            </div>
        );
    }

    return (
        <div className="audit-events-list">
            <h3>📋 Audit Events ({events.length})</h3>
            <div className="events-container">
                {events.map(event => (
                    <AuditEventCard 
                        key={event.id} 
                        event={event} 
                        onClick={() => onEventClick(event)}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Individual Audit Event Card
 */
function AuditEventCard({ 
    event, 
    onClick 
}: {
    event: AuditEvent;
    onClick: () => void;
}) {
    function getEventIcon(): string {
        switch (event.eventType) {
            case 'access_request': return '📝';
            case 'access_granted': return '✅';
            case 'access_denied': return '❌';
            case 'data_upload': return '📤';
            case 'emergency_access': return '🚨';
            case 'access_revoked': return '🔒';
            case 'data_viewed': return '👁️';
            default: return '📋';
        }
    }

    function getSeverityColor(): string {
        switch (event.severity) {
            case 'critical': return 'critical';
            case 'high': return 'high';
            case 'medium': return 'medium';
            case 'low': return 'low';
            default: return 'low';
        }
    }

    function getComplianceStatus(): string {
        const { gdpr, kvkk, hipaa } = event.compliance;
        if (gdpr && kvkk && hipaa) return 'compliant';
        if (gdpr && kvkk) return 'partial';
        return 'non-compliant';
    }

    return (
        <div 
            className={`audit-event-card ${getSeverityColor()} ${event.isEmergency ? 'emergency' : ''}`}
            onClick={onClick}
        >
            <div className="event-header">
                <div className="event-icon">
                    {getEventIcon()}
                </div>
                <div className="event-info">
                    <h4>{event.action}</h4>
                    <p className="event-actor">
                        {event.actorName} → {event.targetName}
                    </p>
                </div>
                <div className="event-meta">
                    <span className={`severity ${getSeverityColor()}`}>
                        {event.severity.toUpperCase()}
                    </span>
                    <span className={`compliance ${getComplianceStatus()}`}>
                        {getComplianceStatus().toUpperCase()}
                    </span>
                </div>
            </div>

            <div className="event-details">
                <div className="event-timestamp">
                    <strong>Time:</strong> {new Date(event.timestamp).toLocaleString()}
                </div>
                
                {event.details.reason && (
                    <div className="event-reason">
                        <strong>Reason:</strong> {event.details.reason}
                    </div>
                )}
                
                {event.details.emergencyReason && (
                    <div className="event-emergency">
                        <strong>Emergency Reason:</strong> {event.details.emergencyReason}
                    </div>
                )}
                
                {event.details.accessLevel && (
                    <div className="event-access-level">
                        <strong>Access Level:</strong> {
                            event.details.accessLevel === 1 ? 'Read Only' : 'Read & Append'
                        }
                    </div>
                )}
                
                {event.details.blobId && (
                    <div className="event-blob">
                        <strong>Data ID:</strong> {event.details.blobId}
                    </div>
                )}
            </div>

            <div className="event-compliance">
                <div className="compliance-badges">
                    <span className={`badge ${event.compliance.gdpr ? 'good' : 'bad'}`}>
                        GDPR: {event.compliance.gdpr ? '✓' : '✗'}
                    </span>
                    <span className={`badge ${event.compliance.kvkk ? 'good' : 'bad'}`}>
                        KVKK: {event.compliance.kvkk ? '✓' : '✗'}
                    </span>
                    <span className={`badge ${event.compliance.hipaa ? 'good' : 'bad'}`}>
                        HIPAA: {event.compliance.hipaa ? '✓' : '✗'}
                    </span>
                </div>
            </div>

            {event.isEmergency && (
                <div className="emergency-warning">
                    ⚠️ EMERGENCY ACCESS - MasterKey Used
                </div>
            )}

            {event.isRevocable && (
                <div className="revocable-notice">
                    🔄 This access can be revoked
                </div>
            )}
        </div>
    );
}

/**
 * Compliance Report Section
 */
function ComplianceReportSection({ 
    suiAddress, 
    auditAPI 
}: {
    suiAddress: string;
    auditAPI: AuditTrailAPI;
}) {
    const [report, setReport] = useState<ComplianceReport | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    async function generateReport() {
        setIsGenerating(true);
        try {
            const endDate = Date.now();
            const startDate = endDate - (30 * 24 * 60 * 60 * 1000); // Last 30 days
            
            const complianceReport = await auditAPI.generateComplianceReport(
                suiAddress, 
                startDate, 
                endDate
            );
            
            setReport(complianceReport);
        } catch (error) {
            console.error('Failed to generate compliance report:', error);
        } finally {
            setIsGenerating(false);
        }
    }

    return (
        <div className="compliance-report-section">
            <h3>📊 Compliance Report</h3>
            
            <button 
                onClick={generateReport}
                disabled={isGenerating}
                className="generate-report-button"
            >
                {isGenerating ? 'Generating...' : 'Generate 30-Day Report'}
            </button>

            {report && (
                <div className="compliance-report">
                    <div className="report-header">
                        <h4>Compliance Report</h4>
                        <p>Period: {new Date(report.period.start).toLocaleDateString()} - {new Date(report.period.end).toLocaleDateString()}</p>
                    </div>

                    <div className="report-metrics">
                        <div className="metric">
                            <h5>Total Events</h5>
                            <p>{report.totalEvents}</p>
                        </div>
                        <div className="metric">
                            <h5>Emergency Access</h5>
                            <p>{report.emergencyAccess}</p>
                        </div>
                        <div className="metric">
                            <h5>Compliance Violations</h5>
                            <p className={report.complianceViolations > 0 ? 'critical' : 'good'}>
                                {report.complianceViolations}
                            </p>
                        </div>
                    </div>

                    <div className="compliance-scores">
                        <div className="score">
                            <h5>GDPR Compliance</h5>
                            <div className="score-bar">
                                <div 
                                    className="score-fill" 
                                    style={{ width: `${report.gdprCompliance}%` }}
                                ></div>
                                <span>{report.gdprCompliance}%</span>
                            </div>
                        </div>
                        <div className="score">
                            <h5>KVKK Compliance</h5>
                            <div className="score-bar">
                                <div 
                                    className="score-fill" 
                                    style={{ width: `${report.kvkkCompliance}%` }}
                                ></div>
                                <span>{report.kvkkCompliance}%</span>
                            </div>
                        </div>
                        <div className="score">
                            <h5>HIPAA Compliance</h5>
                            <div className="score-bar">
                                <div 
                                    className="score-fill" 
                                    style={{ width: `${report.hipaaCompliance}%` }}
                                ></div>
                                <span>{report.hipaaCompliance}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
