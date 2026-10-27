---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
---

补充显式 `:columns` 的 key 约定说明：显式列按原样透传给宿主，ProTable 不补齐 `key`，需调用方提供 `key` / `dataIndex` / `prop`；显式模式下 `setColumn` 与列控入口均不生效。
