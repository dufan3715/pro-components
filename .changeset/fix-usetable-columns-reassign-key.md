---
'@qin-ui/pro-components-core': patch
---

修复 `useTable` 返回的 `columns` 整体重赋值（`columns.value = [...]`）后新列不补齐 `key` 的问题：此前仅初始化、`setColumn`、`appendColumn` / `prependColumn` 会为缺失 `key` 的列补齐唯一标识，整体重赋值的新数组会保持无 `key` 状态，导致列控制（ColumnControl）看不到新列、按 `key` 的 `setColumn` / `deleteColumn` 定位失效。现在整体重赋值时会同步对新数组就地补齐缺失的 `key`，与初始化行为一致，且不改变数组与列对象的引用，直接变异列对象（如拖拽调宽 `col.width = w`）的语义不受影响。
