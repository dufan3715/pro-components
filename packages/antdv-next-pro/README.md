# @qin-ui/antdv-next-pro

> 基于 **antdv-next** 和 **Vue 3.x** 的二次封装高级组件库，提供高度可配置、Schema 驱动的 `ProForm`、`ProTable` 和 `ComponentProvider`。

<p align="center">
  <img src="https://img.shields.io/badge/antdv--next-v1.1%2B-blue" alt="antdv-next" />
  <img src="https://img.shields.io/badge/Vue-3.5%2B-brightgreen" alt="Vue 3.5+" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT" />
</p>

## 📝 [使用示例和文档详细内容](https://dufan3715.github.io/pro-components/)

---

## 📦 安装

确保您的项目中已安装 `antdv-next` (v1.1+) 和 `vue` (v3.5+)：

```bash
npm install @qin-ui/antdv-next-pro antdv-next
# 或使用 pnpm
pnpm add @qin-ui/antdv-next-pro antdv-next
```

---

## 🚀 ProForm 表单组件

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

| 参数         | 类型             | 说明                              |
| :----------- | :--------------- | :-------------------------------- |
| `initData`   | `DeepPartial<D>` | 表单初始数据                      |
| `initFields` | `Field<D>[]`     | 表单字段初始配置                  |
| `root`       | `boolean`        | 是否创建根 form 实例，默认 `true` |

### `useForm` 返回值 (Form 实例)

| 属性/方法                  | 类型                             | 说明                                                      |
| :------------------------- | :------------------------------- | :-------------------------------------------------------- |
| `formRef`                  | `Ref<FormInstance \| undefined>` | AntdvNext FormInstance 引用，支持直接调用 validate 等方法 |
| `formData`                 | `Reactive<D>`                    | 响应式表单数据对象                                        |
| `fields`                   | `Ref<Field<D>[]>`                | 响应式字段配置数组                                        |
| `getFormData(path?)`       | `(path?) => any`                 | 读取表单字段或整个表单的值（支持深层路径）                |
| `setFormData(path, value)` | `-`                              | 安全更新指定路径的值，支持批量设置与函数式更新            |
| `setField(path, patch)`    | `-`                              | 动态增量更新某一个字段的 Schema 配置参数                  |
| `resetFormData()`          | `-`                              | 重置表单数据为初始值                                      |

### `ProForm` Props

| 属性     | 类型                   | 默认值  | 说明                                    |
| :------- | :--------------------- | :------ | :-------------------------------------- |
| `form`   | `Form<D>`              | -       | `useForm` 返回的实例                    |
| `grid`   | `boolean \| GridProps` | `false` | 是否启用 Grid 网格布局                  |
| 其余属性 | `FormProps`            | -       | 继承并直接透传至 antdv-next `Form` 组件 |

---

## 📄 字段配置（`Field`）详情

所有字段共享 `Base` 公共属性，再加上各内置组件专属的属性参数。

### 公共基础属性（`Base`）

| 属性                 | 类型                                | 说明                                                      |
| :------------------- | :---------------------------------- | :-------------------------------------------------------- |
| `path`               | `Path<D>`                           | 字段标识，需对应 `formData` 中的 key                      |
| `label`              | `string \| Component`               | 字段标签名称，支持直接传入 Vue 组件渲染                   |
| `component`          | 见下方内置组件列表                  | 使用的内置组件名或自定义组件                              |
| `hidden`             | `MaybeRef<boolean>`                 | 字段是否隐藏，支持 Ref / Computed 响应式                  |
| `disabled`           | `MaybeRef<boolean>`                 | 组件是否禁用，支持 Ref / Computed 响应式                  |
| `rules`              | `FormItemRule[]`                    | 字段数据校验规则                                          |
| `span`               | `number`                            | Grid 占位列宽（仅在开启 `grid` 模式下有效）               |
| `slots`              | `Partial<ComponentSlots<FormItem>>` | FormItem 插槽（包含 `label`/`extra`/`help`/`tooltip` 等） |
| `grid`               | `boolean \| GridProps`              | 嵌套子字段的 Grid 配置                                    |
| `fields`             | `Fields<D>`                         | 嵌套子字段配置数组（用于复杂分组）                        |
| `formItemStyle`      | `CSSProperties`                     | FormItem 样式属性                                         |
| `formItemClass`      | `string`                            | FormItem 自定义类名                                       |
| `formItemContainer`  | `Component`                         | FormItem 外层包裹容器组件                                 |
| `formItemDataAttrs`  | `Record<string, string>`            | 附加到 FormItem DOM 节点上的自定义 data 属性              |
| `componentStyle`     | `CSSProperties`                     | 表单输入组件的样式属性                                    |
| `componentClass`     | `string`                            | 表单输入组件的自定义类名                                  |
| `componentContainer` | `Component`                         | 表单输入组件的外层包裹容器组件                            |
| `componentDataAttrs` | `Record<string, string>`            | 附加到输入组件 DOM 节点上的自定义 data 属性               |
| `valueFormatter`     | `ValueFormatter`                    | 字段值格式化与转换器（支持 get/set 双向处理器）           |
| `modelProp`          | `string`                            | 双向绑定的数据名，默认 `'value'`                          |

> [!NOTE]
> **响应式支持**：除了 `component`、`fields`、`slots`、`modelProp`、`formItemContainer`、`componentContainer`、`valueFormatter` 之外，所有属性均高度支持 `Ref` 或 `ComputedRef` 响应式数据。

---

### 内置组件类型（`component` 可选值）

| 内置键名              | 渲染对应的 antdv-next 组件                                 |
| :-------------------- | :--------------------------------------------------------- |
| `'input'`             | Input 文本输入框                                           |
| `'textarea'`          | TextArea 文本域                                            |
| `'input-password'`    | InputPassword 密码输入框                                   |
| `'input-otp'`         | InputOTP 一次性验证码框                                    |
| `'input-search'`      | InputSearch 搜索输入框                                     |
| `'input-number'`      | InputNumber 数字输入框                                     |
| `'select'`            | Select 下拉选择器                                          |
| `'auto-complete'`     | AutoComplete 自动完成                                      |
| `'cascader'`          | Cascader 级联选择器                                        |
| `'date-picker'`       | DatePicker 日期选择器                                      |
| `'range-picker'`      | RangePicker 日期范围选择器                                 |
| `'time-picker'`       | TimePicker 时间选择器                                      |
| `'time-range-picker'` | TimeRangePicker 时间范围选择器                             |
| `'checkbox-group'`    | CheckboxGroup 复选框组                                     |
| `'radio-group'`       | RadioGroup 单选按钮组                                      |
| `'switch'`            | Switch 开关                                                |
| `'slider'`            | Slider 滑块                                                |
| `'tree-select'`       | TreeSelect 树形选择器                                      |
| `'transfer'`          | Transfer 穿梭框                                            |
| `'custom'`            | 完全自定义渲染组件（在 `component` 属性直接传入 Vue 组件） |

---

### 🧩 扩充您的自定义组件

#### 1. 使用 custom 属性内联自定义渲染

```ts
{
  path: 'custom',
  component: (props) => h('div', props, '自定义内容'),
}
```

#### 2. 全局注册高频可复用自定义组件

```vue
<script setup lang="ts">
import { ProComponentProvider } from '@qin-ui/antdv-next-pro';
import MyRateComponent from './MyRate.vue';

const componentMap = {
  'my-rate': MyRateComponent,
};
</script>

<template>
  <ProComponentProvider :component-map="componentMap">
    <RouterView />
  </ProComponentProvider>
</template>
```

#### 3. 配合 TypeScript 声明合并获得强类型联想

在项目中任意 `.d.ts` 类型文件中声明如下：

```ts
declare module '@qin-ui/antdv-next-pro' {
  interface ComponentMap {
    'my-rate': typeof MyRateComponent;
  }
}
```

---

## 📊 ProTable 表格组件

基于 Schema 驱动的表格组件，与 `ProForm` 深度集成，原生支持搜索表单与表格状态联动。

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

### `useTable` 配置参数

| 参数名         | 类型             | 说明                                              |
| :------------- | :--------------- | :------------------------------------------------ |
| `columns`      | `Column<D>[]`    | 表格列 Schema 配置，支持响应式 `hidden`           |
| `dataSource`   | `T[]`            | 静态初始数据源数组                                |
| `pageParam`    | `PageParam`      | 初始分页参数（current, pageSize, total）          |
| `searchParam`  | `DeepPartial<D>` | 搜索栏表单初始填充数据                            |
| `searchFields` | `Fields<D>`      | 搜索栏字段 Schema 配置（格式与 ProForm 完全一致） |

### `ProTable` Props

| 属性               | 类型                                        | 默认值  | 说明                                              |
| :----------------- | :------------------------------------------ | :------ | :------------------------------------------------ |
| `table`            | `Table<D>`                                  | -       | 由 `useTable` 返回的表格实例引用                  |
| `search`           | `() => Promise<void>`                       | -       | 触发表格数据查询的异步回调函数                    |
| `addIndexColumn`   | `boolean`                                   | `false` | 是否自动在表格首列插入序号列                      |
| `immediateSearch`  | `boolean`                                   | `false` | 表格挂载完毕（onMounted）是否立即触发一次查询回调 |
| `control`          | `boolean \| { sizeControl, columnControl }` | `true`  | 是否展示表格右上角尺寸调节和列显示控制条          |
| `searchFormConfig` | `SearchFormConfig`                          | -       | 搜索栏表单的排版布局及展开/收起配置参数           |
| `tableContainer`   | `Component \| false`                        | -       | 表格区域外层自定义包裹组件                        |

---

## ⚙️ ComponentProvider

全局或局部的默认配置提供者，通过在最外层包裹 `ComponentProvider`，传入 `componentVars` 属性，能够极其优雅地控制其所有子组件的默认配置。

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

## Peer Dependencies

| 依赖包名     | 推荐版本要求 |
| :----------- | :----------- |
| `antdv-next` | `^1.1.0`     |
| `vue`        | `^3.5.0`     |

---

## 🤝 参与贡献

欢迎随时通过 [GitHub Issues](https://github.com/dufan3715/pro-components/issues) 提出针对该子包的建议或提交 Pull Request。

## 📄 许可证

基于 [MIT](LICENSE) 开源许可证。
