/**
 * 自定义模型提供商：CLI 端读取 web 端写入的 `~/.claude/providers.json`。
 *
 * 数据流：web 端在 /settings/providers 页面写 → `cliSync.ts` 导出 `providers.json`
 *       → CLI 端 `readCustomProviderFromDisk()` 同步读取 → 启动屏 modelLine 展示。
 *
 * 设计原则：
 *  - 同步 + try/catch 包裹，**缺文件/解析失败必须返回 null**，不能阻塞 CLI 启动。
 *  - 不引入新依赖（用 Node 内置 fs.readFileSync）。
 *  - 缓存读取结果（30 秒内重复读返回缓存），避免每个组件重渲染都 IO。
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export type CustomProviderInfo = {
  /** 展示名（如 "My OpenAI"） */
  name: string
  /** base URL（含 https://） */
  baseUrl: string
  /** 默认模型 id（如 "gpt-4o"） */
  defaultModel: string
  /** API 路径（默认 /chat/completions） */
  apiPath: string
  /** provider id */
  id: string
}

type ProvidersFile = {
  default?: string
  providers: Array<{
    id: string
    name: string
    baseUrl: string
    apiKey: string
    apiPath: string
    defaultModel: string
  }>
}

const CACHE_TTL_MS = 30_000
let cache: { at: number; value: CustomProviderInfo | null } | null = null

function providersFilePath(): string {
  const home = process.env.HOME || ''
  return join(home, '.claude', 'providers.json')
}

function parseAndPickDefault(raw: string): CustomProviderInfo | null {
  try {
    const file = JSON.parse(raw) as ProvidersFile
    if (!file || !Array.isArray(file.providers) || file.providers.length === 0) {
      return null
    }
    const target =
      (file.default && file.providers.find(p => p.id === file.default)) ||
      file.providers[0]
    if (!target) return null
    if (!target.name || !target.defaultModel) return null
    return {
      id: target.id,
      name: target.name,
      baseUrl: target.baseUrl,
      apiPath: target.apiPath || '/chat/completions',
      defaultModel: target.defaultModel,
    }
  } catch {
    return null
  }
}

/**
 * 同步读 `~/.claude/providers.json`，返回默认 provider 的展示信息。
 *
 * 失败语义：缺文件 / 解析失败 / 无 provider → 返回 null（**绝不抛错**）。
 */
export function readCustomProviderFromDisk(): CustomProviderInfo | null {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.value
  }
  let result: CustomProviderInfo | null = null
  try {
    const path = providersFilePath()
    if (existsSync(path)) {
      const raw = readFileSync(path, 'utf-8')
      result = parseAndPickDefault(raw)
    }
  } catch {
    result = null
  }
  cache = { at: Date.now(), value: result }
  return result
}

/**
 * 构造启动屏 modelLine 字符串。
 *
 * 优先返回 `Custom: <name> · <model>` 形式，让 web 端配置可见。
 * 缺配置时回退到上游默认（"Opus 4.6 · Claude Max"等）。
 */
export function getDisplayModelLine(upstreamLine: string): string {
  const custom = readCustomProviderFromDisk()
  if (custom) {
    return `Custom: ${custom.name} · ${custom.defaultModel}`
  }
  return upstreamLine
}

/** 单元测试与诊断用：清空缓存。 */
export function _resetCustomProviderCache(): void {
  cache = null
}
