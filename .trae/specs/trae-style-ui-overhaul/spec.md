# Trae 风格 UI 全面改造 Spec

## Why
当前 UI 虽然已有深色主题，但缺乏动画、视觉层次感不足、组件风格粗糙，与 Trae IDE 的极简+新拟态+玻璃拟态设计语言差距明显。用户要求彻彻底底改造 UI，类比 Trae 的设计风格，增加动画效果。

## What Changes
- **色彩体系重构**：从当前灰色调 `#1e1e1e` 升级为 Trae 风格的深蓝灰底色 + "Intelligent Green" 品牌色
- **全局动画系统**：引入 framer-motion，为页面切换、消息出现、侧边栏折叠、菜单弹出等添加流畅动画
- **侧边栏重设计**：Trae 风格的 Activity Bar（图标栏）+ 文件树式会话列表，带折叠动画
- **聊天输入区重设计**：从终端风格 `>` 提示符改为 Trae 风格的圆角输入框 + 快捷操作标签
- **消息气泡重设计**：用户消息改为右对齐气泡，助手消息改为左对齐卡片，带入场动画
- **登录页重设计**：玻璃拟态卡片 + 渐变背景 + 粒子效果
- **设置页重设计**：卡片式布局 + 柔和阴影 + hover 微交互
- **Topbar 重设计**：移除主题切换（已固定暗色），模型选择器改为 Trae 风格下拉
- **代码块重设计**：带语言标签 + 复制按钮 + 折叠功能的现代化代码块

## Impact
- Affected specs: unified-dark-ui-redesign（之前的深色主题将被新色彩体系替代）
- Affected code:
  - `globals.css` — 色彩变量全面更新
  - `layout.tsx` — 字体引入
  - `sidebar.tsx` — 完全重写
  - `topbar.tsx` — 重写（移除 useTheme）
  - `chat-input.tsx` — 重写为 Trae 风格
  - `assistant-message.tsx` — 重写为卡片+动画
  - `user-message.tsx` — 重写为气泡+动画
  - `message-list.tsx` — 添加滚动动画
  - `login/page.tsx` — 重写为玻璃拟态
  - `settings/page.tsx` — 卡片重设计
  - `package.json` — 添加 framer-motion 依赖

## ADDED Requirements

### Requirement: Trae 风格色彩体系
系统 SHALL 使用以下色彩体系：

| 用途 | 变量名 | 值 |
|------|--------|-----|
| 主背景 | `--bg-base` | `#0F172A`（深蓝灰） |
| 提升背景 | `--bg-elevated` | `#1E293B` |
| 浮层背景 | `--bg-overlay` | `#334155` |
| 主体文字 | `--text-primary` | `#F1F5F9` |
| 次要文字 | `--text-muted` | `#94A3B8` |
| 占位文字 | `--text-subtle` | `#475569` |
| 边框 | `--border-subtle` | `#1E293B` |
| 强边框 | `--border-strong` | `#334155` |
| 品牌色（智能绿） | `--brand` | `#10B981` |
| 品牌柔色 | `--brand-soft` | `rgba(16,185,129,0.08)` |
| 品牌辉光 | `--brand-glow` | `rgba(16,185,129,0.18)` |
| 青色强调 | `--accent-cyan` | `#22D3EE` |
| 紫色强调 | `--accent-purple` | `#A78BFA` |
| 橙色强调 | `--accent-orange` | `#FB923C` |
| 红色强调 | `--accent-red` | `#F87171` |
| 黄色强调 | `--accent-yellow` | `#FBBF24` |

#### Scenario: 深色主题一致性
- **WHEN** 用户访问任意页面
- **THEN** 所有页面使用统一的深蓝灰色系，品牌色为智能绿 `#10B981`

### Requirement: 全局动画系统
系统 SHALL 使用 framer-motion 为以下交互添加动画：

1. **页面切换**：fade + slide 过渡（duration 200ms）
2. **消息出现**：从下方滑入 + 淡入（duration 300ms, spring）
3. **侧边栏折叠/展开**：宽度动画（duration 300ms, ease）
4. **菜单弹出**：scale + fade（duration 150ms, spring）
5. **按钮 hover**：scale 微缩放（1.02x）+ 阴影增强
6. **卡片 hover**：上浮 2px + 阴影增强
7. **输入框 focus**：品牌色辉光脉冲
8. **加载状态**：品牌色脉冲点动画
9. **流式响应**：打字机光标闪烁 + 逐字出现
10. **Toast 通知**：从右侧滑入 + 自动消失

#### Scenario: 消息入场动画
- **WHEN** 新消息出现
- **THEN** 消息从下方 8px 处滑入并淡入，使用 spring 动画（stiffness 300, damping 24）

#### Scenario: 侧边栏折叠动画
- **WHEN** 用户点击折叠按钮
- **THEN** 侧边栏宽度从 280px 平滑过渡到 56px，内容淡出

### Requirement: Trae 风格侧边栏
侧边栏 SHALL 采用双栏结构：

1. **Activity Bar**（56px 宽）：图标导航栏，包含：
   - 聊天图标（当前页高亮为品牌绿）
   - 设置图标
   - MCP 图标
   - 折叠/展开按钮
   - 底部：用户头像

2. **会话面板**（224px 宽，可折叠）：
   - 顶部：搜索框 + 新建会话按钮
   - 中部：会话列表（分组显示：今天 / 昨天 / 更早）
   - 会话项：圆角 hover 效果 + 品牌绿左边框高亮
   - 右键菜单：重命名 / 删除（带动画）

#### Scenario: 侧边栏导航
- **WHEN** 用户点击 Activity Bar 上的图标
- **THEN** 对应面板展开，当前图标高亮为品牌绿色

### Requirement: Trae 风格聊天输入区
聊天输入区 SHALL 采用现代化设计：

1. **输入框**：大圆角（16px）+ 柔和阴影 + 品牌色 focus 辉光
2. **快捷操作标签**：输入框下方显示可点击的功能标签（如"网页读取"、"代码分析"）
3. **模型选择器**：输入框左上角的下拉选择，显示当前模型名
4. **发送按钮**：输入框右侧的品牌绿圆形按钮
5. **状态栏**：输入框下方显示权限模式 / token 用量 / 上下文百分比

#### Scenario: 输入框聚焦
- **WHEN** 用户点击输入框
- **THEN** 输入框出现品牌绿色辉光边框，阴影增强

### Requirement: 消息气泡重设计
消息 SHALL 采用差异化设计：

1. **用户消息**：右对齐，品牌绿背景 + 白色文字，圆角气泡（左下角方角）
2. **助手消息**：左对齐，深色卡片 + 品牌绿左边框，圆角
3. **工具调用**：可折叠卡片，带旋转展开动画
4. **思考块**：半透明背景 + 斜体文字

#### Scenario: 用户消息显示
- **WHEN** 用户发送消息
- **THEN** 消息以右对齐绿色气泡显示，带滑入动画

### Requirement: 登录页重设计
登录页 SHALL 采用玻璃拟态设计：

1. **背景**：深蓝灰渐变 + 动态粒子/网格效果
2. **卡片**：半透明背景 + backdrop-blur + 柔和边框
3. **品牌标识**：大号 TRAE 风格 Logo + 副标题
4. **输入框**：玻璃拟态风格，focus 时品牌绿辉光
5. **按钮**：品牌绿渐变 + hover 发光效果

#### Scenario: 登录页加载
- **WHEN** 用户访问 /login
- **THEN** 页面以 fade-in 动画加载，背景有微妙的粒子/网格动画

### Requirement: 代码块现代化
代码块 SHALL 采用现代化设计：

1. **顶部栏**：语言标签（左）+ 复制按钮（右），深色背景
2. **代码区**：语法高亮 + 行号（可选）
3. **复制按钮**：点击后变为 ✓ + "Copied!" 文字，2 秒后恢复
4. **长代码块**：超过 20 行时自动折叠，显示"展开"按钮

#### Scenario: 复制代码
- **WHEN** 用户点击复制按钮
- **THEN** 按钮图标变为 ✓，文字变为 "Copied!"，2 秒后恢复原状

## MODIFIED Requirements

### Requirement: 深色主题
之前的 `#1e1e1e` 灰色调深色主题 SHALL 替换为 Trae 风格的深蓝灰色系（`#0F172A` 为主背景），品牌色从橙色 `#e0a040` 改为智能绿 `#10B981`。

### Requirement: 顶部栏
顶部栏 SHALL 移除主题切换按钮（已固定暗色），模型选择器改为更醒目的品牌绿样式。

## REMOVED Requirements

### Requirement: 终端风格提示符
**Reason**: Trae 风格使用现代化输入框而非终端 `>` 提示符
**Migration**: 移除 `>` 前缀，改为圆角输入框 + 发送按钮
