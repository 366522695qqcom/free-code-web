/**
 * SSRF protection guard.
 *
 * Validates that a URL does not point to internal/private network resources
 * before being passed to fetch(). Used by:
 *  - web_fetch tool (M-1)
 *  - customBaseUrl in agent-stream (H-3)
 */

import { URL } from "url";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
  "169.254.169.254",  // AWS / Aliyun metadata
  "metadata.google.internal", // GCP metadata
  "metadata.azure.com",
  "host.docker.internal", // Docker
  "kubernetes.default",  // K8s in-cluster
]);

// RFC1918 private ranges and link-local
const BLOCKED_IP_PATTERNS: Array<{ min: number; max: number }> = [
  { min: 0x0A000000, max: 0x0AFFFFFF },  // 10.0.0.0/8
  { min: 0xAC100000, max: 0xAC1FFFFF },  // 172.16.0.0/12
  { min: 0xC0A80000, max: 0xC0A8FFFF },  // 192.168.0.0/16
  { min: 0xA9FE0000, max: 0xA9FEFFFF },  // 169.254.0.0/16 (link-local)
];

const BLOCKED_PORTS = new Set([
  22,   // SSH
  23,   // Telnet
  25,   // SMTP
  445,  // SMB
  3306, // MySQL
  5432, // PostgreSQL
  6379, // Redis
  27017, // MongoDB
  11211, // Memcached
]);

/** Returns true if the IPv4 address falls in a blocked private/link-local range. */
function isBlockedIPv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  const num =
    (parseInt(parts[0], 10) << 24) |
    (parseInt(parts[1], 10) << 16) |
    (parseInt(parts[2], 10) << 8) |
    parseInt(parts[3], 10);
  return BLOCKED_IP_PATTERNS.some((p) => num >= p.min && num <= p.max);
}

/**
 * Check whether a hostname resolves to a blocked IP (simple DNS check).
 * For DNS names we allow them but warn — proper mitigation requires
 * DNS rebinding protection at network level.
 */
function isHostnameBlocked(hostname: string): boolean {
  if (BLOCKED_HOSTNAMES.has(hostname)) return true;
  // If it looks like an IPv4 address, check the range
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return isBlockedIPv4(hostname);
  }
  return false;
}

/**
 * Validate a URL for SSRF before passing to fetch().
 * Throws if the URL targets a blocked host or port.
 */
export function validateUrl(targetUrl: string, context: string): void {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    throw new Error(`${context}: invalid URL: ${targetUrl}`);
  }

  const protocol = parsed.protocol.replace(/:$/, "");
  if (protocol !== "http" && protocol !== "https") {
    throw new Error(`${context}: protocol '${protocol}' is not allowed (only http/https)`);
  }

  const hostname = parsed.hostname;
  if (isHostnameBlocked(hostname)) {
    throw new Error(`${context}: host '${hostname}' is blocked (internal/private address)`);
  }

  const port = parsed.port
    ? parseInt(parsed.port, 10)
    : protocol === "https"
      ? 443
      : 80;
  if (BLOCKED_PORTS.has(port)) {
    throw new Error(`${context}: port ${port} is blocked (sensitive service)`);
  }
}
