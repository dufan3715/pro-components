---
'@qin-ui/antd-vue-pro': minor
'@qin-ui/antdv-next-pro': patch
'@qin-ui/vant-pro': patch
---

复用宿主组件库导出、四包能力对齐与插槽作用域（含「复用优先」原则落地）：

- **表格属性推导不再使用手写回退清单（复用优先）**：`antdv-next-pro` 的 `shared/ui` 原先内置 52 个手写属性键作为回退（`FALLBACK_TABLE_PROP_KEYS`）并以 3 键门槛判断快照可用性。现改为**全部由宿主导出推导**（`Table.props` 取属性键、宿主 emits 推导事件键）：推导可用时按推导键过滤透传；推导不可用时**不再替换为手写清单**，而是在开发期告警一次后**全量透传 attrs**（仅排除组件自身消费的键），由宿主表格自行忽略未知属性。
- **`antd-vue-pro` 表格 emit 入口以宿主导出推导（CR-077④ 对齐）**：新增 `TableEmitProps`（签名经 `ComponentProps<typeof Table>[...]` 索引取得，不手写签名、不新增键清单），`TableComponentProps = TableProps & TableEmitProps`，`v-model:expanded-row-keys` 恢复入口。**实测 ant-design-vue 的 Table 不提供 `onScroll`**（`Table.props` 46 键不含、类型面不存在、`Table.emits` 为 `undefined`），故**不伪造 `@scroll` 入口**，该能力边界已写入类型 JSDoc 与文档事件入口注记。
- **`antd-vue-pro` 序号列偏移修复（CR-077① 对齐）**：`getIndex` 改取 `computedPagination` 的**有效分页**（attrs / Provider 的 `pageSize` 优先），分页关闭时退化为 `index + 1`。
- **`antd-vue-pro` 搜索配置告警按原因分键（CR-077③ 对齐）**：两类语义不同的告警不再互相静音，未配置 `search` 时也不再误报「未返回 Promise」。
- **`ProTable` 插槽作用域对齐（CR-078④）**：`search-form` 插槽现提供 `{ form, search, reset }`、`table` 插槽提供 `{ columns, dataSource, pagination, loading, size, onChange }`（此前 `antd-vue-pro` 的这两个插槽无作用域，属纯增量能力对齐）；三包文档的 Slots 表新增「作用域参数」列。
- **插槽渲染组件对象（CR-086，`vant-pro`）**：`SlotComponent` 的分支判定改为「非原始值即交给 `<component :is>`」，与其余三包逐字一致；此前传组件对象会落入文本插值，DOM 中出现组件对象的 JSON 文本。
- **注释/JSDoc 四包收敛（CR-090 余项）**：`useGroupFieldAttrs` 的栅格边界注释、`不可枚举…` / `WeakMap 不参与响应式追踪` / `shallowRef 形态…` 等表述统一改为「职责与行为边界」；`ProTable` / `SearchForm` 公开 JSDoc 对齐并补齐 `@template` / `@param` / `@slot`。
- **内部结构调整（`element-plus-pro`）**：`table/useTable.ts` 移至 `table/hooks/useTable.ts` 并新增 `hooks` 桶，与其余两包结构一致；`TableEmits` 经核实为 element-plus 自身导出的宿主类型，按复用原则保留。**无公开 API 变化。**
