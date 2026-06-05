# Checklist

## 权限分级系统
- [x] RiskLevel 类型定义包含 low/high/outside-sandbox 三级
- [x] 风险评估器能根据 BashTool 命令模式判定风险等级
- [x] 低风险命令（ls, cat, find, grep, git status 等）自动判定为 low
- [x] 高风险命令（npm install, build, curl POST 等）判定为 high
- [x] 沙箱外命令（docker run, ssh, scp 等）判定为 outside-sandbox
- [x] 未匹配的命令默认判定为 high
- [x] 文件操作工具风险分级正确（read=low, write/edit=high, glob/grep=low）
- [x] 用户自定义规则可覆盖默认规则
- [x] 沙箱模式下部分高风险操作可降级（如 npm install 降为 low）

## 沙箱核心层
- [x] @vercel/sandbox SDK 已安装
- [x] SandboxManager 可创建/停止/恢复/销毁沙箱
- [x] 沙箱配置从环境变量正确读取
- [x] 会话-沙箱映射正确维护
- [x] 沙箱不可用时不降级为直接执行（安全优先）

## 工具沙箱执行
- [x] BashTool 在沙箱中通过 runCommand 执行
- [x] FileReadTool 在沙箱中通过 fs.readFile 执行
- [x] FileWriteTool 在沙箱中通过 fs.writeFile 执行
- [x] FileEditTool 在沙箱中通过 read+diff+write 执行
- [x] GlobTool 在沙箱中通过 runCommand('find') 执行
- [x] GrepTool 在沙箱中通过 runCommand('rg') 执行
- [x] WebFetchTool/WebSearchTool 不受沙箱影响
- [x] 沙箱模式关闭时，所有工具回退到直接执行模式
- [x] agent-stream.ts 集成权限分级：低风险直接执行、高风险确认、沙箱外特殊确认

## 沙箱管理 API
- [x] GET /api/sandbox 返回沙箱状态
- [x] POST /api/sandbox 创建沙箱
- [x] GET /api/sandbox/[id] 返回沙箱详情
- [x] DELETE /api/sandbox/[id] 销毁沙箱
- [x] POST /api/sandbox/[id]/stop 停止沙箱
- [x] POST /api/sandbox/[id]/resume 恢复沙箱
- [x] POST /api/sandbox/[id]/snapshot 创建快照
- [x] 所有 API 端点需要认证

## 前端权限确认增强
- [x] 高风险操作确认弹窗显示黄色"高风险"标签和执行环境标签
- [x] 沙箱外执行确认弹窗使用红色边框+警告图标
- [x] 沙箱外执行弹窗不提供"始终允许"按钮
- [x] 低风险操作自动放行时显示轻量 toast（3 秒消失）
- [x] "始终允许"记忆仅在当前会话有效
- [x] "始终允许"不适用于沙箱外执行等级

## 配置与兼容性
- [x] .env.example 包含所有沙箱环境变量
- [x] 设置页面包含沙箱配置区域
- [x] 设置页面包含自定义权限规则管理
- [x] SANDBOX_ENABLED=false 时应用行为与之前完全一致
- [x] 权限分级在非沙箱模式下仍然生效
- [x] npm run build 通过
- [x] npm run lint 通过
