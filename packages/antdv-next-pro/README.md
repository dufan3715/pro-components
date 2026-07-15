# @qin-ui/antdv-next-pro

> 基于 **antdv-next**（Vue 3 组件库，对齐 Ant Design 设计规范）和 **Vue 3.x** 的二次封装高级组件库，提供高度可配置、Schema 驱动的 `ProForm`、`ProTable` 和 `ProComponentProvider`。

<p align="center">
  <img src="https://img.shields.io/badge/antdv--next-v1.1%2B-blue" alt="antdv-next" />
  <img src="https://img.shields.io/badge/Vue-3.5%2B-brightgreen" alt="Vue 3.5+" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT" />
</p>

## 📝 [使用示例和文档详细内容](https://dufan3715.github.io/pro-components/)

---

## ✨ 核心特性

- 🛡️ **底层坚实**：基于 antdv-next v1.1+ 构建，原生支持 Vue 3.5+，对齐 Ant Design 设计规范。
- 🔥 **Schema 驱动**：使用声明式 JSON 配置即可快速生成表单与表格，极大地减少模板代码。
- ⚙️ **动态自适应**：支持表单字段的动态隐藏、禁用与规则联动，表格列的动态控制与配置。
- 🧩 **极致扩展**：原生支持自定义渲染组件与插槽定制，提供 `ProComponentProvider` 全局默认属性覆盖。
- 📐 **完美类型推导**：基于 TypeScript 提供完备的强类型推导和自动补全。

---

## 📦 安装

确保您的项目中已安装 `antdv-next` (v1.1+) 和 `vue` (v3.5+)：

```bash
npm install @qin-ui/antdv-next-pro antdv-next
# 或使用 pnpm
pnpm add @qin-ui/antdv-next-pro antdv-next
```

---

## 🤖 AI 辅助开发

本项目内置 AI 上下文初始化工具。安装后在项目根目录执行：

```bash
npx @qin-ui/antdv-next-pro init-ai
```

将在项目中生成双载体 AI 上下文，使 Cursor / Claude Code / Codex 等 AI 工具深度理解本库的 Schema 驱动用法与属性透传规则：

- `AGENTS.md` - 核心使用规则（跨工具开放约定，会话时自动注入，AI 默认加载）
- `.agents/skills/antdv-next-pro.md` - 完整 API 参考（支持 skills 发现的工具按需调取）

> 生成的 `AGENTS.md` 使用标记区块写入，重复执行 `init-ai` 可安全更新，不影响项目内其他库的指令。建议将生成的文件提交到 Git 仓库，团队共享 AI 上下文。

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

| 属性/方法                      | 说明                                                                               | 类型                             |
| :----------------------------- | :--------------------------------------------------------------------------------- | :------------------------------- |
| `formData`                     | 响应式表单数据对象，可直接读写，支持深层路径                                       | `Reactive<D>`                    |
| `fields`                       | 响应式表单字段配置数组引用                                                         | `Ref<Field[]>`                   |
| `formRef`                      | 底层 antdv-next 原生 [FormInstance](https://antdv-next.com/components/form-cn#api) | `Ref<FormInstance \| undefined>` |
| `getFormData(path?)`           | 安全获取指定字段路径（支持深层 'a.b'）的数据值                                     | `(path?) => any`                 |
| `setFormData(path, val)`       | 安全更新指定路径的值，支持批量对象或函数式更新                                     | `(path, val) => void`            |
| `getField(path, opts?)`        | 获取指定 path 的字段配置，支持查找函数定位                                         | `(path, opts) => Field`          |
| `setField(path, patch, opts?)` | 增量更新指定字段的配置参数（如 label、hidden 等），支持 merge 或 rewrite 更新      | `(path, patch, opts) => void`    |
| `deleteField(path)`            | 删除特定 path 的表单字段配置                                                       | `(path) => void`                 |
| `appendField(path, field)`     | 在指定字段 path 后面动态追加新字段                                                 | `(path, field) => void`          |
| `prependField(path, field)`    | 在指定字段 path 前面动态插入新字段                                                 | `(path, field) => void`          |
| `getParentField(path)`         | 查找获取当前子字段的父级配置项，一级字段返回虚拟根容器                             | `(path) => Field`                |

### `ProForm` Props

| 属性       | 类型                                                                         | 默认值  | 说明                                                                                     |
| :--------- | :--------------------------------------------------------------------------- | :------ | :--------------------------------------------------------------------------------------- |
| `form`     | `Form<D>`                                                                    | -       | `useForm` 返回的实例                                                                     |
| `grid`     | `boolean \| GridProps`                                                       | `false` | 是否启用 Grid 网格布局                                                                   |
| `disabled` | `boolean`                                                                    | `false` | 是否全局禁用整个表单                                                                     |
| 其余属性   | 继承 antdv-next [`FormProps`](https://antdv-next.com/components/form-cn#api) | -       | 如 `labelCol`、`wrapperCol`、`labelAlign`、`colon` 等，直接透传至 antdv-next `Form` 组件 |

---

## 🧱 属性分层透传（核心规则）

ProForm/ProTable 是渲染引擎，所有真实 UI 来自 antdv-next。**Field 上的属性会被"剥离到不同 DOM 层"，不是全塞给输入控件**。写错层就会失效，这是最容易踩的坑：

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
| `disabled` / `placeholder` / `allowClear` / `options` / `mode` / `maxlength` / `componentStyle` / `componentClass` / `componentDataAttrs` + 该控件其余 antdv-next 原生属性                                             | 输入控件本身（`a-input` 等）     | 其余全部             |
| `component` / `hidden` / `modelProp` / `valueFormatter` / `fields` / `slots` / `formItemContainer` / `componentContainer` / `extraProps`                                                                               | ProForm 逻辑消费，**不绑到 DOM** | 框架级属性           |

> **规则**：`span` 给 Grid，`label`/`rules` 给 FormItem，其余给输入控件。输入控件的具体属性名/类型请以 [antdv-next 官方文档](https://antdv-next.com) 为准。

---

## 📄 字段配置（`Field`）详情

所有字段共享 `Base` 公共属性，再加上各内置组件专属的属性参数。

### 公共基础属性（`Base`）

| 属性                 | 类型                                | 说明                                                                                                                |
| :------------------- | :---------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| `path`               | `Path<D>`                           | 字段标识，需对应 `formData` 中的 key                                                                                |
| `label`              | `string \| Component`               | 字段标签名称，支持直接传入 Vue 组件渲染                                                                             |
| `component`          | 见下方内置组件列表                  | 使用的内置组件名或自定义组件                                                                                        |
| `hidden`             | `MaybeRef<boolean>`                 | 字段是否隐藏，支持 Ref / Computed 响应式                                                                            |
| `disabled`           | `MaybeRef<boolean>`                 | 组件是否禁用，支持 Ref / Computed 响应式                                                                            |
| `rules`              | `FormItemRule[]`                    | 字段数据校验规则                                                                                                    |
| `span`               | `number`                            | Grid 占位列宽（仅在开启 `grid` 模式下有效）                                                                         |
| `slots`              | `Partial<ComponentSlots<FormItem>>` | FormItem 插槽（包含 `label`/`extra`/`help`/`tooltip` 等）                                                           |
| `grid`               | `boolean \| GridProps`              | 嵌套子字段的 Grid 配置                                                                                              |
| `fields`             | `Fields<D>`                         | 嵌套子字段配置数组（用于复杂分组）                                                                                  |
| `formItemStyle`      | `CSSProperties`                     | FormItem 样式属性                                                                                                   |
| `formItemClass`      | `string`                            | FormItem 自定义类名                                                                                                 |
| `formItemContainer`  | `Component`                         | FormItem 外层包裹容器组件                                                                                           |
| `formItemDataAttrs`  | `Record<string, string>`            | 附加到 FormItem DOM 节点上的自定义 data 属性                                                                        |
| `componentStyle`     | `CSSProperties`                     | 表单输入组件的样式属性                                                                                              |
| `componentClass`     | `string`                            | 表单输入组件的自定义类名                                                                                            |
| `componentContainer` | `Component`                         | 表单输入组件的外层包裹容器组件                                                                                      |
| `componentDataAttrs` | `Record<string, string>`            | 附加到输入组件 DOM 节点上的自定义 data 属性                                                                         |
| `valueFormatter`     | `ValueFormatter`                    | 字段值格式化与转换器（支持 get/set 双向处理器）                                                                     |
| `modelProp`          | `string`                            | 双向绑定的数据名，默认 `'value'`。Switch/Checkbox 使用 `'checked'`，**ProComponentProvider 已为 `switch` 预设此值** |

> [!NOTE]
> **响应式支持**：除了 `component`、`fields`、`slots`、`modelProp`、`formItemContainer`、`componentContainer`、`valueFormatter` 之外，所有属性均高度支持 `Ref` 或 `ComputedRef` 响应式数据。

### `valueFormatter` 字段值转换

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
import { ProComponentProvider } from '@qin-ui/antdv-next-pro';
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
declare module '@qin-ui/antdv-next-pro' {
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

| 参数名         | 类型             | 说明                                                                                            |
| :------------- | :--------------- | :---------------------------------------------------------------------------------------------- |
| `columns`      | `Column<D>[]`    | 表格列 Schema 配置，支持响应式 `hidden`                                                         |
| `dataSource`   | `T[]`            | 静态初始数据源数组                                                                              |
| `pageParam`    | `PageParam`      | 初始分页参数（current, pageSize, total）                                                        |
| `searchParam`  | `DeepPartial<D>` | 搜索栏表单初始填充数据                                                                          |
| `searchFields` | `Fields<D>`      | 搜索栏字段 Schema 配置，**格式与 ProForm 的 `fields` 完全一致**，同样支持配置驱动渲染和属性透传 |

### `useTable` 返回值 (Table 实例)

| 属性/方法          | 类型                  | 说明                                                                                       |
| :----------------- | :-------------------- | :----------------------------------------------------------------------------------------- |
| `columns`          | `Ref<Column<T>[]>`    | 响应式表格列配置数组                                                                       |
| `dataSource`       | `Ref<T[]>`            | 响应式表格数据源                                                                           |
| `pageParam`        | `Reactive<PageParam>` | 响应式分页参数：`{ current, pageSize, total }`                                             |
| `searchForm`       | `Form<D>`             | 搜索栏 ProForm 实例，可通过 `searchForm.formData` 获取搜索条件，也可调用其所有字段操作方法 |
| `setColumn`        | `(path, col, opts?)`  | 动态合并/覆盖列配置（`opts.updateType: 'merge' \| 'rewrite'`）                             |
| `deleteColumn`     | `(path, opts?)`       | 根据 dataIndex 路径或查找函数删除列                                                        |
| `appendColumn`     | `(path, col, opts?)`  | 在指定列后追加新列                                                                         |
| `prependColumn`    | `(path, col, opts?)`  | 在指定列前插入新列                                                                         |
| `setPageParam`     | `(pageParam)`         | 更新分页参数（支持局部属性或函数式更新）                                                   |
| `resetQueryParams` | `()`                  | 重置分页状态和搜索表单数据至初始值                                                         |

### `ProTable` Props

| 属性               | 类型                                                                           | 默认值  | 说明                                                                                  |
| :----------------- | :----------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------ |
| `table`            | `Table<D>`                                                                     | -       | 由 `useTable` 返回的表格实例引用                                                      |
| `search`           | `() => Promise<void>`                                                          | -       | 触发表格数据查询的异步回调函数                                                        |
| `addIndexColumn`   | `boolean`                                                                      | `false` | 是否自动在表格首列插入序号列                                                          |
| `immediateSearch`  | `boolean`                                                                      | `false` | 表格挂载完毕（onMounted）是否立即触发一次查询回调                                     |
| `control`          | `boolean \| { sizeControl, columnControl }`                                    | `true`  | 是否展示表格右上角尺寸调节和列显示控制条                                              |
| `searchFormConfig` | `SearchFormConfig`                                                             | -       | 搜索栏表单的排版布局及展开/收起配置参数                                               |
| `tableContainer`   | `Component \| false`                                                           | -       | 表格区域外层自定义包裹组件                                                            |
| 其余属性           | 继承 antdv-next [`TableProps`](https://antdv-next.com/components/table-cn#api) | -       | 如 `bordered`、`loading`、`size`、`pagination` 等，直接透传至 antdv-next `Table` 组件 |

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
```

#### Column 列配置

`columns` 数组中每一项为 `Column<T>` 类型，**继承 antdv-next `ColumnType`**，因此所有原生列属性（`title` / `width` / `fixed` / `align` / `customRender` / `ellipsis` 等）均可用。在此基础上新增：

| 属性        | 说明                                                                                      | 类型                 | 默认值  |
| :---------- | :---------------------------------------------------------------------------------------- | :------------------- | :------ |
| `dataIndex` | 列数据路径（主要字段），类型安全，支持 `'name'` / `'address.city'` / `['address','city']` | `string \| string[]` | -       |
| `key`       | 列字段标识（辅助），仅当 `dataIndex` 无法满足时使用，匹配优先级低于 `dataIndex`           | `string`             | -       |
| `hidden`    | 是否隐藏该列（配合列动态控制）                                                            | `boolean`            | `false` |

---

## ⚙️ ProComponentProvider

全局或局部的默认配置提供者，通过在最外层包裹 `ProComponentProvider`，传入 `componentVars` 属性，能够极其优雅地控制其所有子组件的默认配置。

```vue
<template>
  <ProComponentProvider :component-vars="config">
    <ProForm :form="form" />
    <ProTable :table="table" />
  </ProComponentProvider>
</template>

<script setup lang="ts">
import { ProComponentProvider } from '@qin-ui/antdv-next-pro';

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

#### 内置默认预设（INJECT_CONFIG）

ProComponentProvider 内置了一套默认属性预设，**即使不配置 `componentVars` 也会生效**。Field 配置优先级最高，会覆盖这些预设。以下为各组件的内置默认值（写代码时需知晓，避免行为与预期不符）：

| component                                                            | 默认预设                                                                                                                                                                                                         |
| :------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `switch`                                                             | `{ modelProp: 'checked' }` -- v-model 绑定 `checked` 而非 `value`                                                                                                                                                |
| `input` / `input-password`                                           | `{ maxlength: 100, allowClear: true, placeholder: '请输入' }`                                                                                                                                                    |
| `textarea`                                                           | `{ maxlength: 200, autoSize: { minRows: 3, maxRows: 6 }, showCount: true, allowClear: true, placeholder: '请输入' }`                                                                                             |
| `input-number`                                                       | `{ max: 1e15-1, min: -(1e15+1), controls: false, placeholder: '请输入', style: { width: '100%' } }`                                                                                                              |
| `select` / `cascader` / `auto-complete`                              | `{ allowClear: true, placeholder: '请选择', getPopupContainer }`                                                                                                                                                 |
| `date-picker` / `range-picker` / `time-picker` / `time-range-picker` | `{ allowClear: true, getPopupContainer, style: { width: '100%' } }`                                                                                                                                              |
| `pro-form`                                                           | `{ grid: { gutter: { xs: 8, sm: 16, md: 16, lg: 24 } } }`                                                                                                                                                        |
| `pro-form-item`                                                      | `{ validateFirst: true, span: 8 }`                                                                                                                                                                               |
| `pro-table`                                                          | `{ pagination: { showTotal, showSizeChanger, pageSizeOptions: ['10'..'100'], showQuickJumper: true }, searchFormConfig: { layout: 'grid', expand: { minExpandRows: 2 } }, control: true, addIndexColumn: true }` |

> `modelProp` 控制 v-model 绑定的属性名，默认 `'value'`（即 `v-model:value`）。`switch` 经预设绑定为 `checked`，通常无需手动设置。
> antdv-next 的 `date-picker` 还支持按 picker 子类型分别预设：`date-picker.date` / `.week` / `.month` / `.year` / `.quarter`。

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
