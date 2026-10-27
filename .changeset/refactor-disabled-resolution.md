---
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
---

内部重构：字段禁用取值的三级优先（字段显式 > 外层上下文 > componentVars 默认值）收敛为共享工具 `resolveEffectiveDisabled` 单一实现，两包调用点对齐，无行为变化。
