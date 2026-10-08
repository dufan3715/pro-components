---
'@qin-ui/element-plus-pro': patch
---

element 表格单来源化、DOM 属性泄漏修复与告警去重（CR-094、CR-098～CR-103）：

- **`container` 不再泄漏到原生 `<form>`（CR-098）**：`searchFormConfig.container`（组件对象或 `false`）此前沿 `SearchForm` → `ProForm` → `ElForm` 的 attrs 落到原生 `<form>` 上，DOM 中出现非法属性 `container="[object Object]"`。现于 ProTable 向下传参前剔除 `container`（`hidden` 一并剔除，二者均由 ProTable 自身消费），未改变 `SearchForm` 的 attrs 透传行为。
- **两类搜索配置告警不再互相静音（CR-099）**：原先共用单个去重标志，只打印先触发的一条，冲突配置提示会被永久静音；且未配置 `search` 时也会误报「未返回 Promise」。现按告警原因分键去重，并仅在确实配置了 `search` 时校验（与 `antd-vue-pro` / `antdv-next-pro` 口径一致）。
- **表格属性单一来源与死代码清理（CR-094）**：`pagination` / `size` / `data` / `columns` / `tableContainer` 一律从对应 prop（或 Provider 注入）派生 —— 此前代码中"从 attrs 取这些键"的分支**恒不可达**（它们均为已声明 prop，永不进入 `attrs`；且 `ElTable` 的 props 不含 `pagination`），一并删除；手写的 Provider 键清单改为由 `Object.keys(props)` **推导**（复用优先，不再维护自造清单），相关的 4 条 `delete` 与排除键集合中的 6 个死键同步移除。**无行为变更**（被删路径实测不可达）。
- **`defineEmits<TableEmits>()` 与运行时不一致（CR-100）**：实测运行时 emits 仅 `update:size` / `update:loading`（来自 `defineModel`），表格事件（`row-click` 等 19 个）当前经 attrs 到达宿主表格；一旦外部类型变为可解析，宿主事件名会进入 emits 并把 attrs 监听剔除、导致事件**静默失效**。因**删除该声明会使产物 d.ts 中的事件处理器键消失（公开类型面回归）**，本次保留声明并补充行为说明与守卫用例，**不引入行为变更**；彻底移除需另立「显式事件转发 + 类型面迁移」的破坏性变更提案。
- **死过滤清理（CR-101）**：`useGroupFieldAttrs` 中 `k !== 'disabled'` 的过滤为死代码（`ElFormItem` 的 props 共 12 键、不含 `disabled`），已删除；分组 `disabled` 传播经用例与突变确认**依然有效**（无 CR-003 回归）。四个 `disabled` 上下文 helper 经逐一核实**均有可达路径或属对外别名**，全部保留。
- **JSDoc 结构对齐（CR-102）**：`ProForm` / `ComponentProvider` / `useGroupFieldAttrs` / `BaseFormItem` 的注释结构与另三包对齐（`@public` 位置、`@param {...FormProps} ...attrs`、完整 `@example`、`@slot` 与 props 级说明），删除实现手段类表述。
