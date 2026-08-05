# @qin-ui/antdv-next-pro

基于 antdv-next v1.1+（`a-` 前缀，对齐 Ant Design 设计规范）封装的 Schema 驱动组件库。
用 JS 配置对象描述 UI，不写 `<a-*>` 模板堆叠。ProForm/ProTable 是渲染引擎，所有真实 UI 来自 antdv-next。

## 安装与使用

```bash
pnpm add @qin-ui/antdv-next-pro   # peerDeps: antdv-next ^1.1.0, vue ^3.5
```

```ts
// 按需引入（推荐）
import { ProForm, ProTable, useForm, useTable } from '@qin-ui/antdv-next-pro';
```

## 核心心智模型

**1. 配置驱动**：`useForm(数据, Field[])` / `useTable({ columns, searchFields })` 生成实例，组件接收实例。

**2. 属性分层透传**（最关键）：Field 上的属性被"剥离到不同 DOM 层"，不是全塞给输入控件。写错层就失效：

| 属性                                                                                                                                                                                                               | 落到哪一层                       | 说明           |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------- | :------------- |
| `span`/`offset`/`push`/`pull`/`flex`/`xs..xxl`                                                                                                                                                                     | `<a-col>` Grid 层                | 仅 grid 开启时 |
| `label`/`rules`/`tooltip`/`colon`/`labelAlign`/`labelCol`/`wrapperCol`/`extra`/`help`/`validateFirst`/`validateTrigger`/`valuePropName`/`normalize`/`required`/`formItemClass`/`formItemStyle`/`formItemDataAttrs` | `<a-form-item>` 层               | 表单项         |
| `disabled`/`placeholder`/`allowClear`/`options`/`mode`/`maxlength`/`componentClass`/`componentStyle`/`componentDataAttrs` + 该控件其余 antdv-next 原生属性                                                         | 输入控件本身（a-input 等）       | 其余全部       |
| `component`/`hidden`/`modelProp`/`valueFormatter`/`fields`/`slots`/`formItemContainer`/`componentContainer`/`extraProps`                                                                                           | ProForm 逻辑消费，**不绑到 DOM** | 框架级         |

> 规则：`span` 给 Grid，`label`/`rules` 给 FormItem，其余给输入控件。

## 速查

### component 映射（Field.component 字符串 -> antdv-next 组件）

`input`->Input · `textarea`->TextArea · `input-password`->InputPassword · `input-search`->InputSearch ·
`input-number`->InputNumber · `input-otp`->InputOTP · `auto-complete`->AutoComplete · `select`->Select ·
`cascader`->Cascader · `date-picker`->DatePicker · `range-picker`->RangePicker · `time-picker`->TimePicker ·
`time-range-picker`->TimeRangePicker · `checkbox-group`->CheckboxGroup · `radio-group`->RadioGroup ·
`switch`->Switch · `slider`->Slider · `tree-select`->TreeSelect · `transfer`->Transfer · `custom`->用户自定义组件

> 写 Field 中输入控件的具体属性前，**属性名/类型以 https://antdv-next.com 官方文档为准**（官方提供 `llms.txt`，AI 可直接 fetch）。

### 隐式默认行为（INJECT_CONFIG，易踩坑）

由 `ProComponentProvider` 注入，优先级低于 Field 配置。**不写也有这些默认值，需知晓以免行为与预期不符：**

| component                                                            | 默认预设                                                                                                                                                                                                                                 |
| :------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `switch`                                                             | `{ modelProp: 'checked' }` -> v-model 绑 `checked` 而非 `value`                                                                                                                                                                          |
| `input` / `input-password`                                           | `{ maxlength: 100, allowClear: true, placeholder: '请输入' }`                                                                                                                                                                            |
| `textarea`                                                           | `{ maxlength: 200, autoSize: {minRows:3,maxRows:6}, showCount: true, allowClear: true, placeholder: '请输入' }`                                                                                                                          |
| `input-number`                                                       | `{ max: 1e15-1, min: -(1e15+1), controls: false, placeholder: '请输入', style:{width:'100%'} }`                                                                                                                                          |
| `select` / `cascader` / `auto-complete`                              | `{ allowClear: true, placeholder: '请选择', getPopupContainer }`                                                                                                                                                                         |
| `date-picker` / `range-picker` / `time-picker` / `time-range-picker` | `{ allowClear: true, getPopupContainer, style:{width:'100%'} }`                                                                                                                                                                          |
| `pro-form`                                                           | `{ grid: { gutter: {xs:8, sm:16, md:16, lg:24} } }`                                                                                                                                                                                      |
| `pro-form-item`                                                      | `{ validateFirst: true, span: 8 }`                                                                                                                                                                                                       |
| `pro-table`                                                          | `{ pagination:{showTotal, showSizeChanger, pageSizeOptions:['10','20','30','40','50','100'], showQuickJumper:true}, searchFormConfig:{layout:'grid', expand:{minExpandRows:2, expandStatus:false}}, control:true, addIndexColumn:true }` |

> `modelProp` 控制 v-model 绑定名，默认 `'value'`->`v-model:value`。
> `date-picker` 支持按 picker 子类型分别预设：`date-picker.date` / `.week` / `.month` / `.year` / `.quarter`，默认值同上。
> `input-search` / `input-otp` / `checkbox-group` / `radio-group` / `slider` / `tree-select` / `transfer` 无预设（`{}`）。

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
| `form.formRef`                                                                        | 底层 antdv-next Form 实例引用（Ref），`formRef.value?.validate()` / `.resetFields()`                                       |

### useTable -- 表格实例

```ts
useTable({ columns, dataSource, pageParam, searchParam, searchFields });
```

返回 `Table` 实例：

| 成员                                                                  | 说明                                                   |
| :-------------------------------------------------------------------- | :----------------------------------------------------- |
| `table.columns` / `table.dataSource`                                  | 列配置 / 数据源（Ref）                                 |
| `table.pageParam`                                                     | 分页参数（reactive）：`current` / `pageSize` / `total` |
| `table.searchForm`                                                    | 搜索表单实例（Form 类型，所有 useForm 方法可用）       |
| `table.setColumn` / `deleteColumn` / `appendColumn` / `prependColumn` | 列增删改查（用法同 setField，支持 `{all:true}`）       |
| `table.setPageParam(patch)`                                           | 设置分页参数                                           |
| `table.resetQueryParams()`                                            | 重置分页到第一页 + 恢复搜索条件到初始值                |

## 关键约定

### 自定义组件

`Field.component` 解析优先级（高 -> 低）：`teleport 插槽注入` > `ProComponentProvider.componentMap` > `内置 componentMap` > `原始 component 值`。

四种接入方式（完整代码见 skills）：

- **方式 1** `markRaw(SFC)`：单字段复用 SFC（**必须 markRaw**，否则被 Vue 深度代理触发性能警告）
- **方式 2** render 函数 `(props, ctx) => VNode`：需动态拼装 props
- **方式 3** `ProComponentProvider` 注入 `componentMap`：全局复用 / 覆盖内置组件，可追加 `declare module` 声明获强类型
- **方式 4** 模板 scoped slot：插槽名 = 字段 `path`，`v-bind="scoped"` 转发（teleport 机制，优先级最高）

约定：默认 v-model 绑 `value`，他 prop 用 `modelProp` 指定；组件会收到 `path` prop；除框架级属性外其余作 attrs 透传。

### valueFormatter -- 字段值转换

控制表单值与组件值之间的转换。**在表单数据写入前（computed setter 中）执行**，支持两种形态：

```ts
// 函数形态：(新值, 旧值) => 转换后的值，写回 formData。仅 set（写入）方向生效，读取时不转换
{ path: 'name', valueFormatter: (val, oldVal) => val?.trim() }

// 对象形态：get 读出时转换，set 写入时转换（双向）
{ path: 'birthday', component: 'date-picker',
  valueFormatter: { get: v => v ? dayjs(v) : null, set: v => v ? dayjs(v).format('YYYY-MM-DD') : null } }
```

### ProTable -- 配置驱动表格

透传所有 antdv-next `TableProps`（`& TableProps`），可直接写 `row-key` / `bordered` / `scroll` / `row-selection` 等原生属性；`size`、`loading` 是 v-model。

关键 prop：`table`（useTable 实例）、`search`（数据查询方法 `() => Promise`，ProTable 内部调用，非自动触发）、`addIndexColumn`、`immediateSearch`、`control`、`searchFormConfig`（含 `hidden`/`container`/`layout`/`expand`）、`tableContainer`。

**数据流**：搜索->重置分页到第 1 页->调 `search()`；分页/排序变化->更新 `pageParam`->调 `search()`；重置->`resetQueryParams()`->调 `search()`。

### Column -- 列配置

继承 antdv-next `ColumnType`，所有原生列属性可用。新增：`dataIndex`（列数据路径，主用，支持 `'name'` / `'address.city'` / `['address','city']`）、`key`（辅助标识，优先级更低）、`hidden`（隐藏该列，配合列控制）。

## 反模式

- ❌ 在 `<ProForm>` 内手写 `<a-form-item>` -- ProForm 从 Field 配置自动渲染。
- ❌ 猜透传属性名 -- 先查 antdv-next.com。
- ❌ 把 `span` 当输入控件属性。
- ❌ 传 SFC 给 `component` 不用 `markRaw`。
- ❌ 在 ProTable 上忘了传 `:search`，或期望它自动请求 -- 查询由你提供并驱动。

## 按需深查

完整 API（详细签名、参数表、完整示例、ProTable Slots、ProComponentProvider 用法）：

- `.agents/skills/antdv-next-pro/SKILL.md` — skills 入口（速查 + 参考导航）
- `.agents/skills/antdv-next-pro/references/README.md` — 完整使用文档与进阶示例
- `.agents/skills/antdv-next-pro/references/api.md` — 结构化 API 元数据
- `node_modules/@qin-ui/antdv-next-pro/README.md` — 完整用法与进阶示例
- antdv-next 组件属性查阅官方文档：https://antdv-next.com （官方还提供 `llms.txt` 与 Agent Skills，可一并加载）
