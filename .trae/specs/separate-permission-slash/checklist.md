# Checklist

## 权限模式独立控件
- [ ] 输入框左侧有权限模式按钮，显示当前模式图标和短标签
- [ ] 点击按钮弹出权限模式下拉菜单
- [ ] 下拉菜单列出 default、plan、acceptEdits、bypassPermissions 四个选项
- [ ] 当前选中模式有高亮标记
- [ ] 下拉菜单支持键盘导航（↑↓、Enter、Esc）
- [ ] 选择后菜单关闭，按钮更新为新模式的图标和标签
- [ ] 按钮颜色根据风险等级变化

## CC 风格斜杠命令菜单
- [ ] 输入 `/` 弹出斜杠命令菜单（而非权限模式菜单）
- [ ] 命令列表包含 /clear、/compact、/context、/cost、/help、/model、/review、/status、/tools
- [ ] 每个命令显示名称和简短描述
- [ ] 支持模糊搜索过滤（如 `/co` 过滤出 /compact、/context、/cost）
- [ ] 支持键盘导航（↑↓、Enter/Tab、Esc）
- [ ] 选择命令后填入 `/command ` 文本，不立即执行
- [ ] 用户可在填入的命令后补充参数，按 Enter 执行

## 旧逻辑清理
- [ ] `/` 不再触发权限模式菜单
- [ ] placeholder 文字从 "/ to switch mode" 改为 "/ for commands"
- [ ] 状态栏底部提示从 "/ mode" 改为 "/ commands"

## 构建验证
- [ ] npm run build 通过
- [ ] npm run lint 无错误
