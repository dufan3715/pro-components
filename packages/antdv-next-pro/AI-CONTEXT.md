# @qin-ui/antdv-next-pro — AI 上下文

> Schema-driven Vue 3 高级组件库，基于 antdv-next。用 JavaScript 对象描述 UI，而非在模板中堆砌组件标签。

---

## 1. 架构概览

### 1.1 三层架构

```
┌─────────────────────────────────────────────────┐
│  Field[] 配置层（用户编写的 JS 对象）              │
├─────────────────────────────────────────────────┤
│  @qin-ui/antdv-next-pro（Schema 解析 + 属性分层）  │
│  逐层剥离 → Grid→a-col, FormItem→a-form-item,     │
│  剩余属性→输入控件                                  │
├─────────────────────────────────────────────────┤
│  antdv-next（Vue 3 组件库）                        │
│  a-input / a-select / a-date-picker / a-table ... │
└─────────────────────────────────────────────────┘
```

ProForm/ProTable 是**渲染引擎**，不是组件库。Field 属性被逐层剥离分发到不同层级的 antdv-next 组件。

### 1.2 组件解析链

```
Field.component  →  componentMap[component]  →  antdv-next 组件
  'input'         →  Input          (a-input)
  'select'        →  Select         (a-select)
  'switch'        →  Switch         (a-switch)
  'custom'        →  VueComponent   (直接渲染)
  'my-custom'     →  ProComponentProvider 注入的自定义组件
```

### 1.3 内置组件映射表

| component           | antdv-next 组件 | 常用输入控件层透传 Props                                               |
| :------------------ | :-------------- | :--------------------------------------------------------------------- |
| `input`             | Input           | placeholder, maxlength, allowClear, addonBefore, addonAfter, showCount |
| `textarea`          | TextArea        | rows, maxlength, showCount, autoSize                                   |
| `input-password`    | InputPassword   | placeholder, maxlength, visibilityToggle                               |
| `input-otp`         | InputOTP        | length, mask, separator                                                |
| `input-search`      | InputSearch     | placeholder, loading, onSearch                                         |
| `input-number`      | InputNumber     | min, max, step, precision, formatter, parser                           |
| `select`            | Select          | **options**, mode, showSearch, allowClear, maxTagCount, loading        |
| `auto-complete`     | AutoComplete    | **options**, filterOption, allowClear                                  |
| `cascader`          | Cascader        | **options**, fieldNames, showSearch, expandTrigger                     |
| `date-picker`       | DatePicker      | picker, format, showTime, disabledDate, allowClear                     |
| `range-picker`      | RangePicker     | format, showTime, disabledDate, allowClear                             |
| `time-picker`       | TimePicker      | format, showSecond, allowClear, hourStep                               |
| `time-range-picker` | TimeRangePicker | format, allowClear                                                     |
| `checkbox-group`    | CheckboxGroup   | **options**, direction                                                 |
| `radio-group`       | RadioGroup      | **options**, direction, buttonStyle                                    |
| `switch`            | Switch          | checkedChildren, unCheckedChildren, loading                            |
| `slider`            | Slider          | min, max, step, marks, range, tooltip                                  |
| `tree-select`       | TreeSelect      | **treeData**, showSearch, treeCheckable                                |
| `transfer`          | Transfer        | **dataSource**, **titles**, **targetKeys**, showSearch                 |
| `custom`            | 自定义          | component 传入 Vue 组件或 h() 渲染函数                                 |

> **写任何输入控件属性前，必须查阅 [antdv-next 文档](https://antdv-next.com/llms-full-cn.txt) 确认属性名和类型。**

---

## 2. 属性分层传递（核心规则）

Field 属性逐层剥离，分发到渲染树的不同目标：

```html
<a-col :span="8">
  <a-form-item label="城市" :rules="[...]">
    <a-select placeholder="选择" :options="[...]" />
  </a-form-item>
</a-col>
```

### 属性归属

**Grid 层 → `<a-col>`**（仅 grid 启用时生效）
`span`, `order`, `offset`, `push`, `pull`, `flex`, `xs`, `sm`, `md`, `lg`, `xl`, `xxl`

**FormItem 层 → `<a-form-item>`**
`label`, `rules`, `colon`, `labelAlign`, `labelCol`, `wrapperCol`, `tooltip`, `extra`, `help`, `validateFirst`, `validateTrigger`, `valuePropName`, `normalize`, `formItemClass`, `formItemStyle`, `formItemContainer`, `formItemDataAttrs`

**输入控件层 → 输入组件**
其余所有属性（`disabled`, `placeholder`, `allowClear`, `options`, `showSearch`, `maxlength`, `mode`, `componentDataAttrs`, `componentClass`, `componentStyle` 等）

**ProForm 消费（不绑定 DOM）：** `component`, `fields`, `hidden`, `slots`, `modelProp`, `valueFormatter`, `componentContainer`, `extraProps`

### modelProp

决定 `v-model:xxx` 绑定变量名：

- 默认 `'value'` → `v-model:value`
- Switch/Checkbox 使用 `'checked'`
- **ProComponentProvider 已为 `switch` 预设 `modelProp: 'checked'`**，通常无需手动指定

---

## 3. 渐进式用法

### 第一阶段：配置驱动

**禁止在模板中手写 `<a-form-item>` 或 `<a-input>`。**

```typescript
import { ProForm, useForm } from '@qin-ui/antdv-next-pro';

const form = useForm({ username: '', password: '' }, [
  {
    path: 'username',
    component: 'input',
    label: '用户名',
    placeholder: '请输入用户名',
    rules: [{ required: true, message: '请输入' }],
  },
  {
    path: 'password',
    component: 'input-password',
    label: '密码',
    placeholder: '请输入密码',
    rules: [{ required: true, message: '请输入' }],
  },
]);
```

```html
<template>
  <ProForm :form="form" />
</template>
```

### 第二阶段：字段联动

`disabled`、`hidden`、`rules` 等控制属性支持多种联动方式：

```typescript
import { computed, ref } from 'vue';

const form = useForm({ hasLimit: false, limitCount: undefined }, [
  { path: 'hasLimit', component: 'switch', label: '开启限制' },
  {
    path: 'limitCount',
    component: 'input-number',
    label: '限制次数',
    // 方式一：computed() — 声明式，推荐用于初始化时已知的联动
    disabled: computed(() => !form.formData.hasLimit),
    rules: computed(() => [
      { required: form.formData.hasLimit, message: '请输入' },
    ]),
  },
]);

// 方式二：ref() — 适合外部状态控制
const isDisabled = ref(false); // disabled: isDisabled

// 方式三：setField() — 命令式，适合运行时事件触发
form.setField('limitCount', { disabled: true });
```

**选择：** 初始化联动 → `computed()`；运行时事件 → `setField()`；外部共享状态 → `ref()`。代码越简单越好。

### 第三阶段：自定义扩展

```typescript
import { h } from 'vue';

const form = useForm({ agreement: false }, [
  {
    path: 'agreement',
    component: (p, ctx) => h(MyCheckbox, { ...p, ...ctx.attrs }),
    modelProp: 'checked',
    rules: [
      {
        validator: (_, val) =>
          val ? Promise.resolve() : Promise.reject('请同意'),
      },
    ],
  },
]);
```

```html
<ProForm :form="form">
  <!-- 同名插槽接管渲染，scoped 内置 value/checked 等绑定参数 -->
  <template #agreement="scoped">
    <a-checkbox v-bind="scoped">同意协议</a-checkbox>
  </template>
</ProForm>
```

---

## 4. 反模式

```ts
// ❌ 不要手写 a-form-item — ProForm 自动渲染
// ❌ 不要猜测属性名 — 必须查阅 antdv-next 文档
{ path: 'city', component: 'select', searchable: true }    // 错：Select 没有 searchable
{ path: 'city', component: 'select', showSearch: true }     // 对：查阅文档后使用 showSearch

// ❌ path 必须精确对应 formData 中的键名，否则数据/校验丢失
// ✅ 联动优先用 computed()，运行时用 setField()，不要过度设计
```

---

## 5. ProComponentProvider：全局默认配置

应用顶层统一配置所有子组件默认属性。

**INJECT_CONFIG 预设默认值：**

| 组件                                      | 预设默认值                                                                                                                              |
| :---------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| `switch`                                  | `{ modelProp: 'checked' }`                                                                                                              |
| `input`                                   | `{ maxlength: 100, allowClear: true, placeholder: '请输入' }`                                                                           |
| `textarea`                                | `{ maxlength: 200, autoSize: {minRows:3,maxRows:6}, showCount: true, allowClear: true, placeholder: '请输入' }`                         |
| `select` / `cascader` / `auto-complete`   | `{ allowClear: true, placeholder: '请选择', getPopupContainer }`                                                                        |
| `input-number`                            | `{ max: 10^15, min: -(10^15), controls: false, placeholder: '请输入', style: {width:'100%'} }`                                          |
| `date-picker` / `range-picker` / `time-*` | `{ allowClear: true, getPopupContainer, style: {width:'100%'} }`                                                                        |
| `pro-table`                               | `{ pagination: {showTotal, showSizeChanger, showQuickJumper}, searchFormConfig: {layout:'grid'}, control: true, addIndexColumn: true }` |
| `pro-form`                                | `{ grid: { gutter: {xs:8, sm:16, md:16, lg:24} } }`                                                                                     |
| `pro-form-item`                           | `{ validateFirst: true, span: 8 }`                                                                                                      |

**优先级：** Field 级别配置 > `componentVars` > `INJECT_CONFIG` 预设

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
  'pro-form-item': { validateFirst: true, span: 6 },
  input: { maxlength: 200 },
  select: { showSearch: true },
  'pro-table': { addIndexColumn: false },
};
</script>
```

---

## 6. ProTable 速览

```vue
<script setup lang="ts">
import { ProTable, useTable } from '@qin-ui/antdv-next-pro';

type Row = { id: number; name: string; status: string };

const table = useTable<Row>({
  columns: [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '姓名', dataIndex: 'name', width: 120 },
    { title: '状态', dataIndex: 'status', width: 100 },
  ],
  // searchFields 格式与 ProForm fields 完全一致，支持相同的分层剥离机制
  searchFields: [
    { path: 'name', component: 'input', placeholder: '搜索姓名' },
    { path: 'status', component: 'select', options: [...], placeholder: '状态' },
  ],
});

// searchForm 是 ProForm 实例，可使用所有表单方法
table.searchForm.setField('name', { placeholder: '请输入' });
</script>

<template>
  <ProTable
    :table="table"
    :search="() => fetchData()"
    addIndexColumn
    immediateSearch
  />
</template>
```

---

## 7. 参考

按优先级查阅：

1. **`node_modules/@qin-ui/antdv-next-pro/api.json`** — 结构化 API 元数据（函数签名、类型定义、JSDoc 示例）
2. **`node_modules/@qin-ui/antdv-next-pro/README.md`** — 完整使用文档和代码示例
3. **`https://antdv-next.com/llms-full-cn.txt`** — antdv-next 全部组件 API（确认输入控件层属性时必查）
4. **`https://antdv-next.com/llms-semantic-cn.md`** — antdv-next 组件语义化 DOM 结构（自定义样式时必查）
