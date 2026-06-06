# Checklist

## 斜杠命令列表数据结构
- [x] SlashCommand 类型定义包含 name、hasSubmenu 字段
- [x] SLASH_COMMANDS 常量包含 /clear、/compact、/context、/cost、/help、/model、/permissions、/review、/status、/tools

## CC 风格极简斜杠命令菜单
- [x] 输入 `/` 弹出极简命令菜单（而非权限模式菜单）
- [x] 每行只显示命令名，无描述、无表头、无提示文字
- [x] 支持模糊搜索过滤（如 `/co` 过滤出 /compact、/context、/cost）
- [x] 支持键盘导航（↑↓、Enter/Tab、Esc）
- [x] 选择普通命令后填入 `/command ` 文本，不立即执行

## /permissions 子菜单
- [x] 选中 /permissions 后切换为权限分级子菜单
- [x] 子菜单极简风格：每行只显示图标和模式名，无描述文字
- [x] 当前选中模式有 `*` 标记
- [x] 支持键盘导航（↑↓、Enter、Esc）
- [x] Esc 返回命令列表
- [x] 选择后切换权限模式，关闭菜单，清空输入框

## 旧逻辑清理和提示文字
- [x] `/` 不再直接弹出权限模式菜单
- [x] 移除旧的表格表头、描述列、footer 提示等
- [x] placeholder 文字从 "/ to switch mode" 改为 "/ for commands"
- [x] 状态栏底部提示从 "/ mode" 改为 "/ commands"

## 单元测试
- [ ] SLASH_COMMANDS 数据结构包含所有10个命令
- [ ] 模糊搜索过滤逻辑测试通过（/co、/p、/xyz）
- [ ] /permissions 子菜单切换逻辑测试通过
- [ ] 选择普通命令后填入文本逻辑测试通过
- [ ] 选择权限模式后切换模式、关闭菜单、清空输入框测试通过

## 构建验证
- [ ] npm run build 通过
- [ ] npm run lint 无错误
- [ ] npx vitest run 所有测试通过
