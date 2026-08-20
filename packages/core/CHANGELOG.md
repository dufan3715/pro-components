# @qin-ui/pro-components-core

## 1.1.3

### Patch Changes

- perf: 表单渲染链路深度扁平化重构与性能优化
  - **链路扁平化（8 层 -> 6 层）**：彻底移除 `PathProvider` 组件实例，精简组件树层级
  - **Hook 纯函数化**：将 `GroupedFieldAttrs` 改造为 `useGroupFieldAttrs` 纯计算 Hook，100% 消除作用域插槽闭包转发开销
  - **实例开销降低**：单字段 Vue 内部组件实例减少 2 个（Antd 系 8->6，Vant 4->2），内存与首次挂载速度显著优化

## 1.1.2

### Patch Changes

- fix: 修复 Paths 类型定义，补充 (string & {})[] 宽数组逃生通道，解决包含 Date 或嵌套对象时表格 Ref 类型兼容性报错

## 1.1.1

### Patch Changes

- fix: 修复 ProTable 列配置响应式引用断开、多级表头递归与表单插槽注入时序等问题

## 1.1.0

### Minor Changes

- 新增多语言国际化（i18n）机制及 ProTable 列控制增强配置：
  - 支持内置语言包（zh-CN / zh-TW / en-US），能够跟随宿主 UI 库全局语言自动切换。
  - ProComponentProvider 新增 `locale` 属性，支持覆盖任意内置文案。
  - ProTable 列控制 `control.columnControl` 支持传入配置对象（支持自定义 `labels` 别名映射、`excludedKeys` 排除列、`disabledKeys` 锁定展示列、`disableCheckAll` 禁用全选）。

## 1.0.4

### Patch Changes

- 修复 `setField` 在 merge 模式下无法覆盖 `computed`/`ref`（只读 ref）属性的问题。旧实现使用 `Object.assign`，会触发 Vue reactive 对只读 ref 的 set 拦截而静默失败，导致该属性仍指向原 `ComputedRef`。改为对「旧值是 ref、新值非 ref」的属性先 `delete` 再赋值，使其被原始值真正替换。

## 1.0.3

### Patch Changes

- @types/lodash-es 从 devDependencies 归类至 dependencies。

## 1.0.2

### Patch Changes

- fix(core): 修复 useTable 重置查询参数时未恢复初始分页参数的问题

## 1.0.1

### Patch Changes

- 修复 sideEffects 导致消费方 CSS 被删除，并完善发布字段与构建配置
  - 修复 antd-vue-pro / element-plus-pro 的 `sideEffects: false` 导致消费方 tree-shaking 时 CSS 自动引入被删除的 bug
  - 各包完善 exports、prepublishOnly、engines、browserslist 等发布字段
  - vue-component-type-helpers 从 dependencies 移至 devDependencies
  - 简化为单入口构建，消除产物 hash 后缀
  - 清理 tsconfig 死配置，显式 `vue-tsc --noEmit`
  - core devDeps 对齐根版本，统一 vue peer 为 ^3.5.0
