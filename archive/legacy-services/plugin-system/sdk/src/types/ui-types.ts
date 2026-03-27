/**
 * UI Types
 * 
 * Type definitions for the MNBara UI system
 */

/**
 * UI component types
 */
export type UIComponentType = 
  | 'button'
  | 'input'
  | 'select'
  | 'textarea'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'slider'
  | 'progress'
  | 'modal'
  | 'dialog'
  | 'tooltip'
  | 'popover'
  | 'dropdown'
  | 'menu'
  | 'tabs'
  | 'accordion'
  | 'card'
  | 'panel'
  | 'sidebar'
  | 'header'
  | 'footer'
  | 'navigation'
  | 'breadcrumb'
  | 'pagination'
  | 'table'
  | 'list'
  | 'grid'
  | 'chart'
  | 'form'
  | 'container'
  | 'wrapper'
  | 'spacer'
  | 'divider'
  | 'icon'
  | 'image'
  | 'video'
  | 'audio'
  | 'custom';

/**
 * UI component themes
 */
export type UITheme = 'light' | 'dark' | 'auto' | 'custom';

/**
 * UI component sizes
 */
export type UISize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';

/**
 * UI component variants
 */
export type UIVariant = 'solid' | 'outline' | 'ghost' | 'link' | 'unstyled' | 'custom';

/**
 * UI component colors
 */
export type UIColor = 
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'gray'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'blue'
  | 'cyan'
  | 'purple'
  | 'pink'
  | 'white'
  | 'black'
  | 'transparent';

/**
 * UI component states
 */
export type UIState = 'default' | 'hover' | 'focus' | 'active' | 'disabled' | 'loading' | 'error' | 'success';

/**
 * UI component positioning
 */
export type UIPosition = 'top' | 'bottom' | 'left' | 'right' | 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * UI component alignment
 */
export type UIAlignment = 'start' | 'center' | 'end' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly';

/**
 * UI component layout
 */
export type UILayout = 'horizontal' | 'vertical' | 'grid' | 'flex' | 'absolute' | 'relative' | 'fixed' | 'sticky';

/**
 * UI component definition
 */
export interface UIComponent {
  id: string;
  type: UIComponentType;
  name: string;
  description?: string;
  enabled: boolean;
  visible: boolean;
  theme: UITheme;
  size: UISize;
  variant: UIVariant;
  color: UIColor;
  state: UIState;
  position: UIPosition;
  alignment: UIAlignment;
  layout: UILayout;
  
  // Styling
  styles?: {
    className?: string;
    inline?: Record<string, string | number>;
    css?: string;
    responsive?: Record<string, any>;
    animations?: Record<string, any>;
    transitions?: Record<string, any>;
  };
  
  // Content
  content?: {
    text?: string;
    html?: string;
    icon?: string;
    image?: string;
    video?: string;
    audio?: string;
    children?: UIComponent[];
  };
  
  // Properties
  properties?: Record<string, any>;
  attributes?: Record<string, string | number | boolean>;
  
  // Events
  events?: {
    onClick?: (event: UIEvent) => void;
    onHover?: (event: UIEvent) => void;
    onFocus?: (event: UIEvent) => void;
    onBlur?: (event: UIEvent) => void;
    onChange?: (event: UIEvent) => void;
    onSubmit?: (event: UIEvent) => void;
    onKeyDown?: (event: UIEvent) => void;
    onKeyUp?: (event: UIEvent) => void;
    onKeyPress?: (event: UIEvent) => void;
    onMouseDown?: (event: UIEvent) => void;
    onMouseUp?: (event: UIEvent) => void;
    onMouseEnter?: (event: UIEvent) => void;
    onMouseLeave?: (event: UIEvent) => void;
    onMouseMove?: (event: UIEvent) => void;
    onScroll?: (event: UIEvent) => void;
    onResize?: (event: UIEvent) => void;
    onLoad?: (event: UIEvent) => void;
    onError?: (event: UIEvent) => void;
    onMount?: (component: UIComponent) => void;
    onUnmount?: (component: UIComponent) => void;
    onUpdate?: (component: UIComponent, prevProps: any) => void;
  };
  
  // Validation
  validation?: {
    required?: boolean;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    step?: number;
    custom?: (value: any) => boolean | string;
  };
  
  // Accessibility
  accessibility?: {
    label?: string;
    description?: string;
    role?: string;
    tabIndex?: number;
    ariaLabel?: string;
    ariaLabelledBy?: string;
    ariaDescribedBy?: string;
    ariaHidden?: boolean;
    ariaExpanded?: boolean;
    ariaSelected?: boolean;
    ariaChecked?: boolean;
    ariaDisabled?: boolean;
    ariaInvalid?: boolean;
    ariaRequired?: boolean;
    ariaLive?: 'off' | 'polite' | 'assertive';
    ariaAtomic?: boolean;
    ariaBusy?: boolean;
    ariaRelevant?: string;
    keyboardShortcuts?: string[];
    focusable?: boolean;
    focusTrap?: boolean;
  };
  
  // Metadata
  metadata?: Record<string, any>;
  tags?: string[];
  categories?: string[];
  
  // Lifecycle
  createdAt: Date;
  updatedAt: Date;
  version: string;
  
  // Plugin integration
  pluginId: string;
  pluginName: string;
  
  // Custom properties
  [key: string]: any;
}

/**
 * UI component creation options
 */
export interface UICreateOptions {
  pluginId?: string;
  theme?: UITheme;
  size?: UISize;
  variant?: UIVariant;
  color?: UIColor;
  state?: UIState;
  position?: UIPosition;
  alignment?: UIAlignment;
  layout?: UILayout;
  styles?: UIComponent['styles'];
  content?: UIComponent['content'];
  properties?: Record<string, any>;
  attributes?: Record<string, string | number | boolean>;
  events?: Partial<UIComponent['events']>;
  validation?: UIComponent['validation'];
  accessibility?: UIComponent['accessibility'];
  metadata?: Record<string, any>;
  tags?: string[];
  categories?: string[];
}

/**
 * UI event
 */
export interface UIEvent {
  type: string;
  target: UIComponent;
  currentTarget: UIComponent;
  data?: any;
  timestamp: Date;
  preventDefault: () => void;
  stopPropagation: () => void;
  stopImmediatePropagation: () => void;
  isDefaultPrevented: () => boolean;
  isPropagationStopped: () => boolean;
  isImmediatePropagationStopped: () => boolean;
}

/**
 * UI theme configuration
 */
export interface UIThemeConfig {
  name: string;
  type: UITheme;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    shadow: string;
  };
  typography: {
    fontFamily: string;
    fontSize: Record<UISize, string>;
    fontWeight: Record<'light' | 'normal' | 'medium' | 'semibold' | 'bold', number>;
    lineHeight: Record<UISize, string>;
    letterSpacing: Record<UISize, string>;
  };
  spacing: Record<UISize, string>;
  borderRadius: Record<UISize, string>;
  shadows: Record<UISize, string>;
  transitions: {
    duration: Record<'fast' | 'normal' | 'slow', string>;
    easing: Record<'ease-in' | 'ease-out' | 'ease-in-out' | 'linear', string>;
  };
  breakpoints: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', string>;
  zIndex: Record<'dropdown' | 'sticky' | 'fixed' | 'modal' | 'popover' | 'tooltip' | 'toast', number>;
}

/**
 * UI layout configuration
 */
export interface UILayoutConfig {
  type: UILayout;
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  justifyContent?: UIAlignment;
  alignItems?: UIAlignment;
  alignContent?: UIAlignment;
  gap?: string;
  padding?: string;
  margin?: string;
  width?: string;
  height?: string;
  minWidth?: string;
  minHeight?: string;
  maxWidth?: string;
  maxHeight?: string;
}

/**
 * UI component registry
 */
export interface UIComponentRegistry {
  register: (component: UIComponent) => Promise<string>;
  unregister: (id: string) => Promise<void>;
  get: (id: string) => Promise<UIComponent | null>;
  getAll: (filter?: Partial<UIComponent>) => Promise<UIComponent[]>;
  getByType: (type: UIComponentType) => Promise<UIComponent[]>;
  getByPlugin: (pluginId: string) => Promise<UIComponent[]>;
  update: (id: string, updates: Partial<UIComponent>) => Promise<UIComponent>;
  enable: (id: string) => Promise<void>;
  disable: (id: string) => Promise<void>;
  show: (id: string) => Promise<void>;
  hide: (id: string) => Promise<void>;
}

/**
 * UI context for plugin development
 */
export interface UIContext {
  // Component management
  createComponent: (config: Partial<UIComponent>) => Promise<UIComponent>;
  updateComponent: (id: string, updates: Partial<UIComponent>) => Promise<UIComponent>;
  deleteComponent: (id: string) => Promise<void>;
  getComponent: (id: string) => Promise<UIComponent | null>;
  getComponents: (filter?: Partial<UIComponent>) => Promise<UIComponent[]>;
  
  // Theme management
  getTheme: () => UITheme;
  setTheme: (theme: UITheme) => Promise<void>;
  getThemeConfig: (theme?: UITheme) => UIThemeConfig;
  registerTheme: (config: UIThemeConfig) => Promise<void>;
  
  // Layout management
  createLayout: (config: UILayoutConfig) => Promise<string>;
  updateLayout: (id: string, config: UILayoutConfig) => Promise<void>;
  deleteLayout: (id: string) => Promise<void>;
  getLayout: (id: string) => Promise<UILayoutConfig | null>;
  
  // Event handling
  on: (event: string, handler: (event: UIEvent) => void) => void;
  off: (event: string, handler: (event: UIEvent) => void) => void;
  emit: (event: string, data?: any) => void;
  
  // Styling
  addStyles: (styles: string) => Promise<void>;
  removeStyles: (id: string) => Promise<void>;
  addClass: (componentId: string, className: string) => Promise<void>;
  removeClass: (componentId: string, className: string) => Promise<void>;
  
  // State management
  getState: (componentId: string) => Promise<any>;
  setState: (componentId: string, state: any) => Promise<void>;
  subscribe: (componentId: string, callback: (state: any) => void) => Promise<() => void>;
  
  // Utilities
  showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => Promise<void>;
  showModal: (component: UIComponent) => Promise<void>;
  hideModal: (id: string) => Promise<void>;
  showLoading: (message?: string) => Promise<void>;
  hideLoading: () => Promise<void>;
  
  // Validation
  validateComponent: (component: UIComponent) => Promise<boolean>;
  
  // Accessibility
  announce: (message: string, priority?: 'polite' | 'assertive') => Promise<void>;
  focus: (componentId: string) => Promise<void>;
  
  // Logging
  log: (level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: any) => void;
  
  // Error handling
  createError: (code: string, message: string, details?: any) => Error;
  throwError: (error: Error) => never;
  
  // Utilities
  delay: (ms: number) => Promise<void>;
  timeout: <T>(promise: Promise<T>, ms: number) => Promise<T>;
  retry: <T>(fn: () => Promise<T>, options?: { count?: number; delay?: number }) => Promise<T>;
  
  // Validation
  validate: (data: any, schema: any) => boolean;
  
  // Security
  checkPermission: (permission: string) => boolean;
  
  // Timing
  startTimer: (name: string) => void;
  endTimer: (name: string) => number;
  getElapsedTime: (name: string) => number;
}

/**
 * Default UI theme configuration
 */
export const DEFAULT_UI_THEME_CONFIG: UIThemeConfig = {
  name: 'MNBara Default',
  type: 'light',
  colors: {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#06B6D4',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    shadow: 'rgba(0, 0, 0, 0.1)'
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem'
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      xs: '1rem',
      sm: '1.25rem',
      md: '1.5rem',
      lg: '1.75rem',
      xl: '1.75rem',
      '2xl': '2rem',
      '3xl': '2.25rem',
      '4xl': '2.5rem',
      '5xl': '1'
    },
    letterSpacing: {
      xs: '0.025em',
      sm: '0.025em',
      md: '0',
      lg: '-0.025em',
      xl: '-0.025em',
      '2xl': '-0.025em',
      '3xl': '-0.05em',
      '4xl': '-0.05em',
      '5xl': '-0.05em'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem',
    '5xl': '8rem'
  },
  borderRadius: {
    xs: '0.125rem',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    '4xl': '2rem',
    '5xl': '3rem'
  },
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
    '4xl': '0 45px 80px -20px rgba(0, 0, 0, 0.35)',
    '5xl': '0 55px 100px -25px rgba(0, 0, 0, 0.4)'
  },
  transitions: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms'
    },
    easing: {
      'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
      'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
      'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      linear: 'linear'
    }
  },
  breakpoints: {
    xs: '0px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
    toast: 1070
  }
} as const;