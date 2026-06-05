export type RiskLevel = 'low' | 'high' | 'outside-sandbox';

export interface PermissionDecision {
  riskLevel: RiskLevel;
  reason: string;             // Human-readable explanation of why this level
  sandboxExecutable: boolean;  // Can this run in sandbox? (outside-sandbox = false)
}

export interface PermissionRule {
  pattern: string;             // Regex pattern to match command/tool
  riskLevel: RiskLevel;
  description: string;         // Human-readable description
  sandboxDowngrade?: RiskLevel; // If sandbox is enabled, downgrade risk
}

export interface CustomRule {
  id: string;
  pattern: string;
  riskLevel: RiskLevel;
  toolName?: string;           // Optional: only apply to specific tool
}
