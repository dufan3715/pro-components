---
'@qin-ui/pro-components-core': patch
---

core 的路径边界判定与非法入参兜底：

- `appendField` / `prependField` / `appendColumn` / `prependColumn` 的路径判定由 falsy 改为 nullish：`0` 与 `''` 现在按**已提供路径**处理（与「`0` 是合法字段/列 key」一致）。**行为变化**：当提供了路径但没有匹配的分组时，此前会被当作"未传路径"而追加到顶层末尾，现在为**静默不插入**；未传 `path`（`undefined` / `null`）的行为不变（仍为顶层插入）。
- 非数组入参恢复兜底：`useTable` 的初始化列、列整体重赋值、初始化数据源三处改为 `Array.isArray(x) ? [...x] : []`，`as any` 或 JS 调用方传入非数组时不再抛 `TypeError`（与浅拷贝改造前的行为一致）。
- 文档口径校准（无行为变更）：`toPath` 的缓存/冻结行为按分支陈述（仅非空字符串分支返回缓存并冻结的同一实例）；`toPath` 与 `normalizePathKey` 的 JSDoc 写明「数组段含 `null` / `undefined` 时 `join('.')` 不变量不成立」的边界；`isDangerousKey` 标注 `@internal`（仍不进包根导出面）。
