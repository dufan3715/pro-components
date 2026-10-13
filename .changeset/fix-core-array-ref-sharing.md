---
'@qin-ui/pro-components-core': patch
---

`useFields` / `useTable` 不再就地变异调用方传入的数组（`@mutates` 契约收敛，CR-016）：

- **变更前**：`useFields(initFields)` 与 `useTable({ columns, dataSource, pageParam })` 直接持有调用方传入的**数组/对象引用**，因此 `appendField` / `prependField` / `deleteField`、列增删与整体重赋值（`table.columns.value = [...]`）会**就地修改调用方数组**（`push`/`unshift`/`splice`/索引赋值）。
- **变更后**：入口对数组做**一次浅拷贝**（`dataSource`、`pageParam` 同理），内部增删与整体重赋值只作用于内部状态：
  - 调用方数组的**长度与元素位置不再被改写**；
  - **元素仍共享**（浅拷贝语义）：列/字段**对象**的就地变异（如 `resizeColumn` 式写 `width`）依旧双向可见；
  - `normalizeColumns` / `normalizeColumn` 对**列对象**就地补齐 `key` 的既有 `@mutates` 行为保持不变（仍是文档化契约）；直接调用这两个工具函数时传入的数组仍会被就地变异，仅 `useTable` 内部改为传入其浅拷贝。
- **升级影响（行为变更）**：若你的代码依赖「传入的数组就是状态本体」（例如拿到 `table.columns.value` 后直接 push，期望原数组同步变化，或断言 `table.columns.value === 传入数组`），请改为通过 `table.columns.value` / `appendColumn` / `deleteColumn` 等实例 API 操作；仅读取元素对象的代码不受影响。
- **迁移示例**：
  ```ts
  // 变更前（依赖数组共享）
  const columns = [{ dataIndex: 'name' }];
  const table = useTable({ columns });
  table.columns.value.push({ dataIndex: 'age' }); // 旧行为：columns 也被 push
  // 变更后：内部数组新增，columns 长度保持 1；如需同步请自行维护
  ```
