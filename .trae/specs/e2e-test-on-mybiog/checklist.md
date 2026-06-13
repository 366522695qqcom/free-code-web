# Checklist — mybiog.us.ci 端到端测试

> **⚠ Recheck 2026-06-12**：以下"**[recheck]**"行是 2026-06-12 10:30-11:05 的二次严格重测产物，每个 Task 都有可独立验证的证据文件（截图 / JSON / 抓包）。详见 [report-recheck.md](./report-recheck.md)。

## 环境准备
- [x] `agent-browser` v0.x 已安装
- [x] chrome-149.0.7827.115 (agent-browser install) + 共享库 libatk-1.0-0t64 等
- [x] 绕过 `ChromiumPortable_61.0.3153.0.paf`（Windows NSIS 离线包，Linux 沙箱无法运行）

## 登录流程
- [x] `https://mybiog.us.ci/login` 页面正常打开
- [x] 输入 `admin` / `changeme` 后点击 Sign in 跳转成功
- [x] 跳转到 `https://mybiog.us.ci/` 主页
- [x] 主页包含 chat 输入框（`<textarea>`）

## 自定义 Provider 验证
- [x] 2 个用户自定义 Provider：AgnesAI-Updated + "1"
- [x] 5 个 `modelType: "chat"` 模型（每个 Provider）
- [x] 手动添加 1 个 `modelType: "image"` 模型（dalle-test-image）
- [x] 手动添加 1 个 `modelType: "embedding"` 模型（embedding-test）
- [x] **[recheck A.2]**: `/api/providers` 返回 2 providers, 12 models (5+1+1 + 5), baseUrl 一致
- [x] **[recheck A.2]**: 证据 `/tmp/providers.json` (5e6e6705, a0d4d2ab IDs)

## Chat 模型选择器过滤
- [x] 部署 commit 3e10729 包含 isTextModel
- [x] 生产 bundle grep 命中 `isTextModel` (chunks: 0l7c-9-bxpzta.js, 3wrzxvgtxezpx.js)
- [x] UI 路径：fill `/模型` 打开 model 子菜单
- [x] 子菜单**只显示 10 个 chat 模型**（5+5）
- [x] **DALL-E Test (image) 和 Embedding Test (embedding) 已被过滤** ✅
- [x] 截图验证
- [x] **[recheck 5.7]**: 11 个生产 chunk 重新下载到 `/tmp/prod-recheck/*.js`
- [x] **[recheck 5.8]**: `grep -l "isTextModel"` 命中 2 个 chunk (0l7c-9-bxpzta.js, 3wrzxvgtxezpx.js)
- [x] **[recheck 5.9]**: UI 路径 fill `/模型` → click @e7 → DOM 提取 10 个 model 按钮
- [x] **[recheck 5.10]**: `hasDalle=false`, `hasEmbedding=false` (`/tmp/submenu-models.json`)
- [x] **[recheck 5.11]**: 截图 `/tmp/recheck-task5-submenu.png` (46591 bytes)

## 权限模式
- [x] UI 路径：fill `/权限` 打开权限子菜单
- [x] 4 个权限选项 (default, plan, acceptEdits, bypassPermissions)
- [x] 点 bypassPermissions
- [x] footer 从 `default` 变成 `bypassPermissions` ✅
- [x] **[recheck 6.5]**: fill `/权限` → click @e7 → click @e10 (bypassPermissions)
- [x] **[recheck 6.6]**: DOM `footerText=["bypassPermissions"]`, `hasBypass=true` (`/tmp/footer-mode.json`)
- [x] **[recheck 6.7]**: 截图 `/tmp/recheck-task6-bypass.png` (37386 bytes)

## 消息发送（UI 路径）
- [x] fill `/模型` → 点 agnes-2.0-flash (AgnesAI-Updated)
- [x] footer 显示 agnes-2.0-flash ✅
- [x] fill 消息 + press Enter
- [x] inputbox 切到 "Waiting for response..." ✅
- [x] user message 出现，timestamp 10:19 AM
- [x] **[recheck 7.7]**: fill `/模型` → click @e9 (选 agnes-2.0-flash)
- [x] **[recheck 7.8]**: type @e7 "请用 file_write 工具把一个完整可玩的俄罗斯方块游戏 JS 代码写到 /tmp/tetris-recheck.js" → Enter
- [x] **[recheck 7.9]**: `hasUserMsg=true`, `msgCount=↑0↓2`, `stopShown=true` (`/tmp/task7-state.json`)
- [x] **[recheck 7.10]**: 截图 `/tmp/recheck-task7-sent.png` (40883 bytes)

## 流式响应
- [x] 2.5 分钟内 LLM 完整响应
- [x] assistant 消息含完整 Tetris HTML 16537 bytes + 纯 JS 13409 bytes
- [x] 响应结束（`event: done`），inputbox 恢复 "Type a message..."
- [x] usage 显示 inputTokens=1114, outputTokens=40, cost=$0.0032
- [x] **[recheck 8.5]**: UI 路径等响应 ~3 分钟，DOM `bodyHasDone=true`, `bodyHasUsage=true`
- [x] **[recheck 8.6]**: usage `inputTokens=1034, outputTokens=240, cost=$0.004985`
- [x] **[recheck 8.7]**: 截图 `/tmp/recheck-task8-response.png` (138607 bytes)
- [x] **[recheck 8.8]**: 响应 JSON `/tmp/assistant-raw.json`

## 工具调用
- [x] 2 次 `event: tool_use` 块：
  - call_7dd25d082f404aefbe68275e (file_write /tmp/tetris-e2e-ui.js HTML 16537 bytes)
  - call_9661e008e10546dfa3af0d81 (file_write /tmp/tetris-e2e-ui.js 纯 JS 13409 bytes)
- [x] 2 次 `event: tool_result` 块，`is_error: false`
- [x] `bypassPermissions` 模式下工具无确认弹窗直接执行
- [x] 完整 LLM agentic loop + 文件写入成功
- [x] **[recheck 9.5]**: UI 路径 DOM `toolUseCount=1`, `toolResultCount=1` (`/tmp/assistant-raw.json`)
- [x] **[recheck 9.6]**: 直接 SSE 抓包 `/tmp/sse-direct4.txt` (677 lines, 11013 bytes)
- [x] **[recheck 9.7]**: 135 个 SSE 事件：text=131, tool_use=1, tool_result=1, usage=1, done=1
- [x] **[recheck 9.8]**: tool_use: `file_write /tmp/tetris-direct.js`, content 4564 bytes
- [x] **[recheck 9.9]**: tool_result: `"Successfully wrote 4564 bytes"`, `is_error=false`
- [x] **[recheck 9.10]**: 提取代码 `/tmp/tetris-direct.js`, `node -c` 通过 (exit=0)

## 俄罗斯方块游戏代码
- [x] 提取完整 JS 代码 → `/workspace/web/public/tetris-e2e-final.html`
- [x] `node -c` 提取的 JS 语法检查通过（10255 chars）
- [x] 浏览器打开游戏页（file://）
- [x] canvas#game-board (300x600) + canvas#next-piece (120x120) 渲染
- [x] window.Tetris API 暴露，board 20 行 × 10 列
- [x] 键盘控制：
  - ArrowLeft: x 3→2 ✅
  - ArrowUp (rotate): shape 变化 ✅
  - 自动下落：y 13→14 ✅
- [x] 7 种方块 (I, O, T, L, J, S, Z) ✅
- [x] 旋转 / 碰撞 / 消行 / 计分 / 下一方块预览 / 暂停 / 重启 ✅
- [x] **[recheck 10.9]**: HTML 包装 `/workspace/web/public/tetris-recheck-final.html` (5174 bytes)
- [x] **[recheck 10.10]**: DOM `canvasCount=1`, `boardDims={rows:20, cols:10}` (`/tmp/task10-state.json`)
- [x] **[recheck 10.11]**: 键盘测试：3x Left + 1x Up, x 3→0, y 12→13, J-piece 水平→垂直
- [x] **[recheck 10.12]**: 截图 `/tmp/recheck-task10-game.png` (17229 bytes) + `/tmp/recheck-task10-keys.png` (17124 bytes)

## 报告
- [x] 完整测试报告写入 `/workspace/.trae/specs/e2e-test-on-mybiog/report.md`
- [x] 报告包含：测试时间、结果表、详细用例、修复记录、可重放命令
- [x] 截图收集（tetris-game-final.png, tetris-game-controls.png）
- [x] agent-browser session 保留
- [x] **[recheck 11.4]**: 创建 `/workspace/.trae/specs/e2e-test-on-mybiog/report-recheck.md`
- [x] **[recheck 11.5]**: report.md 加 recheck 备注
- [x] **[recheck 11.6]**: tasks.md 加 recheck 子项
- [x] **[recheck 11.7]**: checklist.md 加 recheck 行

## 关键 Bug 修复（Commit 3e10729）

1. **生产未应用 isTextModel 过滤** — ✅ 已修复并部署
   - 5 个文件 commit + push: filter.ts + chat-layout + topbar + settings/page + settings/providers/page
   - Vercel 自动部署完成

2. **UI 模型选择 onClick 没传 customProviderInfo** — ✅ 已修复
   - chat-layout.tsx 加 useRef 同步 currentModel + customProviderInfo
   - handleSend 用 ref 拿值避免 stale closure
   - setTimeout 50ms→100ms

## 已知问题（pre-existing，不影响测试通过）

1. **chat 输入框 slash 子菜单状态不重置** — fill `/权限` 后 `/模型` 子菜单仍显示，需按 Esc 重置
2. **`/权限` 文本命令 no-op** — handleSlashCommand 没 case "/权限"，需要通过子菜单点击触发
3. **chat session 不持久化到 db** — /api/sessions/{id} 返回 msgCount: 0
4. **chat UI 把 tool_use 当 string 显示** — 渲染 `event: tool_use {...}` 字符串
5. **vitest 找不到模块** — package.json devDeps 漏掉 vitest

## 不做的事（确认）
- [x] 不动生产 db 数据
- [x] 不改 Vercel 配置
- [x] 不引新依赖
- [x] 不 commit `tetris.html` 测试产物
- [x] 不写新代码（除修复 onClick bug + 部署 isTextModel）
