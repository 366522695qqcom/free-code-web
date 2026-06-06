# Checklist

## 斜杠命令列表数据结构
- [ ] SlashCommand 类型定义包含 name、description、hasSubmenu 字段
- [ ] SLASH_COMMANDS 常量包含 /clear、/compact、/context、/cost、/help、/model、/permissions、/review、/status、/tools

## CC 风格斜杠命令菜单
- [ ] 输入 `/` 弹出斜杠命令菜单（而非权限模式菜单）
- [ ] 每个命令显示名称和简短描述
- [ ] 支持模糊搜索过滤（如 `/co` 过滤出 /compact、/context、/cost）
- [ ] 支持键盘导航（↑↓、Enter/Tab、Esc）
- [ ] 选择普通命令后填入 `/command ` 文本，不立即执行
- [ ] 用户可在填入的命令后补充参数，按 Enter 执行

## /permissions 子菜单
- [ ] 选中 /permissions 后切换为权限分级子菜单
- [ ] 子菜单显示 default、plan、acceptEdits、bypassPermissions 四个选项
- [ ] 每个选项显示图标、模式名、核心行为简述、风险等级
- [ ] 当前选中模式有高亮标记
- [ ] 支持键盘导航（↑↓、Enter、Esc）
- [ ] Esc 返回命令列表（而非直接关闭）
- [ ] 选择后切换权限模式，关闭菜单，清空输入框

## 旧逻辑清理和提示文字
- [ ] `/` 不再直接弹出权限模式菜单
- [ ] placeholder 文字从 "/ to switch mode" 改为 "/ for commands"
- [ ] 状态栏底部提示从 "/ mode" 改为 "/ commands"

## 构建验证
- [ ] npm run build 通过
- [ ] npm run lint 无错误
