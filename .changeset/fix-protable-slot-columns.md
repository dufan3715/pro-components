---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
---

修复 ProTable 默认插槽声明列不生效的问题：无显式列且存在默认插槽时，改由宿主消费插槽列，并在插槽内注入序号列组件，使「序号列 + 插槽声明的列」共存。

- 默认 `addIndexColumn` 下：表头为「序号 + 插槽列」，序号随分页偏移；
- `addIndexColumn: false` 时仅渲染插槽列；
- 存在显式 `:columns`（含空数组）或 `useTable` 列时仍以列配置为准，插槽列不参与渲染；
- 运行期增删默认插槽会驱动插槽列模式切换，移除插槽后序号列恢复注入；
- 列配置存在但全部隐藏时以列配置为准（空表），不再回落到默认插槽列。

边界：antdv-next 在把插槽 children 转成列时会调用插槽（非 render 上下文），开发环境会输出一次 `Slot "default" invoked outside of the render function` 告警，生产环境无告警；插槽列不参与列控与省略 Tooltip。
