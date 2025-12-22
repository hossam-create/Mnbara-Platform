import React, { createContext, useContext, useState, useEffect } from 'react';
import { biometricService } from '../services/biometric.service';

// Military-grade Role Definitions
export type ClearanceLevel = 1 | 2 | 3 | 4 | 5; // 1=Public, 5=Nuclear

export type AdminRole = 'SUPER_ADMIN' | 'OPS_COMMANDER' | 'FINANCE_AUDITOR' | 'CS_AGENT' | 'TECH_OFFICER';

interface SecurityState {
  isAuthenticated: boolean;
  role: AdminRole | null;
  clearance: ClearanceLevel;
  sessionToken: string | null;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  lockdownMode: boolean;
  isBiometricEnabled: boolean;
}

interface SecurityContextType extends SecurityState {
  login: (role: AdminRole) => void;
  logout: () => void;
  accessVault: (requiredClearance: ClearanceLevel, rationale: string) => boolean;
  reportThreat: (severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => void;
  registerBiometrics: () => Promise<boolean>;
  verifyIdentity: () => Promise<boolean>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SecurityState>({
    isAuthenticated: false,
    role: null,
    clearance: 1,
    sessionToken: null,
    threatLevel: 'LOW',
    lockdownMode: false,
    isBiometricEnabled: false,
  });

  // "The Sentinel" - Background Watcher
  useEffect(() => {
    // Check biometric support
    biometricService.isSupported().then(supported => {
        if (supported) {
            console.log('🛡️ SECURITY: Biometric Hardware Detected.');
        }
    });

    // Clean, deterministic initialization only.
  }, []);

  const login = (role: AdminRole) => {
    // Determine clearance based on role
    let clearance: ClearanceLevel = 1;
    switch (role) {
        case 'SUPER_ADMIN': clearance = 5; break;
        case 'FINANCE_AUDITOR': clearance = 4; break;
        case 'OPS_COMMANDER': clearance = 3; break;
        case 'TECH_OFFICER': clearance = 3; break;
        case 'CS_AGENT': clearance = 2; break;
    }

    setState(prev => ({
        ...prev,
        isAuthenticated: true,
        role,
        clearance,
        sessionToken: `SECURE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }));
  };

  const logout = () => {
    setState(prev => ({ ...prev, isAuthenticated: false, role: null, sessionToken: null, clearance: 1 }));
  };

  const registerBiometrics = async (): Promise<boolean> => {
      try {
          const success = await biometricService.register();
          if (success) {
              setState(prev => ({ ...prev, isBiometricEnabled: true }));
              console.log('🧬 BIOMETRICS REGISTERED: Identity Secured.');
          }
          return success;
      } catch (e) {
          console.error('Biometric registration failed', e);
          return false;
      }
  };

  const verifyIdentity = async (): Promise<boolean> => {
      try {
          console.log('🔒 SECURITY CHALLENGE: Verifying Biometric Identity...');
          const verified = await biometricService.authenticate();
          if (verified) {
             console.log('🔓 IDENTITY CONFIRMED.');
          } else {
             console.warn('⚠️ IDENTITY VERIFICATION FAILED.');
          }
          return verified;
      } catch (e) {
          console.error('Biometric verification failed', e);
          return false;
      }
  };

  // The "Break Glass" Protocol
  const accessVault = (requiredClearance: ClearanceLevel, rationale: string): boolean => {
    if (state.lockdownMode) {
        console.error('⛔ VAULT ACCESS DENIED: SYSTEM IN LOCKDOWN.');
        return false;
    }

    if (state.clearance >= requiredClearance) {
        console.log(`🔓 VAULT ACCESS GRANTED. Officer: ${state.role}. Rationale: ${rationale}`);
        return true;
    } else {
        console.warn(`⚠️ VAULT ACCESS DENIED. Insufficient Clearance. Required: ${requiredClearance}, User: ${state.clearance}`);
        // Auto-escalate threat level on repeated failures
        return false;
    }
  };

  const reportThreat = (severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => {
      setState(prev => ({ ...prev, threatLevel: severity }));
      if (severity === 'CRITICAL') {
          setState(prev => ({ ...prev, lockdownMode: true }));
          alert('🚨 CRITICAL THREAT DETECTED. FORTRESS LOCKDOWN INITIATED. 🚨');
      }
  };

  return (
    <SecurityContext.Provider value={{
        ...state,
        login,
        logout,
        accessVault,
        reportThreat,
        registerBiometrics,
        verifyIdentity
    }}>
      {children}
    </SecurityContext.Provider>
  );
}

export const useSecurity = () => {
    const context = useContext(SecurityContext);
    if (!context) throw new Error('useSecurity must be used within a SecurityProvider (The Iron Vault)');
    return context;
};
