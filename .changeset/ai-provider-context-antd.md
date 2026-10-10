---
'@qin-ui/antd-vue-pro': patch
---

随包 AI 上下文（AI-CONTEXT.md）新增「项目级覆盖层」规则：AI 在生成任何 Field/Column 代码前，将先全局搜索并读取项目 `ProComponentProvider` 的实际 `componentVars` / `componentMap` / `locale` 配置（属性优先级：Field 属性 > 项目 Provider > 内置默认）。规则不含配置值快照，项目修改配置后无需重新执行 `init-ai`，AI 每次会话都读取最新源码。
