# @qin-ui/antd-vue-pro

> 基于 **Ant Design Vue v4+** 和 **Vue 3.x** 的二次封装高级组件库，提供高度可配置、Schema 驱动的 `ProForm` 和 `ProTable`，助您摆脱繁琐的模板代码，快速搭建桌面端中后台应用。

<p align="center">
  <img src="https://img.shields.io/badge/Ant%20Design%20Vue-4.x-blue" alt="Ant Design Vue 4.x" />
  <img src="https://img.shields.io/badge/Vue-3.3%2B-brightgreen" alt="Vue 3.3+" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT" />
</p>

## 📝 [使用示例和文档详细内容](https://dufan3715.github.io/pro-components/)

---

## ✨ 核心特性

- 🛡️ **底层坚实**：基于 Ant Design Vue 4.x 构建，原生支持 Vue 3.3+。
- 🔥 **Schema 驱动**：使用声明式 JSON 配置即可快速生成表单，极大地减少了模板文件的编写。
- ⚙️ **动态自适应**：支持表单字段的动态隐藏、禁用与规则联动，表格列的动态控制与配置。
- 🧩 **极致扩展**：原生支持自定义渲染组件与插槽定制，提供 `ProComponentProvider` 进行全局默认属性覆盖。
- 📐 **完美类型推导**：基于 TypeScript 提供完备的强类型推导和自动补全，开发体验流畅。

---

## 📦 安装

确保您的项目中已安装 `ant-design-vue` (v4+) 和 `vue` (v3.3+)：

```bash
npm i @qin-ui/antd-vue-pro
# 或使用 pnpm
pnpm add @qin-ui/antd-vue-pro
```

> [!WARNING]
> **2.0+ 升级提示**：2.0 版本进行了底层重构，`useForm` 返回的 `formData` 从原本的 `ref` 包装调整为了真正的 `reactive` 响应式对象，获取和修改属性时无需使用 `.value`。

---

## 🤖 AI 辅助开发

本项目内置 AI 上下文初始化工具。安装后在项目根目录执行：

```bash
npx @qin-ui/antd-vue-pro init-ai
```

将在项目中生成双载体 AI 上下文，使 Cursor / Claude Code / Codex 等 AI 工具深度理解本库的 Schema 驱动用法与属性透传规则：

- `AGENTS.md` — 核心使用规则（跨工具开放约定，会话时自动注入，AI 默认加载）
- `.agents/skills/antd-vue-pro.md` — 完整 API 参考（支持 skills 发现的工具按需调取）

> 生成的 `AGENTS.md` 使用标记区块写入，重复执行 `init-ai` 可安全更新，不影响项目内其他库的指令。建议将生成的文件提交到 Git 仓库，团队共享 AI 上下文。

---

## 🚀 快速开始

### 1. 全局注册组件（可选）

```ts
import { createApp } from 'vue';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import AntdVuePro from '@qin-ui/antd-vue-pro';
import App from './App.vue';

const app = createApp(App);
app.use(Antd);
app.use(AntdVuePro); // 全局注册 ProForm, ProTable 和 ProComponentProvider
app.mount('#app');
```

### 2. 基础表单使用示例

```vue
<script setup lang="ts">
import { ProForm, useForm } from '@qin-ui/antd-vue-pro';

interface UserForm {
  username: string;
  age: number;
  gender: string;
}

// 1. 创建类型安全的表单实例
const form = useForm<UserForm>(
  { username: '张三', age: 18, gender: 'male' }, // 初始数据
  [
    {
      path: 'username',
      label: '用户名',
      component: 'input',
      rules: [{ required: true, message: '请输入用户名' }],
    },
    {
      path: 'age',
      label: '年龄',
      component: 'input-number',
      min: 1,
      max: 150,
    },
    {
      path: 'gender',
      label: '性别',
      component: 'select',
      options: [
        { label: '男', value: 'male' },
        { label: '女', value: 'female' },
      ],
    },
  ]
);

// 2. 提交表单校验与数据获取
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
    <a-button type="primary" style="margin-top: 16px;" @click="handleSubmit">
      提交表单
    </a-button>
  </div>
</template>
```

---

## 🧱 属性分层透传（核心规则）

ProForm/ProTable 是渲染引擎，所有真实 UI 来自 ant-design-vue。**Field 上的属性会被"剥离到不同 DOM 层"，不是全塞给输入控件**。写错层就会失效，这是最容易踩的坑：

```
<a-col :span="8">            ← Grid 层（仅 grid 开启时）
  <a-form-item label="...">  ← FormItem 层
    <a-input placeholder>     ← 输入控件层
  </a-form-item>
</a-col>
```

| 属性                                                                                                                                                                                                                   | 落到哪一层                       | 说明                 |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------- | :------------------- |
| `span` / `offset` / `push` / `pull` / `flex` / `xs`..`xxl`                                                                                                                                                             | `<a-col>` Grid 层                | 仅 `grid` 开启时生效 |
| `label` / `rules` / `tooltip` / `colon` / `labelCol` / `wrapperCol` / `extra` / `help` / `validateTrigger` / `validateFirst` / `valuePropName` / `normalize` / `formItemStyle` / `formItemClass` / `formItemDataAttrs` | `<a-form-item>` 层               | 表单项相关属性       |
| `disabled` / `placeholder` / `allowClear` / `options` / `mode` / `maxlength` / `componentStyle` / `componentClass` / `componentDataAttrs` + 该控件其余 ant-design-vue 原生属性                                         | 输入控件本身（`a-input` 等）     | 其余全部             |
| `component` / `hidden` / `modelProp` / `valueFormatter` / `fields` / `slots` / `formItemContainer` / `componentContainer` / `extraProps`                                                                               | ProForm 逻辑消费，**不绑到 DOM** | 框架级属性           |

> **规则**：`span` 给 Grid，`label`/`rules` 给 FormItem，其余给输入控件。输入控件的具体属性名/类型请以 [ant-design-vue 官方文档](https://antdv.com) 为准。

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

| component                                      | 默认预设                                                                                                                                                                                                         |
| :--------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `switch`                                       | `{ modelProp: 'checked' }` —— v-model 绑定 `checked` 而非 `value`                                                                                                                                                |
| `input` / `input-password`                     | `{ maxlength: 100, allowClear: true, placeholder: '请输入' }`                                                                                                                                                    |
| `textarea`                                     | `{ maxlength: 200, autoSize: { minRows: 3, maxRows: 6 }, showCount: true, allowClear: true, placeholder: '请输入' }`                                                                                             |
| `input-number`                                 | `{ max: 1e15-1, min: -(1e15+1), controls: false, placeholder: '请输入', style: { width: '100%' } }`                                                                                                              |
| `select` / `cascader`                          | `{ allowClear: true, placeholder: '请选择', getPopupContainer }`                                                                                                                                                 |
| `date-picker` / `range-picker` / `time-picker` | `{ allowClear: true, getPopupContainer, style: { width: '100%' } }`                                                                                                                                              |
| `pro-form`                                     | `{ grid: { gutter: { xs: 8, sm: 16, md: 16, lg: 24 } } }`                                                                                                                                                        |
| `pro-form-item`                                | `{ validateFirst: true, span: 8 }`                                                                                                                                                                               |
| `pro-table`                                    | `{ pagination: { showTotal, showSizeChanger, pageSizeOptions: ['10'..'100'], showQuickJumper: true }, searchFormConfig: { layout: 'grid', expand: { minExpandRows: 2 } }, control: true, addIndexColumn: true }` |

> `modelProp` 控制 v-model 绑定的属性名，默认 `'value'`（即 `v-model:value`）。`switch` 经预设绑定为 `checked`，通常无需手动设置。

---

### 2. ProForm

基于 Ant Design Vue Form 深度封装的高级表单组件。

#### Props

| 参数名 | 说明                                                      | 类型                   | 默认值  |
| :----- | :-------------------------------------------------------- | :--------------------- | :------ |
| `form` | 由 `useForm` 返回的表单实例                               | `Form`                 | -       |
| `grid` | 是否启用栅格网格布局，支持传入 Grid 配置以配置自适应      | `boolean \| GridProps` | `false` |
| `...`  | 其余属性均继承自 Ant Design Vue `a-form` 组件的原生 Props | `FormProps`            | -       |

#### Events & Methods

- 所有事件（如 `finish`, `finishFailed` 等）和方法（如 `validate`, `resetFields`）均与 Ant Design Vue `a-form` 组件完全继承，且能直接透传绑定。

---

### 3. ProTable

基于 Ant Design Vue Table 深度封装的高级表格组件，将搜索表单、列配置、分页高度集成。

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
| `...`              | 其余参数继承自 Ant Design Vue `a-table` 的原生属性        | `TableProps`                           | -       |

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
  table.dataSource.value = res.data;
  table.setPageParam({ total: res.total });
};

// 重置按钮（ProTable 内部已串联 resetQueryParams -> search，一般无需手动处理）
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
| `formData`                     | 响应式表单数据对象（**2.0+ 中由 reactive 包装**）                                   | `Reactive<D>`                    |
| `fields`                       | 响应式表单字段配置数组引用                                                          | `Ref<Field[]>`                   |
| `formRef`                      | 底层 Ant Design Vue `a-form` 的 DOM/组件引用实例                                    | `Ref<FormInstance \| undefined>` |
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

用于创建和管理表格实例，内置集成了列配置操作与搜索表单组件。

#### 入参参数

```ts
const table = useTable<D, T>({
  columns: [], // 初始列配置
  dataSource: [], // 静态初始数据源
  pageParam: {}, // 分页参数配置
  searchParam: {}, // 搜索栏初始数据
  searchFields: [], // 搜索栏字段 Schema 配置
});
```

#### 返回值 (Table 实例)

| 属性/方法                 | 说明                                                      | 类型                   |
| :------------------------ | :-------------------------------------------------------- | :--------------------- |
| `columns`                 | 响应式表格列配置数组                                      | `Ref<Column[]>`        |
| `dataSource`              | 响应式表格列表数据源                                      | `Ref<T[]>`             |
| `pageParam`               | 响应式分页参数对象（包含 `current`, `pageSize`, `total`） | `Reactive<PageParam>`  |
| `searchForm`              | 搜索栏表单关联的 `useForm` 实例，提供完美的表单操作 API   | `Form<D>`              |
| `setColumn(key, patch)`   | 合并或重置修改指定 key 的列配置属性（如 width、title 等） | `(key, patch) => void` |
| `deleteColumn(key)`       | 动态移除某一个指定 key 对应的表格列配置                   | `(key) => void`        |
| `appendColumn(key, col)`  | 在某一个列的后方动态追加配置列                            | `(key, col) => void`   |
| `prependColumn(key, col)` | 在某一个列的前方动态插入配置列                            | `(key, col) => void`   |
| `setPageParam(param)`     | 增量设置当前分页参数值，支持传入对象或更新函数            | `(param) => void`      |
| `resetQueryParams()`      | 重置搜索参数，并恢复分页至第 1 页                         | `() => void`           |

#### 列配置（Column）

`columns` 数组中每一项为 `Column<T>` 类型，**继承 ant-design-vue `ColumnType`**，因此所有原生列属性（`title` / `width` / `fixed` / `align` / `customRender` / `ellipsis` 等）均可用。在此基础上新增：

| 属性        | 说明                                                                                      | 类型                 | 默认值  |
| :---------- | :---------------------------------------------------------------------------------------- | :------------------- | :------ |
| `dataIndex` | 列数据路径（主要字段），类型安全，支持 `'name'` / `'address.city'` / `['address','city']` | `string \| string[]` | -       |
| `key`       | 列字段标识（辅助），仅当 `dataIndex` 无法满足时使用，匹配优先级低于 `dataIndex`           | `string`             | -       |
| `hidden`    | 是否隐藏该列（配合列动态控制）                                                            | `boolean`            | `false` |

---

## 📄 字段配置（`Field`）详解

在进行表单 Schema 编写时，`Field` 数组中的每一项都支持以下属性定义：

### 公共基础属性

| 属性名               | 说明                                                                          | 类型                          | 默认值    |
| :------------------- | :---------------------------------------------------------------------------- | :---------------------------- | :-------- |
| `path`               | 字段标识，需对应数据对象 `formData` 的 key，支持多级嵌套，例如 `address.city` | `string`                      | -         |
| `label`              | 字段中文标签，支持字符串或直接传入 VNode 组件进行自定义                       | `string \| Component \| Slot` | -         |
| `component`          | 调用的表单项组件的类型，支持内置类型键名或直接传入自定义 Vue 组件             | `string \| Component`         | `'input'` |
| `hidden`             | 字段是否被隐藏（在 DOM 中彻底不渲染，但数据保留），支持 Ref/Computed 响应式   | `boolean \| Ref<boolean>`     | `false`   |
| `disabled`           | 组件的禁用状态，支持 Ref/Computed 响应式                                      | `boolean \| Ref<boolean>`     | `false`   |
| `rules`              | 字段数据校验规则，遵循 ant-design-vue Form 校验格式                           | `Rule[]`                      | -         |
| `span`               | 栅格占位宽度（在 ProForm 开启 `grid` 网格布局后有效）                         | `number`                      | -         |
| `formItemStyle`      | 挂载在外部 `a-form-item` 节点上的额外 CSS 样式属性                            | `CSSProperties`               | -         |
| `formItemClass`      | 挂载在外部 `a-form-item` 节点上的自定义类名                                   | `string`                      | -         |
| `formItemContainer`  | 针对该表单项的最外层 DOM 包裹组件                                             | `Component`                   | -         |
| `formItemDataAttrs`  | 附加在 `a-form-item` DOM 节点上的自定义 data 属性                             | `Record<string, string>`      | -         |
| `componentStyle`     | 直接传递给内部表单输入组件的额外 CSS 样式属性                                 | `CSSProperties`               | -         |
| `componentClass`     | 直接传递给内部表单输入组件的自定义类名                                        | `string`                      | -         |
| `componentContainer` | 针对表单输入组件的包裹组件（位于 FormItem 与组件之间）                        | `Component`                   | -         |
| `componentDataAttrs` | 附加在内部输入组件 DOM 节点上的自定义 data 属性                               | `Record<string, string>`      | -         |
| `slots`              | 该表单项的插槽自定义内容，包含 formItem 插槽或组件插槽                        | `Record<string, Slot>`        | -         |
| `valueFormatter`     | 字段值转换处理器，可在输入更新或提取数据时做 get/set 转换                     | `ValueFormatter`              | -         |
| `modelProp`          | 双向绑定的数据属性名称（当使用自定义组件且非 value 绑定时）                   | `string`                      | `'value'` |
| `fields`             | 嵌套子表单项的 Schema 数组配置（用于分组或复杂嵌套表单）                      | `Field[]`                     | -         |
| `grid`               | 针对当前嵌套子表单项所使用的网格布局参数（仅当有 `fields` 时有效）            | `boolean \| GridProps`        | -         |

#### `valueFormatter` 字段值转换

控制表单值与组件值之间的转换（如日期 `dayjs` 与字符串互转）。在 `onUpdate:value` 之前执行，支持两种形态：

```ts
// 函数形态：(新值, 旧值) => 转换后的值，写回 formData
{ path: 'name', component: 'input', valueFormatter: (val, oldVal) => val?.trim() }

// 对象形态：get 读出时转换，set 写入时转换
{
  path: 'birthday',
  component: 'date-picker',
  valueFormatter: {
    get: (val) => (val ? dayjs(val) : null),                          // formData -> 组件显示
    set: (val) => (val ? dayjs(val).format('YYYY-MM-DD') : null),     // 组件 -> formData
  },
}
```

> ⚠️ `valueFormatter` 不支持响应式（不能包 `ref`/`computed`），与 `component` / `fields` / `slots` / `modelProp` 等同属不支持响应式的属性。

---

### 🔄 响应式联动

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

#### 不支持响应式的属性

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

组件库默认封装了 Ant Design Vue 的高频交互组件，您可以在 `component` 属性中填入以下预设键名来自动调用：

| 内置键名           | 渲染对应的 Ant Design Vue 组件  |
| :----------------- | :------------------------------ |
| `'input'`          | `a-input` 文本输入框            |
| `'textarea'`       | `a-textarea` 文本域             |
| `'input-search'`   | `a-input-search` 搜索输入框     |
| `'input-password'` | `a-input-password` 密码框       |
| `'input-number'`   | `a-input-number` 数字输入框     |
| `'select'`         | `a-select` 下拉选择器           |
| `'cascader'`       | `a-cascader` 级联选择器         |
| `'date-picker'`    | `a-date-picker` 日期选择器      |
| `'range-picker'`   | `a-range-picker` 日期范围选择器 |
| `'time-picker'`    | `a-time-picker` 时间选择器      |
| `'checkbox-group'` | `a-checkbox-group` 复选框组     |
| `'radio-group'`    | `a-radio-group` 单选按钮组      |
| `'switch'`         | `a-switch` 开关切换器           |
| `'slider'`         | `a-slider` 滑动条               |
| `'tree-select'`    | `a-tree-select` 树形选择器      |
| `'transfer'`       | `a-transfer` 穿梭框             |
| `'custom'`         | 完全渲染自定义组件              |

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
import { ProComponentProvider } from '@qin-ui/antd-vue-pro';
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
declare module '@qin-ui/antd-vue-pro' {
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
    <a-checkbox v-bind="scoped">同意协议</a-checkbox>
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

- **v-model**：默认绑 `value`（`v-model:value`）。若组件用别的 prop（如 Switch 用 `checked`），通过字段 `modelProp` 指定，或在 `componentVars` 预设 `modelProp`。
- **接收 path**：组件会收到 `path` prop（字段路径），可用于透传或标识。
- **属性透传**：Field 上除框架级属性外（`component` / `hidden` / `modelProp` / `valueFormatter` / `fields` / `slots` / `formItemContainer` / `componentContainer` / `extraProps` 等），其余作为 attrs 透传给自定义组件。

---

## Peer Dependencies

| 依赖包名称       | 推荐版本要求 |
| :--------------- | :----------- |
| `vue`            | `^3.5.0`     |
| `ant-design-vue` | `^4.0.0`     |

---

## 🤝 贡献与反馈

欢迎在任何时候通过 [GitHub Issues](https://github.com/dufan3715/pro-components/issues) 提交对本子包的优化建议和反馈。

## 📄 开源许可证

基于 [MIT](LICENSE) 开源许可证。
