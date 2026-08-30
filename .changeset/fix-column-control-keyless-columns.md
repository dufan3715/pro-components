---
'@qin-ui/element-plus-pro': patch
---

fix(column-control): 无 key/prop 列不再出现在列控面板 (R-17)

`ColumnControl` 此前为无 key/prop 列合成序号 key（`__col_${index}`）使其进入面板，但该合成 key 与真实列无关联——`setColumn(合成key, ...)` 在 core 中无法寻址而静默 no-op，勾选状态与实际列显隐脱节；列序变化时合成 key 也会漂移。现与 antd-vue-pro / antdv-next-pro 对齐：

- 无 key、无 prop 或 key 为空串的列直接不进入列控面板（列控仅针对可寻址的有效列）；
- 面板项移除对 `table.columnFallback` 文案兜底的依赖（key 必然非空）；
- 经 core `useTable` 的列会被自动补齐 key，不受影响；直接传 `columns` prop 的原始列配置中被过滤的列仍正常渲染，仅不提供列控开关；
- 新增判别测试 CC-A2（三包同构：无 key/空串 key 列被过滤，合成 key 不再出现）。
