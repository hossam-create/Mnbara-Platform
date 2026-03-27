export interface PluginConfig {
  debug?: boolean;
  timeout?: number;
  retries?: number;
}

export interface PluginState {
  isInitialized: boolean;
  isConnected: boolean;
  lastActivity?: Date;
}

export interface PluginData {
  id: string;
  name: string;
  value: any;
  timestamp: Date;
}