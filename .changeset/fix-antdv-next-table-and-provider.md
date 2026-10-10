---
'@qin-ui/antdv-next-pro': minor
---

修复 antdv-next 适配层的表格序号偏移、emit 型 attrs 入口、告警去重与若干类型/文档问题（CR-074～CR-081）：

- **`ProTable` 序号列偏移错误（CR-077①）**：`getIndex` 原先读取 `table.pageParam` 的 `pageSize`，而 `computedPagination` 允许 `attrs` / Provider 的 `pageSize` 优先 —— 当分页配置来自 attrs/Provider 时序号偏移错误。现统一取**有效分页**（`computedPagination`），分页关闭时退化为 `index + 1`。
- **支持宿主表格的 emit 型 attrs（CR-077④）**：宿主 `_TableProps` 不含 `onChange` / `onScroll` / `onUpdate:expandedRowKeys`（属 emits 面），导致 `@scroll`、`v-model:expanded-row-keys` 无入口。现本包 `TableProps`（= 宿主 `_TableProps` 与由宿主根导出 `TableEmits` 推导的同族 `on*` 键，与宿主的 `TableEmitsProps` 同式，不手写签名）同时用于 `ProTable` 的 Props 与 `component-provider/types`，并显式转发。
- **`onTableChange` 类型退化修复（CR-077②）**：`any` → `TableProps['onChange']`。
- **搜索配置告警按原因分键（CR-077③）**：原先共用单个去重标志，两类语义不同的告警互相静音；且未配置 `search` 时也会误报「未返回 Promise」。现按原因分别去重，且仅在确实配置了 `search` 时校验。
- **静态 `props` 快照兜底（CR-080）**：`tableProperties` 依赖宿主 `Table` 的静态 `props` 快照，若快照为空会导致表格 attrs 静默全丢。现快照为空时输出一次开发期告警，并改为不做键名限定的全量透传（由宿主的 props 校验兜底）。
- **`table/useTable.ts` 路径对齐 `table/hooks/useTable.ts`（CR-076）**：与 `antd-vue-pro` 保持一致并新增 `hooks` 桶；同时**移除 `PageParam` 的再导出**以对齐四包导出面。
  ⚠️ **类型层破坏性变更**：若你此前从 `@qin-ui/antdv-next-pro` 导入 `PageParam` 类型，请改从 `@qin-ui/pro-components-core` 导入。
- **`shared/ui` 的 `useConfig` 更名为 `useHostConfig`（CR-075）**：该导出读取宿主组件上下文（`componentDisabled` / `componentSize`），与本包 locale 深层导入的 `useConfig`（宿主配置读取）语义不同，同名易被误「统一」后静默退化。`shared/ui` 非公开入口，对使用方无影响。
- **删除两处死通道（CR-079）**：`formItemProps[k] = slots[k]`（`getSlotPropFn` 中 slot 恒胜）与 `component === 'date-picker' ? '' : picker` 三元（`PLACEHOLDER_KEYS` 无点分键）；两处均以用例证明行为不变。
- **文档与注释（CR-074 / CR-078）**：`ComponentVars` 补 `@public` 与 JSDoc（API 文档此前缺该条目）；`ProForm` 补齐 `@param {...FormProps} ...attrs` 与 `@example`；`BaseFormItem` 的 `@param {Fields<D>}` 修正；`useGroupFieldAttrs` 注释改为行为陈述。
- **测试补齐（CR-081）**：新增 `PT-A23`～`PT-A29`、`BI-A18`、`BI-A19`、`BF-A15`、`HK-04`、`SX-02` 等 12 条（序号偏移、`v-model:size`、筛选插槽守卫、falsy 字段项、静态 props 兜底、导出面与宿主上下文等）。
