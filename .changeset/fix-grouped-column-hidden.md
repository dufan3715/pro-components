---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
---

修复分组列的子列 `hidden` 不生效（三包同构）：

- **现象**：列过滤只作用于顶层列 —— element `TableColumnRenderer` 的 `renderColumn` 对 `children` 直接 `map` 递归渲染、antd / antdv-next `ProTable` 的可见列过滤只过滤顶层，导致分组内的子列设置 `hidden: true`（含响应式 `ref`）后仍被渲染（表头与表体都出现）。
- **修复**：
  - `element-plus-pro`：`renderColumn` 渲染子列前按 `isObjectItem(child) && !toValue(child.hidden)` 过滤（与顶层同口径，支持响应式形态）；
  - `antd-vue-pro` / `antdv-next-pro`：新增 `filterVisibleColumns` 递归过滤（含子列），并仅在**确实过滤掉子列**时对该列生成浅拷贝，未发生变动的列保持原对象引用 —— 递归在既有 `computed` 内执行，渲染期无新增开销。
- **回归**：element `PT-A27`（分组 + 嵌套分组 + 布尔/响应式 `hidden`）、antd / antdv-next `PT-A19`（表头与表体均不含被过滤子列、响应式翻转生效、未变动列保持原引用、下发给宿主表格的列已剔除被过滤子列）。

破坏性变更：无（此前子列 `hidden` 被忽略属缺陷）。
