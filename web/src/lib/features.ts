/**
 * Runtime feature flags system.
 *
 * Reads FEATURE_FLAGS from the environment (comma-separated string)
 * and provides a `feature()` function compatible with the CLI pattern.
 *
 * Works on both server and client side:
 * - Server: reads from process.env.FEATURE_FLAGS
 * - Client: reads from process.env.NEXT_PUBLIC_FEATURE_FLAGS (injected at build time)
 */

function getFeatureFlags(): Set<string> {
  if (typeof window !== "undefined") {
    // Client side: read from NEXT_PUBLIC_ env var (inlined at build time)
    const flags = process.env.NEXT_PUBLIC_FEATURE_FLAGS;
    if (flags) {
      return new Set(
        flags
          .split(",")
          .map((f) => f.trim().toUpperCase())
          .filter(Boolean)
      );
    }
    return new Set();
  }

  // Server side: read from process.env
  const flags = process.env.FEATURE_FLAGS;
  if (flags) {
    return new Set(
      flags
        .split(",")
        .map((f) => f.trim().toUpperCase())
        .filter(Boolean)
    );
  }
  return new Set();
}

/**
 * Check if a feature flag is enabled.
 * Compatible with the CLI's `feature()` pattern.
 *
 * @param flag - The feature flag name (case-insensitive)
 * @returns true if the flag is enabled
 */
export function feature(flag: string): boolean {
  const flags = getFeatureFlags();
  return flags.has(flag.toUpperCase());
}

/**
 * Get all enabled feature flags.
 *
 * @returns Set of enabled flag names (uppercase)
 */
export function getEnabledFeatures(): Set<string> {
  return getFeatureFlags();
}
