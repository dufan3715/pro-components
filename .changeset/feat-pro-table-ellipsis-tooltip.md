---
'@qin-ui/antd-vue-pro': minor
'@qin-ui/antdv-next-pro': minor
---

ProTable 的 `Column.ellipsis` 扩展 `showTooltip` 配置：单元格文本横向溢出时，以表格级共享的单个 Tooltip 展示完整文本，不按单元格挂载 Tooltip 组件；body 单元格不再输出宿主原生 `title`，表头仍保留宿主原生提示。

新增 `ellipsisTooltip` 表格级配置：truthy 时全局启用所有列（列上 `showTooltip: false` 或 `ellipsis: false` 可退出），对象同时复用宿主 `TooltipProps`：`getPopupContainer`（收到 ProTable 根节点，锚点与浮层共用）、`mouseEnterDelay` / `mouseLeaveDelay`（秒，默认 0.2 / 0.1）、`placement` / `arrow` / `autoAdjustOverflow` / `color`；浮层样式按宿主命名透传（antd-vue 为 `overlayClassName` / `overlayStyle` / `overlayInnerStyle`，antdv-next 为 `rootClass` / `styles.root` / `styles.container`）。

同时：

- 导出 `ColumnEllipsis` 类型，并从宿主 `ColumnType['ellipsis']` 派生；
- `resizeColumn` 与 `onChange` 的 `sorter.column` 会还原到 `table.columns` 原始列，`col.width = w` 的就地写法仍生效；
- `ellipsisTooltip` 支持通过 `componentVars['pro-table']` 配置；
- 仅当存在 `showTooltip` 列时挂载 Tooltip 与全局监听。
