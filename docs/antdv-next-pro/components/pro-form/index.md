# ProForm

基于 antdv-next Form 的高级表单封装，通过 Schema 配置驱动，内置常用输入组件，支持响应式属性、Grid 布局、嵌套字段、自定义组件等。

## 何时使用

- 需要通过配置生成表单而不是编写大量模板代码
- 需要表单字段的动态增减
- 需要统一表单布局和样式

::: tip 配合 useForm 使用
antdv-next-pro 导出了一个名为 `useForm` 的自定义 Hook，用于处理表单数据和字段配置，配合 `useForm` 可以更轻松地使用 ProForm。
:::

## 架构与数据流

![ProForm 架构图](/diagrams/ProForm.jpg)

ProForm 的渲染链路可以理解为三层组件协作：

- `ProForm(BaseForm)` 负责承接 `useForm` 的 `formData` 和 `fields`
- `BaseFormItem` 负责将 `fields` 拆分为 FormItem / GridItem / 组件 props，并递归渲染
- `BaseField` 负责把字段配置映射为具体 UI 组件并处理 v-model

数据流的核心路径如下：

- `useForm` 创建 `formData` + `fields`
- `ProForm` 将 `formData` 作为 `Form` 的 `model`
- `BaseField` 使用 `v-model:[modelProp]` 双向绑定字段值
- `valueFormatter` 在值回写前处理数据，再由 `setFormData` 更新
- `FormItem` 在字段更新时触发校验（通过内部 `onFieldChange`）

## 快速开始

最小使用步骤：

1. 使用 `useForm` 创建表单对象
2. 将表单对象传给 `ProForm`

```vue
<script setup lang="ts">
import { ProForm, useForm } from '@qin-ui/antdv-next-pro';

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

### Props

| 参数名 | 说明                                | 类型                 | 默认值 |
| ------ | ----------------------------------- | -------------------- | ------ |
| form   | useForm 返回对象                    | Form                 | -      |
| grid   | 是否启用栅格布局                    | boolean \| GridProps | false  |
| ...    | 继承 antdv-next Form 组件的所有参数 | FormProps            | -      |

### Events

| 事件名 | 说明                                | 类型 |
| ------ | ----------------------------------- | ---- |
| ...    | 继承 antdv-next Form 组件的所有事件 | -    |

### Methods

| 方法名 | 说明                                | 类型 |
| ------ | ----------------------------------- | ---- |
| ...    | 继承 antdv-next Form 组件的所有方法 | -    |

## Field 配置

`Field` 是 ProForm 的字段配置入口，单个字段的属性会被拆分到 FormItem / GridItem / 具体组件等层级。

### Base（公共字段）

去向：公共属性会被 `BaseFormItem`/`BaseField` 解析并分发到对应层级。

| 字段                 | 说明                                     |
| -------------------- | ---------------------------------------- |
| `path`               | 字段标识 namePath，同 FormItem 的 `name` |
| `hidden`             | 字段是否隐藏                             |
| `disabled`           | 字段是否禁用                             |
| `label`              | 字段标题，支持字符串或 VNode             |
| `component`          | 指定渲染组件名称或组件对象               |
| `slots`              | 字段插槽配置（FormItem 与组件插槽）      |
| `formItemStyle`      | FormItem 样式                            |
| `formItemClass`      | FormItem 类名                            |
| `formItemContainer`  | FormItem 外层包裹组件                    |
| `formItemDataAttrs`  | 附加到 FormItem DOM 的属性               |
| `componentStyle`     | 组件样式                                 |
| `componentClass`     | 组件类名                                 |
| `componentContainer` | 组件外层包裹组件                         |
| `componentDataAttrs` | 附加到组件 DOM 的属性                    |
| `valueFormatter`     | 值格式化（get/set 或单函数）             |
| `modelProp`          | v-model 属性名，默认 `value`             |
| `extraProps`         | 不参与渲染，仅用于业务侧自定义标识       |

### Nested（嵌套字段）

去向：递归进入下一层 `BaseFormItem`。

| 字段     | 说明                         |
| -------- | ---------------------------- |
| `fields` | 嵌套子字段配置               |
| `grid`   | 嵌套字段的网格布局开关或参数 |

### FormItem 透传

去向：传给 `FormItem`。

- 继承 `FormItemProps`（不包含 `label`）
- 常用字段：`rules`、`validateStatus`、`help`、`extra`、`required` 等

### GridItem 透传

去向：传给 `GridItem`。

- 继承 `GridItemProps`
- 常用字段：`span`、`xs`、`sm`、`md`、`lg`、`xl`、`xxl`

### 组件透传

去向：传给具体表单组件。

- 除以上分组之外的字段会被当作组件 props 透传

### 关键示例

示例 1：字段 + `valueFormatter`

```ts
const form = useForm({ name: '' }, [
  {
    path: 'name',
    component: 'input',
    valueFormatter: val => (val ? val.trim() : val),
  },
]);
```

示例 2：嵌套字段 + `grid`

```ts
const form = useForm({ user: { first: '', last: '' } }, [
  {
    path: 'user',
    grid: true,
    fields: [
      { path: 'first', component: 'input', span: 12 },
      { path: 'last', component: 'input', span: 12 },
    ],
  },
]);
```

## 字段属性分流规则

字段属性会被拆分为四类：`GridItem`、`FormItem`、具体组件、容器/插槽。

**分流规则**

- `grid`/GridItem 相关 props 会传给 `GridItem`
- `formItem*`/校验/提示等会传给 `FormItem`
- `component*`/`modelProp`/`valueFormatter` 与其余 props 会传给具体组件
- `formItemContainer`/`componentContainer`/`slots` 走容器或插槽
- `fields` 进入下一层 `BaseFormItem`

**优先级说明**

- 同名插槽优先于 `component` 渲染
- `modelProp` 默认 `value`
- `valueFormatter` 在值回写前执行
- `slots` 中 `label/extra/help/tooltip` 归属 `FormItem`，其余归属组件

## Types

- `Field`：字段配置入口，组合组件参数 / FormItem 参数 / GridItem 参数
- `Base`：字段公共能力集合（path、slots、容器、样式、格式化等）
- `Fields`：字段数组，支持嵌套
- `ValueFormatter`：字段值处理函数，支持 `get/set` 或单函数
- `modelProp`：自定义 v-model 绑定字段名

## 高级：TypeScript 类型推导与覆盖

为了在使用 ProForm 的 `fields` 时能够获得自定义组件的类型推导，或强制覆盖内置组件（如 `input`）的属性提示，你可以利用 TypeScript 的声明合并来扩展全局的 `ComponentMap`。

在你的业务项目（如 `env.d.ts` 或 `components.d.ts`）中补充如下内容：

```typescript
import 'antdv-next-pro';
import type MyCustomUpload from '@/components/MyCustomUpload.vue';
import type MySuperInput from '@/components/MySuperInput.vue';

declare module 'antdv-next-pro' {
  interface ComponentMap {
    'custom-upload': typeof MyCustomUpload;
    input: typeof MySuperInput;
  }
}
```

配置完成后：

1. `component` 字段会自动提示 `'custom-upload'`。
2. 当你在 `fields` 数组中设置 `component: 'custom-upload'` 时，会自动出现 `MyCustomUpload` 组件所接受的各项 Props。
3. 当你设置 `component: 'input'` 时，提示将替换为 `MySuperInput` 的 Props。

## 扩展点与最佳实践（简版）

- 动态字段：使用 `setField` 更新字段配置
- 字段联动：用 `setFormData` + `setField` 实现显隐、禁用、规则联动
- 自定义组件接入：`component` + `ProComponentProvider` 注册，插槽优先级高于 `component`
- 值格式化：使用 `valueFormatter` 与 `modelProp` 对齐组件的 v-model 习惯

## useForm

创建表单对象的 hook。

### 参数

| 参数         | 类型             | 说明                                     |
| ------------ | ---------------- | ---------------------------------------- |
| `initData`   | `DeepPartial<D>` | 表单初始数据                             |
| `initFields` | `Field<D>[]`     | 表单字段初始配置                         |
| `root`       | `boolean`        | 是否为根 form 实例（用于嵌套 form 场景） |

### 返回值

| 属性                       | 类型                             | 说明                                                                    |
| -------------------------- | -------------------------------- | ----------------------------------------------------------------------- |
| `formRef`                  | `Ref<FormInstance \| undefined>` | antdv-next `FormInstance` 引用，可调用 `validate`、`resetFields` 等方法 |
| `formData`                 | `Reactive<D>`                    | 响应式表单数据对象                                                      |
| `fields`                   | `Ref<Field<D>[]>`                | 响应式字段配置数组                                                      |
| `getFormData(path?)`       | `(path?) => any`                 | 读取字段值，不传 path 返回全部数据                                      |
| `setFormData(path, value)` | `-`                              | 设置字段值，value 支持函数形式 `(prev) => next`                         |
| `setField(path, patch)`    | `-`                              | 动态更新指定字段的配置项                                                |
| `resetFormData()`          | `-`                              | 将表单数据重置为初始值                                                  |
