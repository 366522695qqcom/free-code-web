# Checklist

## 沙箱核心层
- [ ] @vercel/sandbox SDK 已安装
- [ ] SandboxManager 可创建/停止/恢复/销毁沙箱
- [ ] 沙箱配置从环境变量正确读取
- [ ] 会话-沙箱映射正确维护
- [ ] 沙箱不可用时不降级为直接执行（安全优先）

## 工具沙箱执行
- [ ] BashTool 在沙箱中通过 runCommand 执行
- [ ] FileReadTool 在沙箱中通过 fs.readFile 执行
- [ ] FileWriteTool 在沙箱中通过 fs.writeFile 执行
- [ ] FileEditTool 在沙箱中通过 read+diff+write 执行
- [ ] GlobTool 在沙箱中通过 runCommand('find') 执行
- [ ] GrepTool 在沙箱中通过 runCommand('rg') 执行
- [ ] WebFetchTool/WebSearchTool 不受沙箱影响，仍在服务端执行
- [ ] 沙箱模式关闭时，所有工具回退到直接执行模式

## 沙箱管理 API
- [ ] GET /api/sandbox 返回沙箱状态
- [ ] POST /api/sandbox 创建沙箱
- [ ] GET /api/sandbox/[id] 返回沙箱详情
- [ ] DELETE /api/sandbox/[id] 销毁沙箱
- [ ] POST /api/sandbox/[id]/stop 停止沙箱
- [ ] POST /api/sandbox/[id]/resume 恢复沙箱
- [ ] POST /api/sandbox/[id]/snapshot 创建快照
- [ ] 所有 API 端点需要认证

## 前端沙箱面板
- [ ] 顶栏显示沙箱状态指示器（running/stopped/creating/error）
- [ ] 沙箱面板显示操作按钮（停止/恢复/销毁/新建）
- [ ] 沙箱面板显示资源信息（vCPU、内存、运行时）
- [ ] 沙箱未启用时不显示面板
- [ ] useSandbox hook 正确调用 API

## 配置与兼容性
- [ ] .env.example 包含所有沙箱环境变量
- [ ] 设置页面包含沙箱配置区域
- [ ] SANDBOX_ENABLED=false 时应用行为与之前完全一致
- [ ] npm run build 通过
- [ ] npm run lint 通过
