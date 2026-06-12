# Security Audit Spec

## Why
对 free-code CLI + CC Web 代码仓库进行周期性的自动化安全审计，识别中等严重度及以上的已确认漏洞，确保系统在认证、注入、外部交互和敏感数据处理等高风险攻击面上不存在可被利用的安全缺陷。

## What Changes
- 梳理代码库架构，明确入口点、信任边界和数据流转
- 对认证与访问控制、注入向量、外部交互、敏感数据处理四大攻击面进行系统性检查
- 对每个潜在发现追踪完整代码路径（攻击者可控输入 → 影响结果）
- 输出结构化审计报告（按严重度分组，含位置、影响、修复建议）
- 如未确认中等及以上漏洞，输出"审计完成——未发现中等或更高严重度的已确认漏洞"

## Impact
- Affected specs: 无（纯审计，不修改代码）
- Affected code: 全仓库范围扫描（`src/`、`web/src/`）

## ADDED Requirements
### Requirement: Architecture Discovery
The system SHALL examine the codebase to understand entry points, trust boundaries, and data flows between components before beginning vulnerability assessment.

#### Scenario: Identify entry points
- **WHEN** audit begins
- **THEN** all HTTP route handlers, CLI entry points, WebSocket/messaging endpoints, and external-facing APIs are cataloged

#### Scenario: Map trust boundaries
- **WHEN** entry points are identified
- **THEN** boundaries between unauthenticated public access, authenticated user access, internal service communication, and sandbox/isolated execution are documented

### Requirement: Authentication & Access Control Audit
The system SHALL audit login flows, session management, role/permission checks for vulnerabilities that allow unauthorized access or privilege escalation.

#### Scenario: Session hijacking or fixation
- **WHEN** examining session management code
- **THEN** any weakness in token generation, storage, validation, or invalidation is reported with exploitation path

#### Scenario: Authorization bypass
- **WHEN** examining permission checks
- **THEN** any route or operation that lacks proper authorization or has circumventable checks is reported

### Requirement: Injection Vector Audit
The system SHALL audit raw SQL queries, shell command construction, template rendering, and file path operations for injection vulnerabilities.

#### Scenario: SQL injection
- **WHEN** raw SQL queries are found
- **THEN** any query with unsanitized user input concatenation is reported with full exploitation path

#### Scenario: Command injection
- **WHEN** shell command construction from user input is found
- **THEN** any command built via string concatenation without proper escaping is reported

#### Scenario: Path traversal
- **WHEN** file path operations using user input are found
- **THEN** any path constructed without sanitization that could escape the intended directory is reported

### Requirement: External Interaction Audit
The system SHALL audit webhook handlers, outbound network requests, and third-party API integrations for SSRF, data exfiltration, and injection risks.

#### Scenario: SSRF via outbound requests
- **WHEN** user-controlled URLs are used in outbound HTTP requests
- **THEN** any request where the target URL is not validated against an allowlist is reported

#### Scenario: Webhook injection
- **WHEN** webhook endpoints accept and process external payloads
- **THEN** any unvalidated payload that triggers sensitive operations is reported

### Requirement: Sensitive Data Handling Audit
The system SHALL audit secrets in code/config, credential/PII logging, and encryption practices.

#### Scenario: Hardcoded secrets
- **WHEN** scanning source files and configuration
- **THEN** any API keys, tokens, passwords, or cryptographic material in plaintext is reported

#### Scenario: Credential logging
- **WHEN** examining logging statements
- **THEN** any log that outputs credentials, tokens, or PII is reported

### Requirement: Evidence Requirements
Each reported finding SHALL include: attacker profile, controllable input vector, exact code path from input to vulnerability, concrete impact, and suggested fix.

#### Scenario: Complete finding report
- **WHEN** a vulnerability is confirmed
- **THEN** the report includes all five evidence elements and the full code path trace

### Requirement: Structured Output
The system SHALL output findings grouped by severity (Critical / High / Medium), each with location, impact, and fix suggestion. If no Medium+ findings are confirmed, output a clean audit statement.

#### Scenario: Clean audit
- **WHEN** no Medium, High, or Critical vulnerabilities are confirmed
- **THEN** output "审计完成——未发现中等或更高严重度的已确认漏洞"

#### Scenario: Findings present
- **WHEN** one or more Medium+ vulnerabilities are confirmed
- **THEN** output findings grouped by severity with full evidence