import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  persistent?: boolean
  actions?: Array<{
    label: string
    action: string
    style?: 'primary' | 'secondary'
  }>
  createdAt: number
}

interface NotificationState {
  notifications: Notification[]
  maxNotifications: number
}

const initialState: NotificationState = {
  notifications: [],
  maxNotifications: 5,
}

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'createdAt'>>) => {
      const notification: Notification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: Date.now(),
        duration: 5000, // Default 5 seconds
        ...action.payload,
      }
      
      state.notifications.unshift(notification)
      
      // Keep only max notifications
      if (state.notifications.length > state.maxNotifications) {
        state.notifications = state.notifications.slice(0, state.maxNotifications)
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      )
    },
    clearAllNotifications: (state) => {
      state.notifications = []
    },
    clearExpiredNotifications: (state) => {
      const now = Date.now()
      state.notifications = state.notifications.filter(notification => {
        if (notification.persistent) return true
        if (!notification.duration) return true
        return (now - notification.createdAt) < notification.duration
      })
    },
  },
})

export const {
  addNotification,
  removeNotification,
  clearAllNotifications,
  clearExpiredNotifications,
} = notificationSlice.actions

// Helper action creators
export const showSuccessNotification = (title: string, message: string) =>
  addNotification({ type: 'success', title, message })

export const showErrorNotification = (title: string, message: string) =>
  addNotification({ type: 'error', title, message, persistent: true })

export const showWarningNotification = (title: string, message: string) =>
  addNotification({ type: 'warning', title, message })

export const showInfoNotification = (title: string, message: string) =>
  addNotification({ type: 'info', title, message })

export default notificationSlice.reducer