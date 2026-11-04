---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
---

修复 ProTable 表头与表格内容之间的间距：原规则写在 `&_header` 内，编译为 `.pro-table_header + .pro-table_header_content`，而实际内容节点是 `.pro-table_content`，选择器从未命中（此前实际间距为 0）；现将间距改为表头自身的 `margin-bottom: 8px`，表头无元素子节点时由既有 `:empty { display: none; }` 移除盒子、不再占间距。原规则意图值为 16px，本次按设计调整为 8px；自定义 `table` 插槽接管内容时同样生效。
