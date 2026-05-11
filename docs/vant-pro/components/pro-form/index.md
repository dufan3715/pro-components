# ProForm 配置式表单

基于 `@qin-ui/core` 的 `useForm` Hook 与 Vant 组件封装的高级表单。它通过 Schema 驱动数据流，使用 `path` 和 `component` 配置每个表单项。

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

| 参数         | 类型             | 说明                 |
| ------------ | ---------------- | -------------------- |
| `initData`   | `DeepPartial<D>` | 表单初始数据         |
| `initFields` | `Field<D>[]`     | 表单字段初始配置     |
| `root`       | `boolean`        | 是否创建根 form 实例 |

### `useForm` 返回的实例对象 (`form`)

| 属性                       | 类型                             | 说明                     |
| -------------------------- | -------------------------------- | ------------------------ |
| `formRef`                  | `Ref<FormInstance \| undefined>` | Vant FormInstance 的引用 |
| `formData`                 | `Reactive<D>`                    | 响应式表单数据对象       |
| `fields`                   | `Ref<Field<D>[]>`                | 响应式字段配置           |
| `getFormData(path?)`       | `(path?) => any`                 | 读取表单字段值           |
| `setFormData(path, value)` | `-`                              | 设置表单字段值           |
| `setField(path, patch)`    | `-`                              | 动态更新字段配置         |
| `resetFormData()`          | `-`                              | 重置表单数据为初始值     |

### `ProForm` Props

| 属性   | 类型      | 默认值 | 说明                 |
| ------ | --------- | ------ | -------------------- |
| `form` | `Form<D>` | -      | `useForm` 返回的实例 |

### 字段配置（`Field`）

#### 公共属性

| 属性                 | 类型                             | 说明                                                    |
| -------------------- | -------------------------------- | ------------------------------------------------------- |
| `path`               | `Path<D>`                        | 字段标识，对应 `formData` 中的 key                      |
| `label`              | `string \| Component`            | 字段标签                                                |
| `component`          | 见下方组件表                     | 使用的内置组件名或自定义组件                            |
| `hidden`             | `MaybeRef<boolean>`              | 是否隐藏                                                |
| `rules`              | `FormItemRule[]`                 | Vant 表单校验规则                                       |
| `slots`              | `Slots`                          | Vant 字段插槽配置                                       |
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
