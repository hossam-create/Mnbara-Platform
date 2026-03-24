import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { io, Socket } from 'socket.io-client'
import { RootState } from '@/store'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  emit: (event: string, data?: any) => void
  on: (event: string, callback: (data: any) => void) => void
  off: (event: string, callback?: (data: any) => void) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: React.ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { isAuthenticated, token, user } = useSelector((state: RootState) => state.auth)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  useEffect(() => {
    if (isAuthenticated && token && user) {
      // Initialize socket connection
      const socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080', {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      })

      // Connection event handlers
      socketInstance.on('connect', () => {
        console.log('Socket connected:', socketInstance.id)
        setIsConnected(true)
        reconnectAttempts.current = 0

        // Join user-specific room
        socketInstance.emit('join-user-room', { userId: user.id })
      })

      socketInstance.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason)
        setIsConnected(false)
      })

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        setIsConnected(false)
        reconnectAttempts.current++

        if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error('Max reconnection attempts reached')
          socketInstance.disconnect()
        }
      })

      // Real-time event handlers
      socketInstance.on('notification', (data) => {
        console.log('Received notification:', data)
        // Handle real-time notifications
        // You can dispatch to notification slice here
      })

      socketInstance.on('order-update', (data) => {
        console.log('Order update:', data)
        // Handle real-time order updates
      })

      socketInstance.on('message', (data) => {
        console.log('Received message:', data)
        // Handle real-time messages
      })

      socketInstance.on('auction-update', (data) => {
        console.log('Auction update:', data)
        // Handle real-time auction updates
      })

      socketInstance.on('price-alert', (data) => {
        console.log('Price alert:', data)
        // Handle price alerts for watchlist items
      })

      socketInstance.on('inventory-update', (data) => {
        console.log('Inventory update:', data)
        // Handle real-time inventory updates
      })

      setSocket(socketInstance)

      // Cleanup on unmount or auth change
      return () => {
        console.log('Cleaning up socket connection')
        socketInstance.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
    } else {
      // User is not authenticated, disconnect socket
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [isAuthenticated, token, user])

  // Handle page visibility changes to manage connection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (socket) {
        if (document.hidden) {
          // Page is hidden, reduce socket activity
          socket.emit('user-inactive')
        } else {
          // Page is visible, resume normal activity
          socket.emit('user-active')
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [socket])

  // Handle network status changes
  useEffect(() => {
    const handleOnline = () => {
      if (socket && !socket.connected) {
        socket.connect()
      }
    }

    const handleOffline = () => {
      if (socket && socket.connected) {
        socket.disconnect()
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [socket])

  const emit = (event: string, data?: any) => {
    if (socket && isConnected) {
      socket.emit(event, data)
    } else {
      console.warn('Socket not connected, cannot emit event:', event)
    }
  }

  const on = (event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, callback)
    }
  }

  const off = (event: string, callback?: (data: any) => void) => {
    if (socket) {
      if (callback) {
        socket.off(event, callback)
      } else {
        socket.off(event)
      }
    }
  }

  const value: SocketContextType = {
    socket,
    isConnected,
    emit,
    on,
    off,
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}