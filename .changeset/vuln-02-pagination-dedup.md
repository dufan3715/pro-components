---
'@qin-ui/element-plus-pro': patch
---

修复 ProTable 在 pageSize 变更触发页码钳制时重复发起查询的问题：pageSize 变更窗口内忽略宿主级联的 `current-change`，查询仅执行一次，页码稳定回到第 1 页。
