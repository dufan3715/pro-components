---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
---

修复列配置中含 `null` / 原始值项时的渲染期崩溃：

- **现象**：`columns` 中混入 `null` / 字符串等非对象项时，挂载 `ProTable` 抛 `TypeError` —— antd / antdv-next 在可见列过滤处抛 `Cannot read properties of null (reading 'hidden')`；element 在列渲染器与列控制处抛 `Cannot read properties of null (reading 'key')` / `'hidden'`。
- **修复**：复用 core 导出的 `isObjectItem`（非 `null` 对象）谓词，在渲染侧统一过滤非对象列：
  - `antd-vue-pro` / `antdv-next-pro`：`ProTable` 的可见列过滤、`ColumnControl` 的列清单入口；
  - `element-plus-pro`：`ProTable` 的 `normalizedRawColumns` 源头过滤（单点覆盖列渲染器、索引列拼接与 `ColumnControl` 入参）、`TableColumnRenderer` 的列过滤、`ColumnControl` 的列清单入口。
- **保持不变的契约**：不改 `normalizeColumn` 与 `columns` 数组本体 —— 原引用透传、`toRaw(table.columns.value) === 原数组`、`@resizeColumn` 式就地变异均不受影响；`hidden` 的 `Ref` / getter 响应式语义不变。
- **行为边界**：`columns` 中的非对象项被静默忽略（与字段侧 `fields` 的处理口径一致）。
- **回归**：`PT-A17`（antd / antdv-next）、`PT-A19`（element）：`columns: [null, 'not-a-column', { 合法列 }]` 时挂载不抛错、表头仅渲染合法列、表体数据正常。

破坏性变更：无（合法列配置行为不变；非法项此前会导致崩溃，现被忽略）。
