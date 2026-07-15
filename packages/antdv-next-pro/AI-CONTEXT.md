# @qin-ui/antdv-next-pro

基于 antdv-next v1.1+（`a-` 前缀，对齐 Ant Design 设计规范）封装的 Schema 驱动组件库。
用 JS 配置对象描述 UI，不写 `<a-*>` 模板堆叠。ProForm/ProTable 是渲染引擎，所有真实 UI 来自 antdv-next。

## 安装与注册

```bash
pnpm add @qin-ui/antdv-next-pro   # peerDeps: antdv-next ^1.1.0, vue ^3.5
```

```ts
import AntdvNextPro from '@qin-ui/antdv-next-pro';
import '@qin-ui/antdv-next-pro/antdv-next-pro.css';
app.use(AntdvNextPro); // 全局注册 ProForm / ProTable / ProComponentProvider
```

## 两条核心心智模型

**1. 配置驱动**：`useForm(数据, Field[])` / `useTable({ columns, searchFields })` 生成实例，组件接收实例。

**2. 属性分层透传**（最关键）：Field 上的属性被"剥离到不同 DOM 层"，不是全塞给输入控件。写错层就失效：

| 属性                                                                                                                                                                                                    | 落到哪一层                       | 说明           |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------- | :------------- |
| `span`/`offset`/`push`/`pull`/`flex`/`xs..xxl`                                                                                                                                                          | `<a-col>` Grid 层                | 仅 grid 开启时 |
| `label`/`rules`/`tooltip`/`colon`/`labelAlign`/`labelCol`/`wrapperCol`/`extra`/`help`/`validateFirst`/`validateTrigger`/`valuePropName`/`normalize`/`formItemClass`/`formItemStyle`/`formItemDataAttrs` | `<a-form-item>` 层               | 表单项         |
| `disabled`/`placeholder`/`allowClear`/`options`/`mode`/`maxlength`/`componentClass`/`componentStyle`/`componentDataAttrs` + 该控件其余 antdv-next 原生属性                                              | 输入控件本身（a-input 等）       | 其余全部       |
| `component`/`hidden`/`modelProp`/`valueFormatter`/`fields`/`slots`/`formItemContainer`/`componentContainer`/`extraProps`                                                                                | ProForm 逻辑消费，**不绑到 DOM** | 框架级         |

> 规则：`span` 给 Grid，`label`/`rules` 给 FormItem，其余给输入控件。

## component 映射（Field.component 字符串 -> antdv-next 组件）

`input`->Input · `textarea`->TextArea · `input-password`->InputPassword · `input-search`->InputSearch ·
`input-number`->InputNumber · `input-otp`->InputOTP · `auto-complete`->AutoComplete · `select`->Select ·
`cascader`->Cascader · `date-picker`->DatePicker · `range-picker`->RangePicker · `time-picker`->TimePicker ·
`time-range-picker`->TimeRangePicker · `checkbox-group`->CheckboxGroup · `radio-group`->RadioGroup ·
`switch`->Switch · `slider`->Slider · `tree-select`->TreeSelect · `transfer`->Transfer · `custom`->用户自定义组件

> 写 Field 中输入控件的具体属性前，**属性名/类型以 https://antdv-next.com 官方文档为准**（官方提供 `llms.txt`，AI 可直接 fetch）。

## 隐式默认行为（INJECT_CONFIG，易踩坑）

由 `ProComponentProvider` 注入，优先级低于 Field 配置。**不写也有这些默认值，需知晓以免行为与预期不符：**

| component                                                            | 默认预设                                                                                                                                                                                          |
| :------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `switch`                                                             | `{ modelProp: 'checked' }` -> v-model 绑 `checked` 而非 `value`                                                                                                                                   |
| `input` / `input-password`                                           | `{ maxlength: 100, allowClear: true, placeholder: '请输入' }`                                                                                                                                     |
| `textarea`                                                           | `{ maxlength: 200, autoSize: {minRows:3,maxRows:6}, showCount: true, allowClear: true, placeholder: '请输入' }`                                                                                   |
| `input-number`                                                       | `{ max: 1e15-1, min: -(1e15+1), controls: false, placeholder: '请输入', style:{width:'100%'} }`                                                                                                   |
| `select` / `cascader` / `auto-complete`                              | `{ allowClear: true, placeholder: '请选择', getPopupContainer }`                                                                                                                                  |
| `date-picker` / `range-picker` / `time-picker` / `time-range-picker` | `{ allowClear: true, getPopupContainer, style:{width:'100%'} }`                                                                                                                                   |
| `pro-form`                                                           | `{ grid: { gutter: {xs:8, sm:16, md:16, lg:24} } }`                                                                                                                                               |
| `pro-form-item`                                                      | `{ validateFirst: true, span: 8 }`                                                                                                                                                                |
| `pro-table`                                                          | `{ pagination:{showTotal, showSizeChanger, pageSizeOptions:['10'..'100'], showQuickJumper:true}, searchFormConfig:{layout:'grid', expand:{minExpandRows:2}}, control:true, addIndexColumn:true }` |

> `modelProp` 控制 v-model 绑定名，默认 `'value'`->`v-model:value`。
> antdv-next 的 `date-picker` 还支持按 picker 子类型分别预设：`date-picker.date` / `.week` / `.month` / `.year` / `.quarter`，默认值同上。

## useForm -- 表单实例

```ts
// 重载一（常用）：初始数据 + 字段配置
const form = useForm<User>(
  { name: '张三', age: 25 }, // initFormData
  [
    {
      path: 'name',
      label: '姓名',
      component: 'input',
      rules: [{ required: true }],
    },
  ] // Field[]
);
// 重载二：仅拿实例（root=true/false）
const form = useForm<User>(true);
```

返回 `Form` 实例（**`formData` 是 reactive 对象，不用 `.value`**）：

| 成员                                                                                  | 说明                                                                                         |
| :------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------- |
| `form.formData`                                                                       | 响应式数据，可直接读写，支持深层路径 `formData.address.city`                                 |
| `form.getFormData(path)` / `form.setFormData(path, value)`                            | 路径读写；setFormData 还支持 `setFormData(path, prev=>new)` 和 `setFormData({...})` 批量覆盖 |
| `form.fields`                                                                         | 字段配置数组（Ref）                                                                          |
| `form.getField(path)` / `form.setField(path, patch)`                                  | 字段增改查；setField 默认合并，`{updateType:'rewrite'}` 覆盖                                 |
| `form.deleteField` / `form.appendField` / `form.prependField` / `form.getParentField` | 字段增删                                                                                     |
| `form.formRef`                                                                        | 底层 antdv-next Form 实例引用（Ref），`formRef.value?.validate()` / `.resetFields()`         |

## ProForm 最小示例

```vue
<script setup lang="ts">
import { ProForm, useForm } from '@qin-ui/antdv-next-pro';
interface User {
  username: string;
  age: number;
  gender: string;
}
const form = useForm<User>({ username: '', age: 18, gender: 'male' }, [
  {
    path: 'username',
    component: 'input',
    label: '用户名',
    rules: [{ required: true }],
  },
  { path: 'age', component: 'input-number', label: '年龄', min: 1, max: 150 },
  {
    path: 'gender',
    component: 'select',
    label: '性别',
    options: [
      { label: '男', value: 'male' },
      { label: '女', value: 'female' },
    ],
  },
]);
const submit = async () => {
  await form.formRef.value?.validate();
  console.log(form.formData);
};
</script>
<template>
  <ProForm :form="form" />
  <a-button type="primary" @click="submit">提交</a-button>
</template>
```

## 自定义组件（4 种方式）

`Field.component` 的解析优先级（高 -> 低）：
`teleport 插槽注入` > `ProComponentProvider.componentMap` > `内置 componentMap` > `原始 component 值`

### 方式 1：传入 SFC 单文件组件对象（推荐，单字段最常用）

`component` 直接传组件对象，**必须用 `markRaw` 包裹**。

```ts
import { markRaw } from 'vue';
import MyInput from './MyInput.vue';
{ path: 'code', label: '验证码', component: markRaw(MyInput) }
```

> ⚠️ **必须 markRaw**：不包会被 Vue 当成响应式对象深度代理，触发性能警告甚至渲染异常。
> 类型上 `component` 接受 `RenderComponentType | Raw<RenderComponentType>`，`Raw<T>` 即 markRaw 的类型标记。
> 此字段不支持响应式（不能包 ref/computed）。

### 方式 2：传入 render 函数（单字段，需动态拼装 props 时）

`component` 传 `(props, ctx) => VNode`。`props` 含 v-model 绑定值与 path，`ctx.attrs` 含透传属性。

```ts
import { h } from 'vue';
import MyInput from './MyInput.vue';
{ path: 'code', label: '验证码', component: (p, ctx) => h(MyInput, { ...p, ...ctx.attrs }) }
```

### 方式 3：ProComponentProvider 注入 componentMap（全局复用，推荐多字段场景）

在根用 `componentMap` 注册，Field 里用字符串引用。**可覆盖内置组件**（如 `input: MyInput` 替换全局 input）。

```vue
<script setup lang="ts">
import { ProComponentProvider } from '@qin-ui/antdv-next-pro';
import MyRichTextEditor from './components/MyRichTextEditor.vue';
const componentMap = { 'rich-editor': MyRichTextEditor };
</script>
<template>
  <ProComponentProvider :component-map="componentMap">
    <ProForm :form="form" />
  </ProComponentProvider>
</template>
```

**追加全局声明获取强类型补全**（项目任意 `.d.ts`）：

```ts
declare module '@qin-ui/antdv-next-pro' {
  interface ComponentMap {
    'rich-editor': typeof MyRichTextEditor;
  }
}
// 之后 component: 'rich-editor' 即获精准属性类型联想
```

### 方式 4：模板 scoped slot（声明式，简单替换）

插槽名 = 字段 `path`，绑定参数通过 `v-bind="scoped"` 转发（teleport 机制，优先级最高）。

```vue
<ProForm :form="form">
  <template #agreement="scoped">
    <a-checkbox v-bind="scoped">同意协议</a-checkbox>
  </template>
</ProForm>
```

### 选择建议

- 单字段复用一个 SFC -> 方式 1（markRaw(SFC)）
- 单字段、需动态拼装 props -> 方式 2（render 函数）
- 多处复用 / 替换内置组件 -> 方式 3（componentMap + 声明扩充）
- 简单声明式替换、不想写 h() -> 方式 4（scoped slot）

### 自定义组件需遵守的约定

- **v-model**：默认绑 `value`（`v-model:value`）。若组件用别的 prop（如 Switch 用 `checked`），通过字段 `modelProp` 指定，或在 componentVars 预设 `modelProp`
- **接收 path**：组件会收到 `path` prop（字段路径）
- **属性透传**：Field 上除框架级属性外（component/hidden/modelProp/valueFormatter/fields/slots/formItemContainer/componentContainer/extraProps 等），其余作为 attrs 透传给自定义组件

## valueFormatter -- 字段值转换

控制表单值与组件值之间的转换（如日期 dayjs 与字符串互转）。**在 onUpdate:前执行**，支持两种形态：

```ts
// 函数形态：(新值, 旧值) => 转换后的值，写回 formData
{ path: 'name', valueFormatter: (val, oldVal) => val?.trim() }

// 对象形态：get 读出时转换，set 写入时转换
{ path: 'birthday', component: 'date-picker',
  valueFormatter: {
    get: (val) => val ? dayjs(val) : null,      // formData -> 组件显示
    set: (val) => val ? dayjs(val).format('YYYY-MM-DD') : null,  // 组件 -> formData
  } }
```

## useTable -- 表格实例

```ts
const table = useTable<SearchParams, User>({
  columns: [{ dataIndex: 'name', title: '姓名', width: 120 }],
  dataSource: [],
  pageParam: { current: 1, pageSize: 10, total: 0 },   // 默认值
  searchParam: { keyword: '', status: '' },
  searchFields: [                                        // 与 ProForm 同一套 Field[] 格式
    { path: 'keyword', component: 'input', label: '关键词' },
    { path: 'status', component: 'select', label: '状态', options: [...] },
  ],
});
```

返回 `Table` 实例：

| 成员                                                                  | 说明                                                   |
| :-------------------------------------------------------------------- | :----------------------------------------------------- |
| `table.columns`                                                       | 列配置（Ref）                                          |
| `table.dataSource`                                                    | 表格数据源（Ref）                                      |
| `table.pageParam`                                                     | 分页参数（reactive）：`current` / `pageSize` / `total` |
| `table.searchForm`                                                    | 搜索表单实例（Form 类型，所有 useForm 方法可用）       |
| `table.setColumn` / `deleteColumn` / `appendColumn` / `prependColumn` | 列增删改查（用法同 setField）                          |
| `table.setPageParam(patch)`                                           | 设置分页参数                                           |
| `table.resetQueryParams()`                                            | 重置分页到第一页 + 恢复搜索条件到初始值                |

## ProTable -- 配置驱动表格

**关键：ProTable 透传所有 antdv-next TableProps**（`& TableProps`），可直接写 `row-key` / `bordered` / `scroll` / `row-selection` 等原生属性；`size`、`loading` 是 v-model。

| prop               | 说明                                                            |
| :----------------- | :-------------------------------------------------------------- |
| `table`            | useTable 实例                                                   |
| `search`           | 数据查询方法 `() => Promise`，ProTable 内部调用它（非自动触发） |
| `addIndexColumn`   | 首列插入 index 列                                               |
| `immediateSearch`  | onMounted 时立即触发一次 search                                 |
| `control`          | 是否显示 size/列控制按钮，可 `{sizeControl, columnControl}`     |
| `searchFormConfig` | 搜索栏配置，含 `hidden`（隐藏搜索区）、`container`              |
| `tableContainer`   | 表格区容器                                                      |

**数据流**：搜索->重置分页到第 1 页->调 `search()`；分页/排序变化->更新 `pageParam`->调 `search()`；重置->`resetQueryParams()`->调 `search()`。

## Column -- 列配置

继承 antdv-next `ColumnType`，**所有原生列属性可用**（`title` / `width` / `fixed` / `align` / `customRender` / `ellipsis`…）。新增：

- `dataIndex`：列数据路径（主用），类型安全，支持 `'name'` / `'address.city'` / `['address','city']`
- `key`：辅助标识（dataIndex 不满足时用，优先级更低）
- `hidden`：隐藏该列（配合列控制）

## ProTable 最小示例

```vue
<script setup lang="ts">
import { ProTable, useTable } from '@qin-ui/antdv-next-pro';
interface User {
  id: number;
  name: string;
  status: string;
}
interface Search {
  keyword: string;
}

const table = useTable<Search, User>({
  columns: [
    { dataIndex: 'name', title: '姓名', width: 120 },
    { dataIndex: 'status', title: '状态' },
  ],
  searchFields: [{ path: 'keyword', component: 'input', label: '关键词' }],
});

const fetchData = async () => {
  // 组装查询参数：搜索条件 + 分页
  const res = await api.list({
    ...table.searchForm.formData,
    ...table.pageParam,
  });
  table.dataSource.value = res.data;
  table.setPageParam({ total: res.total });
};
</script>
<template>
  <ProTable :table="table" :search="fetchData" row-key="id" immediate-search />
</template>
```

## 响应式联动（三种模式，选最简的）

```ts
disabled: computed(() => !form.formData.enabled),   // A 声明式，初始化时已知（首选）
const isDisabled = ref(false);                        // B 外部共享状态
form.setField('limitCount', { disabled: true });      // C 命令式，事件驱动
```

> **不支持响应式**（不能包 ref/computed）的属性：`component` / `formItemContainer` / `componentContainer` / `valueFormatter` / `fields` / `slots` / `modelProp`。

## 反模式

- ❌ 在 `<ProForm>` 内手写 `<a-form-item>` -- ProForm 从 Field 配置自动渲染。
- ❌ 猜透传属性名 -- 先查 antdv-next.com。
- ❌ 把 `span` 当输入控件属性。
- ❌ 传 SFC 给 `component` 不用 `markRaw`。
- ❌ 在 ProTable 上忘了传 `:search`，或期望它自动请求 -- 查询由你提供并驱动。

## 按需深查

- `node_modules/@qin-ui/antdv-next-pro/api.json` -- 结构化 API 元数据（函数签名、参数、类型）。
- `node_modules/@qin-ui/antdv-next-pro/README.md` -- 完整用法与进阶示例。
- 底层 antdv-next 组件属性查阅官方文档：https://antdv-next.com （官方还提供 `llms.txt` 与 Agent Skills，可一并加载）。
