# ProForm 配置式表单

基于 `@qin-ui/pro-components-core` 的 `useForm` Hook 与 Vant 组件封装的高级表单。它通过 Schema 驱动数据流，使用 `path` 和 `component` 配置每个表单项。

## 基础用法

```vue
<script setup lang="ts">
import { ProForm, useForm } from '@qin-ui/vant-pro';

type FormData = { name: string; age: number };

const form = useForm<FormData>({}, [
  {
    path: 'name',
    label: '姓名',
    component: 'field',
    rules: [{ required: true, message: '请填写姓名' }],
  },
  {
    path: 'age',
    label: '年龄',
    component: 'stepper',
  },
]);
</script>

<template>
  <ProForm :form="form" />
</template>
```

## API

### `useForm(initData?, initFields?, root?)` 参数

| 参数         | 类型             | 说明                                                                                         |
| ------------ | ---------------- | -------------------------------------------------------------------------------------------- |
| `initData`   | `DeepPartial<D>` | 表单初始数据                                                                                 |
| `initFields` | `Field<D>[]`     | 表单字段初始配置                                                                             |
| `root`       | `boolean`        | 是否为根 form 实例（用于嵌套 form 场景），默认 `true`。也可作为唯一参数调用 `useForm(root?)` |

> `useForm` 支持两种调用方式：`useForm(initData?, initFields?, root?)` 或 `useForm(root?)`。

### `useForm` 返回的实例对象 (`form`)

| 属性/方法                             | 类型                             | 说明                                                                                                                            |
| ------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `formData`                            | `Reactive<D>`                    | 响应式表单数据对象，可直接读写                                                                                                  |
| `getFormData(path?)`                  | `(path?) => any`                 | 读取字段值，不传 path 返回全部数据                                                                                              |
| `setFormData(path, value)`            | `-`                              | 设置字段值，value 支持函数形式 `(prev) => next`；也可传对象批量覆盖整个表单                                                     |
| `fields`                              | `Ref<Field<D>[]>`                | 响应式字段配置数组                                                                                                              |
| `getField(path, options?)`            | `-`                              | 获取字段配置，支持路径字符串或查找函数；`options.all` 返回所有匹配                                                              |
| `setField(path, patch, options?)`     | `-`                              | 更新字段配置，默认合并模式；`options.updateType: 'rewrite'` 覆盖，`options.all` 批量更新                                        |
| `deleteField(path, options?)`         | `-`                              | 删除字段配置，`options.all` 批量删除                                                                                            |
| `appendField(path, field, options?)`  | `-`                              | 在指定字段后追加，传 `undefined` 在末尾追加                                                                                     |
| `prependField(path, field, options?)` | `-`                              | 在指定字段前插入，传 `undefined` 在开头插入                                                                                     |
| `getParentField(path, options?)`      | `-`                              | 获取字段父级，一级字段返回虚拟根容器                                                                                            |
| `formRef`                             | `Ref<FormInstance \| undefined>` | 底层 Vant Form 实例的引用，可调用 `validate()`、`resetValidation()` 等方法                                                      |
| `formPopup`                           | `FormPopup`                      | 弹出层表单管理对象，提供 `open(path)`、`close()`、`updateProps(props)`、`visible`、`popupFieldPath`、`popupFieldValue`、`props` |

### `ProForm` Props

| 属性   | 类型      | 默认值 | 说明                                                 |
| ------ | --------- | ------ | ---------------------------------------------------- |
| `form` | `Form<D>` | -      | `useForm` 返回的实例，可选，不传时自动创建根表单实例 |

### 字段配置（`Field`）

#### 公共属性

| 属性                 | 类型                             | 说明                                                    |
| -------------------- | -------------------------------- | ------------------------------------------------------- |
| `path`               | `Path<D>`                        | 字段标识，对应 `formData` 中的 key                      |
| `label`              | `SlotComponentType`              | 字段标签，支持字符串、组件、VNode、函数等               |
| `component`          | 见下方组件表                     | 使用的内置组件名或自定义组件                            |
| `hidden`             | `MaybeRef<boolean>`              | 是否隐藏                                                |
| `disabled`           | `MaybeRef<boolean>`              | 是否禁用                                                |
| `rules`              | `FormItemRule[]`                 | Vant 表单校验规则                                       |
| `slots`              | `Slots`                          | 字段插槽配置                                            |
| `fields`             | `Fields<D>`                      | 嵌套子字段配置                                          |
| `fieldStyle`         | `CSSProperties`                  | 外层 `van-field` 样式属性                               |
| `fieldClass`         | `any`                            | 外层 `van-field` 样式类名                               |
| `fieldContainer`     | `Component`                      | 嵌套字段容器包裹组件                                    |
| `componentStyle`     | `CSSProperties`                  | 内部组件样式                                            |
| `componentClass`     | `any`                            | 内部组件类名                                            |
| `componentContainer` | `Component`                      | 组件外层包裹容器                                        |
| `valueFormatter`     | `ValueFormatter`                 | 值转换函数（支持 `get`/`set` 形式）                     |
| `displayFormatter`   | `DisplayFormatter`               | 针对 Popup 展现形式的组件，将选中值转化为输入框展示文字 |
| `modelProp`          | `string`                         | v-model 绑定属性名                                      |
| `popup`              | `boolean \| Partial<PopupProps>` | 是否通过 Popup 弹窗展示该组件                           |
| `extraProps`         | `Record<string, any>`            | 额外的自定义属性，不会被当作组件参数传递                |

> **响应式支持**：除了 `component`、`fields`、`slots`、`modelProp` 等属性之外，很多属性均支持 `Ref` 或 `ComputedRef` 以实现动态表单。

#### 内置组件（`component` 取值）

支持了 Vant 的绝大部分数据录入组件：

- `field` (文本框)
- `switch` (开关)
- `stepper` (步进器)
- `rate` (评分)
- `slider` (滑块)
- `uploader` (上传)
- `checkbox-group` (复选框组)
- `radio-group` (单选框组)
- `picker` (选择器)
- `date-picker` (日期选择器)
- `time-picker` (时间选择器)
- `cascader` (级联选择器)
- `area` (省市区选择器)
- `signature` (签名)
- `button` (按钮)
- `custom` (完全自定义)
