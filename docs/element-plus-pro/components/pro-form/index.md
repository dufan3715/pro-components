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

## 快速开始

最小使用步骤：

1. 使用 `useForm` 创建表单对象
2. 将表单对象传给 `ProForm`

```vue
<script setup lang="ts">
import { ProForm, useForm } from '@qin-ui/element-plus-pro';

type FormData = {
  name: string;
};

const form = useForm<FormData>({ name: '' }, [
  { label: '姓名', path: 'name', component: 'input' },
]);
</script>

<template>
  <ProForm :form="form" />
</template>
```

## API

### ProForm Props

| 参数名 | 说明                                  | 类型                                                                            | 默认值 |
| ------ | ------------------------------------- | ------------------------------------------------------------------------------- | ------ |
| form   | useForm 返回对象                      | Form                                                                            | -      |
| grid   | 是否启用栅格布局                      | boolean \| GridProps                                                            | false  |
| ...    | 继承 Element Plus Form 组件的所有参数 | [FormProps](https://element-plus.org/zh-CN/component/form.html#form-attributes) | -      |

**注意**：`form` 为可选，不传时自动创建根表单实例（适用于无需外部控制的场景）。

### ProForm Events

继承 Element Plus Form 组件的所有事件。

### ProForm Methods

继承 Element Plus Form 组件的所有方法（可通过 `form.formRef` 调用）。

## Field 配置

`Field` 是 ProForm 的字段配置入口，单个字段的属性会被拆分到 FormItem / GridItem / 具体组件等层级。

### Base（公共字段）

去向：公共属性会被 `BaseFormItem`/`BaseField` 解析并分发到对应层级。

| 字段                 | 说明                                                  |
| -------------------- | ----------------------------------------------------- |
| `path`               | 字段标识，同 Element Plus FormItem 的 `prop`          |
| `hidden`             | 字段是否隐藏                                          |
| `disabled`           | 字段是否禁用                                          |
| `label`              | 字段标题，支持字符串或 VNode/渲染函数                 |
| `component`          | 指定渲染组件名称或组件对象                            |
| `slots`              | 字段插槽配置（FormItem 与组件插槽）                   |
| `formItemStyle`      | FormItem 样式                                         |
| `formItemClass`      | FormItem 类名                                         |
| `formItemContainer`  | FormItem 外层包裹组件                                 |
| `formItemDataAttrs`  | 附加到 FormItem DOM 的属性                            |
| `componentStyle`     | 组件样式（仅非嵌套字段有效）                          |
| `componentClass`     | 组件类名（仅非嵌套字段有效）                          |
| `componentContainer` | 组件外层包裹组件（仅非嵌套字段有效）                  |
| `componentDataAttrs` | 附加到组件 DOM 的属性（仅非嵌套字段有效）             |
| `valueFormatter`     | 值格式化（get/set 或单函数，仅非嵌套字段有效）        |
| `modelProp`          | v-model 属性名，默认 `modelValue`（仅非嵌套字段有效） |
| `extraProps`         | 不参与渲染，仅用于业务侧自定义标识                    |

> **注意**：`componentStyle` / `componentClass` / `componentContainer` / `valueFormatter` / `modelProp` / `componentDataAttrs` 仅对非嵌套字段（即不含 `fields` 子字段的字段）有效。嵌套字段使用 `grid` 控制布局。

### Nested（嵌套字段）

去向：递归进入下一层 `BaseFormItem`。

| 字段     | 说明                         |
| -------- | ---------------------------- |
| `fields` | 嵌套子字段配置               |
| `grid`   | 嵌套字段的网格布局开关或参数 |

### FormItem 透传

去向：传给 `ElFormItem`。

- 继承 Element Plus `FormItemProps`（不包含 `label`）
- 常用字段：`rules`、`error`、`showMessage`、`inlineMessage`、`required` 等

### GridItem 透传

去向：传给 `ElCol`（el-col）。

- 继承 `ColProps`
- 常用字段：`span`、`xs`、`sm`、`md`、`lg`、`xl`

### 组件透传

去向：传给具体表单组件。

- 除以上分组之外的字段会被当作组件 props 透传

### 字段属性分流规则

- `grid`/GridItem 相关 props 会传给 `GridItem`
- `formItem*`/校验/提示等会传给 `FormItem`
- `component*`/`modelProp`/`valueFormatter` 与其余 props 会传给具体组件
- `formItemContainer`/`componentContainer`/`slots` 走容器或插槽
- `fields` 进入下一层 `BaseFormItem`

**优先级说明**：同名插槽优先于 `component` 渲染；`modelProp` 默认 `modelValue`；`valueFormatter` 在值回写前执行；`slots` 中 `label/error` 归属 `FormItem`，其余归属组件。

## useForm

创建表单对象的 hook。

### 参数

| 参数         | 类型             | 说明                                                  |
| ------------ | ---------------- | ----------------------------------------------------- |
| `initData`   | `DeepPartial<D>` | 表单初始数据                                          |
| `initFields` | `Field<D>[]`     | 表单字段初始配置                                      |
| `root`       | `boolean`        | 是否为根 form 实例（用于嵌套 form 场景），默认 `true` |

> `useForm` 支持三种调用方式：`useForm(initData, initFields, root?)`、`useForm(root?)`（仅传入 root 标识）、`useForm(initData, initFields?)`。

### 返回值

| 属性/方法                             | 类型                             | 说明                                                                    |
| ------------------------------------- | -------------------------------- | ----------------------------------------------------------------------- |
| `formData`                            | `Reactive<D>`                    | 响应式表单数据对象                                                      |
| `getFormData(path?)`                  | `(path?) => any`                 | 读取指定路径的字段值，不传 path 返回全部数据                            |
| `setFormData(path, value)`            | `-`                              | 设置字段值，value 支持函数形式 `(prev) => next`；也可传对象批量覆盖     |
| `fields`                              | `Ref<Field<D>[]>`                | 响应式字段配置数组                                                      |
| `getField(path, options?)`            | `-`                              | 获取字段配置，支持路径或查找函数；`options.all` 返回所有匹配            |
| `setField(path, patch, options?)`     | `-`                              | 更新字段配置，支持 `merge`/`rewrite`；`options.all` 批量更新            |
| `deleteField(path, options?)`         | `-`                              | 删除字段，`options.all` 批量删除                                        |
| `appendField(path, field, options?)`  | `-`                              | 在指定字段后追加，传 `undefined` 在末尾追加                             |
| `prependField(path, field, options?)` | `-`                              | 在指定字段前插入，传 `undefined` 在开头插入                             |
| `getParentField(path, options?)`      | `-`                              | 获取字段父级，一级字段返回虚拟根容器                                    |
| `formRef`                             | `Ref<FormInstance \| undefined>` | Element Plus Form 实例引用，可调用 `validate()`、`resetFields()` 等方法 |

## 使用示例

- [基础表单](./demos/basic/)
- [复杂表单](./demos/complex/)
- [使用自定义组件](./demos/custom-component/)
- [处理逻辑联动](./demos/linkage/)
- [高级：拓展、覆盖组件](./demos/advanced-component-typing/)
