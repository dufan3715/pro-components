---
'@qin-ui/pro-components-core': patch
---

core 的字段 / 列配置入参防御与列 key 唯一性：

- **`useFields` 非数组入参**：此前传对象 / 函数抛 `TypeError: (initFields || []) is not iterable`，传字符串 `'ab'` 被**静默拆成 `['a','b']` 两个假字段**；现非数组入参回退空数组（与 `useTable` 的 `columns` / `dataSource` 同口径）。
- **`useFields` 含非对象项**：`initFields` 含 `null` / `undefined` / 原始值时，此前 `getField` / `setField` / `deleteField` / `getParentField` 全部抛 `TypeError: Cannot read properties of null (reading 'fields')`（BFS 遍历是这些 API 的唯一入口，一个脏项使全部字段查找与动态编排失效）；现构造期剔除非对象项，且 BFS 对 `children` 中的非对象项免疫。嵌套 `children` 内的脏项原样保留在子数组中，但不参与遍历。
- **`appendColumn` / `prependColumn` 多位点插入的重复 key**：`{ all: true }` 命中 ≥2 个位点时此前克隆列对象沿用显式 key（实测得到 `["a","x","b","x"]`），与「每个列具备唯一 key」的契约不符，宿主表格会出现重复键告警或列错乱；现每个位点获得独立克隆列，克隆列及其 `children` 各层重新分配 key、互不共享，调用方的列对象不再被回写。
- **`normalizeColumn` 的非法列配置**：环状 `children`（自引用 / 互引用）此前直接爆栈 `RangeError: Maximum call stack size exceeded`（`useTable` 构造期即抛）；`Object.preventExtensions` / `Object.seal` 的列对象补 key 时抛 `TypeError: Cannot add property key, object is not extensible`。现递归带访问集，环状引用原样保留不再深入；「不可扩展」判定改用 `Object.isExtensible`（较 `Object.isFrozen` 更准确），降级为解冻浅拷贝副本。

验证：新增判别用例 `FF-47` / `FF-48` / `TT-35` / `TT-36`（回退任一修复即失败）。

**行为变化提示**：多位点插入的克隆列不再保留调用方传入的显式 key，请改用列查找函数（`appendColumn(c => …, …)` 同款 `ColumnFindBy`）或自动 key（`__col_N`）定位这些克隆列。
