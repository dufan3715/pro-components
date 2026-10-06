---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
'@qin-ui/vant-pro': patch
---

补齐适配层导出面并对齐字段/列状态契约文案：

- **`normalizeColumn` / `normalizeColumns` / `localePacks` 无法从适配层获取**（CR-025）：core 已公开导出这三个 API，但四包 `shared/core` 未再导出，业务侧无法在适配层使用。现按统一导入契约（§1.3）补齐再导出。
- **`install()` 的非空断言**（CR-025）：`ProComponentProvider.name!` 改为 `name ?? 'ProComponentProvider'` 兜底，去掉断言且不产生 `undefined` 注册名。
- **状态契约文案收敛**（CR-030）：四包字段类型的 `hidden` 明确「支持布尔 / `Ref` / getter，渲染期按 `toValue` 取值」、`disabled` 明确「字段级优先，未显式指定时继承上层禁用上下文」，并说明嵌套字段 `path` 为各自独立的完整路径（不与父级拼接）；三包列类型的 `hidden` 明确「仅布尔、不做 `toValue` 解包」。
- **注入类型消费端收敛**（CR-028）：四包 `BaseField` 原先以 `as { value: … }` 手工断言注入形态，现直接使用类型已收敛的 `InjectionFormSlotsKey`，去掉断言。
- **组件 JSDoc 绑定修正**（CR-024）：四包 `src/index.ts` 原先把三段组件说明写在同一个 JSDoc 块中，只有最后一段绑定到导出语句（ProForm / ProTable 的文档在 IDE 中丢失）。现拆为三段，各自紧贴对应 `export { … }`。

破坏性变更：无（补充导出与文档；`install()` 注册名行为不变）。
