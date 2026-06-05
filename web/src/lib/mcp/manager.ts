/**
 * MCP Server Manager — manages MCP server lifecycle and communication.
 *
 * Implements a lightweight JSON-RPC client over stdio (child_process) and SSE.
 * Does NOT depend on @modelcontextprotocol/sdk.
 */

import { spawn, type ChildProcess } from "child_process";
import { randomUUID } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { registerTool, unregisterTool } from "@/lib/tools/registry";
import type { ToolExecutor, ToolResult } from "@/lib/tools/registry";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MCPServerConfig {
  id: string;
  name: string;
  type: "stdio" | "sse";
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  status: "disconnected" | "connecting" | "connected" | "error";
  error?: string;
  tools: MCPTool[];
  resources: MCPResource[];
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  serverId: string;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  serverId: string;
}

// ─── JSON-RPC helpers ────────────────────────────────────────────────────────

interface JSONRPCRequest {
  jsonrpc: "2.0";
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
}

// ─── Stdio MCP Client ────────────────────────────────────────────────────────

class StdioMCPClient {
  private process: ChildProcess | null = null;
  private pending = new Map<string, PendingRequest>();
  private buffer = "";
  private messageId = 0;
  private onNotification: ((method: string, params: unknown) => void) | null = null;

  async start(
    command: string,
    args: string[],
    env?: Record<string, string>
  ): Promise<void> {
    const spawnEnv = { ...process.env, ...(env || {}) } as typeof process.env;

    this.process = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: spawnEnv,
      shell: false,
    });

    this.process.stdout?.on("data", (data: Buffer) => {
      this.buffer += data.toString("utf-8");
      this.processBuffer();
    });

    this.process.stderr?.on("data", (data: Buffer) => {
      // Log stderr but don't treat as fatal
      console.debug(`[MCP stderr] ${data.toString("utf-8")}`);
    });

    this.process.on("error", (err) => {
      console.error(`[MCP process error]`, err);
    });

    this.process.on("exit", (code) => {
      console.debug(`[MCP process exited] code=${code}`);
      // Reject all pending requests
      for (const [id, pending] of this.pending) {
        clearTimeout(pending.timer);
        pending.reject(new Error(`Process exited with code ${code}`));
        this.pending.delete(id);
      }
    });
  }

  private processBuffer(): void {
    while (true) {
      const headerEnd = this.buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) break;

      const headerSection = this.buffer.slice(0, headerEnd);
      const bodyStart = headerEnd + 4;

      let contentLength = -1;
      for (const line of headerSection.split("\r\n")) {
        if (line.toLowerCase().startsWith("content-length:")) {
          contentLength = parseInt(line.slice(15).trim(), 10);
          break;
        }
      }

      if (contentLength === -1) {
        // Malformed header, skip
        this.buffer = this.buffer.slice(bodyStart);
        continue;
      }

      if (this.buffer.length < bodyStart + contentLength) {
        // Incomplete body, wait for more data
        break;
      }

      const body = this.buffer.slice(bodyStart, bodyStart + contentLength);
      this.buffer = this.buffer.slice(bodyStart + contentLength);

      try {
        const message = JSON.parse(body);
        this.handleMessage(message);
      } catch {
        console.error("[MCP] Failed to parse message:", body);
      }
    }
  }

  private handleMessage(message: Record<string, unknown>): void {
    if (message.id && this.pending.has(message.id as string)) {
      const pending = this.pending.get(message.id as string)!;
      clearTimeout(pending.timer);
      this.pending.delete(message.id as string);

      if (message.error) {
        pending.reject(
          new Error(
            (message.error as { message: string }).message || "JSON-RPC error"
          )
        );
      } else {
        pending.resolve(message.result);
      }
    } else if (message.method) {
      // Notification
      this.onNotification?.(
        message.method as string,
        message.params
      );
    }
  }

  async sendRequest(
    method: string,
    params?: Record<string, unknown>,
    timeoutMs: number = 30_000
  ): Promise<unknown> {
    if (!this.process?.stdin?.writable) {
      throw new Error("MCP process is not running");
    }

    const id = String(++this.messageId);
    const request: JSONRPCRequest = { jsonrpc: "2.0", id, method, params };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, timeoutMs);

      this.pending.set(id, { resolve, reject, timer });

      const body = JSON.stringify(request);
      const header = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n`;
      this.process!.stdin!.write(header + body);
    });
  }

  setNotificationHandler(
    handler: (method: string, params: unknown) => void
  ): void {
    this.onNotification = handler;
  }

  stop(): void {
    if (this.process) {
      this.process.kill("SIGTERM");
      // Force kill after 5s
      setTimeout(() => {
        this.process?.kill("SIGKILL");
      }, 5000);
      this.process = null;
    }
    // Reject all pending
    for (const [, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(new Error("Client stopped"));
    }
    this.pending.clear();
  }

  isRunning(): boolean {
    return this.process !== null && !this.process.killed;
  }
}

// ─── SSE MCP Client ──────────────────────────────────────────────────────────

class SSEMCPClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private messageId = 0;
  private endpoint = "";
  private connected = false;

  constructor(url: string, env?: Record<string, string>) {
    this.baseUrl = url.replace(/\/$/, "");
    this.headers = {};
    if (env) {
      // Pass any auth headers from env
      if (env["AUTH_TOKEN"]) {
        this.headers["Authorization"] = `Bearer ${env["AUTH_TOKEN"]}`;
      }
    }
  }

  async connect(): Promise<void> {
    // Discover the message endpoint via SSE
    const response = await fetch(`${this.baseUrl}/sse`, {
      headers: { Accept: "text/event-stream", ...this.headers },
    });

    if (!response.ok) {
      throw new Error(`SSE connection failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    // Read until we get the endpoint event
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data.startsWith("/")) {
            this.endpoint = `${this.baseUrl}${data}`;
            this.connected = true;
            // Cancel the SSE reader — we only needed the endpoint
            reader.cancel();
            return;
          }
        }
      }
    }

    throw new Error("Failed to discover SSE endpoint");
  }

  async sendRequest(
    method: string,
    params?: Record<string, unknown>,
    timeoutMs: number = 30_000
  ): Promise<unknown> {
    if (!this.connected && !this.endpoint) {
      throw new Error("SSE client not connected");
    }

    const id = String(++this.messageId);
    const request = { jsonrpc: "2.0", id, method, params };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...this.headers },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const message = await response.json();

      if (message.error) {
        throw new Error(
          message.error.message || "JSON-RPC error from SSE server"
        );
      }

      return message.result;
    } finally {
      clearTimeout(timer);
    }
  }

  stop(): void {
    this.connected = false;
    this.endpoint = "";
  }

  isRunning(): boolean {
    return this.connected;
  }
}

// ─── MCP Server Manager ──────────────────────────────────────────────────────

type MCPClient = StdioMCPClient | SSEMCPClient;

const PERSIST_FILE = join(process.cwd(), "mcp-servers.json");

class MCPManager {
  private servers = new Map<string, MCPServerConfig>();
  private clients = new Map<string, MCPClient>();

  constructor() {
    this.loadFromDisk();
  }

  // ── Server management ────────────────────────────────────────────────────

  addServer(input: {
    name: string;
    type: "stdio" | "sse";
    command?: string;
    args?: string[];
    url?: string;
    env?: Record<string, string>;
  }): MCPServerConfig {
    const id = randomUUID();
    const config: MCPServerConfig = {
      id,
      name: input.name,
      type: input.type,
      command: input.command,
      args: input.args || [],
      url: input.url,
      env: input.env,
      status: "disconnected",
      tools: [],
      resources: [],
    };

    this.servers.set(id, config);
    this.saveToDisk();
    return config;
  }

  removeServer(id: string): boolean {
    const config = this.servers.get(id);
    if (!config) return false;

    // Disconnect if connected
    if (config.status === "connected" || config.status === "connecting") {
      this.disconnectServer(id);
    }

    // Unregister tools
    this.unregisterServerTools(config);

    this.servers.delete(id);
    this.saveToDisk();
    return true;
  }

  listServers(): MCPServerConfig[] {
    return Array.from(this.servers.values());
  }

  getServer(id: string): MCPServerConfig | undefined {
    return this.servers.get(id);
  }

  // ── Connection lifecycle ─────────────────────────────────────────────────

  async connectServer(id: string): Promise<void> {
    const config = this.servers.get(id);
    if (!config) throw new Error(`Server not found: ${id}`);
    if (config.status === "connected" || config.status === "connecting") {
      return;
    }

    config.status = "connecting";
    config.error = undefined;

    try {
      let client: MCPClient;

      if (config.type === "stdio") {
        if (!config.command) throw new Error("stdio server requires a command");

        const stdioClient = new StdioMCPClient();
        await stdioClient.start(config.command, config.args || [], config.env);
        client = stdioClient;
      } else {
        if (!config.url) throw new Error("SSE server requires a URL");

        const sseClient = new SSEMCPClient(config.url, config.env);
        await sseClient.connect();
        client = sseClient;
      }

      this.clients.set(id, client);

      // Initialize the MCP connection
      await client.sendRequest("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "free-code", version: "0.1.0" },
      });

      // Send initialized notification (no response expected)
      if (client instanceof StdioMCPClient) {
        try {
          const notifBody = JSON.stringify({
            jsonrpc: "2.0",
            method: "notifications/initialized",
          });
          const notifHeader = `Content-Length: ${Buffer.byteLength(notifBody)}\r\n\r\n`;
          (client as unknown as { process: { stdin: { write: (d: string) => void } } }).process.stdin.write(notifHeader + notifBody);
        } catch {
          // Notification is best-effort
        }
      }

      // Fetch tools
      try {
        const toolsResult = (await client.sendRequest("tools/list", {})) as {
          tools?: Array<{
            name: string;
            description?: string;
            inputSchema?: Record<string, unknown>;
          }>;
        };

        config.tools = (toolsResult.tools || []).map((t) => ({
          name: t.name,
          description: t.description || "",
          inputSchema: t.inputSchema || { type: "object", properties: {} },
          serverId: id,
        }));
      } catch {
        // Server might not support tools
        config.tools = [];
      }

      // Fetch resources
      try {
        const resourcesResult = (await client.sendRequest("resources/list", {})) as {
          resources?: Array<{
            uri: string;
            name: string;
            description?: string;
            mimeType?: string;
          }>;
        };

        config.resources = (resourcesResult.resources || []).map((r) => ({
          uri: r.uri,
          name: r.name,
          description: r.description,
          mimeType: r.mimeType,
          serverId: id,
        }));
      } catch {
        // Server might not support resources
        config.resources = [];
      }

      config.status = "connected";

      // Register tools in the global tool registry
      this.registerServerTools(config);
    } catch (err) {
      config.status = "error";
      config.error = err instanceof Error ? err.message : String(err);

      // Clean up client if it was created
      const client = this.clients.get(id);
      if (client) {
        client.stop();
        this.clients.delete(id);
      }
    }

    this.saveToDisk();
  }

  disconnectServer(id: string): void {
    const config = this.servers.get(id);
    if (!config) return;

    const client = this.clients.get(id);
    if (client) {
      client.stop();
      this.clients.delete(id);
    }

    // Unregister tools
    this.unregisterServerTools(config);

    config.status = "disconnected";
    config.error = undefined;
    this.saveToDisk();
  }

  // ── Tool & resource access ───────────────────────────────────────────────

  getServerTools(id: string): MCPTool[] {
    return this.servers.get(id)?.tools || [];
  }

  getServerResources(id: string): MCPResource[] {
    return this.servers.get(id)?.resources || [];
  }

  async executeTool(
    serverId: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<ToolResult> {
    const client = this.clients.get(serverId);
    if (!client) {
      return { output: "", error: `MCP server not connected: ${serverId}`, exitCode: 1 };
    }

    try {
      const result = (await client.sendRequest("tools/call", {
        name: toolName,
        arguments: args,
      })) as {
        content?: Array<{ type: string; text?: string }>;
        isError?: boolean;
      };

      // Extract text from content blocks
      let output = "";
      if (Array.isArray(result.content)) {
        output = result.content
          .map((c) => (c.type === "text" ? c.text || "" : JSON.stringify(c)))
          .join("\n");
      } else if (typeof result === "string") {
        output = result;
      } else {
        output = JSON.stringify(result, null, 2);
      }

      return {
        output,
        error: result.isError ? "MCP tool returned an error" : undefined,
        exitCode: result.isError ? 1 : 0,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { output: "", error: message, exitCode: 1 };
    }
  }

  async readResource(serverId: string, uri: string): Promise<string> {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`MCP server not connected: ${serverId}`);
    }

    const result = (await client.sendRequest("resources/read", { uri })) as {
      contents?: Array<{ uri: string; text?: string; blob?: string; mimeType?: string }>;
    };

    if (result.contents && result.contents.length > 0) {
      const content = result.contents[0]!;
      if (content.text) return content.text;
      if (content.blob) return `[Binary data: ${content.mimeType || "unknown"}, base64 length=${content.blob.length}]`;
      return JSON.stringify(content, null, 2);
    }

    return JSON.stringify(result, null, 2);
  }

  // ── Tool registry integration ────────────────────────────────────────────

  private registerServerTools(config: MCPServerConfig): void {
    for (const tool of config.tools) {
      const fullName = `mcp__${config.id}__${tool.name}`;

      const executor: ToolExecutor = {
        name: fullName,
        description: `[MCP:${config.name}] ${tool.description}`,
        parameters: tool.inputSchema,
        requiresConfirmation: false,
        execute: async (params: Record<string, unknown>) => {
          return this.executeTool(config.id, tool.name, params);
        },
      };

      registerTool(executor);
    }
  }

  private unregisterServerTools(config: MCPServerConfig): void {
    for (const tool of config.tools) {
      const fullName = `mcp__${config.id}__${tool.name}`;
      unregisterTool(fullName);
    }
  }

  // ── Persistence ──────────────────────────────────────────────────────────

  private saveToDisk(): void {
    try {
      const data = Array.from(this.servers.values()).map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        command: s.command,
        args: s.args,
        url: s.url,
        env: s.env,
        // Don't persist runtime state
        status: "disconnected" as const,
        error: undefined,
        tools: [] as MCPTool[],
        resources: [] as MCPResource[],
      }));

      writeFileSync(PERSIST_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch {
      // Best effort
    }
  }

  private loadFromDisk(): void {
    try {
      if (!existsSync(PERSIST_FILE)) return;

      const raw = readFileSync(PERSIST_FILE, "utf-8");
      const data = JSON.parse(raw) as Array<{
        id: string;
        name: string;
        type: "stdio" | "sse";
        command?: string;
        args?: string[];
        url?: string;
        env?: Record<string, string>;
      }>;

      for (const item of data) {
        this.servers.set(item.id, {
          ...item,
          status: "disconnected",
          tools: [],
          resources: [],
        });
      }
    } catch {
      // Best effort
    }
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let managerInstance: MCPManager | null = null;

export function getMCPManager(): MCPManager {
  if (!managerInstance) {
    managerInstance = new MCPManager();
  }
  return managerInstance;
}
