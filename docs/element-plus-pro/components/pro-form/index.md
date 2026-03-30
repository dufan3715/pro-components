# ProForm

基于 Element Plus Form 的高级表单封装，通过 `fields` 配置驱动渲染。

## 何时使用

- 需要通过配置生成表单，而不是手写大量模板
- 需要动态字段、字段联动、嵌套字段
- 需要统一全局默认表单行为

## 组件键名

`component` 推荐使用 Element 风格键名：

- `input`（可通过 `type` 使用 `textarea` / `password`）
- `input-number`
- `autocomplete`
- `select`
- `cascader`
- `date-picker`（可通过 `type` 使用 `daterange` / `datetimerange` 等）
- `time-picker` / `time-select`
- `checkbox-group` / `radio-group`
- `switch` / `slider` / `tree-select` / `transfer`

默认 `modelProp` 为 `modelValue`。

## 使用示例

- [基础表单](./demos/basic/)
- [复杂表单](./demos/complex/)
- [使用自定义组件](./demos/custom-component/)
- [处理逻辑联动](./demos/linkage/)
- [高级：拓展、覆盖组件](./demos/advanced-component-typing/)
