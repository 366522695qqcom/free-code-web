export type SandboxStatus = 'creating' | 'running' | 'stopped' | 'error';

export interface SandboxConfig {
  runtime?: 'node26' | 'node24' | 'node22' | 'python3.13';
  vCpus?: number;          // Default: 2
  memory?: number;          // GB, Default: 4
  timeoutMs?: number;       // Default: 300000 (5 min)
  persistent?: boolean;     // Default: true
}

export interface SandboxInfo {
  id: string;               // Vercel Sandbox ID
  sessionId: string;        // Associated chat session ID
  status: SandboxStatus;
  config: SandboxConfig;
  createdAt: number;        // Timestamp
  lastActivityAt: number;   // Timestamp
  error?: string;           // Error message if status is 'error'
}
