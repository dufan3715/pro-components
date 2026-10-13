---
'@qin-ui/pro-components-core': patch
---

两项边界口径按 owner 决策收敛（此前登记为待决策项）：

- **`camelizeProperties` 的 `data-*` / `aria-*` 保名收窄为按取值形态判定**：取值为 **DOM 属性值**（字符串 / 数字 / 布尔，如 `data-testid="x"`、`aria-hidden="true"`）时按键名原样保留；取值为**组件 prop 形态**（对象 / 数组 / 函数，如 kebab 写法的 `data-source` / `data-columns`）时参与驼峰转换。
  - **变更前**：`data-` / `aria-` 前缀一律保名，`<ProTable :data-source="rows">`、`<ProForm :data-columns="[...]">` 这类 kebab 写法的驼峰 prop **永不生效**，最终作为 attribute 透传被静默忽略。
  - **变更后**：`data-source` → `dataSource`、`data-columns` → `dataColumns`；纯 DOM 属性写法不受影响。
  - 边界：数字取值仍按 DOM 属性处理（`data-index="1"` 形式的列表下标写法保持原样），需要列配置 `dataIndex` prop 时请用驼峰写法 `:dataIndex`。
- **`isIndexKey` 对齐 lodash：仅有效数组下标建数组**（`0` ~ `2^32 - 2` 的非负整数）的路径段自动创建数组。此前的数字段一律建数组，`set({}, ['k', -1], 'v')` 得到 `{ k: [] }` 并把值挂成 `JSON.stringify` 不可见的隐藏属性；现按对象键处理（`{ k: { '-1': 'v' } }`，与 lodash 一致）。超出上限的整数段（`1e21`、`2^53`）同样按对象键处理。

验证：判别用例 `SU-11`、`PT-07`（回退即失败）。
