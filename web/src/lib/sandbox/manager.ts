import type { SandboxInfo, SandboxConfig } from './types';
import { getSandboxConfig } from './config';
import type { Sandbox } from '@vercel/sandbox';

class SandboxManager {
  private sandboxes: Map<string, SandboxInfo> = new Map();
  private sessionMap: Map<string, string> = new Map();
  private sandboxInstances: Map<string, Sandbox> = new Map();

  async createSandbox(sessionId: string, config?: SandboxConfig): Promise<SandboxInfo> {
    const globalConfig = getSandboxConfig();
    const mergedConfig: SandboxConfig = {
      runtime: config?.runtime ?? (globalConfig.runtime as SandboxConfig['runtime']),
      vCpus: config?.vCpus ?? globalConfig.vCpus,
      memory: config?.memory ?? globalConfig.memory,
      timeoutMs: config?.timeoutMs ?? globalConfig.timeoutMs,
      persistent: config?.persistent ?? globalConfig.persistent,
    };

    const now = Date.now();
    const placeholderId = `pending-${sessionId}-${now}`;

    const info: SandboxInfo = {
      id: placeholderId,
      sessionId,
      status: 'creating',
      config: mergedConfig,
      createdAt: now,
      lastActivityAt: now,
    };

    try {
      const { Sandbox } = await import('@vercel/sandbox');

      const sandbox = await Sandbox.create({
        runtime: mergedConfig.runtime,
        resources: { vcpus: mergedConfig.vCpus ?? 2 },
        timeout: mergedConfig.timeoutMs,
        persistent: mergedConfig.persistent,
      });

      const sandboxId = sandbox.name;

      info.id = sandboxId;
      info.status = 'running';

      this.sandboxes.set(sandboxId, info);
      this.sessionMap.set(sessionId, sandboxId);
      this.sandboxInstances.set(sandboxId, sandbox);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      info.status = 'error';
      info.error = `Failed to create sandbox: ${errorMessage}`;
      this.sandboxes.set(placeholderId, info);
      this.sessionMap.set(sessionId, placeholderId);
    }

    return info;
  }

  async getOrCreateSandbox(sessionId: string): Promise<SandboxInfo | null> {
    const globalConfig = getSandboxConfig();
    if (!globalConfig.enabled) {
      return null;
    }

    const existing = this.getSandboxForSession(sessionId);
    if (existing) {
      if (existing.status === 'stopped') {
        try {
          return await this.resumeSandbox(existing.id);
        } catch {
          this.removeSession(sessionId);
          return this.createSandbox(sessionId);
        }
      }
      return existing;
    }

    return this.createSandbox(sessionId);
  }

  getSandbox(sandboxId: string): SandboxInfo | undefined {
    return this.sandboxes.get(sandboxId);
  }

  getSandboxForSession(sessionId: string): SandboxInfo | undefined {
    const sandboxId = this.sessionMap.get(sessionId);
    if (!sandboxId) return undefined;
    return this.sandboxes.get(sandboxId);
  }

  async getSandboxInstance(sessionId: string): Promise<Sandbox | null> {
    const sandboxId = this.sessionMap.get(sessionId);
    if (!sandboxId) return null;
    return this.sandboxInstances.get(sandboxId) ?? null;
  }

  async stopSandbox(sandboxId: string): Promise<void> {
    const info = this.sandboxes.get(sandboxId);
    if (!info) {
      throw new Error(`Sandbox not found: ${sandboxId}`);
    }

    try {
      const instance = this.sandboxInstances.get(sandboxId);
      if (instance) {
        await instance.stop();
      }
      info.status = 'stopped';
      info.lastActivityAt = Date.now();
      this.sandboxInstances.delete(sandboxId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      info.status = 'error';
      info.error = `Failed to stop sandbox: ${errorMessage}`;
      info.lastActivityAt = Date.now();
    }
  }

  async resumeSandbox(sandboxId: string): Promise<SandboxInfo> {
    const info = this.sandboxes.get(sandboxId);
    if (!info) {
      throw new Error(`Sandbox not found: ${sandboxId}`);
    }

    try {
      const { Sandbox } = await import('@vercel/sandbox');
      const sandbox = await Sandbox.get({ name: sandboxId });

      info.status = 'running';
      info.lastActivityAt = Date.now();
      info.error = undefined;
      this.sandboxInstances.set(sandboxId, sandbox);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      info.status = 'error';
      info.error = `Failed to resume sandbox: ${errorMessage}`;
      info.lastActivityAt = Date.now();
    }

    return info;
  }

  async destroySandbox(sandboxId: string): Promise<void> {
    const info = this.sandboxes.get(sandboxId);
    if (!info) {
      throw new Error(`Sandbox not found: ${sandboxId}`);
    }

    try {
      const instance = this.sandboxInstances.get(sandboxId);
      if (instance) {
        await instance.delete();
      } else {
        try {
          const { Sandbox } = await import('@vercel/sandbox');
          const sandbox = await Sandbox.get({ name: sandboxId });
          await sandbox.delete();
        } catch {
          // Sandbox may already be destroyed or unreachable; proceed with cleanup
        }
      }
    } finally {
      this.sessionMap.delete(info.sessionId);
      this.sandboxInstances.delete(sandboxId);
      this.sandboxes.delete(sandboxId);
    }
  }

  async createSnapshot(sandboxId: string): Promise<string> {
    const info = this.sandboxes.get(sandboxId);
    if (!info) {
      throw new Error(`Sandbox not found: ${sandboxId}`);
    }

    let instance = this.sandboxInstances.get(sandboxId);
    if (!instance) {
      const { Sandbox } = await import('@vercel/sandbox');
      instance = await Sandbox.get({ name: sandboxId });
      this.sandboxInstances.set(sandboxId, instance);
    }

    const snapshot = await instance.snapshot();
    info.lastActivityAt = Date.now();
    return snapshot.snapshotId;
  }

  listSandboxes(): SandboxInfo[] {
    return Array.from(this.sandboxes.values());
  }

  removeSession(sessionId: string): void {
    const sandboxId = this.sessionMap.get(sessionId);
    if (sandboxId) {
      this.sandboxes.delete(sandboxId);
      this.sandboxInstances.delete(sandboxId);
      this.sessionMap.delete(sessionId);
    }
  }
}

export const sandboxManager = new SandboxManager();
