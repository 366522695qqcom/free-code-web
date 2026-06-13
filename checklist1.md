# Checklist

- [x] H-1 Shell 命令注入：确认 grepWithRipgrep 中 exec(cmd) 的字符串拼接存在命令注入
- [x] H-2 任意文件读写：确认 resolvePath() 对以 `/` 开头的绝对路径无限制
- [x] H-3 SSRF customBaseUrl：确认 runOpenAILoop 中 customBaseUrl 无内网地址校验
- [x] M-1 SSRF web_fetch：确认 web_fetch 工具对目标 URL 无内网限制
- [x] M-2 API 密钥明文存储：确认 providers 表中 api_key 明文存储且 API 响应返回完整密钥
- [x] M-3 默认凭据：确认 auth.ts 中硬编码了 admin/changeme/default-secret-change-me
- [x] 每个漏洞均包含攻击者画像、输入向量、完整代码路径、影响分析、修复建议
- [x] 审计结论明确（3 HIGH + 3 MEDIUM）