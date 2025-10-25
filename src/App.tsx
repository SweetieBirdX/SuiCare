/**
 * SuiCare Main Application
 * 
 * Complete UI implementation with role-based access control
 * Implements all requirements from Aşama III
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SuiClient } from '@mysten/sui/client';
import { getEnokiManager } from './enoki-integration';
import { currentConfig } from './config';

// Import UI components
import {
    LoginPage,
    RoleBasedRouter,
    PatientPortal,
    DoctorDashboard,
    PharmacyDashboard,
    AdminPanel,
    RoleSetup
} from './ui/SuiCareUI';

// ==========================================
// Main App Component
// ==========================================

export default function App() {
    const [suiClient] = React.useState(() => new SuiClient({ url: currentConfig.sui.rpcUrl }));
    const [enokiManager] = React.useState(() => getEnokiManager());

    return (
        <Router>
            <div className="app">
                <header className="app-header">
                    <h1>🏥 SuiCare</h1>
                    <p>Secure Healthcare Data Management</p>
                </header>

                <main className="app-main">
                    <Routes>
                        {/* Authentication and Role Detection */}
                        <Route 
                            path="/" 
                            element={
                                <RoleBasedRouter 
                                    enokiClient={enokiManager}
                                    suiClient={suiClient}
                                    packageId={currentConfig.sui.movePackageId}
                                />
                            } 
                        />

                        {/* Role-specific Dashboards */}
                        <Route 
                            path="/patient-portal" 
                            element={
                                <PatientPortal 
                                    suiAddress="0x1234567890abcdef1234567890abcdef12345678"
                                    suiClient={suiClient}
                                    packageId={currentConfig.sui.movePackageId}
                                />
                            } 
                        />

                        <Route 
                            path="/doctor-dashboard" 
                            element={
                                <DoctorDashboard 
                                    suiAddress="0x1234567890abcdef1234567890abcdef12345678"
                                    suiClient={suiClient}
                                    packageId={currentConfig.sui.movePackageId}
                                />
                            } 
                        />

                        <Route 
                            path="/pharmacy-dashboard" 
                            element={
                                <PharmacyDashboard 
                                    suiAddress="0x1234567890abcdef1234567890abcdef12345678"
                                    suiClient={suiClient}
                                    packageId={currentConfig.sui.movePackageId}
                                />
                            } 
                        />

                        <Route 
                            path="/admin-panel" 
                            element={
                                <AdminPanel 
                                    suiAddress="0x1234567890abcdef1234567890abcdef12345678"
                                    suiClient={suiClient}
                                    packageId={currentConfig.sui.movePackageId}
                                />
                            } 
                        />

                        <Route 
                            path="/role-setup" 
                            element={
                                <RoleSetup 
                                    suiAddress="0x1234567890abcdef1234567890abcdef12345678"
                                    suiClient={suiClient}
                                    packageId={currentConfig.sui.movePackageId}
                                />
                            } 
                        />

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>

                <footer className="app-footer">
                    <p>🔒 Powered by Sui Blockchain • Seal Encryption • Walrus Storage</p>
                    <p>GDPR • KVKK • HIPAA Compliant</p>
                </footer>
            </div>
        </Router>
    );
}

// ==========================================
// CSS Styles (Inline for simplicity)
// ==========================================

const styles = `
.app {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app-header {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    padding: 2rem;
    text-align: center;
    color: white;
}

.app-header h1 {
    margin: 0;
    font-size: 2.5rem;
    font-weight: 700;
}

.app-header p {
    margin: 0.5rem 0 0 0;
    font-size: 1.2rem;
    opacity: 0.9;
}

.app-main {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.app-footer {
    background: rgba(0, 0, 0, 0.1);
    padding: 1rem;
    text-align: center;
    color: white;
    font-size: 0.9rem;
}

/* Login Page Styles */
.login-container {
    background: white;
    border-radius: 20px;
    padding: 3rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    text-align: center;
    max-width: 500px;
    margin: 0 auto;
}

.login-container h1 {
    color: #333;
    margin-bottom: 0.5rem;
}

.login-container h2 {
    color: #666;
    margin-bottom: 2rem;
    font-weight: 400;
}

.login-providers {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 2rem 0;
}

.login-btn {
    padding: 1rem 2rem;
    border: none;
    border-radius: 10px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.login-btn.google {
    background: #4285f4;
    color: white;
}

.login-btn.microsoft {
    background: #0078d4;
    color: white;
}

.login-btn.facebook {
    background: #1877f2;
    color: white;
}

.login-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.security-info {
    margin-top: 2rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 10px;
    text-align: left;
}

.security-info p {
    margin: 0.5rem 0;
    color: #28a745;
    font-weight: 500;
}

/* Dashboard Styles */
.patient-portal,
.doctor-dashboard,
.pharmacy-dashboard,
.admin-panel,
.role-setup {
    background: white;
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
}

.patient-portal header,
.doctor-dashboard header,
.pharmacy-dashboard header,
.admin-panel header,
.role-setup header {
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 1rem;
    margin-bottom: 2rem;
}

.patient-portal h1,
.doctor-dashboard h1,
.pharmacy-dashboard h1,
.admin-panel h1,
.role-setup h1 {
    color: #333;
    margin: 0;
    font-size: 2rem;
}

.patient-portal p,
.doctor-dashboard p,
.pharmacy-dashboard p,
.admin-panel p,
.role-setup p {
    color: #666;
    margin: 0.5rem 0 0 0;
}

/* Critical Warning Styles */
.critical-warning {
    background: #fff3cd;
    border: 2px solid #ffc107;
    border-radius: 10px;
    padding: 1.5rem;
    margin: 1rem 0;
    color: #856404;
}

.critical-warning h3 {
    color: #dc3545;
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
}

.critical-warning p {
    margin: 0.5rem 0;
    font-weight: 500;
}

/* Role Setup Styles */
.role-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin: 2rem 0;
}

.role-option {
    border: 2px solid #e0e0e0;
    border-radius: 15px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    background: white;
}

.role-option:hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.role-option.selected {
    border-color: #667eea;
    background: #f8f9ff;
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.2);
}

.role-option h3 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1.3rem;
}

.role-option p {
    color: #666;
    margin-bottom: 1rem;
    line-height: 1.5;
}

.role-option ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.role-option li {
    padding: 0.3rem 0;
    font-size: 0.9rem;
}

.role-confirmation {
    background: #f8f9ff;
    border-radius: 10px;
    padding: 1.5rem;
    margin-top: 2rem;
    text-align: center;
}

.confirm-button {
    background: #667eea;
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 10px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 1rem;
}

.confirm-button:hover {
    background: #5a6fd8;
    transform: translateY(-2px);
}

.confirm-button:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
}

/* Admin Panel Styles */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin: 1rem 0;
}

.stat-card {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 1.5rem;
    text-align: center;
}

.stat-card h3 {
    margin: 0 0 0.5rem 0;
    color: #666;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.stat-card p {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
    color: #333;
}

.stat-card p.good {
    color: #28a745;
}

.stat-card p.warning {
    color: #ffc107;
}

.users-table {
    margin-top: 1rem;
}

.user-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 10px;
    margin-bottom: 0.5rem;
    align-items: center;
}

.user-row .role {
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
}

.user-row .role.patient {
    background: #e3f2fd;
    color: #1976d2;
}

.user-row .role.doctor {
    background: #f3e5f5;
    color: #7b1fa2;
}

.user-row .status {
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
}

.user-row .status.active {
    background: #e8f5e8;
    color: #2e7d32;
}

/* Access Control Styles */
.access-control-dashboard {
    background: #f8f9fa;
    border-radius: 15px;
    padding: 2rem;
    margin: 1rem 0;
}

.access-request-form,
.access-approval,
.emergency-access-form,
.emergency-revocation {
    background: white;
    border-radius: 10px;
    padding: 1.5rem;
    margin: 1rem 0;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #333;
}

.form-input,
.form-textarea,
.form-select {
    width: 100%;
    padding: 0.8rem;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
    outline: none;
    border-color: #667eea;
}

.form-textarea {
    resize: vertical;
    min-height: 80px;
}

.submit-button,
.emergency-button {
    background: #667eea;
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.submit-button:hover,
.emergency-button:hover {
    background: #5a6fd8;
    transform: translateY(-2px);
}

.submit-button:disabled,
.emergency-button:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
}

.emergency-button {
    background: #dc3545;
}

.emergency-button:hover {
    background: #c82333;
}

.request-info,
.emergency-info {
    background: #e3f2fd;
    border-radius: 8px;
    padding: 1rem;
    margin-top: 1rem;
    font-size: 0.9rem;
    color: #1976d2;
}

.emergency-warning {
    background: #fff3cd;
    border: 2px solid #ffc107;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    color: #856404;
}

.emergency-warning p {
    margin: 0.5rem 0;
    font-weight: 600;
}

.access-request-card,
.emergency-access-card {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 1.5rem;
    margin: 1rem 0;
    border-left: 4px solid #667eea;
}

.emergency-access-card {
    border-left-color: #dc3545;
}

.request-header,
.access-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.request-header h4,
.access-header h4 {
    margin: 0;
    color: #333;
}

.request-time,
.access-time {
    font-size: 0.9rem;
    color: #666;
}

.request-details,
.access-details {
    margin-bottom: 1rem;
}

.request-details p,
.access-details p {
    margin: 0.5rem 0;
    color: #666;
}

.request-actions,
.access-actions {
    display: flex;
    gap: 1rem;
}

.approve-button,
.deny-button,
.revoke-button {
    padding: 0.8rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.approve-button {
    background: #28a745;
    color: white;
}

.approve-button:hover {
    background: #218838;
}

.deny-button {
    background: #dc3545;
    color: white;
}

.deny-button:hover {
    background: #c82333;
}

.revoke-button {
    background: #ffc107;
    color: #212529;
}

.revoke-button:hover {
    background: #e0a800;
}

.no-requests,
.no-emergency-access {
    text-align: center;
    padding: 2rem;
    color: #28a745;
    font-weight: 600;
}

.access-denied {
    text-align: center;
    padding: 2rem;
    color: #dc3545;
}

.requests-list,
.emergency-access-list {
    max-height: 400px;
    overflow-y: auto;
}

/* Emergency Access Specific Styles */
.emergency-access-form {
    border: 2px solid #dc3545;
    background: #fff5f5;
}

.emergency-access-form h3 {
    color: #dc3545;
    margin-top: 0;
}

.emergency-access-denied {
    text-align: center;
    padding: 2rem;
    color: #dc3545;
}

/* Responsive Design */
@media (max-width: 768px) {
    .app-main {
        padding: 1rem;
    }
    
    .login-container,
    .patient-portal,
    .doctor-dashboard,
    .pharmacy-dashboard,
    .admin-panel,
    .role-setup {
        padding: 1.5rem;
    }
    
    .role-options {
        grid-template-columns: 1fr;
    }
    
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .request-actions,
    .access-actions {
        flex-direction: column;
    }
    
    .request-header,
    .access-header {
        flex-direction: column;
        align-items: flex-start;
    }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}
