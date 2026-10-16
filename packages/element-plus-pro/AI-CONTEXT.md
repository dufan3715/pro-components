# @qin-ui/element-plus-pro

基于 element-plus v2.x（`el-` 前缀）封装的 Schema 驱动组件库。
用 JS 配置对象描述 UI，不写 `<el-*>` 模板堆叠。ProForm/ProTable 是渲染引擎，所有真实 UI 来自 element-plus。

## 安装与使用

```bash
pnpm add @qin-ui/element-plus-pro   # peerDeps: element-plus ^2.13.6, vue ^3.5
```

```ts
// 按需引入（推荐）
import { ProForm, ProTable, useForm, useTable } from '@qin-ui/element-plus-pro';
```

## 核心心智模型

**1. 配置驱动**：`useForm(数据, Field[])` / `useTable({ columns, searchFields })` 生成实例，组件接收实例。

**2. 属性分层透传**（最关键）：Field 上的属性被"剥离到不同 DOM 层"，不是全塞给输入控件。写错层就失效：

| 属性                                                                                                                                                                         | 落到哪一层                       | 说明           |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------- | :------------- |
| `span`/`offset`/`push`/`pull`/`xs`..`xl`                                                                                                                                     | `<el-col>` Grid 层               | 仅 grid 开启时 |
| `label`/`rules`/`error`/`required`/`size`/`showMessage`/`inlineMessage`/`labelWidth`/`formItemClass`/`formItemStyle`/`formItemDataAttrs`                                     | `<el-form-item>` 层              | 表单项         |
| `disabled`/`placeholder`/`clearable`/`options`/`filterable`/`multiple`/`maxlength`/`componentClass`/`componentStyle`/`componentDataAttrs` + 该控件其余 element-plus 原生属性 | 输入控件本身（el-input 等）      | 其余全部       |
| `component`/`hidden`/`modelProp`/`valueFormatter`/`fields`/`slots`/`formItemContainer`/`componentContainer`/`extraProps`                                                     | ProForm 逻辑消费，**不绑到 DOM** | 框架级         |

> 规则：`span` 给 Grid，`label`/`rules` 给 FormItem，其余给输入控件。
> **element-plus 命名约定**：用 `clearable`（不是 `allowClear`）、`showWordLimit`（不是 `showCount`）、`autosize`（小写 d）；el-form-item 插槽为 `label` 和 `error`。

## 速查

### component 映射（Field.component 字符串 -> element-plus 组件）

`input`->el-input · `input-number`->el-input-number · `autocomplete`->el-autocomplete · `select`->el-select ·
`cascader`->el-cascader · `date-picker`->el-date-picker · `time-picker`->el-time-picker · `time-select`->el-time-select ·
`checkbox-group`->el-checkbox-group · `radio-group`->el-radio-group · `switch`->el-switch · `slider`->el-slider ·
`tree-select`->el-tree-select · `transfer`->el-transfer · `custom`->用户自定义组件

> `input` 通过 `type` 子类型区分：`type: 'textarea'` 文本域、`type: 'password'` 密码框。
> `date-picker` 通过 `type` 子类型区分：`date`/`dates`/`daterange`/`datetime`/`datetimerange`/`week`/`month`/`monthrange`/`months`/`year`/`yearrange`/`years`。
> 写 Field 中输入控件的具体属性前，**属性名/类型以 https://element-plus.org 官方文档为准**。

### 隐式默认行为（INJECT_CONFIG，易踩坑）

由 `ProComponentProvider` 注入，优先级低于 Field 配置。**不写也有这些默认值，需知晓以免行为与预期不符**；其中 `maxlength` / `max` / `min` / `controls` 属非中性默认（超长输入被静默截断、数值范围受限、步进按钮隐藏），业务要求更高时在 Field 或 `componentVars` 中显式覆盖。下表为**库内置默认**，项目 Provider 可能已按 key 覆盖部分值，最终以现场读取的实际配置为准（见「项目级覆盖层」）：

| component                                     | 默认预设                                                                                                                                                                                                                                |
| :-------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `switch`                                      | `{ modelProp: 'modelValue' }` -> v-model 绑 `modelValue`（element-plus 惯例，即 `v-model`）                                                                                                                                             |
| `input`                                       | `{ maxlength: 100, clearable: true }`                                                                                                                                                                                                   |
| `input.textarea`                              | `{ maxlength: 200, autosize: {minRows:3,maxRows:6}, showWordLimit: true, clearable: true }`                                                                                                                                             |
| `input.password`                              | `{ showPassword: true, maxlength: 100, clearable: true }`                                                                                                                                                                               |
| `input-number`                                | `{ max: 1e15-1, min: -(1e15-1), controls: false, style:{width:'100%'} }`                                                                                                                                                                |
| `autocomplete`                                | `{ clearable: true }`                                                                                                                                                                                                                   |
| `select` / `cascader` / `tree-select`         | `{ clearable: true }`                                                                                                                                                                                                                   |
| `date-picker` / `time-picker` / `time-select` | `{ style:{width:'100%'} }`                                                                                                                                                                                                              |
| `pro-form`                                    | `{ grid: { gutter: 24 } }`                                                                                                                                                                                                              |
| `pro-form-item`                               | `{ span: 8 }`                                                                                                                                                                                                                           |
| `pro-table`                                   | `{ pagination:{layout:'total, sizes, prev, pager, next, jumper', pageSizes:[10,20,30,40,50,100], background:true}, searchFormConfig:{layout:'grid', expand:{minExpandRows:2, expandStatus:false}}, control:true, addIndexColumn:true }` |

> `modelProp` 控制 v-model 绑定名，element-plus 默认 `'modelValue'`（即 `v-model`）。
> `date-picker` 支持按 type 子类型分别预设：`date-picker.date` / `.dates` / `.daterange` / `.datetime` / `.datetimerange` / `.week` / `.month` / `.monthrange` / `.months` / `.year` / `.yearrange` / `.years`，范围类型自动生成 `startPlaceholder`/`endPlaceholder`；预设 key 在 setup 期定型，运行期变更 `type` 不会切换预设。
> `checkbox-group` / `radio-group` / `slider` / `transfer` 无预设（`{}`）。
> **占位符由 locale 兜底**：未显式设置 `placeholder` 时按组件类型自动生成（input 类 -> `input.placeholder`，select/cascader/tree-select 类 -> `select.placeholder`，日期/时间类 -> `date-picker.placeholder`，范围类型 -> `date-picker.start`/`date-picker.end` 等），语言随宿主组件库自动切换。

### 项目级覆盖层（写码前必查，实时生效）

项目 `ProComponentProvider`（通常挂载在 App.vue 或布局组件）的配置介于 Field 属性与上表内置默认之间，优先级为 **Field 属性 > 项目 Provider > 内置默认**。

**硬规则：生成任何 Field / Column / ProForm / ProTable / SearchForm 代码前，先全局搜索项目源码（排除 node_modules），读取 Provider 实际配置：**

```
搜索: <ProComponentProvider   挂载点（通常在 App.vue / 布局 / Provider 包装组件）
Provider 注入面：`data` / `columns` / `loading` 不可经 `componentVars['pro-table']` 配置（由 `:table` 实例、显式 `:data` 与组件自身状态驱动），`form` 不可经 `componentVars['pro-form']` 配置（由显式 `:form` 实例驱动）；传入不可注入键时在注入层静默忽略（类型面已限制，不输出告警）。

搜索: componentVars            项目覆盖的默认属性（input maxlength、select 配置等）
搜索: componentMap             注册的自定义组件 / 接管的内置组件
搜索: :locale=                 覆盖的内置文案（查询/重置/展开/占位符等）
```

- 配置值若抽离到独立文件（如 `:component-vars="providerVars"`），沿 import / 定义语句追到源头读取；
- `componentMap` 注册的 key 是合法的 `Field.component` 取值，应优先使用项目已注册组件，而非新写；
- 内置文案以项目 `locale` 覆盖为准，不硬编码默认文案；
- 全项目搜不到挂载点时，按上表内置默认工作。

### 内置文案（locale）

内置文案（查询/重置/收起/展开/序号/分页总数/占位符等）走 locale 体系，默认跟随宿主 element-plus 语言自动切换：

- `useLocale()` 返回 `{ t, lang }`：`t(key, params?)` 翻译函数（支持 `{placeholder}` 参数）、`lang` 当前语言（`'zh-CN'` / `'zh-TW'` / `'en-US'`）
- 包导出 `zhCN` / `zhTW` / `enUS` 三套语言包（类型 `ProLocale`）
- `ProComponentProvider` 的 `locale` prop 可覆盖任意内置文案（如 `{ 'table.query': '搜索' }`），未覆盖的默认跟随宿主语言

### 不支持响应式的属性（不能包 ref/computed）

`component` / `formItemContainer` / `componentContainer` / `valueFormatter` / `fields` / `slots` / `modelProp`。

## 实例成员速查

### useForm -- 表单实例

```ts
useForm(initFormData, Field[], root = true)   // 重载一（常用）：初始数据 + 字段配置
useForm(true | false)                          // 重载二：仅拿实例（root）
```

返回 `Form` 实例（**`formData` 是 reactive 对象，不用 `.value`**）：

| 成员                                                                                  | 说明                                                                                                                       |
| :------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------- |
| `form.formData`                                                                       | 响应式数据，可直接读写，支持深层路径 `formData.address.city`                                                               |
| `form.getFormData(path)`                                                              | 路径读取；无参返回 `undefined`                                                                                             |
| `form.setFormData(path, value)` / `setFormData(path, prev=>new)`                      | 路径写入，支持函数式                                                                                                       |
| `form.setFormData({...})` / `setFormData(prev => ({...prev, name:'新'}))`             | 批量覆盖整个表单，支持函数式（先清空再写入）                                                                               |
| `form.fields`                                                                         | 字段配置数组（Ref）                                                                                                        |
| `form.getField(path)` / `getField(fn)`                                                | 字段查找，支持路径或查找函数；`{all:true}` 返回所有匹配数组                                                                |
| `form.setField(path, patch)` / `setField(path, prev=>({...}))`                        | 字段增改查；默认合并，`{updateType:'rewrite'}` 覆盖；支持函数式更新；`{all:true}` 批量更新所有匹配                         |
| `form.deleteField` / `form.appendField` / `form.prependField` / `form.getParentField` | 字段增删查；均支持 `{all:true}`；`appendField(undefined, f)` 末尾追加、`prependField(undefined, f)` 开头插入，入参可为数组 |
| `form.formRef`                                                                        | 底层 element-plus Form 实例引用（Ref），`formRef.value?.validate()` / `.resetFields()`                                     |

> `useFormData()` 在 `ProForm` 子树内承接**内部兜底实例**的数据 store；`<ProForm :form="form">` 时与 `form.formData` 非同源，需同源请用 `useForm(false)` 或直接用传入实例。

### useTable -- 表格实例

```ts
useTable({ columns, data, pageParam, searchParam, searchFields }); // 数据源用 data（非 dataSource）
```

返回 `Table` 实例（**数据源字段名为 `data`，非 `dataSource`**）：

| 成员                                                                  | 说明                                                   |
| :-------------------------------------------------------------------- | :----------------------------------------------------- |
| `table.columns` / `table.data`                                        | 列配置 / 数据源（Ref，element-plus 语义）              |
| `table.pageParam`                                                     | 分页参数（reactive）：`current` / `pageSize` / `total` |
| `table.searchForm`                                                    | 搜索表单实例（Form 类型，所有 useForm 方法可用）       |
| `table.setColumn` / `deleteColumn` / `appendColumn` / `prependColumn` | 列增删改查（用法同 setField，支持 `{all:true}`）       |
| `table.setPageParam(patch)`                                           | 设置分页参数                                           |
| `table.resetQueryParams()`                                            | 恢复分页与搜索条件到初始化快照                         |

## 关键约定

### 自定义组件

`Field.component` 解析优先级（高 -> 低）：`teleport 插槽注入` > `ProComponentProvider.componentMap` > `内置 componentMap` > `原始 component 值`。

四种接入方式（完整代码见 skills）：

- **方式 1** `markRaw(SFC)`：单字段复用 SFC（**必须 markRaw**，否则被 Vue 深度代理触发性能警告）
- **方式 2** render 函数 `(props, ctx) => VNode`：需动态拼装 props
- **方式 3** `ProComponentProvider` 注入 `componentMap`：全局复用 / 覆盖内置组件，可追加 `declare module` 声明获强类型
- **方式 4** 模板 scoped slot：插槽名 = 字段 `path`，`v-bind="scoped"` 转发（teleport 机制，优先级最高）

约定：默认 v-model 绑 `modelValue`，他 prop 用 `modelProp` 指定；组件会收到 `path` prop；除框架级属性外其余作 attrs 透传。

### valueFormatter -- 字段值转换

控制表单值与组件值之间的转换。**在表单数据写入前（computed setter 中，于 `onUpdate:modelValue` 写回前）执行**，支持两种形态：

```ts
// 函数形态：(新值, 旧值) => 转换后的值，写回 formData。仅 set（写入）方向生效，读取时不转换
{ path: 'name', valueFormatter: (val, oldVal) => val?.trim() }

// 对象形态：get 读出时转换，set 写入时转换（双向）
{ path: 'birthday', component: 'date-picker',
  valueFormatter: { get: v => v ? new Date(v) : null, set: v => v ? dayjs(v).format('YYYY-MM-DD') : null } }
```

### ProTable -- 配置驱动表格

透传所有 element-plus `TableProps`（`& Omit<TableProps,'data'>`），可直接写 `row-key` / `bordered` / `stripe` 等原生属性；`size`、`loading` 是 v-model。

关键 prop：`table`（useTable 实例）、`search`（数据查询方法 `() => Promise`，ProTable 内部调用，非自动触发）、`addIndexColumn`、`immediateSearch`、`control`、`searchFormConfig`（含 `hidden`/`container`/`layout`/`expand`）、`tableContainer`、`columns`（覆盖实例列配置）、`data`（覆盖实例数据源）、`pagination`（`false` | 分页属性）。

**列控制（control）**：`control` 支持布尔值或 `{ sizeControl, columnControl }` 对象；`columnControl` 可为布尔值或 `ColumnControlConfig`：`labels`（列在下拉中的显示名映射，label 为 vnode 或函数时必用）、`excludedKeys`（不在下拉出现、始终展示）、`disabledKeys`（显示但不可取消勾选）、`disableCheckAll`（禁用全选/取消全选）。列 key 取 `prop` 或自定义 `key`。

**数据流**：搜索->重置分页到第 1 页->调 `search()`；分页/排序变化->更新 `pageParam`->调 `search()`；重置->`resetQueryParams()`->调 `search()`。

### Column -- 列配置

继承 element-plus `TableColumnCtx`（除 `prop`/`property`/`children`/`render`），所有原生列属性可用。新增：`prop`（列数据路径，主用，对应数据源 key）、`key`（辅助标识，优先级更低）、`hidden`（隐藏该列，配合列控制）、`render(scope)`（自定义渲染函数，接收 `{ row, column, $index, cellValue }`，优先级高于 `formatter`）。

> element-plus Table 列用 `prop`（不是 `dataIndex`），数据源用 `data`（不是 `dataSource`），v-model 用 `modelValue`（不是 `value`）。

## 反模式

- ❌ 在 `<ProForm>` 内手写 `<el-form-item>` -- ProForm 从 Field 配置自动渲染。
- ❌ 猜透传属性名 -- 先查 element-plus.org（element-plus 用 `clearable` 不是 `allowClear`，`filterable` 不是 `searchable`）。
- ❌ 把 `span` 当输入控件属性。
- ❌ 传 SFC 给 `component` 不用 `markRaw`。
- ❌ 在 ProTable 上忘了传 `:search`，或期望它自动请求 -- 查询由你提供并驱动。
- ❌ 把 element-plus 当 ant-design-vue -- 列用 `prop` 不是 `dataIndex`，数据源用 `data` 不是 `dataSource`，v-model 用 `modelValue` 不是 `value`。
- ❌ 不读项目 `ProComponentProvider` 实际配置就写 Field/Column 属性 -- 默认值与组件映射可能已被项目覆盖。

## 按需深查

完整 API（详细签名、参数表、完整示例、ProTable Slots、ProComponentProvider 用法）：

- `.agents/skills/element-plus-pro/SKILL.md` — skills 入口（速查 + 参考导航）
- `.agents/skills/element-plus-pro/references/README.md` — 完整使用文档与进阶示例
- `.agents/skills/element-plus-pro/references/api.md` — 结构化 API 元数据
- `node_modules/@qin-ui/element-plus-pro/README.md` — 完整用法与进阶示例
- element-plus 组件属性查阅官方文档：https://element-plus.org
- 项目注册了自定义 `componentMap` key 时，推荐补 `declare module` 环境类型声明（见 README 方式 3），使 `Field.component` 联合类型包含项目注册的 key
