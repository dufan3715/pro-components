---
'@qin-ui/pro-components-core': patch
---

修复 `useTable` 的列 `key` 规范化未覆盖元素级变异的问题：

- **现象**：只有整体重赋值 `table.columns.value = [...]` 会自动补齐列 `key`；直接对数组做元素级操作（`columns.value.push(...)` / `splice(...)` / `columns.value[i] = {...}`）时新列没有 `key` —— 列控制（ColumnControl）下拉看不到该列，按 `key` 的 `setColumn` / `deleteColumn` 定位失效。
- **原因**：`columns` 为普通 `ref`，补 `key` 只发生在构造、`setColumn` / `appendColumn` / `prependColumn` 与整体重赋值的同步监听里，元素级变异不经过任何规范化入口。
- **修复**：`columns` 改为 `customRef` —— 内部经 `ref` 转发以**保持数组与元素的深层响应式以及原引用语义**；读取时幂等就地补齐**缺失**的 `key`（命中即跳过、不改写已有 `key`、不重建 `children` 数组），整体重赋值时先规范化再收编。原仅覆盖整体重赋值的同步监听移除，规范化入口收敛为一处。
- **保持不变的契约**：
  - `@resizeColumn` 式就地变异列对象（`col.width = w`）照常生效（写入可见、渲染更新）—— 新增用例 `PT-A15` 锁定该契约；
  - 初始传入的数组仍为状态本体（`toRaw(table.columns.value) === 原数组`）；元素引用在多次读取间恒等；
  - `key` 兜底链（`dataIndex → prop → columnKey → 自增`）与冻结列的副本语义与既有 `normalizeColumn` 完全一致。
- **行为边界**：只补齐缺失 `key`，不重写调用方显式提供的 `key`（重复 `key` 不做去重）。
- **回归**：`TT-27`（`push` / 索引赋值后读取即补齐唯一 `key`）、`TT-28`（元素级插入的分组列递归补齐 `children`）、`PT-A15`（`resizeColumn` 契约）。

破坏性变更：无。
