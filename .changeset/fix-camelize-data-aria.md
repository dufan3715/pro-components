---
'@qin-ui/pro-components-core': patch
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
'@qin-ui/vant-pro': patch
---

修复 `data-*` / `aria-*` 属性名被驼峰化破坏的问题：

- **现象**：`camelizeProperties` 对全部 key 调用 `camelize`，`data-testid` 变成 `dataTestid`、`aria-label` 变成 `ariaLabel`，属性名在 DOM 上被破坏 —— 可访问性属性（`aria-*`）、测试选择器（`data-testid`）、第三方埋点属性全部失效。四个包的 `ProForm` 都是 `mergeProps(injectAttrs.value, camelizeProperties(attrs))` 且无白名单，直接下发宿主 `<Form>`，均受影响。
- **修复**：`camelizeProperties` 对 `data-*` 与 `aria-*` 前缀的 key（大小写不敏感，如 `ARIA-live`）按原样保留，其余 key 仍转换为 camelCase。
- **行为边界**：仅前缀为 `data-` / `aria-` 的属性名保名；`kebab-case` 属性（`user-name`、`row-key`、`on-row-click`）转换语义不变。
- **回归**：`SU-04`（core 单元：转换语义 + 保名 + 驼峰变体不存在）、`PF-D1`（四包：带 `data-testid` / `aria-label` 的 `ProForm` 渲染后宿主 `<form>` 上属性名原样存在）。

破坏性变更：无。
