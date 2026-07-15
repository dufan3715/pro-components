# @qin-ui/element-plus-pro

> 基于 **Element Plus** 和 **Vue 3.x** 的二次封装高级组件库，提供高度可配置、Schema 驱动的 `ProForm`、`ProTable` 和 `ProComponentProvider`，助您摆脱繁琐的模板代码，极速搭建现代化桌面端中后台应用。

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
- 🔥 **Schema 驱动**：使用声明式 JSON 配置即可快速生成表单与表格，极大地减少模板代码。
- 🔄 **语义对齐**：针对 Element Plus 深度定制，数据源语义统一为 `data`（不再使用 `dataSource`），默认 `modelProp` 统一为 `modelValue`。
- 🧩 **极致扩展**：原生支持自定义渲染组件与插槽定制，提供 `ProComponentProvider` 进行全局默认属性覆盖。
- 📐 **强类型推导**：基于 TypeScript 提供完备的强类型推导和自动补全。

---

## 📦 安装

确保您的项目中已安装 `element-plus` (v2.13.6+) 和 `vue` (v3.5+)：

```bash
npm i @qin-ui/element-plus-pro
# 或使用 pnpm
pnpm add @qin-ui/element-plus-pro element-plus
```

---

## 🤖 AI 辅助开发

本项目内置 AI 上下文初始化工具。安装后在项目根目录执行：

```bash
npx @qin-ui/element-plus-pro init-ai
```

将在项目中生成双载体 AI 上下文，使 Cursor / Claude Code / Codex 等 AI 工具深度理解本库的 Schema 驱动用法与属性透传规则：

- `AGENTS.md` - 核心使用规则（跨工具开放约定，会话时自动注入，AI 默认加载）
- `.agents/skills/element-plus-pro.md` - 完整 API 参考（支持 skills 发现的工具按需调取）

> 生成的 `AGENTS.md` 使用标记区块写入，重复执行 `init-ai` 可安全更新，不影响项目内其他库的指令。建议将生成的文件提交到 Git 仓库，团队共享 AI 上下文。

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

const form = useForm<UserForm>({ username: '', age: 18, role: 'user' }, [
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
]);

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

## 🧱 属性分层透传（核心规则）

ProForm/ProTable 是渲染引擎，所有真实 UI 来自 element-plus。**Field 上的属性会被"剥离到不同 DOM 层"，不是全塞给输入控件**。写错层就会失效，这是最容易踩的坑：

```
<el-col :span="8">              ← Grid 层（仅 grid 开启时）
  <el-form-item label="...">    ← FormItem 层
    <el-input placeholder />    ← 输入控件层
  </el-form-item>
</el-col>
```

| 属性                                                                                                                                                                                           | 落到哪一层                       | 说明                 |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------- | :------------------- |
| `span` / `offset` / `push` / `pull` / `xs`..`xl`                                                                                                                                               | `<el-col>` Grid 层               | 仅 `grid` 开启时生效 |
| `label` / `rules` / `error` / `required` / `size` / `showMessage` / `inlineMessage` / `labelWidth` / `formItemStyle` / `formItemClass` / `formItemDataAttrs`                                   | `<el-form-item>` 层              | 表单项相关属性       |
| `disabled` / `placeholder` / `clearable` / `options` / `filterable` / `multiple` / `maxlength` / `componentStyle` / `componentClass` / `componentDataAttrs` + 该控件其余 element-plus 原生属性 | 输入控件本身（`el-input` 等）    | 其余全部             |
| `component` / `hidden` / `modelProp` / `valueFormatter` / `fields` / `slots` / `formItemContainer` / `componentContainer` / `extraProps`                                                       | ProForm 逻辑消费，**不绑到 DOM** | 框架级属性           |

> **规则**：`span` 给 Grid，`label`/`rules` 给 FormItem，其余给输入控件。输入控件的具体属性名/类型请以 [element-plus 官方文档](https://element-plus.org) 为准。
> **element-plus 命名约定**：用 `clearable`（不是 `allowClear`）、`showWordLimit`（不是 `showCount`）、`filterable`（不是 `searchable`）。

---

## 📚 组件 API 说明

### 1. ProComponentProvider

作为全局或局部范围的上下文配置器，通过传入 `component-vars` 属性来统一覆盖子组件的默认配置。

#### Props

| 参数名           | 说明                                    | 类型            | 默认值 |
| :--------------- | :-------------------------------------- | :-------------- | :----- |
| `component-vars` | 需要全局 provide 给子组件的默认属性配置 | `ComponentVars` | -      |

#### 内置默认预设（INJECT_CONFIG）

ProComponentProvider 内置了一套默认属性预设，**即使不配置 `component-vars` 也会生效**。Field 配置优先级最高，会覆盖这些预设。以下为各组件的内置默认值（写代码时需知晓，避免行为与预期不符）：

| component                                              | 默认预设                                                                                                                                                                                                                       |
| :----------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `switch`                                               | `{ modelProp: 'modelValue' }` -- v-model 绑定 `modelValue`（element-plus 惯例，即 `v-model`）                                                                                                                                  |
| `input`                                                | `{ maxlength: 100, clearable: true, placeholder: '请输入' }`                                                                                                                                                                   |
| `input.textarea`                                       | `{ maxlength: 200, autosize: { minRows: 3, maxRows: 6 }, showWordLimit: true, clearable: true, placeholder: '请输入' }`                                                                                                        |
| `input.password`                                       | `{ showPassword: true, maxlength: 100, clearable: true, placeholder: '请输入' }`                                                                                                                                               |
| `input-number`                                         | `{ max: 1e15-1, min: -(1e15+1), controls: false, placeholder: '请输入', style: { width: '100%' } }`                                                                                                                            |
| `select` / `cascader` / `autocomplete` / `tree-select` | `{ clearable: true, placeholder: '请选择' }`                                                                                                                                                                                   |
| `date-picker` / `time-picker` / `time-select`          | `{ style: { width: '100%' }, placeholder: '请选择' }`                                                                                                                                                                          |
| `pro-form`                                             | `{ grid: { gutter: 24 } }`                                                                                                                                                                                                     |
| `pro-form-item`                                        | `{ span: 8 }`                                                                                                                                                                                                                  |
| `pro-table`                                            | `{ pagination: { layout: 'total,sizes,prev,pager,next,jumper', pageSizes: [10,20,30,40,50,100], background: true }, searchFormConfig: { layout: 'grid', expand: { minExpandRows: 2 } }, control: true, addIndexColumn: true }` |

> `modelProp` 控制 v-model 绑定的属性名，element-plus 默认 `'modelValue'`（即 `v-model`）。`switch` 经预设同样为 `modelValue`，通常无需手动设置。
> `date-picker` 支持按 type 子类型分别预设：`date-picker.date` / `.daterange` / `.datetime` / `.week` / `.month` / `.monthrange` / `.year` / `.yearrange` 等。

---

### 2. ProForm

基于 Element Plus Form 深度封装的高级表单组件。

#### Props

| 参数名 | 说明                                                     | 类型                   | 默认值  |
| :----- | :------------------------------------------------------- | :--------------------- | :------ |
| `form` | 由 `useForm` 返回的表单实例                              | `Form`                 | -       |
| `grid` | 是否启用栅格网格布局，支持传入 Grid 配置以配置自适应     | `boolean \| GridProps` | `false` |
| `...`  | 其余属性均继承自 Element Plus `el-form` 组件的原生 Props | `FormProps`            | -       |

---

### 3. ProTable

基于 Element Plus Table 深度封装的高级表格组件，将搜索表单、列配置、分页高度集成。

#### Props

| 参数名             | 说明                                                      | 类型                                   | 默认值  |
| :----------------- | :-------------------------------------------------------- | :------------------------------------- | :------ |
| `table`            | 由 `useTable` 返回的表格实例                              | `Table`                                | -       |
| `search`           | 触发表格查询的回调函数，需返回 Promise 或直接返回查询数据 | `(params: any) => Promise<any> \| any` | -       |
| `addIndexColumn`   | 是否自动在表格首列插入序号列                              | `boolean`                              | `false` |
| `immediateSearch`  | 表格挂载时（onMounted）是否立即触发一次 `search` 查询     | `boolean`                              | `false` |
| `control`          | 是否在表格右上角工具栏中展示尺寸调节和列动态显示控制按钮  | `boolean`                              | `true`  |
| `searchFormConfig` | 查询表单的布局配置参数                                    | `SearchFormConfig`                     | -       |
| `tableContainer`   | 表格的外部包裹容器，默认为 false                          | `Component \| false`                   | -       |
| `...`              | 其余参数继承自 Element Plus `el-table` 的原生属性         | `TableProps`                           | -       |

#### Slots

| 插槽名        | 说明                                               |
| :------------ | :------------------------------------------------- |
| `search-form` | 自定义搜索栏表单内容                               |
| `button-bar`  | 自定义操作按钮组区域（位于搜索栏下方，表格左上方） |
| `toolbar`     | 自定义工具栏区域（位于表格右上方控制按钮旁）       |
| `table`       | 完全自定义渲染表格区域                             |

#### 数据流

ProTable 不会自动请求数据，**查询由你提供的 `search` 回调驱动**。内部串联逻辑：

```
点击搜索  -> 重置分页到第 1 页        -> 调用 search()
分页/排序变化 -> 更新 pageParam        -> 调用 search()
点击重置  -> resetQueryParams()       -> 调用 search()
挂载(immediateSearch) -> 立即触发一次   -> 调用 search()
```

`search` 回调内通常组装查询参数并赋值数据源：

```ts
const fetchData = async () => {
  const res = await api.list({
    ...table.searchForm.formData, // 搜索条件
    ...table.pageParam, // 分页
  });
  table.data.value = res.data; // element-plus 语义：data（非 dataSource）
  table.setPageParam({ total: res.total });
};
```

---

## ⚙️ 核心 Hooks 说明

### 1. `useForm`

用于创建表单管理对象，整合了表单数据、字段规则和 ref 控制。

#### 入参定义

```ts
const form = useForm<D>(initFormData?, initFields?, root?)
```

- `initFormData`: 表单初始数据对象（`DeepPartial<D>`）
- `initFields`: 初始字段配置数组（`Field[]`）
- `root`: 是否创建根 Form 实例，默认为 `true`。若为 `false`，则内部会隐式 inject 父级表单上下文。

#### 返回值 (Form 实例)

| 属性/方法                      | 说明                                                                                | 类型                             |
| :----------------------------- | :---------------------------------------------------------------------------------- | :------------------------------- |
| `formData`                     | 响应式表单数据对象（由 reactive 包装）                                              | `Reactive<D>`                    |
| `fields`                       | 响应式表单字段配置数组引用                                                          | `Ref<Field[]>`                   |
| `formRef`                      | 底层 Element Plus `el-form` 的组件引用实例                                          | `Ref<FormInstance \| undefined>` |
| `getFormData(path)`            | 安全获取指定字段路径（支持深层 'a.b'）的数据值                                      | `(path) => any`                  |
| `setFormData(path, val)`       | 安全更新指定路径的值，支持批量对象或函数式更新                                      | `(path, val) => void`            |
| `getField(path, opts?)`        | 获取指定 path 的字段配置，支持查找函数定位，支持配置 `{ all: true }` 获取所有匹配项 | `(path, opts) => Field`          |
| `setField(path, patch, opts?)` | 增量更新指定字段的配置参数（如改变 label、hidden 等），支持 merge 或 rewrite 更新   | `(path, patch, opts) => void`    |
| `deleteField(path)`            | 从当前配置数组中删除特定 path 的表单字段配置                                        | `(path) => void`                 |
| `appendField(path, field)`     | 在特定的字段 path 后面，动态追加一个新的表单字段配置                                | `(path, field) => void`          |
| `prependField(path, field)`    | 在特定的字段 path 前面，动态插入一个新的表单字段配置                                | `(path, field) => void`          |
| `getParentField(path)`         | 查找获取当前子字段的父级配置项，一级字段返回虚拟根容器                              | `(path) => Field`                |

---

### 2. `useTable`

用于创建和管理表格实例，深度融合 Element Plus 的 API 设计。

#### 入参参数

```ts
const table = useTable<D, T>({
  columns: [], // 初始列配置
  data: [], // Element Plus 数据源（语义对齐 Element Plus，而非 dataSource）
  pageParam: {}, // 分页参数配置
  searchParam: {}, // 搜索栏初始数据
  searchFields: [], // 搜索栏字段 Schema 配置
});
```

#### 返回值 (Table 实例)

| 属性/方法                 | 说明                                                               | 类型                   |
| :------------------------ | :----------------------------------------------------------------- | :--------------------- |
| `columns`                 | 响应式表格列配置数组                                               | `Ref<Column[]>`        |
| `data`                    | **响应式表格数据源（Element Plus 语义，对应 core 的 dataSource）** | `Ref<T[]>`             |
| `pageParam`               | 响应式分页参数对象（包含 `current`, `pageSize`, `total`）          | `Reactive<PageParam>`  |
| `searchForm`              | 搜索栏表单关联的 `useForm` 实例，提供完美的表单操作 API            | `Form<D>`              |
| `setColumn(key, patch)`   | 合并或重置修改指定 key 的列配置属性（如 width、label 等）          | `(key, patch) => void` |
| `deleteColumn(key)`       | 动态移除某一个指定 key 对应的表格列配置                            | `(key) => void`        |
| `appendColumn(key, col)`  | 在某一个列的后方动态追加配置列                                     | `(key, col) => void`   |
| `prependColumn(key, col)` | 在某一个列的前方动态插入配置列                                     | `(key, col) => void`   |
| `setPageParam(param)`     | 增量设置当前分页参数值，支持传入对象或更新函数                     | `(param) => void`      |
| `resetQueryParams()`      | 重置搜索参数，并恢复分页至第 1 页                                  | `() => void`           |

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
> Element Plus Table 列用 `prop`（不是 `dataIndex`），数据源用 `data`（不是 `dataSource`）。

---

## 📄 表单字段配置（`Field`）详解

在进行表单 Schema 编写时，`Field` 数组中的每一项都支持以下属性定义：

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

#### `valueFormatter` 字段值转换

控制表单值与组件值之间的转换。在 `onUpdate:modelValue` 之前（即 v-model 写回前）执行，支持两种形态：

```ts
// 函数形态：(新值, 旧值) => 转换后的值，写回 formData
{ path: 'name', component: 'input', valueFormatter: (val, oldVal) => val?.trim() }

// 对象形态：get 读出时转换，set 写入时转换
{
  path: 'birthday',
  component: 'date-picker',
  valueFormatter: {
    get: (val) => (val ? new Date(val) : null),                          // formData -> 组件显示
    set: (val) => (val ? dayjs(val).format('YYYY-MM-DD') : null),        // 组件 -> formData
  },
}
```

> ⚠️ `valueFormatter` 不支持响应式（不能包 `ref`/`computed`），与 `component` / `fields` / `slots` / `modelProp` 等同属不支持响应式的属性。

#### 🔄 响应式联动

控制类属性（`disabled` / `hidden` / `rules` 等）支持三种响应式模式，按场景选最简的：

```ts
// A. computed() 声明式 -- 初始化时已知的联动（首选）
disabled: computed(() => !form.formData.enabled),
rules: computed(() => form.formData.hasLimit ? [{ required: true, message: '必填' }] : []),

// B. ref() -- 外部共享状态
const isDisabled = ref(false);
disabled: isDisabled,

// C. setField() 命令式 -- 事件驱动的运行时变更
form.setField('limitCount', { disabled: true });
```

> **规则**：初始化时已知的联动用 `computed()`，运行时事件触发的用 `setField()`，外部共享状态用 `ref()`。能用 `computed()` 解决就不要用 `setField()`。

##### 不支持响应式的属性

以下属性不能包 `ref`/`computed`（会失效或引发渲染异常），只能传静态值：

| 属性                                       | 原因                                                |
| :----------------------------------------- | :-------------------------------------------------- |
| `component`                                | 组件对象/函数，响应式代理会破坏渲染（需 `markRaw`） |
| `valueFormatter`                           | 纯转换函数，无需响应式                              |
| `fields`                                   | 嵌套字段数组结构，响应式代理会干扰内部解析          |
| `slots`                                    | 插槽内容，响应式代理会破坏渲染                      |
| `modelProp`                                | 字符串标识，无需响应式                              |
| `formItemContainer` / `componentContainer` | 容器组件，需 `markRaw`                              |

> 动态切换 `component` 或 `slots` 时，用 `setField()` 命令式更新，而非包 `computed`。

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

### 🧩 自定义组件（4 种方式）

`Field.component` 的解析优先级（高 -> 低）：

`teleport 插槽注入` > `ProComponentProvider.componentMap` > `内置 componentMap` > `原始 component 值`

#### 方式 1：传入 SFC 单文件组件对象（推荐，单字段最常用）

`component` 直接传组件对象，**必须用 `markRaw` 包裹**：

```ts
import { markRaw } from 'vue';
import MyInput from './MyInput.vue';

const fields = [{ path: 'code', label: '验证码', component: markRaw(MyInput) }];
```

> ⚠️ **必须 `markRaw`**：不包会被 Vue 当成响应式对象深度代理，触发性能警告甚至渲染异常。类型上 `component` 接受 `RenderComponentType | Raw<RenderComponentType>`，`Raw<T>` 即 markRaw 的类型标记。此字段不支持响应式（不能包 `ref`/`computed`）。

#### 方式 2：传入 render 函数（单字段，需动态拼装 props 时）

`component` 传 `(props, ctx) => VNode`。`props` 含 v-model 绑定值与 path，`ctx.attrs` 含透传属性：

```ts
import { h } from 'vue';
import MyInput from './MyInput.vue';

const fields = [
  {
    path: 'code',
    label: '验证码',
    component: (p, ctx) => h(MyInput, { ...p, ...ctx.attrs }),
  },
];
```

#### 方式 3：ProComponentProvider 注入 componentMap（全局复用，推荐多字段场景）

在根用 `componentMap` 注册，Field 里用字符串引用。**可覆盖内置组件**（如 `input: MyInput` 替换全局 `input`）。

```vue
<script setup lang="ts">
import { ProComponentProvider } from '@qin-ui/element-plus-pro';
import MyRichTextEditor from './components/MyRichTextEditor.vue';

const componentMap = {
  'rich-editor': MyRichTextEditor,
};
</script>

<template>
  <ProComponentProvider :component-map="componentMap">
    <AppLayout />
  </ProComponentProvider>
</template>
```

追加 TypeScript 全局声明获取强类型补全（项目任意 `.d.ts`）：

```ts
declare module '@qin-ui/element-plus-pro' {
  interface ComponentMap {
    'rich-editor': typeof MyRichTextEditor;
  }
}
```

之后 `component: 'rich-editor'` 即获精准属性类型联想与校验。

#### 方式 4：模板 scoped slot（声明式，简单替换）

插槽名 = 字段 `path`，绑定参数通过 `v-bind="scoped"` 转发（teleport 机制，优先级最高）：

```vue
<ProForm :form="form">
  <template #agreement="scoped">
    <el-checkbox v-bind="scoped">同意协议</el-checkbox>
  </template>
</ProForm>
```

#### 选择建议

| 场景                         | 推荐方式                          |
| :--------------------------- | :-------------------------------- |
| 单字段复用一个 SFC           | 方式 1（`markRaw(SFC)`）          |
| 单字段、需动态拼装 props     | 方式 2（render 函数）             |
| 多处复用 / 替换内置组件      | 方式 3（componentMap + 声明扩充） |
| 简单声明式替换、不想写 `h()` | 方式 4（scoped slot）             |

#### 自定义组件需遵守的约定

- **v-model**：默认绑 `modelValue`（`v-model`）。若组件用别的 prop，通过字段 `modelProp` 指定，或在 `componentVars` 预设 `modelProp`。
- **接收 path**：组件会收到 `path` prop（字段路径），可用于透传或标识。
- **属性透传**：Field 上除框架级属性外（`component` / `hidden` / `modelProp` / `valueFormatter` / `fields` / `slots` / `formItemContainer` / `componentContainer` / `extraProps` 等），其余作为 attrs 透传给自定义组件。

---

## Peer Dependencies

| 依赖包名称     | 推荐版本要求 |
| :------------- | :----------- |
| `vue`          | `^3.5.0`     |
| `element-plus` | `^2.13.6`    |

---

## 🤝 贡献与反馈

如有任何问题，欢迎通过 [GitHub Issues](https://github.com/dufan3715/pro-components/issues) 提交对本子包的优化建议和反馈。

## 📄 开源许可证

基于 [MIT](LICENSE) 开源许可证。
