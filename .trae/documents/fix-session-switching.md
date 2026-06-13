# 修复：无法切换到之前的对话

## Summary
点击侧边栏历史会话后，UI 没有真正切换到目标会话（消息列表仍是上一个会话的内容，或先显示旧消息再闪现）。根因是 `useChat(sessionId, ...)` hook 内部对 `sessionId` prop 的变化不响应，导致会话切换的副作用（清空 messages、重新加载、停止流式响应）未触发。本 plan 通过 (1) 在 `useChat` 中加入 sessionId 同步 useEffect、(2) 在 `chat-layout.tsx` 的 `handleSelectSession` 中加入 `clearMessages()` + 停止流 + 错误处理、(3) 在切换时按 `currentSessionId` 重新拉取 messages 并设置到 state、(4) 在 `use-sessions` 中按会话 id 缓存并复用之前已加载的 messages 来修复。

## Current State Analysis

### Bug 现场

| 文件 | 问题 |
|------|------|
| [use-chat.ts](file:///workspace/web/src/hooks/use-chat.ts#L158) | `useChat(sessionId, ...)` 接收 prop 但**没有 useEffect 监听 sessionId 变化**。当父组件 `setCurrentSessionId(id)` 时，hook 内部 `messages` 仍保留上一个会话的 state |
| [chat-layout.tsx#handleSelectSession](file:///workspace/web/src/components/layout/chat-layout.tsx#L127-L183) | 切换时只调用 `setCurrentSessionId(id)` + `fetch('/api/sessions/' + id).then(setMessages(...))`。**没有先 `clearMessages()`** —— 在新消息到达前 UI 闪烁旧消息；**没有 abort 旧流** —— 如果用户切换时还在 streaming，旧流的 `setMessages` 回调会污染新会话的 state；**没有 race condition 防护** —— 快速连续点击两个会话会乱序 |
| [use-sessions.ts](file:///workspace/web/src/hooks/use-sessions.ts) | `setCurrentSessionId` 是裸 setState，没有附带"切换时的副作用"机制（如重置 usage） |
| [use-sessions.ts#sessionToConversation](file:///workspace/web/src/hooks/use-sessions.ts#L18-L28) | `sessionToConversation` 把 `messages` 永远设为 `[]`（拉列表时不需要完整消息）—— 这是合理的；问题在切换时需要重新走 `/api/sessions/[id]` |

### 触发场景

1. 用户发送消息到会话 A（messages 不空）
2. 用户在 sidebar 点击会话 B
3. 期望：消息流清空 → 拉 B 的消息 → 渲染
4. 实际：
   - `setCurrentSessionId(B)` 触发 useChat 重渲染，但 messages 引用未变 → UI 还显示 A 的消息
   - `fetch('/api/sessions/B')` 在某个时点返回，**`setMessages(B's messages)` 才生效** —— 这个中间过程让用户看到 A 的消息
   - 如果用户连续点 B → C → D，最后到达的 fetch 不一定是最后一次点击的会话（race condition）
   - 切换时如果 A 还在 streaming，A 的 `setMessages` 回调会把 B 的 messages 覆盖回去

### 根因总结

1. `useChat` 不监听 sessionId 变化（缺少副作用清空/同步）
2. `handleSelectSession` 缺少前置 `clearMessages()` 和 abort 操作
3. `handleSelectSession` 缺少 race condition 防护（AbortController / sequence token）
4. 切换时 `usage` / `autoApproveToasts` / `pendingConfirmation` 不重置

## Proposed Changes

### 1. `use-chat.ts`：添加 sessionId 同步 effect

在 `useChat` 中加入以下 effect（在已有的 `messagesRef` 之后）：

```ts
// Reset chat state when switching sessions
const lastSessionIdRef = useRef<string | null>(sessionId);
useEffect(() => {
  if (lastSessionIdRef.current === sessionId) return;
  lastSessionIdRef.current = sessionId;
  // Reset transient state — messages will be populated by handleSelectSession's fetch
  setMessages([]);
  setUsage({ inputTokens: 0, outputTokens: 0, cacheCreationInputTokens: 0, cacheReadInputTokens: 0, cost: 0 });
  setPendingConfirmation(null);
  setAutoApproveToasts([]);
  // Abort any in-flight stream
  abortControllerRef.current?.abort();
  abortControllerRef.current = null;
  setIsStreaming(false);
}, [sessionId]);
```

**为什么**：当父组件 setCurrentSessionId 切换时，hook 自动清空旧状态。这样即使 chat-layout 不主动调 `clearMessages()`，UI 也不会"残留"上一个会话的 messages。

### 2. `chat-layout.tsx`：改造 `handleSelectSession`

**Before** ([chat-layout.tsx#L127-L183](file:///workspace/web/src/components/layout/chat-layout.tsx#L127-L183)):
```ts
const handleSelectSession = useCallback((id: string) => {
  setCurrentSessionId(id);
  fetch(`/api/sessions/${id}`).then(...).then(setMessages(...));
}, [setCurrentSessionId, setMessages]);
```

**After**:
```ts
const sessionLoadTokenRef = useRef(0);

const handleSelectSession = useCallback(
  (id: string) => {
    if (id === currentSessionId) return; // 同一会话不重复加载
    // 1. 立即切换 id（触发 useChat 内的清空 effect）
    setCurrentSessionId(id);
    // 2. 立即清空 messages（前置清空，避免闪烁旧消息）
    clearMessages();
    // 3. 停止正在进行的流
    stopStreaming();
    // 4. 拉新会话的消息（带 token 防止 race condition）
    const token = ++sessionLoadTokenRef.current;
    fetch(`/api/sessions/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load session: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (token !== sessionLoadTokenRef.current) return; // 已被新切换覆盖
        if (data.messages && Array.isArray(data.messages)) {
          const enhancedMsgs = data.messages.map((msg, idx) => ({
            id: `msg-${idx}`,
            role: msg.role,
            content: typeof msg.content === "string"
              ? msg.content
              : Array.isArray(msg.content)
                ? msg.content.filter((b) => b.type === "text").map((b) => b.text).join("")
                : "",
            timestamp: new Date(msg.timestamp).getTime(),
            contentBlocks: Array.isArray(msg.content)
              ? data.messages.map((block) => {
                  if (block.type === "text") return { type: "text" as const, text: block.text };
                  if (block.type === "thinking") return { type: "thinking" as const, text: block.thinking };
                  if (block.type === "tool_use") return { type: "tool_use" as const, toolUse: { id: block.id, name: block.name, input: block.input }, status: "done" as const };
                  return { type: "text" as const, text: "" };
                })
              : undefined,
          }));
          setMessages(enhancedMsgs);
        }
        // 恢复 usage（如果后端返回 tokenUsage）
        if (data.tokenUsage) {
          resetUsage();
          // 直接 setUsage — 通过新的 useChat setter 暴露
        }
      })
      .catch((err) => {
        if (token !== sessionLoadTokenRef.current) return;
        console.error("Failed to load session", err);
        setSystemMessage("无法加载会话消息");
      });
  },
  [currentSessionId, setCurrentSessionId, clearMessages, stopStreaming, setMessages, setSystemMessage]
);
```

**关键变更**：
- 同会话不重复加载（`id === currentSessionId` 提前 return）
- 前置 `clearMessages()` + `stopStreaming()` 避免残留
- 引入 `sessionLoadTokenRef` 防止 race condition：仅最后一次点击的 fetch 会写入 state
- 错误处理：失败时显示系统消息

### 3. `use-chat.ts`：暴露 `setUsage` setter

新增 `setUsage` 到 hook 返回值，让 `chat-layout` 在加载历史会话时能恢复 usage：

```ts
// 在 useChat 顶部
const setUsageDirect = useCallback((u: Usage) => setUsage(u), []);

// return 新增
return { ..., setUsage: setUsageDirect };
```

`chat-layout` 的 `handleSelectSession` 中恢复 usage：
```ts
if (data.tokenUsage) {
  setUsageDirect({
    inputTokens: data.tokenUsage.inputTokens || 0,
    outputTokens: data.tokenUsage.outputTokens || 0,
    cacheCreationInputTokens: data.tokenUsage.cacheCreationInputTokens || 0,
    cacheReadInputTokens: data.tokenUsage.cacheReadInputTokens || 0,
    cost: data.tokenUsage.cost || 0,
  });
}
```

### 4. `use-chat.ts`：sessionId prop 改为 `null` 时立即清空

在上面的 useEffect 末尾加入：
```ts
// Switched to "no session" — ensure all state is empty
if (sessionId === null) {
  setMessages([]);
  setUsage(...);
}
```
（实际已有的 `clearMessages()` 已经做这个工作 — 改成 `null` 时不依赖父组件传 `null` 时是否调用 `clearMessages`，保险起见 effect 内处理。）

### 5. `chat-layout.tsx`：删除 session 时检查 currentSessionId

现有 [chat-layout.tsx#L193-L201](file:///workspace/web/src/components/layout/chat-layout.tsx#L193-L201) 已正确处理（删除后调 `clearMessages()`），保持。

### 6. (可选优化) 避免重复点击同一会话

- sidebar.tsx 在 button onClick 时已经 `onSelectSession(session.id)` —— 加 early return 即可（已包含在 useCallback 中）

## Assumptions & Decisions

| 决策 | 理由 |
|------|------|
| 不引入 session store（zustand 等）| 范围最小化；问题本质是 effect 缺失 |
| 不改 use-sessions 的 API | setCurrentSessionId 保持纯 setState，副作用由 useChat 内部处理 |
| 不实现消息缓存（避免二次拉取）| 范围控制；首次实现修复核心 bug 后再做性能优化 |
| token 持久化方案保留 | 不改后端 schema，usage 通过 fetch 拉取后 set |
| 切换中允许 abort 流 | 避免旧会话的流回调污染新会话 |
| 不处理"切换后自动滚动到新会话最后一条消息" | 由 useChat 自身消息流渲染保证（自动滚到底） |

## Verification

1. `cd /workspace/web && npm run build` 通过
2. `cd /workspace/web && npm run lint` 通过
3. 手动测试场景：
   - 在会话 A 发送 3 条消息 → messages.length=3
   - 在会话 B（已存在 5 条消息）点 sidebar 切换 → UI 立即清空 → 1s 内显示 B 的 5 条消息
   - 快速点击 A → B → C → D，最终显示 D 的内容
   - 在 A 还在 streaming 时切换到 B → A 的流被 abort，B 显示自己已有 messages
4. 检查后端日志无未捕获错误
5. 用 agent-browser 打开 `https://mybiog.us.ci/`（如环境允许）执行同样的操作

## 实施文件

- [use-chat.ts](file:///workspace/web/src/hooks/use-chat.ts) — 添加 sessionId sync effect + 暴露 setUsage
- [chat-layout.tsx](file:///workspace/web/src/components/layout/chat-layout.tsx) — 改造 handleSelectSession

## 不做的事

- 不重构 use-sessions 状态管理
- 不改 /api/sessions/[id] 后端
- 不改 Sidebar 组件
- 不引入新依赖
- 不优化消息缓存（performance optimization 是另一个 task）
- 不修 streaming 中切换的"是否应保留未完成响应"语义问题（本次直接 abort）
