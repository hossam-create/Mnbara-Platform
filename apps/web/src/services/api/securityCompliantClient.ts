/**
 * SECURITY-COMPLIANT BACKEND API CLIENT
 * ACCESS CONTROL & AUTHORITY POLICY IMPLEMENTATION
 * 
 * CRITICAL SECURITY NOTICE:
 * - Frontend UI has ZERO authority over access control
 * - All security decisions enforced EXCLUSIVELY in Backend
 * - X-User-Role header is INFORMATIONAL ONLY
 * - Backend validates ALL permissions independently
 * - Authorization token is mandatory on every request
 * 
 * VIOLATION OF THIS POLICY COMPROMISES SYSTEM SECURITY
 */

import { store } from '@/store'
import { RootState } from '@/store'
import { UserRole } from '@/types/role.types'

/**
 * SECURITY AUDIT: Get authentication headers for API requests
 * WARNING: Headers are INFORMATIONAL ONLY - Backend validates independently
 */
export function getAuthHeaders(): Record<string, string> {
  const state = store.getState() as RootState
  const token = state.auth.token
  const user = state.auth.user
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[SECURITY AUDIT] getAuthHeaders called:', {
      hasToken: !!token,
      userRole: user?.role,
      warning: 'Headers are INFORMATIONAL ONLY - Backend validates independently',
      security: 'Frontend has ZERO authority over access control'
    });
  }
  
  const headers: Record<string, string> = {}
  
  // MANDATORY: Authorization token for backend validation
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  // INFORMATIONAL: X-User-Role header - Backend validates independently
  if (user?.role) {
    headers['X-User-Role'] = user.role
  }
  
  return headers
}

/**
 * SECURITY AUDIT: Get user role from Redux store
 * WARNING: Role is COSMETIC ONLY - Backend validates independently
 */
export function getCurrentUserRole(): UserRole | null {
  const state = store.getState() as RootState
  const user = state.auth.user
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[SECURITY AUDIT] getCurrentUserRole called:', {
      userRole: user?.role,
      warning: 'Role is COSMETIC ONLY - Backend validates independently',
      security: 'Frontend has ZERO authority over access control'
    });
  }
  
  if (!user?.role) {
    return null
  }
  
  // Validate role is one of the allowed values
  const validRoles = Object.values(UserRole)
  if (validRoles.includes(user.role as UserRole)) {
    return user.role as UserRole
  }
  
  return null
}

/**
 * SECURITY AUDIT: Check if current user has a specific role
 * WARNING: Check is COSMETIC ONLY - Backend validates independently
 */
export function hasUserRole(role: UserRole): boolean {
  const currentRole = getCurrentUserRole()
  const hasRole = currentRole === role
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[SECURITY AUDIT] hasUserRole called:', {
      requestedRole: role,
      currentRole,
      hasRole,
      warning: 'Check is COSMETIC ONLY - Backend validates independently',
      security: 'Frontend has ZERO authority over access control',
      policy: 'Backend validates ALL permissions independently'
    });
  }
  
  return hasRole
}

/**
 * SECURITY AUDIT: Create authenticated request config
 * WARNING: Config is INFORMATIONAL ONLY - Backend validates independently
 */
export function createAuthConfig(config: any = {}): any {
  if (process.env.NODE_ENV === 'development') {
    console.log('[SECURITY AUDIT] createAuthConfig called:', {
      warning: 'Config is INFORMATIONAL ONLY - Backend validates independently',
      security: 'Frontend has ZERO authority over access control',
      policy: 'Authorization token is mandatory on every request'
    });
  }
  
  const authHeaders = getAuthHeaders()
  
  return {
    ...config,
    headers: {
      ...config.headers,
      ...authHeaders
    }
  }
}

/**
 * SECURITY AUDIT: Role-based request interceptor
 * WARNING: Interceptor is INFORMATIONAL ONLY - Backend validates independently
 */
export function roleBasedRequestInterceptor(config: any): any {
  if (process.env.NODE_ENV === 'development') {
    console.log('[SECURITY AUDIT] roleBasedRequestInterceptor called:', {
      warning: 'Interceptor is INFORMATIONAL ONLY - Backend validates independently',
      security: 'Frontend has ZERO authority over access control',
      policy: 'Backend rejects unauthorized access regardless of UI state'
    });
  }
  
  return createAuthConfig(config)
}

/**
 * SECURITY AUDIT: Role-based response interceptor
 * WARNING: Interceptor is INFORMATIONAL ONLY - Backend validates independently
 */
export function roleBasedResponseInterceptor(response: any): any {
  if (process.env.NODE_ENV === 'development') {
    console.log('[SECURITY AUDIT] roleBasedResponseInterceptor called:', {
      status: response.status,
      warning: 'Interceptor is INFORMATIONAL ONLY - Backend validates independently',
      security: 'Frontend has ZERO authority over access control'
    });
  }
  
  return response
}

/**
 * SECURITY AUDIT: Handle role-based authorization errors
 * CRITICAL: Backend enforces ALL security decisions
 */
export function roleBasedErrorInterceptor(error: any): any {
  if (error.response?.status === 403) {
    // FORBIDDEN: Backend rejected access - Frontend has NO authority
    const role = getCurrentUserRole()
    
    if (process.env.NODE_ENV === 'development') {
      console.error('[SECURITY AUDIT] 403 Forbidden - Backend rejected access:', {
        userRole: role || 'unauthenticated',
        error: error.response?.data,
        security: 'Backend correctly enforced access control',
        policy: 'Frontend has ZERO authority over access control',
        authority: 'ALL security decisions enforced EXCLUSIVELY in Backend'
      });
    }
    
    // Log security violation attempt
    console.warn('[SECURITY] Backend access control enforced - Frontend has no authority');
    
  } else if (error.response?.status === 401) {
    // UNAUTHORIZED: Token validation failed
    if (process.env.NODE_ENV === 'development') {
      console.error('[SECURITY AUDIT] 401 Unauthorized - Token validation failed:', {
        security: 'Backend correctly rejected invalid token',
        policy: 'Authorization token is mandatory on every request'
      });
    }
  }
  
  return Promise.reject(error)
}

/**
 * SECURITY AUDIT: Role-based API endpoint helpers
 * WARNING: Endpoints require backend validation - Frontend has NO authority
 */
export const roleBasedAPI = {
  /**
   * ADMIN-ONLY endpoints - Backend validates ALL access
   * CRITICAL: Frontend has ZERO authority over admin access
   */
  admin: {
    users: '/admin/users',           // Backend validates admin role
    analytics: '/admin/analytics',   // Backend validates admin role
    settings: '/admin/settings',     // Backend validates admin role
    disputes: '/admin/disputes',     // Backend validates admin role
    ledger: '/admin/ledger',         // Backend validates admin role
    payouts: '/admin/payouts'        // Backend validates admin role
  },
  
  /**
   * OPS-ONLY endpoints - Backend validates ALL access
   * CRITICAL: Frontend has ZERO authority over ops access
   */
  ops: {
    escrow: '/ops/escrow',           // Backend validates ops role
    disputes: '/ops/disputes',       // Backend validates ops role
    financial: '/ops/financial',     // Backend validates ops role
    guarantees: '/ops/guarantees',  // Backend validates ops role
    monitoring: '/ops/monitoring'    // Backend validates ops role
  },
  
  /**
   * USER endpoints - Backend validates authentication
   * CRITICAL: All endpoints require backend validation
   */
  user: {
    profile: '/user/profile',          // Backend validates token
    orders: '/user/orders',            // Backend validates token
    wallet: '/user/wallet',            // Backend validates token
    disputes: '/user/disputes'         // Backend validates token
  }
}

/**
 * SECURITY AUDIT: Create role-specific API client
 * WARNING: Client is INFORMATIONAL ONLY - Backend validates independently
 * CRITICAL: Frontend has ZERO authority over API access
 */
export function createRoleBasedClient(baseClient: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[SECURITY AUDIT] createRoleBasedClient called:', {
      warning: 'Client is INFORMATIONAL ONLY - Backend validates independently',
      security: 'Frontend has ZERO authority over API access',
      policy: 'Backend validates ALL permissions independently'
    });
  }
  
  return {
    ...baseClient,
    
    /**
     * ADMIN-ONLY API calls - Backend validates ALL access
     * CRITICAL: Frontend has ZERO authority over admin API calls
     */
    admin: {
      get: (url: string, config?: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[SECURITY AUDIT] Admin API GET called:', {
            url,
            warning: 'Backend validates admin access - Frontend has NO authority',
            security: 'Backend enforces ALL security decisions'
          });
        }
        return baseClient.get(url, createAuthConfig(config))
      },
      
      post: (url: string, data?: any, config?: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[SECURITY AUDIT] Admin API POST called:', {
            url,
            warning: 'Backend validates admin access - Frontend has NO authority',
            security: 'Backend enforces ALL security decisions'
          });
        }
        return baseClient.post(url, data, createAuthConfig(config))
      },
      
      put: (url: string, data?: any, config?: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[SECURITY AUDIT] Admin API PUT called:', {
            url,
            warning: 'Backend validates admin access - Frontend has NO authority',
            security: 'Backend enforces ALL security decisions'
          });
        }
        return baseClient.put(url, data, createAuthConfig(config))
      },
      
      patch: (url: string, data?: any, config?: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[SECURITY AUDIT] Admin API PATCH called:', {
            url,
            warning: 'Backend validates admin access - Frontend has NO authority',
            security: 'Backend enforces ALL security decisions'
          });
        }
        return baseClient.patch(url, data, createAuthConfig(config))
      },
      
      delete: (url: string, config?: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[SECURITY AUDIT] Admin API DELETE called:', {
            url,
            warning: 'Backend validates admin access - Frontend has NO authority',
            security: 'Backend enforces ALL security decisions'
          });
        }
        return baseClient.delete(url, createAuthConfig(config))
      }
    },
    
    /**
     * OPS-ONLY API calls - Backend validates ALL access
     * CRITICAL: Frontend has ZERO authority over ops API calls
     */
    ops: {
      get: (url: string, config?: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[SECURITY AUDIT] Ops API GET called:', {
            url,
            warning: 'Backend validates ops access - Frontend has NO authority',
            security: 'Backend enforces ALL security decisions'
          });
        }
        return baseClient.get(url, createAuthConfig(config))
      },
      
      post: (url: string, data?: any, config?: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[SECURITY AUDIT] Ops API POST called:', {
            url,
            warning: 'Backend validates ops access - Frontend has NO authority',
            security: 'Backend enforces ALL security decisions'
          });
        }
        return baseClient.post(url, data, createAuthConfig(config))
      },
      
      put: (url: string, data?: any, config?: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[SECURITY AUDIT] Ops API PUT called:', {
            url,
            warning: 'Backend validates ops access - Frontend has NO authority',
            security: 'Backend enforces ALL security decisions'
          });
        }
        return baseClient.put(url, data, createAuthConfig(config))
      },
      
      patch: (url: string, data?: any, config?: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[SECURITY AUDIT] Ops API PATCH called:', {
            url,
            warning: 'Backend validates ops access - Frontend has NO authority',
            security: 'Backend enforces ALL security decisions'
          });
        }
        return baseClient.patch(url, data, createAuthConfig(config))
      },
      
      delete: (url: string, config?: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[SECURITY AUDIT] Ops API DELETE called:', {
            url,
            warning: 'Backend validates ops access - Frontend has NO authority',
            security: 'Backend enforces ALL security decisions'
          });
        }
        return baseClient.delete(url, createAuthConfig(config))
      }
    },
    
    /**
     * USER API calls - Backend validates authentication
     * CRITICAL: All user API calls require backend validation
     */
    user: {
      get: (url: string, config?: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[SECURITY AUDIT] User API GET called:', {
            url,
            warning: 'Backend validates user access - Frontend has NO authority',
            security: 'Backend enforces ALL security decisions'
          });
        }
        return baseClient.get(url, createAuthConfig(config))
      },
      
      post: (url: string, data?: any, config?: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[SECURITY AUDIT] User API POST called:', {
            url,
            warning: 'Backend validates user access - Frontend has NO authority',
            security: 'Backend enforces ALL security decisions'
          });
        }
        return baseClient.post(url, data, createAuthConfig(config))
      },
      
      put: (url: string, data?: any, config?: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[SECURITY AUDIT] User API PUT called:', {
            url,
            warning: 'Backend validates user access - Frontend has NO authority',
            security: 'Backend enforces ALL security decisions'
          });
        }
        return baseClient.put(url, data, createAuthConfig(config))
      },
      
      patch: (url: string, data?: any, config?: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[SECURITY AUDIT] User API PATCH called:', {
            url,
            warning: 'Backend validates user access - Frontend has NO authority',
            security: 'Backend enforces ALL security decisions'
          });
        }
        return baseClient.patch(url, data, createAuthConfig(config))
      },
      
      delete: (url: string, config?: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[SECURITY AUDIT] User API DELETE called:', {
            url,
            warning: 'Backend validates user access - Frontend has NO authority',
            security: 'Backend enforces ALL security decisions'
          });
        }
        return baseClient.delete(url, createAuthConfig(config))
      }
    }
  }
}