---
'@qin-ui/antd-vue-pro': patch
---

修复模板中以 kebab-case 绑定 `:data-source` 时显式绑定被忽略：

- **现象**：`<ProTable :table="table" :data-source="rows" />` 中 `rows` 不生效，表格渲染的是 `table.dataSource`，与 `:columns` / `:pagination` 的「显式绑定优先」口径不一致。
- **原因**：`resolveOwnedProp` 按驼峰键读取 `attrs[name]`，而模板编译后的 attrs 键保留 kebab 写法（`data-source`），驼峰读取恒为 `undefined`，取值回落到 `:table` 实例。
- **修复**：attrs 统一经 `camelizeProperties` 归一后再按键取值，`forwardedTableAttrs` 复用同一份归一结果（`columns` / `pagination` 等单段键行为不变）。
- **回归**：新增 `PT-A37`（模板 kebab 绑定 `:columns` / `:data-source` 覆盖 `:table` 实例；修复前实测红）。

破坏性变更：无（修复显式绑定被静默忽略的缺陷）。
