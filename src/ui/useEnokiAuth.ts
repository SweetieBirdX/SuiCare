/**
 * Enoki zkLogin Authentication Hook
 * 
 * PROMPT 4.1: ZK Login Giriş Kontrolü
 * Kullanıcı Enoki ile giriş yaptığında, zkLogin verilerini kullanarak
 * kullanıcının Sui adresini belirler.
 */

import { useState, useEffect } from 'react';
import { EnokiClient } from '@mysten/enoki';
import { SuiClient } from '@mysten/sui/client';

export interface EnokiAuthState {
    user: any | null;
    suiAddress: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface EnokiAuthHook extends EnokiAuthState {
    signIn: (provider: 'google' | 'facebook' | 'microsoft' | 'twitch') => Promise<void>;
    signOut: () => Promise<void>;
    getZkProof: () => Promise<any>;
}

/**
 * PROMPT 4.1 Implementation: zkLogin Authentication Hook
 * 
 * Usage:
 * const { user, signIn, suiAddress, isAuthenticated } = useEnokiAuth();
 */
export function useEnokiAuth(
    enokiClient: EnokiClient,
    suiClient: SuiClient
): EnokiAuthHook {
    const [state, setState] = useState<EnokiAuthState>({
        user: null,
        suiAddress: null,
        isAuthenticated: false,
        isLoading: true,
        error: null
    });

    // Check for existing session on mount
    useEffect(() => {
        checkExistingSession();
    }, []);

    /**
     * Check if user already has an active session
     */
    async function checkExistingSession() {
        try {
            const sessionData = localStorage.getItem('enoki_session');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                
                // Verify session is still valid
                const isValid = await verifySession(session);
                if (isValid) {
                    setState({
                        user: session.user,
                        suiAddress: session.suiAddress,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null
                    });
                    return;
                }
            }
        } catch (error) {
            console.error('Session check failed:', error);
        }
        
        setState(prev => ({ ...prev, isLoading: false }));
    }

    /**
     * PROMPT 4.1: Sign in with zkLogin
     * Determines user's Sui address using zkLogin data
     */
    async function signIn(provider: 'google' | 'facebook' | 'microsoft' | 'twitch') {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        try {
            console.log(`🔐 Initiating zkLogin with ${provider}...`);
            
            // 1. Start zkLogin flow with Enoki
            const authUrl = await enokiClient.createAuthorizationURL({
                provider: provider,
                clientId: process.env.ENOKI_CLIENT_ID!,
                redirectUrl: window.location.origin + '/auth/callback',
                network: 'testnet'
            });
            
            // 2. Redirect to OAuth provider
            window.location.href = authUrl;
            
            // Note: After OAuth callback, handleCallback() should be called
            
        } catch (error) {
            console.error('zkLogin sign in failed:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Sign in failed'
            }));
        }
    }

    /**
     * Handle OAuth callback and complete zkLogin
     */
    async function handleCallback(code: string) {
        try {
            console.log('🔑 Processing zkLogin callback...');
            
            // 1. Exchange code for zkLogin proof
            const zkLoginProof = await enokiClient.handleOAuthCallback({
                code: code
            });
            
            // 2. Extract Sui address from zkLogin proof
            const suiAddress = zkLoginProof.address;
            
            console.log(`✅ zkLogin successful!`);
            console.log(`   Sui Address: ${suiAddress}`);
            
            // 3. Get user info
            const userInfo = await getUserInfo(suiAddress);
            
            // 4. Store session
            const session = {
                user: userInfo,
                suiAddress: suiAddress,
                zkProof: zkLoginProof,
                timestamp: Date.now()
            };
            
            localStorage.setItem('enoki_session', JSON.stringify(session));
            
            setState({
                user: userInfo,
                suiAddress: suiAddress,
                isAuthenticated: true,
                isLoading: false,
                error: null
            });
            
        } catch (error) {
            console.error('Callback handling failed:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Authentication failed'
            }));
        }
    }

    /**
     * Sign out user
     */
    async function signOut() {
        localStorage.removeItem('enoki_session');
        setState({
            user: null,
            suiAddress: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
        });
    }

    /**
     * Get zero-knowledge proof for transactions
     */
    async function getZkProof(): Promise<any> {
        const sessionData = localStorage.getItem('enoki_session');
        if (!sessionData) {
            throw new Error('No active session');
        }
        
        const session = JSON.parse(sessionData);
        return session.zkProof;
    }

    /**
     * Verify session is still valid
     */
    async function verifySession(session: any): Promise<boolean> {
        try {
            // Check if session is expired (24 hours)
            const now = Date.now();
            const sessionAge = now - session.timestamp;
            if (sessionAge > 24 * 60 * 60 * 1000) {
                return false;
            }
            
            // Verify Sui address is valid
            if (!session.suiAddress || !session.suiAddress.startsWith('0x')) {
                return false;
            }
            
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get user info from blockchain
     */
    async function getUserInfo(address: string): Promise<any> {
        try {
            // In production, query user profile from blockchain
            return {
                address: address,
                createdAt: Date.now()
            };
        } catch {
            return {
                address: address,
                createdAt: Date.now()
            };
        }
    }

    return {
        ...state,
        signIn,
        signOut,
        getZkProof
    };
}

/**
 * Mock hook for development/testing
 */
export function useMockEnokiAuth(): EnokiAuthHook {
    const [state, setState] = useState<EnokiAuthState>({
        user: null,
        suiAddress: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
    });

    async function signIn(provider: string) {
        const mockAddress = '0x' + Array(64).fill('1').join('');
        setState({
            user: { name: 'Test User', email: 'test@example.com' },
            suiAddress: mockAddress,
            isAuthenticated: true,
            isLoading: false,
            error: null
        });
    }

    async function signOut() {
        setState({
            user: null,
            suiAddress: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
        });
    }

    async function getZkProof() {
        return { proof: 'mock_proof' };
    }

    return {
        ...state,
        signIn,
        signOut,
        getZkProof
    };
}
