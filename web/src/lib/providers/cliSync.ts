/**
 * CLI 同步：从 libSQL 读所有 provider + 它们的 chat 模型，
 * 写入 `~/.claude/providers.json` 让 free-code CLI 启动屏读取。
 *
 * 注意：本文件**只导出函数**。调用方（未来 useProvidersSync hook / API route）
 * 负责触发。本文件不引入 IO 副作用的依赖（无 fs 模块导入）。
 *
 * 调用方需要传入 `writeFile` 函数（便于测试与在 Edge Runtime 中替换）。
 */

import type { ProviderWithModels } from "./types";
import { listProvidersWithModels } from "./storage";

/** 写入磁盘的格式（CLI 端读取时的约定）。 */
export type CliProvidersFile = {
  /** 默认激活的 provider id，未设置时取第一个。 */
  default?: string;
  providers: Array<{
    id: string;
    name: string;
    baseUrl: string;
    apiKey: string;
    apiPath: string;
    /** 该 provider 的默认 chat 模型 id。 */
    defaultModel: string;
  }>;
};

type WriteFile = (path: string, content: string) => Promise<void> | void;

/** 选 provider 的默认模型：第一个 chat 类型模型，回退到第一个模型。 */
function pickDefaultModel(p: ProviderWithModels): string {
  const firstChat = p.models.find(m => (m.modelType ?? "chat") === "chat");
  return (firstChat ?? p.models[0])?.modelId ?? "";
}

function toCliShape(p: ProviderWithModels) {
  return {
    id: p.id,
    name: p.name,
    baseUrl: p.baseUrl,
    apiKey: p.apiKey,
    apiPath: p.apiPath,
    defaultModel: pickDefaultModel(p),
  };
}

/**
 * 同步所有 provider + 默认模型到磁盘。
 *
 * @param targetPath 写入路径（默认 ~/.claude/providers.json）
 * @param writeFile  注入的写文件实现（默认 Node fs.writeFileSync；web 端传 fs/promises）
 * @param defaultProviderId  默认激活 provider；未传则用第一个
 */
export async function writeProvidersForCli(args: {
  targetPath?: string;
  writeFile: WriteFile;
  defaultProviderId?: string;
}): Promise<{ path: string; count: number }> {
  const providers = await listProvidersWithModels();
  const file: CliProvidersFile = {
    default: args.defaultProviderId ?? providers[0]?.id,
    providers: providers.map(toCliShape),
  };

  // 路径默认 ~/.claude/providers.json（与 Claude Code 约定一致）
  let target = args.targetPath;
  if (!target) {
    // 在 web/Edge 环境下 process.env.HOME 可能为空
    const home = (typeof process !== "undefined" && process.env?.HOME) || "";
    target = `${home}/.claude/providers.json`;
  }

  await args.writeFile(target, JSON.stringify(file, null, 2));
  return { path: target, count: file.providers.length };
}

/**
 * 仅获取默认 provider 的展示信息（不写文件）。
 * 供 web 端在"已连接 / 当前模型"等位置展示。
 */
export async function getDefaultProviderForCli(): Promise<{
  name: string;
  baseUrl: string;
  defaultModel: string;
} | null> {
  const providers = await listProvidersWithModels();
  const p = providers[0];
  if (!p) return null;
  const { name, baseUrl } = p;
  return { name, baseUrl, defaultModel: pickDefaultModel(p) };
}
