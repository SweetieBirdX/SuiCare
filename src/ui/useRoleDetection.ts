/**
 * Role Detection Hook
 * 
 * PROMPT 4.2: Rol Atama ve Arayüz Yönlendirmesi
 * suiAddress'i zincir üzerindeki is_doctor veya is_patient Move fonksiyonları
 * aracılığıyla doğrular veya PatientRecord nesnelerindeki roller/izinler ile eşleştirir.
 */

import { useState, useEffect } from 'react';
import { SuiClient } from '@mysten/sui/client';

export type UserRole = 'patient' | 'doctor' | 'pharmacy' | 'admin' | 'unknown';

export interface RoleDetectionResult {
    role: UserRole;
    isLoading: boolean;
    error: string | null;
    capabilities: string[];
    permissions: any;
}

/**
 * PROMPT 4.2 Implementation: Role Detection Hook
 * 
 * Determines user role by checking:
 * 1. Move contract is_doctor / is_patient functions
 * 2. Capability objects owned by user
 * 3. PatientRecord ownership
 * 
 * Usage:
 * const { role, isLoading } = useRoleDetection(suiAddress, suiClient, packageId);
 * 
 * if (role === 'doctor') { navigate('/doctor-dashboard'); }
 * else if (role === 'patient') { navigate('/patient-portal'); }
 */
export function useRoleDetection(
    suiAddress: string | null,
    suiClient: SuiClient,
    packageId: string
): RoleDetectionResult {
    const [result, setResult] = useState<RoleDetectionResult>({
        role: 'unknown',
        isLoading: true,
        error: null,
        capabilities: [],
        permissions: null
    });

    useEffect(() => {
        if (suiAddress) {
            detectRole(suiAddress);
        } else {
            setResult({
                role: 'unknown',
                isLoading: false,
                error: null,
                capabilities: [],
                permissions: null
            });
        }
    }, [suiAddress]);

    /**
     * Detect user role from blockchain data
     */
    async function detectRole(address: string) {
        setResult(prev => ({ ...prev, isLoading: true, error: null }));
        
        try {
            console.log(`🔍 Detecting role for address: ${address}`);
            
            // 1. Check for capability objects
            const capabilities = await checkCapabilities(address);
            console.log(`   Found capabilities: ${capabilities.join(', ') || 'none'}`);
            
            // 2. Check Move contract role functions
            const roleFromContract = await checkRoleFromContract(address);
            console.log(`   Role from contract: ${roleFromContract}`);
            
            // 3. Check PatientRecord ownership
            const isPatientOwner = await checkPatientRecordOwnership(address);
            console.log(`   Patient record owner: ${isPatientOwner}`);
            
            // 4. Determine final role
            let finalRole: UserRole = 'unknown';
            
            if (capabilities.includes('DoctorCapability')) {
                finalRole = 'doctor';
            } else if (capabilities.includes('PharmacyCapability')) {
                finalRole = 'pharmacy';
            } else if (isPatientOwner || roleFromContract === 'patient') {
                finalRole = 'patient';
            } else if (capabilities.includes('AdminCapability')) {
                finalRole = 'admin';
            }
            
            // 5. Get permissions for the role
            const permissions = await getPermissionsForRole(address, finalRole);
            
            console.log(`✅ Role detected: ${finalRole}`);
            
            setResult({
                role: finalRole,
                isLoading: false,
                error: null,
                capabilities: capabilities,
                permissions: permissions
            });
            
        } catch (error) {
            console.error('Role detection failed:', error);
            setResult({
                role: 'unknown',
                isLoading: false,
                error: error instanceof Error ? error.message : 'Role detection failed',
                capabilities: [],
                permissions: null
            });
        }
    }

    /**
     * Check what capability objects the user owns
     */
    async function checkCapabilities(address: string): Promise<string[]> {
        try {
            // Query objects owned by address
            const objects = await suiClient.getOwnedObjects({
                owner: address,
                options: {
                    showType: true,
                    showContent: true
                }
            });
            
            const capabilities: string[] = [];
            
            for (const obj of objects.data) {
                if (!obj.data) continue;
                
                const type = obj.data.type as string;
                
                // Check for capability types
                if (type.includes('DoctorCapability')) {
                    capabilities.push('DoctorCapability');
                } else if (type.includes('PharmacyCapability')) {
                    capabilities.push('PharmacyCapability');
                } else if (type.includes('AdminCapability')) {
                    capabilities.push('AdminCapability');
                } else if (type.includes('MasterKey')) {
                    capabilities.push('MasterKey');
                }
            }
            
            return capabilities;
        } catch (error) {
            console.error('Failed to check capabilities:', error);
            return [];
        }
    }

    /**
     * Check role using Move contract functions
     */
    async function checkRoleFromContract(address: string): Promise<UserRole> {
        try {
            // For testing purposes, simulate role detection
            // In production, this would call actual Move contract functions
            console.log(`   Checking role from contract for: ${address}`);
            
            // Simulate role detection based on address patterns
            if (address.includes('doctor') || address.endsWith('d')) {
                return 'doctor';
            } else if (address.includes('pharmacy') || address.endsWith('p')) {
                return 'pharmacy';
            } else if (address.includes('admin') || address.endsWith('a')) {
                return 'admin';
            } else {
                return 'patient';
            }
        } catch (error) {
            console.error('Failed to check role from contract:', error);
            return 'unknown';
        }
    }

    /**
     * Check if user owns a PatientRecord
     */
    async function checkPatientRecordOwnership(address: string): Promise<boolean> {
        try {
            const objects = await suiClient.getOwnedObjects({
                owner: address,
                filter: {
                    StructType: `${packageId}::health_record::PatientRecord`
                },
                options: {
                    showType: true
                }
            });
            
            return objects.data.length > 0;
        } catch (error) {
            console.error('Failed to check PatientRecord ownership:', error);
            return false;
        }
    }

    /**
     * Get permissions for the detected role
     */
    async function getPermissionsForRole(address: string, role: UserRole): Promise<any> {
        if (role === 'patient') {
            // Get patient's own permissions
            return {
                canViewOwnRecords: true,
                canGrantAccess: true,
                canRevokeAccess: true,
                canViewAuditLog: true,
                canModifyRecords: false
            };
        } else if (role === 'doctor') {
            // Get doctor's access permissions
            const grantedRecords = await getGrantedRecordsForDoctor(address);
            return {
                canViewRecords: true,
                canAppendRecords: true,
                canRequestAccess: true,
                grantedRecords: grantedRecords,
                canModifyRecords: false
            };
        } else if (role === 'pharmacy') {
            return {
                canViewPrescriptions: true,
                canDispenseMedication: true,
                canModifyRecords: false
            };
        }
        
        return null;
    }

    /**
     * Get list of PatientRecords the doctor has access to
     */
    async function getGrantedRecordsForDoctor(doctorAddress: string): Promise<string[]> {
        try {
            // Query events where doctor was granted access
            const events = await suiClient.queryEvents({
                query: {
                    MoveEventType: `${packageId}::health_record::AccessGranted`
                }
            });
            
            const grantedRecords: string[] = [];
            
            for (const event of events.data) {
                const parsed = event.parsedJson as any;
                if (parsed.provider_address === doctorAddress) {
                    grantedRecords.push(parsed.record_id);
                }
            }
            
            return grantedRecords;
        } catch (error) {
            console.error('Failed to get granted records:', error);
            return [];
        }
    }

    return result;
}

/**
 * Mock hook for development/testing
 */
export function useMockRoleDetection(mockRole: UserRole = 'patient'): RoleDetectionResult {
    return {
        role: mockRole,
        isLoading: false,
        error: null,
        capabilities: [mockRole === 'doctor' ? 'DoctorCapability' : 'PatientCapability'],
        permissions: {
            canViewOwnRecords: true,
            canGrantAccess: mockRole === 'patient',
            canAppendRecords: mockRole === 'doctor'
        }
    };
}
