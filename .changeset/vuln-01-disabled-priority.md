---
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
---

统一 `disabled` 取值优先级为「字段 > 表单 > componentVars 默认值」：

- antdv-next-pro：修复 `componentVars` 中组件级 `disabled` 默认值在表单未声明 `disabled` 时始终失效的问题；
- element-plus-pro：修复表单显式 `disabled={false}` 无法覆盖组件级 `disabled` 默认值的问题。

显式字段级 `disabled={false}` 仍可解禁；`disabled` 的 `''` / `'disabled'` 字符串形态与宿主 Boolean 解析保持一致。
