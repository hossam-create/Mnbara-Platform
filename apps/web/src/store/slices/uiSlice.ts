import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  mobileMenuOpen: boolean
  searchModalOpen: boolean
  cartDrawerOpen: boolean
  filterDrawerOpen: boolean
  loading: {
    global: boolean
    page: boolean
    component: Record<string, boolean>
  }
  modals: {
    login: boolean
    register: boolean
    forgotPassword: boolean
    productQuickView: boolean
    addressForm: boolean
    paymentForm: boolean
  }
  breadcrumbs: Array<{
    label: string
    href?: string
  }>
  pageTitle: string
  metaDescription: string
  currentPage: string
  deviceType: 'mobile' | 'tablet' | 'desktop'
  networkStatus: 'online' | 'offline'
}

const initialState: UIState = {
  theme: 'system',
  sidebarOpen: false,
  mobileMenuOpen: false,
  searchModalOpen: false,
  cartDrawerOpen: false,
  filterDrawerOpen: false,
  loading: {
    global: false,
    page: false,
    component: {},
  },
  modals: {
    login: false,
    register: false,
    forgotPassword: false,
    productQuickView: false,
    addressForm: false,
    paymentForm: false,
  },
  breadcrumbs: [],
  pageTitle: 'Mnbara - eBay-Level Marketplace',
  metaDescription: 'Discover amazing products on Mnbara marketplace',
  currentPage: '/',
  deviceType: 'desktop',
  networkStatus: 'online',
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<UIState['theme']>) => {
      state.theme = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileMenuOpen = action.payload
    },
    toggleSearchModal: (state) => {
      state.searchModalOpen = !state.searchModalOpen
    },
    setSearchModalOpen: (state, action: PayloadAction<boolean>) => {
      state.searchModalOpen = action.payload
    },
    toggleCartDrawer: (state) => {
      state.cartDrawerOpen = !state.cartDrawerOpen
    },
    setCartDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.cartDrawerOpen = action.payload
    },
    toggleFilterDrawer: (state) => {
      state.filterDrawerOpen = !state.filterDrawerOpen
    },
    setFilterDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.filterDrawerOpen = action.payload
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload
    },
    setPageLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.page = action.payload
    },
    setComponentLoading: (state, action: PayloadAction<{ component: string; loading: boolean }>) => {
      state.loading.component[action.payload.component] = action.payload.loading
    },
    openModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = true
    },
    closeModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = false
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key as keyof UIState['modals']] = false
      })
    },
    setBreadcrumbs: (state, action: PayloadAction<UIState['breadcrumbs']>) => {
      state.breadcrumbs = action.payload
    },
    addBreadcrumb: (state, action: PayloadAction<{ label: string; href?: string }>) => {
      state.breadcrumbs.push(action.payload)
    },
    setPageTitle: (state, action: PayloadAction<string>) => {
      state.pageTitle = action.payload
    },
    setMetaDescription: (state, action: PayloadAction<string>) => {
      state.metaDescription = action.payload
    },
    setCurrentPage: (state, action: PayloadAction<string>) => {
      state.currentPage = action.payload
    },
    setDeviceType: (state, action: PayloadAction<UIState['deviceType']>) => {
      state.deviceType = action.payload
    },
    setNetworkStatus: (state, action: PayloadAction<UIState['networkStatus']>) => {
      state.networkStatus = action.payload
    },
  },
})

export const {
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  toggleSearchModal,
  setSearchModalOpen,
  toggleCartDrawer,
  setCartDrawerOpen,
  toggleFilterDrawer,
  setFilterDrawerOpen,
  setGlobalLoading,
  setPageLoading,
  setComponentLoading,
  openModal,
  closeModal,
  closeAllModals,
  setBreadcrumbs,
  addBreadcrumb,
  setPageTitle,
  setMetaDescription,
  setCurrentPage,
  setDeviceType,
  setNetworkStatus,
} = uiSlice.actions

export default uiSlice.reducer