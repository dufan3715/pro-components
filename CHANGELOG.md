# Changelog

## [2026-07-01] AI Integration & Context Update

### 🚀 Features

- **AI 智能体集成 (`@qin-ui/*`)**：为所有 UI 包新增了 `init-ai` CLI 工具。
  - **用法**：在消费方项目中直接运行 `npx @qin-ui/antdv-next-pro init-ai`（或其他对应包名）。
  - **标准规范**：全面拥抱 **Agentic Collaboration Standard (ACS)**，一键在项目根目录生成统一的 `.agents/rules/<pkg>.md` 配置文件，告别杂乱的多工具隐藏文件夹。
  - **极佳兼容性**：生成的配置自带 YAML Frontmatter（包含 `globs` 字段），不仅支持主流 Agent，也能完美兼容 Cursor、Windsurf 等对路由匹配有严格要求的 IDE。

### 🐛 Bug Fixes

- **AI 上下文精准度 (`@qin-ui/*`)**：
  - 修正了各个子包中 `AI-CONTEXT.md` 错误复制粘贴的内置组件列表，确保 AI 类型推断的绝对准确。
  - `@qin-ui/vant-pro`：更正为真实的 Vant 移动端组件列表（如 `field`, `stepper`, `picker`, `uploader` 等），并移除了错误提及的 `ProTable` 说明。
  - `@qin-ui/element-plus-pro`：更正为真实的 Element Plus 组件列表（补充了 `time-select`, `autocomplete` 等独有组件）。
  - `@qin-ui/antd-vue-pro` / `@qin-ui/antdv-next-pro`：补全了所有支持的 16 个核心组件的明确列举，防止 AI 在面对含糊表达时 fallback 到 custom 写法。

---

_📦 涉及包的版本更新：_

- `@qin-ui/antd-vue-pro` **v2.1.14**
- `@qin-ui/antdv-next-pro` **v1.1.14**
- `@qin-ui/element-plus-pro` **v1.0.7**
- `@qin-ui/vant-pro` **v1.0.4**
