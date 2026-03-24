import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@/store'
import { setCredentials, clearCredentials, refreshToken } from '@/store/slices/authSlice'
import { authAPI } from '@/services/api/authAPI'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: any
  login: (email: string, password: string) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: any) => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
export { AuthContext }

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { user, token, refreshToken: refreshTokenValue, isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  )
  const [initializing, setInitializing] = useState(true)

  // Initialize auth state on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have a valid token
        if (token) {
          // Verify token is still valid by fetching user profile
          try {
            const response = await authAPI.getProfile()
            dispatch(setCredentials({
              user: response.data,
              token,
              refreshToken: refreshTokenValue!
            }))
          } catch (error) {
            // Token is invalid, try to refresh
            if (refreshTokenValue) {
              try {
                await dispatch(refreshToken()).unwrap()
              } catch (refreshError) {
                // Refresh failed, clear credentials
                dispatch(clearCredentials())
              }
            } else {
              dispatch(clearCredentials())
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        dispatch(clearCredentials())
      } finally {
        setInitializing(false)
      }
    }

    initializeAuth()
  }, [dispatch, token, refreshTokenValue])

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!token || !refreshTokenValue) return

    // Decode JWT to get expiration time
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]))
      const expirationTime = tokenPayload.exp * 1000 // Convert to milliseconds
      const currentTime = Date.now()
      const timeUntilExpiration = expirationTime - currentTime
      
      // Refresh token 5 minutes before expiration
      const refreshTime = Math.max(timeUntilExpiration - 5 * 60 * 1000, 0)

      if (refreshTime > 0) {
        const refreshTimer = setTimeout(() => {
          dispatch(refreshToken())
        }, refreshTime)

        return () => clearTimeout(refreshTimer)
      }
    } catch (error) {
      console.error('Error parsing token:', error)
    }
  }, [token, refreshTokenValue, dispatch])

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password })
      dispatch(setCredentials(response.data))
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed')
    }
  }

  const register = async (userData: any) => {
    try {
      const response = await authAPI.register(userData)
      dispatch(setCredentials(response.data))
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed')
    }
  }

  const logout = async () => {
    try {
      if (token) {
        await authAPI.logout(token)
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      dispatch(clearCredentials())
    }
  }

  const updateProfile = async (data: any) => {
    try {
      const response = await authAPI.updateProfile(data)
      dispatch(setCredentials({
        user: response.data,
        token: token!,
        refreshToken: refreshTokenValue!
      }))
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Profile update failed')
    }
  }

  const refreshAuth = async () => {
    if (refreshTokenValue) {
      await dispatch(refreshToken()).unwrap()
    }
  }

  const value: AuthContextType = {
    isAuthenticated,
    isLoading: isLoading || initializing,
    user,
    login,
    register,
    logout,
    updateProfile,
    refreshAuth,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
