---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
---

新增分页显式值冲突提示：当 `:pagination` 显式设置 `current` / `pageSize` 覆盖 `table.pageParam`，导致宿主回写后分页不更新时，输出一次去重告警。运行时行为保持不变。
