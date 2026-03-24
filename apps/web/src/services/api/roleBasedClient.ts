/**
 * Role-based API Client
 * Adds authentication headers and role information to API requests
 * Backend authorization remains mandatory - frontend guards are cosmetic only
 */

// REMOVED: import { store } from '@/store' to break circular dependency
// import { RootState } from '@/store' // Type import is fine if handled carefully, but let's avoid it to be safe
import { UserRole } from '@/types/role.types'

let _store: any = null

export const injectStore = (store: any) => {
  _store = store
}

/**
 * Get authentication headers for API requests
 * Includes token and user role information
 */
export function getAuthHeaders(): Record<string, string> {
  if (!_store) return {}
  
  const state = _store.getState()
  const token = state.auth.token
  const user = state.auth.user
  
  const headers: Record<string, string> = {}
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  if (user?.role) {
    headers['X-User-Role'] = user.role
  }
  
  return headers
}

/**
 * Get user role from Redux store
 */
export function getCurrentUserRole(): UserRole | null {
  if (!_store) return null

  const state = _store.getState()
  const user = state.auth.user
  
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
 * Check if current user has a specific role
 */
export function hasUserRole(role: UserRole): boolean {
  return getCurrentUserRole() === role
}

/**
 * Create authenticated request config
 * Adds authentication headers to any request config
 */
export function createAuthConfig(config: any = {}): any {
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
 * Role-based request interceptor
 * Automatically adds authentication headers to requests
 */
export function roleBasedRequestInterceptor(config: any): any {
  return createAuthConfig(config)
}

/**
 * Role-based response interceptor
 * Handles role-based authorization errors
 */
export function roleBasedResponseInterceptor(response: any): any {
  return response
}

/**
 * Handle role-based authorization errors
 */
export function roleBasedErrorInterceptor(error: any): any {
  if (error.response?.status === 403) {
    // Forbidden - user doesn't have required role/permission
    const role = getCurrentUserRole()
    console.warn(`Access denied for role: ${role || 'unauthenticated'}`)
    
    // Could trigger a notification or redirect here
    // For now, just log and let the calling code handle it
  }
  
  return Promise.reject(error)
}

/**
 * Role-based API endpoint helpers
 */
export const roleBasedAPI = {
  /**
   * Admin-only endpoints
   */
  admin: {
    users: '/admin/users',
    analytics: '/admin/analytics',
    settings: '/admin/settings',
    disputes: '/admin/disputes'
  },
  
  /**
   * Ops-only endpoints
   */
  ops: {
    escrow: '/ops/escrow',
    disputes: '/ops/disputes',
    financial: '/ops/financial',
    guarantees: '/ops/guarantees'
  },
  
  /**
   * User endpoints (all authenticated users)
   */
  user: {
    profile: '/user/profile',
    orders: '/user/orders',
    wallet: '/user/wallet',
    disputes: '/user/disputes'
  }
}

/**
 * Create role-specific API client
 * Ensures requests include proper role headers
 */
export function createRoleBasedClient(baseClient: any) {
  return {
    ...baseClient,
    
    /**
     * Admin-only API calls
     */
    admin: {
      get: (url: string, config?: any) => 
        baseClient.get(url, createAuthConfig(config)),
      
      post: (url: string, data?: any, config?: any) => 
        baseClient.post(url, data, createAuthConfig(config)),
      
      put: (url: string, data?: any, config?: any) => 
        baseClient.put(url, data, createAuthConfig(config)),
      
      patch: (url: string, data?: any, config?: any) => 
        baseClient.patch(url, data, createAuthConfig(config)),
      
      delete: (url: string, config?: any) => 
        baseClient.delete(url, createAuthConfig(config))
    },
    
    /**
     * Ops-only API calls
     */
    ops: {
      get: (url: string, config?: any) => 
        baseClient.get(url, createAuthConfig(config)),
      
      post: (url: string, data?: any, config?: any) => 
        baseClient.post(url, data, createAuthConfig(config)),
      
      put: (url: string, data?: any, config?: any) => 
        baseClient.put(url, data, createAuthConfig(config)),
      
      patch: (url: string, data?: any, config?: any) => 
        baseClient.patch(url, data, createAuthConfig(config)),
      
      delete: (url: string, config?: any) => 
        baseClient.delete(url, createAuthConfig(config))
    },
    
    /**
     * User API calls (all authenticated users)
     */
    user: {
      get: (url: string, config?: any) => 
        baseClient.get(url, createAuthConfig(config)),
      
      post: (url: string, data?: any, config?: any) => 
        baseClient.post(url, data, createAuthConfig(config)),
      
      put: (url: string, data?: any, config?: any) => 
        baseClient.put(url, data, createAuthConfig(config)),
      
      patch: (url: string, data?: any, config?: any) => 
        baseClient.patch(url, data, createAuthConfig(config)),
      
      delete: (url: string, config?: any) => 
        baseClient.delete(url, createAuthConfig(config))
    }
  }
}