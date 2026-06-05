import type { PermissionRule } from './types';

/**
 * Default permission rules for bash commands and tool-level access.
 *
 * Order matters: more specific patterns should come before general ones
 * so that compound commands (e.g. "git status") match before their
 * single-word prefix ("git").
 */
export const defaultPermissionRules: PermissionRule[] = [
  // ─── Low risk: read-only / info commands ─────────────────────────────────

  // File listing & reading
  { pattern: '^ls\\b', riskLevel: 'low', description: 'List directory contents' },
  { pattern: '^cat\\b', riskLevel: 'low', description: 'Print file contents' },
  { pattern: '^head\\b', riskLevel: 'low', description: 'Show beginning of file' },
  { pattern: '^tail\\b', riskLevel: 'low', description: 'Show end of file' },
  { pattern: '^less\\b', riskLevel: 'low', description: 'Page through file' },
  { pattern: '^more\\b', riskLevel: 'low', description: 'Page through file' },

  // File search
  { pattern: '^find\\b', riskLevel: 'low', description: 'Search for files' },
  { pattern: '^locate\\b', riskLevel: 'low', description: 'Locate files by name' },
  { pattern: '^which\\b', riskLevel: 'low', description: 'Locate a command' },
  { pattern: '^whereis\\b', riskLevel: 'low', description: 'Locate binary/source/man' },
  { pattern: '^type\\b', riskLevel: 'low', description: 'Display command type' },

  // Content search
  { pattern: '^grep\\b', riskLevel: 'low', description: 'Search file contents' },
  { pattern: '^rg\\b', riskLevel: 'low', description: 'Ripgrep search' },
  { pattern: '^ag\\b', riskLevel: 'low', description: 'Silver searcher' },
  { pattern: '^ack\\b', riskLevel: 'low', description: 'Ack search' },

  // Git read-only
  { pattern: '^git\\s+status\\b', riskLevel: 'low', description: 'Show working tree status' },
  { pattern: '^git\\s+log\\b', riskLevel: 'low', description: 'Show commit logs' },
  { pattern: '^git\\s+diff\\b', riskLevel: 'low', description: 'Show changes' },
  { pattern: '^git\\s+branch\\b', riskLevel: 'low', description: 'List branches' },
  { pattern: '^git\\s+remote\\b', riskLevel: 'low', description: 'Manage remotes (read)' },
  { pattern: '^git\\s+show\\b', riskLevel: 'low', description: 'Show objects' },
  { pattern: '^git\\s+tag\\b', riskLevel: 'low', description: 'List tags' },

  // Shell info
  { pattern: '^pwd\\b', riskLevel: 'low', description: 'Print working directory' },
  { pattern: '^echo\\b', riskLevel: 'low', description: 'Print text' },
  { pattern: '^printf\\b', riskLevel: 'low', description: 'Format and print text' },

  // Version / package listing
  { pattern: '^node\\s+-v\\b', riskLevel: 'low', description: 'Node.js version' },
  { pattern: '^npm\\s+-v\\b', riskLevel: 'low', description: 'npm version' },
  { pattern: '^npm\\s+list\\b', riskLevel: 'low', description: 'List installed packages' },
  { pattern: '^npm\\s+ls\\b', riskLevel: 'low', description: 'List installed packages' },
  { pattern: '^pnpm\\s+list\\b', riskLevel: 'low', description: 'List installed packages (pnpm)' },

  // System info
  { pattern: '^ps\\b', riskLevel: 'low', description: 'Process status' },
  { pattern: '^top\\s+-bn1\\b', riskLevel: 'low', description: 'Snapshot of processes' },
  { pattern: '^df\\b', riskLevel: 'low', description: 'Disk free space' },
  { pattern: '^free\\b', riskLevel: 'low', description: 'Memory usage' },
  { pattern: '^uname\\b', riskLevel: 'low', description: 'System information' },
  { pattern: '^whoami\\b', riskLevel: 'low', description: 'Current user' },
  { pattern: '^id\\b', riskLevel: 'low', description: 'User/group IDs' },
  { pattern: '^hostname\\b', riskLevel: 'low', description: 'Hostname' },
  { pattern: '^date\\b', riskLevel: 'low', description: 'Current date/time' },
  { pattern: '^uptime\\b', riskLevel: 'low', description: 'System uptime' },

  // Environment
  { pattern: '^env\\b', riskLevel: 'low', description: 'Print environment' },
  { pattern: '^printenv\\b', riskLevel: 'low', description: 'Print environment variables' },
  { pattern: '^set\\b', riskLevel: 'low', description: 'Shell variables' },

  // File info / text processing
  { pattern: '^file\\b', riskLevel: 'low', description: 'Determine file type' },
  { pattern: '^stat\\b', riskLevel: 'low', description: 'File status' },
  { pattern: '^wc\\b', riskLevel: 'low', description: 'Word/line/byte count' },
  { pattern: '^sort\\b', riskLevel: 'low', description: 'Sort lines' },
  { pattern: '^uniq\\b', riskLevel: 'low', description: 'Report unique lines' },
  { pattern: '^cut\\b', riskLevel: 'low', description: 'Remove sections of lines' },
  { pattern: '^tr\\b', riskLevel: 'low', description: 'Translate characters' },
  { pattern: '^du\\b', riskLevel: 'low', description: 'Disk usage' },
  { pattern: '^tree\\b', riskLevel: 'low', description: 'Directory tree' },

  // ─── Outside-sandbox: host access / container execution ──────────────────

  // Docker execution
  { pattern: '^docker\\s+run\\b', riskLevel: 'outside-sandbox', description: 'Run Docker container on host' },
  { pattern: '^docker\\s+exec\\b', riskLevel: 'outside-sandbox', description: 'Execute in Docker container' },
  { pattern: '^docker\\s+start\\b', riskLevel: 'outside-sandbox', description: 'Start Docker container' },

  // Remote access
  { pattern: '^ssh\\b', riskLevel: 'outside-sandbox', description: 'SSH to remote host' },
  { pattern: '^scp\\b', riskLevel: 'outside-sandbox', description: 'Secure copy to/from remote' },
  { pattern: '^sftp\\b', riskLevel: 'outside-sandbox', description: 'Secure file transfer' },
  { pattern: '^rsync\\b', riskLevel: 'outside-sandbox', description: 'Remote file sync' },

  // Host access convention
  { pattern: '/host/', riskLevel: 'outside-sandbox', description: 'Command targets host filesystem' },

  // Network host mode
  { pattern: '--network\\s+host', riskLevel: 'outside-sandbox', description: 'Uses host network mode' },
  { pattern: '--host', riskLevel: 'outside-sandbox', description: 'Uses host network mode' },

  // Orchestration
  { pattern: '^kubectl\\b', riskLevel: 'outside-sandbox', description: 'Kubernetes CLI' },
  { pattern: '^helm\\b', riskLevel: 'outside-sandbox', description: 'Kubernetes Helm' },
  { pattern: '^vagrant\\b', riskLevel: 'outside-sandbox', description: 'Vagrant VM management' },

  // ─── High risk: mutating / network-active commands ───────────────────────

  // Package install
  { pattern: '^npm\\s+install\\b', riskLevel: 'high', description: 'Install npm packages', sandboxDowngrade: 'low' },
  { pattern: '^npm\\s+i\\b', riskLevel: 'high', description: 'Install npm packages (short)', sandboxDowngrade: 'low' },
  { pattern: '^yarn\\s+add\\b', riskLevel: 'high', description: 'Add yarn package', sandboxDowngrade: 'low' },
  { pattern: '^pnpm\\s+add\\b', riskLevel: 'high', description: 'Add pnpm package', sandboxDowngrade: 'low' },
  { pattern: '^pnpm\\s+install\\b', riskLevel: 'high', description: 'Install pnpm packages', sandboxDowngrade: 'low' },
  { pattern: '^bun\\s+add\\b', riskLevel: 'high', description: 'Add bun package', sandboxDowngrade: 'low' },
  { pattern: '^bun\\s+install\\b', riskLevel: 'high', description: 'Install bun packages', sandboxDowngrade: 'low' },
  { pattern: '^pip\\s+install\\b', riskLevel: 'high', description: 'Install pip packages', sandboxDowngrade: 'low' },
  { pattern: '^uv\\s+pip\\s+install\\b', riskLevel: 'high', description: 'Install packages via uv', sandboxDowngrade: 'low' },
  { pattern: '^uv\\s+add\\b', riskLevel: 'high', description: 'Add package via uv', sandboxDowngrade: 'low' },

  // Build / run
  { pattern: '^npm\\s+run\\b', riskLevel: 'high', description: 'Run npm script' },
  { pattern: '^yarn\\s+run\\b', riskLevel: 'high', description: 'Run yarn script' },
  { pattern: '^pnpm\\s+run\\b', riskLevel: 'high', description: 'Run pnpm script' },
  { pattern: '^bun\\s+run\\b', riskLevel: 'high', description: 'Run bun script' },
  { pattern: '^make\\b', riskLevel: 'high', description: 'Run make build', sandboxDowngrade: 'low' },
  { pattern: '^cmake\\b', riskLevel: 'high', description: 'Run cmake' },
  { pattern: '^cargo\\s+build\\b', riskLevel: 'high', description: 'Build Rust project', sandboxDowngrade: 'low' },
  { pattern: '^cargo\\s+run\\b', riskLevel: 'high', description: 'Run Rust project' },
  { pattern: '^go\\s+build\\b', riskLevel: 'high', description: 'Build Go project', sandboxDowngrade: 'low' },
  { pattern: '^go\\s+run\\b', riskLevel: 'high', description: 'Run Go project' },

  // Docker build / compose
  { pattern: '^docker\\s+build\\b', riskLevel: 'high', description: 'Build Docker image' },
  { pattern: '^docker\\s+compose\\b', riskLevel: 'high', description: 'Docker Compose' },
  { pattern: '^docker-compose\\b', riskLevel: 'high', description: 'Docker Compose (hyphenated)' },

  // Network requests with mutation
  { pattern: '^curl\\s+.*-X\\s+(POST|PUT|DELETE|PATCH)', riskLevel: 'high', description: 'curl with mutating HTTP method' },
  { pattern: '^wget\\b', riskLevel: 'high', description: 'Download files' },

  // Git mutations
  { pattern: '^git\\s+push\\b', riskLevel: 'high', description: 'Push to remote' },
  { pattern: '^git\\s+merge\\b', riskLevel: 'high', description: 'Merge branches' },
  { pattern: '^git\\s+rebase\\b', riskLevel: 'high', description: 'Rebase commits' },
  { pattern: '^git\\s+reset\\b', riskLevel: 'high', description: 'Reset commits' },
  { pattern: '^git\\s+checkout\\b', riskLevel: 'high', description: 'Switch branches' },
  { pattern: '^git\\s+clone\\b', riskLevel: 'high', description: 'Clone repository' },

  // File mutations
  { pattern: '^rm\\b', riskLevel: 'high', description: 'Remove files', sandboxDowngrade: 'low' },
  { pattern: '^rmdir\\b', riskLevel: 'high', description: 'Remove directory', sandboxDowngrade: 'low' },
  { pattern: '^mv\\b', riskLevel: 'high', description: 'Move/rename files' },
  { pattern: '^cp\\b', riskLevel: 'high', description: 'Copy files' },
  { pattern: '^chmod\\b', riskLevel: 'high', description: 'Change file permissions' },
  { pattern: '^chown\\b', riskLevel: 'high', description: 'Change file ownership' },

  // Publishing
  { pattern: '^npm\\s+publish\\b', riskLevel: 'high', description: 'Publish npm package' },
  { pattern: '^yarn\\s+publish\\b', riskLevel: 'high', description: 'Publish yarn package' },

  // Sudo
  { pattern: '^sudo\\b', riskLevel: 'high', description: 'Execute as superuser', sandboxDowngrade: 'low' },
];

/**
 * Tool-level default risk levels for non-bash tools.
 */
export const toolRiskDefaults: Record<string, PermissionRule> = {
  file_read: { pattern: 'file_read', riskLevel: 'low', description: 'Read file contents' },
  file_write: { pattern: 'file_write', riskLevel: 'high', description: 'Write file contents' },
  file_edit: { pattern: 'file_edit', riskLevel: 'high', description: 'Edit file contents' },
  glob: { pattern: 'glob', riskLevel: 'low', description: 'Search files by pattern' },
  grep: { pattern: 'grep', riskLevel: 'low', description: 'Search file contents' },
  web_fetch: { pattern: 'web_fetch', riskLevel: 'low', description: 'Fetch URL content' },
  web_search: { pattern: 'web_search', riskLevel: 'low', description: 'Search the web' },
};
