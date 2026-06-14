import type { RiskLevel, PermissionDecision, PermissionRule, CustomRule } from './types';
import { defaultPermissionRules, toolRiskDefaults } from './rules';

/**
 * Assess the risk level of a tool invocation.
 *
 * 1. Custom rules take highest priority.
 * 2. Non-bash tools use tool-level defaults.
 * 3. Bash commands are matched against the default rule set.
 * 4. Unmatched commands default to high risk.
 * 5. Sandbox downgrades are applied when sandboxEnabled is true.
 */
export function assessRisk(
  toolName: string,
  params: Record<string, unknown>,
  sandboxEnabled: boolean,
  customRules?: CustomRule[]
): PermissionDecision {
  // 1. Check custom rules first (highest priority)
  if (customRules && customRules.length > 0) {
    for (const rule of customRules) {
      // If the rule targets a specific tool, only match when toolName matches
      if (rule.toolName && rule.toolName !== toolName) continue;

      let commandToMatch: string;
      if (toolName === 'bash') {
        commandToMatch = (params.command as string) || '';
      } else {
        commandToMatch = toolName;
      }

      try {
        const regex = new RegExp(rule.pattern);
        if (regex.test(commandToMatch)) {
          return buildDecision(rule.riskLevel, `Matched custom rule: ${rule.pattern}`, sandboxEnabled, undefined);
        }
      } catch {
        // Invalid regex in custom rule — skip it
      }
    }
  }

  // 2. Non-bash tools: use tool-level defaults
  if (toolName !== 'bash') {
    const toolDefault = toolRiskDefaults[toolName];
    if (toolDefault) {
      return buildDecision(toolDefault.riskLevel, toolDefault.description, sandboxEnabled, toolDefault.sandboxDowngrade);
    }
    // Unknown non-bash tool defaults to high
    return buildDecision('high', `Unknown tool: ${toolName}`, sandboxEnabled, undefined);
  }

  // 3. Bash command matching
  const command = (params.command as string) || '';
  if (!command) {
    return buildDecision('high', 'Empty command', sandboxEnabled, undefined);
  }

  const trimmedCommand = command.trim();

  // Check against all default rules in order
  let matchedRule: PermissionRule | undefined;

  for (const rule of defaultPermissionRules) {
    try {
      const regex = new RegExp(rule.pattern);
      if (regex.test(trimmedCommand)) {
        matchedRule = rule;
        break;
      }
    } catch {
      // Invalid regex — skip
    }
  }

  if (matchedRule) {
    return buildDecision(matchedRule.riskLevel, matchedRule.description, sandboxEnabled, matchedRule.sandboxDowngrade);
  }

  // 4. Default: unmatched commands are high risk
  return buildDecision('high', `Unmatched command defaults to high risk: ${trimmedCommand.split(' ')[0]}`, sandboxEnabled, undefined);
}

/**
 * Build a PermissionDecision, applying sandbox downgrade if applicable.
 */
function buildDecision(
  riskLevel: RiskLevel,
  reason: string,
  sandboxEnabled: boolean,
  sandboxDowngrade?: RiskLevel
): PermissionDecision {
  let finalLevel = riskLevel;

  // On Vercel (serverless), the filesystem is isolated (/tmp only),
  // so sandboxDowngrade should apply even without explicit sandbox.
  const isVercel = !!process.env.VERCEL;
  if ((sandboxEnabled || isVercel) && sandboxDowngrade) {
    finalLevel = sandboxDowngrade;
  }

  return {
    riskLevel: finalLevel,
    reason,
    sandboxExecutable: finalLevel !== 'outside-sandbox',
  };
}
