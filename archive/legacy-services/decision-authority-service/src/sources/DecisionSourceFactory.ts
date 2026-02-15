import { IDecisionSource } from '../interfaces/IDecisionSource';
import { InternalDecisionSource } from './InternalDecisionSource';
import { MockDecisionSource } from './MockDecisionSource';
import { CustodiiDecisionSource } from './CustodiiDecisionSource';
import config, { DecisionAuthorityMode } from '../config/config';

/**
 * DecisionSourceFactory - Creates the appropriate decision source
 * based on configuration
 */
export class DecisionSourceFactory {
  private static instance: IDecisionSource | null = null;
  
  /**
   * Get the configured decision source (singleton)
   */
  static getDecisionSource(): IDecisionSource {
    if (!this.instance) {
      this.instance = this.createDecisionSource();
    }
    return this.instance;
  }
  
  /**
   * Reset the singleton (useful for testing)
   */
  static reset(): void {
    this.instance = null;
  }
  
  /**
   * Create a decision source based on configuration
   */
  private static createDecisionSource(): IDecisionSource {
    const mode = config.decisionAuthorityMode;
    
    console.log(`[DecisionSourceFactory] Creating decision source: ${mode}`);
    
    switch (mode) {
      case DecisionAuthorityMode.INTERNAL:
        return new InternalDecisionSource();
      
      case DecisionAuthorityMode.EXTERNAL:
        return new CustodiiDecisionSource();
      
      default:
        console.warn(`[DecisionSourceFactory] Unknown mode: ${mode}, defaulting to INTERNAL`);
        return new InternalDecisionSource();
    }
  }
  
  /**
   * Create a mock decision source for testing
   */
  static createMockSource(config?: any): IDecisionSource {
    return new MockDecisionSource(config);
  }
}
