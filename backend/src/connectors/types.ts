export type Submission = Record<string, any>;

export interface ConnectorConfig {
  type: string;            // e.g. "email", "slack"
  credentials?: Record<string, any>; 
  settings?: Record<string, any>; 
}

export interface ConnectorResult {
  success: boolean;
  message?: string;
  error?: any;
}