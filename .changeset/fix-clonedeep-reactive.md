---
'@qin-ui/pro-components-core': patch
---

修复 `cloneDeep` 对 Vue 响应式数据静默降级为 JSON 拷贝的问题：

- **现象**：`cloneDeep(reactive({...}))` / `cloneDeep(ref({...}).value)` 会把 `Date` 变成 ISO 字符串、`Map` / `Set` / `RegExp` / `Error` 变成 `{}`、`NaN` / `Infinity` 变成 `null`，并打印一条「已降级为 JSON 拷贝」的告警 —— 而数据本身完全可结构化克隆。受影响调用链包括 `useTable` 的列快照与 `resetQueryParams` 的重置快照。
- **原因**：`cloneDeep` 直接把入参交给 `structuredClone`，而 Vue 的 `reactive()` / `ref.value` 都是 Proxy，`structuredClone` 对其必抛 `DataCloneError`，从而误入 JSON 降级分支。
- **修复**：`cloneDeep` 入口先判断 `isProxy(value)`，是响应式代理则 `toRaw(value)` 解包后再克隆；JSON 降级与最终兜底路径统一使用解包后的对象。JSON 降级语义（含告警）对真正不可结构化克隆的数据保持不变。
- **行为边界**：仅解包入口一层；若原始对象内部持有已响应式代理，仍走 JSON 降级路径（已在 JSDoc 中标注）。
- **回归**：新增 `CR-008 [判别]` 用例 —— 响应式入参克隆后 `Date` / `Map` 类型与取值不降级、结果为非代理普通对象、与源快照隔离、且不产生降级告警，并覆盖 `ref.value` 形态。

破坏性变更：无。
