---
'@qin-ui/element-plus-pro': patch
---

修复 `ProTable` 传入 `default` 插槽导致整表失去全部列的问题：

- **现象**：`<ProTable>` 上写 `#default` 时，该插槽被透传给宿主 `ElTable`，动态 `default` 覆盖了模板中承载列渲染器的静态 `default`，表格静默失去全部列（`createSlots` 语义：动态同名插槽覆盖静态插槽）。
- **修复**：槽位转发时**保留 `default`** 给列渲染器（不再透传同名用户插槽），并对传入 `default` 的用户给出一**次性**提示，指引使用 `search-form` / `button-bar` / `toolbar` / `table` 具名插槽 —— 与 antd / antdv-next 在类型层排除 `default` 的口径对齐。
- **回归**：`PT-A20` —— 传入 `default` 插槽后表头仍为 1 列且列名正确、表体数据正常、用户内容不透传宿主表格、提示出现一次。

破坏性变更：无（此前传入 `default` 会导致整表无列，属缺陷；具名插槽行为不变）。
