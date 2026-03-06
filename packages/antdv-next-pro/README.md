# @qin-ui/antdv-next-pro

基于 [antdv-next](https://github.com/vueComponent/pro-components) 的二次封装 ProComponent 组件库，提供高度可配置的 `ProForm`、`ProTable` 和 `ComponentProvider`。

## 安装

```bash
npm install @qin-ui/antdv-next-pro antdv-next
# 或
pnpm add @qin-ui/antdv-next-pro antdv-next
```

---

## ProForm

基于 Schema 驱动的表单组件，通过 `fields` 配置描述每个表单项，支持 Grid 布局、响应式属性、嵌套字段、自定义组件等。

### 基础用法

```vue
<script setup lang="ts">
import { ProForm, useForm } from '@qin-ui/antdv-next-pro';

type FormData = { name: string; age: number };

const form = useForm<FormData>({}, [
  {
    path: 'name',
    label: '姓名',
    component: 'input',
    rules: [{ required: true }],
  },
  { path: 'age', label: '年龄', component: 'input-number' },
]);
</script>

<template>
  <ProForm :form="form" />
</template>
```

### `useForm(initData?, initFields?, root?)` 参数

| 参数         | 类型             | 说明                 |
| ------------ | ---------------- | -------------------- |
| `initData`   | `DeepPartial<D>` | 表单初始数据         |
| `initFields` | `Field<D>[]`     | 表单字段初始配置     |
| `root`       | `boolean`        | 是否创建根 form 实例 |

### `useForm` 返回值

| 属性                       | 类型                             | 说明                        |
| -------------------------- | -------------------------------- | --------------------------- |
| `formRef`                  | `Ref<FormInstance \| undefined>` | AntdvNext FormInstance 引用 |
| `formData`                 | `Reactive<D>`                    | 响应式表单数据对象          |
| `fields`                   | `Ref<Field<D>[]>`                | 响应式字段配置              |
| `getFormData(path?)`       | `(path?) => any`                 | 读取表单字段值              |
| `setFormData(path, value)` | `-`                              | 设置表单字段值              |
| `setField(path, patch)`    | `-`                              | 动态更新字段配置            |
| `resetFormData()`          | `-`                              | 重置表单数据为初始值        |

### `ProForm` Props

| 属性   | 类型                   | 默认值  | 说明                     |
| ------ | ---------------------- | ------- | ------------------------ |
| `form` | `Form<D>`              | -       | `useForm` 返回的实例     |
| `grid` | `boolean \| GridProps` | `false` | 启用 Grid 网格布局       |
| 其余   | `FormProps`            | -       | 透传至 antdv-next `Form` |

### 字段配置（`Field`）

所有字段共享 `Base` 公共属性，再加上各组件专属 Props。

#### 公共属性（`Base`）

| 属性                 | 类型                                | 说明                                              |
| -------------------- | ----------------------------------- | ------------------------------------------------- |
| `path`               | `Path<D>`                           | 字段标识，对应 `formData` 中的 key                |
| `label`              | `string \| Component`               | 字段标签                                          |
| `component`          | 见下方组件表                        | 使用的内置组件名或自定义组件                      |
| `hidden`             | `MaybeRef<boolean>`                 | 是否隐藏                                          |
| `rules`              | `FormItemRule[]`                    | 校验规则                                          |
| `span`               | `number`                            | Grid 列宽（仅 grid 模式有效）                     |
| `slots`              | `Partial<ComponentSlots<FormItem>>` | FormItem 插槽（`label`/`extra`/`help`/`tooltip`） |
| `grid`               | `boolean \| GridProps`              | 嵌套字段的 Grid 配置                              |
| `fields`             | `Fields<D>`                         | 嵌套子字段配置                                    |
| `formItemStyle`      | `CSSProperties`                     | FormItem 样式                                     |
| `formItemClass`      | `string`                            | FormItem 类名                                     |
| `formItemContainer`  | `Component`                         | FormItem 外层包裹组件                             |
| `formItemDataAttrs`  | `Record<string, string>`            | 附加到 FormItem DOM 节点的属性                    |
| `componentStyle`     | `CSSProperties`                     | 组件样式                                          |
| `componentClass`     | `string`                            | 组件类名                                          |
| `componentContainer` | `Component`                         | 组件外层包裹组件                                  |
| `componentDataAttrs` | `Record<string, string>`            | 附加到组件 DOM 节点的属性                         |
| `valueFormatter`     | `ValueFormatter`                    | 值转换函数（支持 `get`/`set` 形式）               |
| `modelProp`          | `string`                            | v-model 绑定属性名，默认 `'value'`                |

> **响应式支持**：除了 `component`、`fields`、`slots`、`modelProp`、`formItemContainer`、`componentContainer`、`valueFormatter` 之外，所有属性均支持 `Ref` 或 `ComputedRef`。

#### 内置组件（`component` 取值）

| 值                  | 对应组件                                        |
| ------------------- | ----------------------------------------------- |
| `input`             | Input 文本框                                    |
| `textarea`          | TextArea 文本域                                 |
| `input-password`    | InputPassword 密码框                            |
| `input-otp`         | InputOTP 一次性密码框                           |
| `input-search`      | InputSearch 搜索框                              |
| `input-number`      | InputNumber 数字输入框                          |
| `select`            | Select 下拉选择器                               |
| `auto-complete`     | AutoComplete 自动完成                           |
| `cascader`          | Cascader 级联选择器                             |
| `date-picker`       | DatePicker 日期选择器                           |
| `range-picker`      | RangePicker 日期范围选择器                      |
| `time-picker`       | TimePicker 时间选择器                           |
| `time-range-picker` | TimeRangePicker 时间范围选择器                  |
| `checkbox-group`    | CheckboxGroup 复选框组                          |
| `radio-group`       | RadioGroup 单选框组                             |
| `switch`            | Switch 开关                                     |
| `slider`            | Slider 滑块                                     |
| `tree-select`       | TreeSelect 树形选择器                           |
| `transfer`          | Transfer 穿梭框                                 |
| `custom`            | 完全自定义渲染组件（`component` 传入 Vue 组件） |

#### 自定义组件

```ts
// 使用 custom 内联自定义
{
  path: 'custom',
  component: (props) => h('div', props, '自定义内容'),
}
```

#### 注册可复用自定义组件

```ts
import { registerComponent } from '@qin-ui/antdv-next-pro';
import MyRateComponent from './MyRate.vue';

// 注册后在 schema 中即可使用字符串引用
registerComponent('my-rate', MyRateComponent);
```

配合 TypeScript 模块扩充获得完整类型提示：

```ts
declare module '@qin-ui/antdv-next-pro' {
  interface CustomFieldTypeMap {
    'my-rate': typeof MyRateComponent;
  }
}
```

---

## ProTable

基于 Schema 驱动的表格组件，与 `ProForm` 深度集成支持搜索联动。

### 基础用法

```vue
<script setup lang="ts">
import { ProTable, useTable } from '@qin-ui/antdv-next-pro';

type Row = { id: number; name: string };

const table = useTable<Row>({
  columns: [
    { title: 'ID', dataIndex: 'id' },
    { title: '姓名', dataIndex: 'name' },
  ],
});
</script>

<template>
  <ProTable :table="table" :search="() => fetchData()" />
</template>
```

### `useTable` 参数

| 参数           | 类型             | 说明                                  |
| -------------- | ---------------- | ------------------------------------- |
| `columns`      | `Column<D>[]`    | 列配置，支持 `hidden` 属性            |
| `dataSource`   | `T[]`            | 静态数据源                            |
| `pageParam`    | `PageParam`      | 分页初始参数                          |
| `searchParam`  | `DeepPartial<D>` | 搜索初始参数                          |
| `searchFields` | `Fields<D>`      | 搜索表单字段配置（同 ProForm Fields） |

### `ProTable` Props

| 属性               | 类型                                        | 默认值  | 说明                                  |
| ------------------ | ------------------------------------------- | ------- | ------------------------------------- |
| `table`            | `Table<D>`                                  | -       | `useTable` 返回的实例                 |
| `search`           | `() => Promise<void>`                       | -       | 触发查询的回调                        |
| `addIndexColumn`   | `boolean`                                   | `false` | 自动在首列插入序号列                  |
| `immediateSearch`  | `boolean`                                   | `false` | 挂载时立即触发一次查询                |
| `control`          | `boolean \| { sizeControl, columnControl }` | `true`  | 是否显示表格尺寸/列配置控制条         |
| `searchFormConfig` | `SearchFormConfig`                          | -       | 搜索表单配置（`layout`、`expand` 等） |
| `tableContainer`   | `Component \| false`                        | -       | 表格区域外层包裹容器                  |

---

## ComponentProvider

全局默认属性配置提供者，作为 `ProForm` / `ProTable` 的父组件使用，通过 `componentVars` 配置各组件的默认 Props。

```vue
<template>
  <ComponentProvider :component-vars="config">
    <ProForm :form="form" />
    <ProTable :table="table" />
  </ComponentProvider>
</template>

<script setup lang="ts">
import { ComponentProvider } from '@qin-ui/antdv-next-pro';

const config = {
  'pro-form': { grid: { gutter: 24 } },
  'pro-form-item': { validateFirst: true, span: 6 },
  input: { maxlength: 200, allowClear: true },
  select: { allowClear: true, placeholder: '请选择' },
  'date-picker': { style: { width: '100%' } },
  'pro-table': {
    addIndexColumn: true,
    pagination: { showTotal: total => `共 ${total} 条` },
  },
};
</script>
```

---

## 全局注册

```ts
import { createApp } from 'vue';
import AntdvNextPro from '@qin-ui/antdv-next-pro';

createApp(App).use(AntdvNextPro).mount('#app');
```

或单独注册组件：

```ts
import {
  ProForm,
  ProTable,
  ProComponentProvider,
} from '@qin-ui/antdv-next-pro';

app.use(ProForm);
app.use(ProTable);
app.use(ProComponentProvider);
```

---

## Peer Dependencies

| 包           | 版本     |
| ------------ | -------- |
| `antdv-next` | `^1.1.0` |
| `vue`        | `^3.5.0` |
