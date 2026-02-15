/**
 * UI Components
 * 
 * UI component utilities for MNBara plugins
 */

import { PluginContext } from '../types/plugin-types';

export enum UIComponentType {
  BUTTON = 'button',
  INPUT = 'input',
  SELECT = 'select',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  TEXTAREA = 'textarea',
  FORM = 'form',
  MODAL = 'modal',
  DROPDOWN = 'dropdown',
  MENU = 'menu',
  NAVIGATION = 'navigation',
  CARD = 'card',
  PANEL = 'panel',
  TABS = 'tabs',
  ACCORDION = 'accordion',
  ALERT = 'alert',
  BADGE = 'badge',
  PROGRESS = 'progress',
  SPINNER = 'spinner',
  ICON = 'icon',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  CHART = 'chart',
  TABLE = 'table',
  LIST = 'list',
  GRID = 'grid',
  CONTAINER = 'container',
  LAYOUT = 'layout',
  CUSTOM = 'custom'
}

export enum UITheme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto'
}

export enum UISize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

export enum UIVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  INFO = 'info',
  NEUTRAL = 'neutral'
}

export interface UIStyle {
  theme?: UITheme;
  size?: UISize;
  variant?: UIVariant;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: string;
  borderWidth?: string;
  padding?: string;
  margin?: string;
  width?: string;
  height?: string;
  minWidth?: string;
  minHeight?: string;
  maxWidth?: string;
  maxHeight?: string;
  fontSize?: string;
  fontWeight?: string;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  display?: 'block' | 'inline' | 'inline-block' | 'flex' | 'grid' | 'none';
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  gap?: string;
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  zIndex?: string;
  opacity?: string;
  visibility?: 'visible' | 'hidden';
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
  boxShadow?: string;
  transition?: string;
  animation?: string;
  cursor?: string;
  userSelect?: 'none' | 'text' | 'all';
  pointerEvents?: 'none' | 'auto';
}

export interface UIComponent {
  id: string;
  type: UIComponentType;
  props: Record<string, any>;
  style?: UIStyle;
  children?: UIComponent[];
  events?: Record<string, (event: any) => void>;
  metadata?: Record<string, any>;
  pluginId: string;
  parentId?: string;
  order?: number;
  visible?: boolean;
  enabled?: boolean;
  validation?: UIValidation;
  accessibility?: UIAccessibility;
  responsive?: UIResponsive;
}

export interface UIValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string | RegExp;
  custom?: (value: any) => boolean | string;
  message?: string;
}

export interface UIAccessibility {
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  role?: string;
  tabIndex?: number;
  focusable?: boolean;
  keyboardNavigation?: boolean;
  screenReaderText?: string;
}

export interface UIResponsive {
  breakpoints?: {
    [breakpoint: string]: Partial<UIStyle>;
  };
  hideOn?: string[];
  showOn?: string[];
}

export interface UIManager {
  // Component management
  create: (type: UIComponentType, props: Record<string, any>, options?: UICreateOptions) => UIComponent;
  update: (id: string, updates: Partial<UIComponent>) => UIComponent;
  delete: (id: string) => boolean;
  get: (id: string) => UIComponent | undefined;
  getAll: (pluginId?: string) => UIComponent[];
  
  // Component hierarchy
  addChild: (parentId: string, child: UIComponent, index?: number) => void;
  removeChild: (parentId: string, childId: string) => void;
  moveChild: (parentId: string, childId: string, newIndex: number) => void;
  
  // Styling
  setStyle: (id: string, style: Partial<UIStyle>) => void;
  getStyle: (id: string) => UIStyle | undefined;
  applyTheme: (theme: UITheme) => void;
  
  // Events
  addEventListener: (id: string, event: string, handler: (event: any) => void) => void;
  removeEventListener: (id: string, event: string, handler?: (event: any) => void) => void;
  emitEvent: (id: string, event: string, data?: any) => void;
  
  // State management
  show: (id: string) => void;
  hide: (id: string) => void;
  enable: (id: string) => void;
  disable: (id: string) => void;
  
  // Validation
  validate: (id: string) => boolean;
  getValidationErrors: (id: string) => string[];
  
  // Theming
  getTheme: () => UITheme;
  setTheme: (theme: UITheme) => void;
  
  // Responsive
  setBreakpoint: (breakpoint: string, style: Partial<UIStyle>) => void;
  getBreakpoint: (breakpoint: string) => Partial<UIStyle> | undefined;
  
  // Plugin-specific
  getPluginComponents: (pluginId: string) => UIComponent[];
  clearPluginComponents: (pluginId: string) => void;
  
  // Utilities
  find: (predicate: (component: UIComponent) => boolean) => UIComponent[];
  query: (selector: string) => UIComponent[];
  clone: (id: string, newId?: string) => UIComponent;
}

export interface UICreateOptions {
  pluginId?: string;
  style?: UIStyle;
  parentId?: string;
  order?: number;
  visible?: boolean;
  enabled?: boolean;
  validation?: UIValidation;
  accessibility?: UIAccessibility;
  responsive?: UIResponsive;
  metadata?: Record<string, any>;
}

export interface UIComponentFactory {
  create: (type: UIComponentType, props: Record<string, any>, options?: UICreateOptions) => UIComponent;
  register: (type: UIComponentType, creator: ComponentCreator) => void;
  unregister: (type: UIComponentType) => void;
  getCreator: (type: UIComponentType) => ComponentCreator | undefined;
  getRegisteredTypes: () => UIComponentType[];
}

export type ComponentCreator = (props: Record<string, any>, options?: UICreateOptions) => UIComponent;

export class DefaultUIManager implements UIManager {
  private components: Map<string, UIComponent> = new Map();
  private theme: UITheme = UITheme.LIGHT;
  private breakpoints: Map<string, Partial<UIStyle>> = new Map();
  private componentFactory: UIComponentFactory;

  constructor(
    private pluginContext: PluginContext,
    componentFactory?: UIComponentFactory
  ) {
    this.componentFactory = componentFactory || new DefaultUIComponentFactory();
  }

  create(type: UIComponentType, props: Record<string, any>, options?: UICreateOptions): UIComponent {
    const component = this.componentFactory.create(type, props, {
      ...options,
      pluginId: this.pluginContext.id
    });
    
    this.components.set(component.id, component);
    return component;
  }

  update(id: string, updates: Partial<UIComponent>): UIComponent {
    const component = this.components.get(id);
    if (!component) {
      throw new Error(`Component not found: ${id}`);
    }

    const updatedComponent = { ...component, ...updates };
    this.components.set(id, updatedComponent);
    return updatedComponent;
  }

  delete(id: string): boolean {
    const component = this.components.get(id);
    if (!component) {
      return false;
    }

    // Remove from parent if it has one
    if (component.parentId) {
      const parent = this.components.get(component.parentId);
      if (parent && parent.children) {
        parent.children = parent.children.filter(child => child.id !== id);
      }
    }

    // Remove children
    if (component.children) {
      for (const child of component.children) {
        this.delete(child.id);
      }
    }

    return this.components.delete(id);
  }

  get(id: string): UIComponent | undefined {
    return this.components.get(id);
  }

  getAll(pluginId?: string): UIComponent[] {
    const components = Array.from(this.components.values());
    if (pluginId) {
      return components.filter(component => component.pluginId === pluginId);
    }
    return components;
  }

  addChild(parentId: string, child: UIComponent, index?: number): void {
    const parent = this.components.get(parentId);
    if (!parent) {
      throw new Error(`Parent component not found: ${parentId}`);
    }

    if (!parent.children) {
      parent.children = [];
    }

    // Update child's parentId
    child.parentId = parentId;

    if (index !== undefined && index >= 0 && index <= parent.children.length) {
      parent.children.splice(index, 0, child);
    } else {
      parent.children.push(child);
    }

    // Store the child component
    this.components.set(child.id, child);
  }

  removeChild(parentId: string, childId: string): void {
    const parent = this.components.get(parentId);
    if (!parent || !parent.children) {
      return;
    }

    parent.children = parent.children.filter(child => child.id !== childId);

    // Remove the child component
    this.components.delete(childId);
  }

  moveChild(parentId: string, childId: string, newIndex: number): void {
    const parent = this.components.get(parentId);
    if (!parent || !parent.children) {
      throw new Error(`Parent component not found: ${parentId}`);
    }

    const currentIndex = parent.children.findIndex(child => child.id === childId);
    if (currentIndex === -1) {
      throw new Error(`Child component not found: ${childId}`);
    }

    const [child] = parent.children.splice(currentIndex, 1);
    parent.children.splice(newIndex, 0, child);
  }

  setStyle(id: string, style: Partial<UIStyle>): void {
    const component = this.components.get(id);
    if (!component) {
      throw new Error(`Component not found: ${id}`);
    }

    component.style = { ...component.style, ...style };
  }

  getStyle(id: string): UIStyle | undefined {
    const component = this.components.get(id);
    return component?.style;
  }

  applyTheme(theme: UITheme): void {
    this.theme = theme;
    
    // Apply theme to all components
    for (const component of this.components.values()) {
      if (component.style) {
        component.style.theme = theme;
      }
    }
  }

  addEventListener(id: string, event: string, handler: (event: any) => void): void {
    const component = this.components.get(id);
    if (!component) {
      throw new Error(`Component not found: ${id}`);
    }

    if (!component.events) {
      component.events = {};
    }

    component.events[event] = handler;
  }

  removeEventListener(id: string, event: string, handler?: (event: any) => void): void {
    const component = this.components.get(id);
    if (!component || !component.events) {
      return;
    }

    if (handler && component.events[event] === handler) {
      delete component.events[event];
    } else if (!handler) {
      delete component.events[event];
    }
  }

  emitEvent(id: string, event: string, data?: any): void {
    const component = this.components.get(id);
    if (!component || !component.events || !component.events[event]) {
      return;
    }

    try {
      component.events[event](data);
    } catch (error) {
      console.error(`Error emitting event ${event} for component ${id}:`, error);
    }
  }

  show(id: string): void {
    const component = this.components.get(id);
    if (!component) {
      throw new Error(`Component not found: ${id}`);
    }

    component.visible = true;
  }

  hide(id: string): void {
    const component = this.components.get(id);
    if (!component) {
      throw new Error(`Component not found: ${id}`);
    }

    component.visible = false;
  }

  enable(id: string): void {
    const component = this.components.get(id);
    if (!component) {
      throw new Error(`Component not found: ${id}`);
    }

    component.enabled = true;
  }

  disable(id: string): void {
    const component = this.components.get(id);
    if (!component) {
      throw new Error(`Component not found: ${id}`);
    }

    component.enabled = false;
  }

  validate(id: string): boolean {
    const component = this.components.get(id);
    if (!component || !component.validation) {
      return true;
    }

    const validation = component.validation;
    const value = component.props.value;

    if (validation.required && (value === undefined || value === null || value === '')) {
      return false;
    }

    if (typeof value === 'string') {
      if (validation.minLength !== undefined && value.length < validation.minLength) {
        return false;
      }
      if (validation.maxLength !== undefined && value.length > validation.maxLength) {
        return false;
      }
      if (validation.pattern) {
        const pattern = typeof validation.pattern === 'string' ? new RegExp(validation.pattern) : validation.pattern;
        if (!pattern.test(value)) {
          return false;
        }
      }
    }

    if (typeof value === 'number') {
      if (validation.min !== undefined && value < validation.min) {
        return false;
      }
      if (validation.max !== undefined && value > validation.max) {
        return false;
      }
    }

    if (validation.custom) {
      const result = validation.custom(value);
      if (typeof result === 'boolean') {
        return result;
      }
      if (typeof result === 'string') {
        return false;
      }
    }

    return true;
  }

  getValidationErrors(id: string): string[] {
    const component = this.components.get(id);
    if (!component || !component.validation) {
      return [];
    }

    const errors: string[] = [];
    const validation = component.validation;
    const value = component.props.value;

    if (validation.required && (value === undefined || value === null || value === '')) {
      errors.push(validation.message || 'This field is required');
    }

    if (typeof value === 'string') {
      if (validation.minLength !== undefined && value.length < validation.minLength) {
        errors.push(validation.message || `Minimum length is ${validation.minLength}`);
      }
      if (validation.maxLength !== undefined && value.length > validation.maxLength) {
        errors.push(validation.message || `Maximum length is ${validation.maxLength}`);
      }
      if (validation.pattern) {
        const pattern = typeof validation.pattern === 'string' ? new RegExp(validation.pattern) : validation.pattern;
        if (!pattern.test(value)) {
          errors.push(validation.message || 'Invalid format');
        }
      }
    }

    if (typeof value === 'number') {
      if (validation.min !== undefined && value < validation.min) {
        errors.push(validation.message || `Minimum value is ${validation.min}`);
      }
      if (validation.max !== undefined && value > validation.max) {
        errors.push(validation.message || `Maximum value is ${validation.max}`);
      }
    }

    if (validation.custom) {
      const result = validation.custom(value);
      if (typeof result === 'string') {
        errors.push(result);
      } else if (typeof result === 'boolean' && !result) {
        errors.push(validation.message || 'Validation failed');
      }
    }

    return errors;
  }

  getTheme(): UITheme {
    return this.theme;
  }

  setTheme(theme: UITheme): void {
    this.theme = theme;
    this.applyTheme(theme);
  }

  setBreakpoint(breakpoint: string, style: Partial<UIStyle>): void {
    this.breakpoints.set(breakpoint, style);
  }

  getBreakpoint(breakpoint: string): Partial<UIStyle> | undefined {
    return this.breakpoints.get(breakpoint);
  }

  getPluginComponents(pluginId: string): UIComponent[] {
    return Array.from(this.components.values())
      .filter(component => component.pluginId === pluginId);
  }

  clearPluginComponents(pluginId: string): void {
    const pluginComponents = this.getPluginComponents(pluginId);
    for (const component of pluginComponents) {
      this.delete(component.id);
    }
  }

  find(predicate: (component: UIComponent) => boolean): UIComponent[] {
    return Array.from(this.components.values()).filter(predicate);
  }

  query(selector: string): UIComponent[] {
    // Simple query implementation - in a real implementation, you'd use a proper CSS selector engine
    const results: UIComponent[] = [];
    
    for (const component of this.components.values()) {
      if (this.matchesSelector(component, selector)) {
        results.push(component);
      }
    }
    
    return results;
  }

  clone(id: string, newId?: string): UIComponent {
    const original = this.components.get(id);
    if (!original) {
      throw new Error(`Component not found: ${id}`);
    }

    const cloned = { ...original };
    cloned.id = newId || this.generateComponentId();
    
    // Clone children recursively
    if (cloned.children) {
      cloned.children = cloned.children.map(child => this.clone(child.id));
    }

    return cloned;
  }

  private generateComponentId(): string {
    return `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private matchesSelector(component: UIComponent, selector: string): boolean {
    // Simple selector matching - in a real implementation, you'd use a proper CSS selector engine
    if (selector.startsWith('#')) {
      return component.id === selector.substring(1);
    }
    
    if (selector.startsWith('.')) {
      const className = selector.substring(1);
      return component.props.className === className || 
             (component.props.className && component.props.className.includes(className));
    }
    
    return component.type === selector;
  }
}

export class DefaultUIComponentFactory implements UIComponentFactory {
  private creators: Map<UIComponentType, ComponentCreator> = new Map();

  constructor() {
    this.registerDefaultCreators();
  }

  create(type: UIComponentType, props: Record<string, any>, options?: UICreateOptions): UIComponent {
    const creator = this.creators.get(type);
    if (!creator) {
      throw new Error(`Unknown component type: ${type}`);
    }

    return creator(props, options);
  }

  register(type: UIComponentType, creator: ComponentCreator): void {
    this.creators.set(type, creator);
  }

  unregister(type: UIComponentType): void {
    this.creators.delete(type);
  }

  getCreator(type: UIComponentType): ComponentCreator | undefined {
    return this.creators.get(type);
  }

  getRegisteredTypes(): UIComponentType[] {
    return Array.from(this.creators.keys());
  }

  private registerDefaultCreators(): void {
    // Button creator
    this.register(UIComponentType.BUTTON, (props, options) => ({
      id: this.generateComponentId(),
      type: UIComponentType.BUTTON,
      props: {
        text: props.text || 'Button',
        onClick: props.onClick,
        disabled: props.disabled || false,
        ...props
      },
      style: {
        theme: UITheme.LIGHT,
        size: UISize.MEDIUM,
        variant: UIVariant.PRIMARY,
        ...options?.style
      },
      visible: options?.visible !== false,
      enabled: options?.enabled !== false,
      pluginId: options?.pluginId || 'unknown',
      order: options?.order,
      validation: options?.validation,
      accessibility: options?.accessibility,
      responsive: options?.responsive,
      metadata: options?.metadata
    }));

    // Input creator
    this.register(UIComponentType.INPUT, (props, options) => ({
      id: this.generateComponentId(),
      type: UIComponentType.INPUT,
      props: {
        type: props.type || 'text',
        placeholder: props.placeholder,
        value: props.value,
        onChange: props.onChange,
        disabled: props.disabled || false,
        ...props
      },
      style: {
        theme: UITheme.LIGHT,
        size: UISize.MEDIUM,
        ...options?.style
      },
      visible: options?.visible !== false,
      enabled: options?.enabled !== false,
      pluginId: options?.pluginId || 'unknown',
      order: options?.order,
      validation: options?.validation,
      accessibility: options?.accessibility,
      responsive: options?.responsive,
      metadata: options?.metadata
    }));

    // Card creator
    this.register(UIComponentType.CARD, (props, options) => ({
      id: this.generateComponentId(),
      type: UIComponentType.CARD,
      props: {
        title: props.title,
        content: props.content,
        footer: props.footer,
        ...props
      },
      style: {
        theme: UITheme.LIGHT,
        borderRadius: '8px',
        borderWidth: '1px',
        padding: '16px',
        ...options?.style
      },
      visible: options?.visible !== false,
      enabled: options?.enabled !== false,
      pluginId: options?.pluginId || 'unknown',
      order: options?.order,
      validation: options?.validation,
      accessibility: options?.accessibility,
      responsive: options?.responsive,
      metadata: options?.metadata
    }));

    // Container creator
    this.register(UIComponentType.CONTAINER, (props, options) => ({
      id: this.generateComponentId(),
      type: UIComponentType.CONTAINER,
      props: {
        ...props
      },
      style: {
        theme: UITheme.LIGHT,
        display: 'flex',
        flexDirection: 'column',
        ...options?.style
      },
      visible: options?.visible !== false,
      enabled: options?.enabled !== false,
      pluginId: options?.pluginId || 'unknown',
      order: options?.order,
      validation: options?.validation,
      accessibility: options?.accessibility,
      responsive: options?.responsive,
      metadata: options?.metadata
    }));
  }

  private generateComponentId(): string {
    return `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}