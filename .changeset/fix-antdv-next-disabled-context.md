---
'@qin-ui/antdv-next-pro': patch
---

修复 `ProForm` 遮蔽宿主禁用状态的问题：

- **现象**：`ProForm` 未显式指定 `disabled` 时，会向下发恒为 `false` 的禁用上下文，导致宿主 `<ConfigProvider :component-disabled="true">` 以及外层 `<a-form :disabled>` 的禁用状态被静默解除（表单可编辑）。
- **原因**：`useDisabledContextProvider` 收到的是归一化后的显式 boolean（未指定时为 `false`），而 antdv-next 的 `DisabledContext` 采用「最近 Provider 全量覆盖」语义，恒下发的 `false` 覆盖了上层上下文。
- **修复**：未显式指定 `attrs.disabled` 时改为下发上层上下文的值（`useDisabledContext()`），与该包 `BaseFormItem` 既有的 `props.disabled ?? parentDisabled.value` 保持同一范式；显式值行为不变（裸 `disabled`、`:disabled="true"`、字符串 `'true'` 均归一为禁用；`:disabled="false"` 显式解除，包括覆盖宿主的 `true`）。
- **回归**：`PF-D2` —— 宿主 `componentDisabled: true` + 未指定 → 输入框禁用；`:disabled="false"` → 覆盖宿主；裸 `disabled` → 仍禁用。

破坏性变更：无（此前未指定 `disabled` 时无法继承宿主禁用属于缺陷；显式指定的语义完全不变）。
