---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
---

ProTable 表头与表格内容之间的间距由 8px 恢复为 16px：间距仍为表头自身的 `margin-bottom`，表头无元素子节点时由 `:empty { display: none; }` 移除盒子、不再占间距；自定义 `table` 插槽接管内容时同样生效。
