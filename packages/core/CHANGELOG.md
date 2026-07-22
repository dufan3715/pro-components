# @qin-ui/pro-components-core

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
