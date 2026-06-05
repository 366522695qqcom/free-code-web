export function getSandboxConfig(): {
  enabled: boolean;
  runtime: string;
  vCpus: number;
  memory: number;
  timeoutMs: number;
  persistent: boolean;
  vercelToken?: string;
} {
  return {
    enabled: process.env.SANDBOX_ENABLED === 'true',
    runtime: process.env.SANDBOX_RUNTIME || 'node24',
    vCpus: parseInt(process.env.SANDBOX_VCPUS || '2', 10),
    memory: parseInt(process.env.SANDBOX_MEMORY || '4', 10),
    timeoutMs: parseInt(process.env.SANDBOX_TIMEOUT_MS || '300000', 10),
    persistent: process.env.SANDBOX_PERSISTENT !== 'false',
    vercelToken: process.env.VERCEL_TOKEN,
  };
}
