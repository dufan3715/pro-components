---
'@qin-ui/pro-components-core': patch
---

补充 `resetQueryParams` 的分页重置边界说明：分页按初始化快照合并写，仅恢复快照中存在的键，运行期新增的分页键在重置后保留；搜索条件仍按快照批量覆盖。
