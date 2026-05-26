# @qin-ui/element-plus-pro

> 基于 **Element Plus** 和 **Vue 3.x** 的二次封装高级组件库，提供高度可配置、Schema 驱动的 `ProForm` 和 `ProTable`，助您摆脱繁琐的模板代码，极速搭建现代化桌面端中后台应用。

<p align="center">
  <img src="https://img.shields.io/badge/Element%20Plus-2.x-blue" alt="Element Plus" />
  <img src="https://img.shields.io/badge/Vue-3.5%2B-brightgreen" alt="Vue 3.5+" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT" />
</p>

## 📝 [使用示例和文档详细内容](https://dufan3715.github.io/pro-components/)

---

## ✨ 核心特性

- 🛡️ **极简设计**：基于 Element Plus 构建，原生支持 Vue 3.5+。
- ⚙️ **Schema 驱动**：支持通过简单的 JSON Schema 配置直接渲染表单和表格，大幅削减模版代码。
- 🔄 **语义对齐**：针对 Element Plus 深度定制，数据源语义统一为 `data`（不再使用 `dataSource`），默认 `modelProp` 统一为 `modelValue`。
- 🧩 **极致扩展**：原生支持自定义渲染组件与插槽定制，提供 `ProComponentProvider` 进行全局默认属性覆盖。
- 📐 **强类型推导**：基于 TypeScript 提供完备的强类型推导和自动补全，开发体验极致流畅。

---

## 📦 安装

确保您的项目中已安装 `element-plus` 和 `vue`：

```bash
pnpm add @qin-ui/element-plus-pro element-plus
```

---

## 🚀 快速开始

### 1. 全局配置与注册

```ts
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import ElementPlusPro from '@qin-ui/element-plus-pro';
import App from './App.vue';

const app = createApp(App);
app.use(ElementPlus);
app.use(ElementPlusPro); // 全局注册 ProForm, ProTable 和 ProComponentProvider
app.mount('#app');
```

### 2. 基础表单使用示例

```vue
<script setup lang="ts">
import { ProForm, useForm } from '@qin-ui/element-plus-pro';

interface UserForm {
  username: string;
  age: number;
  role: string;
}

// 创建类型安全的表单实例
const form = useForm<UserForm>(
  { username: '', age: 18, role: 'user' }, // 初始数据
  [
    {
      path: 'username',
      label: '用户名',
      component: 'input',
      rules: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    },
    {
      path: 'age',
      label: '年龄',
      component: 'input-number',
      min: 1,
      max: 120,
    },
    {
      path: 'role',
      label: '角色',
      component: 'select',
      options: [
        { label: '管理员', value: 'admin' },
        { label: '普通用户', value: 'user' },
      ],
    },
  ]
);

const handleSubmit = async () => {
  try {
    await form.formRef.value?.validate();
    console.log('提交的数据：', form.formData);
  } catch (error) {
    console.error('校验失败：', error);
  }
};
</script>

<template>
  <div style="padding: 24px; max-width: 600px;">
    <ProForm :form="form" />
    <el-button type="primary" style="margin-top: 16px;" @click="handleSubmit">
      提交表单
    </el-button>
  </div>
</template>
```

### 3. 基础表格使用示例

```vue
<script setup lang="ts">
import { ProTable, useTable } from '@qin-ui/element-plus-pro';

interface UserRow {
  id: number;
  name: string;
  age: number;
}

// 使用适配 Element Plus 的 useTable 实例
const table = useTable<any, UserRow>({
  columns: [
    { prop: 'id', label: 'ID', width: 80 },
    { prop: 'name', label: '姓名' },
    { prop: 'age', label: '年龄' },
  ],
  data: [
    { id: 1, name: '张三', age: 25 },
    { id: 2, name: '李四', age: 30 },
  ],
});
</script>

<template>
  <div style="padding: 24px;">
    <ProTable :table="table" />
  </div>
</template>
```

---

## 📚 组件 API 说明

### 1. ProComponentProvider

作为全局或局部范围的上下文配置器，通过传入 `component-vars` 属性来统一覆盖子组件的默认配置。

#### Props

| 参数名           | 说明                                    | 类型            | 默认值 |
| :--------------- | :-------------------------------------- | :-------------- | :----- |
| `component-vars` | 需要全局 provide 给子组件的默认属性配置 | `ComponentVars` | -      |

---

### 2. ProForm

基于 Element Plus Form 深度封装的高级表单组件。

#### Props

| 参数名 | 说明                                                     | 类型                   | 默认值  |
| :----- | :------------------------------------------------------- | :--------------------- | :------ |
| `form` | 由 `useForm` 返回的表单实例                              | `Form`                 | -       |
| `grid` | 是否启用栅格网格布局                                     | `boolean \| GridProps` | `false` |
| `...`  | 其余属性均继承自 Element Plus `el-form` 组件的原生 Props | `FormProps`            | -       |

---

### 3. ProTable

基于 Element Plus Table 深度封装的高级表格组件。

#### Props

| 参数名             | 说明                                                  | 类型                                   | 默认值  |
| :----------------- | :---------------------------------------------------- | :------------------------------------- | :------ |
| `table`            | 由 `useTable` 返回的表格实例                          | `Table`                                | -       |
| `search`           | 触发表格查询的回调函数，需返回 Promise                | `(params: any) => Promise<any> \| any` | -       |
| `addIndexColumn`   | 是否自动在表格首列插入序号列                          | `boolean`                              | `false` |
| `immediateSearch`  | 表格挂载时（onMounted）是否立即触发一次 `search` 查询 | `boolean`                              | `false` |
| `control`          | 是否展示尺寸调节和列动态配置控制栏                    | `boolean`                              | `true`  |
| `searchFormConfig` | 查询表单的布局配置参数                                | `SearchFormConfig`                     | -       |
| `tableContainer`   | 表格的外部包裹容器，默认为 false                      | `Component \| false`                   | -       |
| `...`              | 其余参数继承自 Element Plus `el-table` 的原生属性     | `TableProps`                           | -       |

---

## ⚙️ 核心 Hooks 说明

### 1. `useForm`

用于创建和管理表单实例，组合了表单数据、字段规则和 ref 控制。

#### 入参定义

```ts
const form = useForm<D>(initFormData?, initFields?, root?)
```

#### 返回值 (Form 实例)

| 属性/方法                      | 说明                                                          | 类型                             |
| :----------------------------- | :------------------------------------------------------------ | :------------------------------- |
| `formData`                     | 响应式表单数据对象（由 reactive 包装）                        | `Reactive<D>`                    |
| `fields`                       | 响应式表单字段配置数组引用                                    | `Ref<Field[]>`                   |
| `formRef`                      | 底层 Element Plus `el-form` 的组件引用实例                    | `Ref<FormInstance \| undefined>` |
| `getFormData(path)`            | 安全获取指定字段路径的数据值                                  | `(path) => any`                  |
| `setFormData(path, val)`       | 安全更新指定路径的值，支持批量对象或函数式更新                | `(path, val) => void`            |
| `getField(path, opts?)`        | 获取指定 path 的字段配置，支持 `{ all: true }` 获取所有匹配项 | `(path, opts) => Field`          |
| `setField(path, patch, opts?)` | 增量更新指定字段的配置参数，支持 merge 或 rewrite 更新        | `(path, patch, opts) => void`    |
| `deleteField(path)`            | 从配置数组中删除特定 path 的表单字段配置                      | `(path) => void`                 |
| `appendField(path, field)`     | 在特定的字段 path 后面，动态追加一个新的表单字段配置          | `(path, field) => void`          |
| `prependField(path, field)`    | 在特定的字段 path 前面，动态插入一个新的表单字段配置          | `(path, field) => void`          |

---

### 2. `useTable`

用于创建和管理表格实例，深度融合 Element Plus 的 API 设计。

#### 入参参数

```ts
const table = useTable<D, T>({
  columns: [], // 初始列配置
  data: [], // Element Plus 数据源（与 core 的 dataSource 对应）
  pageParam: {}, // 分页参数配置
  searchParam: {}, // 搜索栏初始数据
  searchFields: [], // 搜索栏字段 Schema 配置
});
```

#### 返回值 (Table 实例)

| 属性/方法                 | 说明                                                        | 类型                   |
| :------------------------ | :---------------------------------------------------------- | :--------------------- |
| `columns`                 | 响应式表格列配置数组                                        | `Ref<Column[]>`        |
| `data`                    | **响应式表格数据源（已重命名为 data 以适配 Element Plus）** | `Ref<T[]>`             |
| `pageParam`               | 响应式分页参数对象（包含 `current`, `pageSize`, `total`）   | `Reactive<PageParam>`  |
| `searchForm`              | 搜索栏表单关联的 `useForm` 实例，提供完美的表单操作 API     | `Form<D>`              |
| `setColumn(key, patch)`   | 合并或重置修改指定 key 的列配置属性（如 width、label 等）   | `(key, patch) => void` |
| `deleteColumn(key)`       | 动态移除某一个指定 key 对应的表格列配置                     | `(key) => void`        |
| `appendColumn(key, col)`  | 在某一个列的后方动态追加配置列                              | `(key, col) => void`   |
| `prependColumn(key, col)` | 在某一个列的前方动态插入配置列                              | `(key, col) => void`   |
| `setPageParam(param)`     | 增量设置当前分页参数值，支持传入对象或更新函数              | `(param) => void`      |
| `resetQueryParams()`      | 重置搜索参数，并恢复分页至第 1 页                           | `() => void`           |

---

## 📄 表格列配置（`Column`）说明

列配置采用 Element Plus 原生协议为主，极易上手：

- **原生列属性支持**：`prop`、`label`、`width`、`fixed`、`align`、`sortable`、`filters`、`filterMethod`、`children` 等
- **原生格式化支持**：`formatter`
- **Pro 级扩展属性**：
  - `hidden` (是否隐藏列，支持响应式)
  - `render(scope)` (自定义渲染插槽，接收行参数)

> [!TIP]
> 渲染优先级为：`render(scope)` > `formatter`。

---

## 📄 表单字段配置（`Field`）说明

### 公共基础属性

| 属性名               | 说明                                                                          | 类型                          | 默认值         |
| :------------------- | :---------------------------------------------------------------------------- | :---------------------------- | :------------- |
| `path`               | 字段标识，需对应数据对象 `formData` 的 key，支持多级嵌套，例如 `address.city` | `string`                      | -              |
| `label`              | 字段中文标签，支持字符串或直接传入 VNode 组件进行自定义                       | `string \| Component \| Slot` | -              |
| `component`          | 调用的表单项组件的类型，支持内置类型键名或直接传入自定义 Vue 组件             | `string \| Component`         | `'input'`      |
| `hidden`             | 字段是否被隐藏（在 DOM 中不渲染），支持 Ref/Computed 响应式                   | `boolean \| Ref<boolean>`     | `false`        |
| `disabled`           | 组件的禁用状态，支持 Ref/Computed 响应式                                      | `boolean \| Ref<boolean>`     | `false`        |
| `rules`              | 字段数据校验规则，遵循 Element Plus 表单校验格式                              | `Rule[]`                      | -              |
| `span`               | 栅格占位宽度（在 ProForm 开启 `grid` 后有效）                                 | `number`                      | -              |
| `formItemStyle`      | 挂载在外部 `el-form-item` 节点上的额外 CSS 样式属性                           | `CSSProperties`               | -              |
| `formItemClass`      | 挂载在外部 `el-form-item` 节点上的自定义类名                                  | `string`                      | -              |
| `formItemContainer`  | 针对该表单项的最外层 DOM 包裹组件                                             | `Component`                   | -              |
| `formItemDataAttrs`  | 附加在 `el-form-item` DOM 节点上的自定义 data 属性                            | `Record<string, string>`      | -              |
| `componentStyle`     | 直接传递给内部表单输入组件的额外 CSS 样式属性                                 | `CSSProperties`               | -              |
| `componentClass`     | 直接传递给内部表单输入组件的自定义类名                                        | `string`                      | -              |
| `componentContainer` | 针对表单输入组件的包裹组件                                                    | `Component`                   | -              |
| `componentDataAttrs` | 附加在内部输入组件 DOM 节点上的自定义 data 属性                               | `Record<string, string>`      | -              |
| `valueFormatter`     | 字段值转换处理器，可在输入更新或提取数据时做 get/set 转换                     | `ValueFormatter`              | -              |
| `modelProp`          | 双向绑定的数据属性名称（默认为 `modelValue`）                                 | `string`                      | `'modelValue'` |
| `fields`             | 嵌套子表单项的 Schema 数组配置                                                | `Field[]`                     | -              |
| `grid`               | 针对当前嵌套子表单项所使用的网格布局参数（仅当有 `fields` 时有效）            | `boolean \| GridProps`        | -              |

---

### 内置组件映射（`component` 可选值）

您可以在 `component` 属性中填入以下预设键名来自动调用内置的 Element Plus 组件：

| 内置键名           | 渲染对应的 Element Plus 组件                                     |
| :----------------- | :--------------------------------------------------------------- |
| `'input'`          | `el-input` 文本输入框（可搭配 `type: 'textarea' \| 'password'`） |
| `'input-number'`   | `el-input-number` 数字输入框                                     |
| `'autocomplete'`   | `el-autocomplete` 自动完成                                       |
| `'select'`         | `el-select` 下拉选择器                                           |
| `'cascader'`       | `el-cascader` 级联选择器                                         |
| `'date-picker'`    | `el-date-picker` 日期选择器（支持多种 `type` 属性）              |
| `'time-picker'`    | `el-time-picker` 时间选择器                                      |
| `'time-select'`    | `el-time-select` 时间选择下拉框                                  |
| `'checkbox-group'` | `el-checkbox-group` 复选框组                                     |
| `'radio-group'`    | `el-radio-group` 单选按钮组                                      |
| `'switch'`         | `el-switch` 开关切换器                                           |
| `'slider'`         | `el-slider` 滑动条                                               |
| `'tree-select'`    | `el-tree-select` 树形选择器                                      |
| `'transfer'`       | `el-transfer` 穿梭框                                             |
| `'custom'`         | 完全渲染自定义组件                                               |

---

## 🧩 扩展注册您的自定义组件

### 步骤 1：利用 ComponentProvider 全局注册

```vue
<script setup lang="ts">
import { ProComponentProvider } from '@qin-ui/element-plus-pro';
import MyCustomWidget from './components/MyCustomWidget.vue';

const componentMap = {
  'my-widget': MyCustomWidget,
};
</script>

<template>
  <ProComponentProvider :component-map="componentMap">
    <RouterView />
  </ProComponentProvider>
</template>
```

### 步骤 2：追加 TypeScript 全局声明获取强类型补全

在项目任意 `.d.ts` 类型文件中写入以下代码：

```ts
declare module '@qin-ui/element-plus-pro' {
  interface ComponentMap {
    'my-widget': typeof MyCustomWidget;
  }
}
```

---

## Peer Dependencies

- `vue` `^3.5.0`
- `element-plus` `^2.13.6`

---

## 🤝 贡献与反馈

如有任何问题，欢迎通过 [GitHub Issues](https://github.com/dufan3715/pro-components/issues) 提交反馈。

## 📄 开源许可证

基于 [MIT](LICENSE) 开源许可证。
