# @qin-ui/element-plus-pro — AI 上下文

基于 **element-plus**（Vue 3，el- 前缀）的 Schema 驱动高级组件库。用 JS 对象描述 UI，而非模板堆砌组件标签。

---

## 1. 架构概览

### 1.1 三层架构

```
┌─────────────────────────────────────────────────┐
│  Field[] 配置层（用户编写的 JS 对象）             │
│  { path:'name', component:'input', span:8, ... } │
├─────────────────────────────────────────────────┤
│  @qin-ui/element-plus-pro（Schema 解析 + 组件解析）│
│  属性分层剥离 → Grid→el-col, FormItem→el-form-item, 剩余→输入控件 │
├─────────────────────────────────────────────────┤
│  element-plus（Vue 3 组件库，el- 前缀）           │
│  el-input / el-select / el-date-picker / el-table ...│
└─────────────────────────────────────────────────┘
```

ProForm/ProTable 是**渲染引擎**，不是组件库。Field 属性被逐层剥离，分发到不同层级的 el-\* 组件。

### 1.2 内置组件映射表

| Field `component`  | 渲染的 el 组件    | 子类型（`type`）                                                                   | 常用透传 Props（示例）                                                                    |
| :----------------- | :---------------- | :--------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------- |
| `'input'`          | el-input          | textarea, password                                                                 | placeholder, maxlength, clearable, showWordLimit, showPassword, autosize                  |
| `'input-number'`   | el-input-number   | —                                                                                  | min, max, step, precision, controls, placeholder                                          |
| `'autocomplete'`   | el-autocomplete   | —                                                                                  | placeholder, clearable, fetchSuggestions, triggerOnFocus                                  |
| `'select'`         | el-select         | —                                                                                  | **options**, multiple, filterable, clearable, allowCreate, loading, remote, remoteMethod  |
| `'cascader'`       | el-cascader       | —                                                                                  | **options**, props, filterable, clearable, showAllLevels                                  |
| `'date-picker'`    | el-date-picker    | date, daterange, datetime, datetimerange, week, month, monthrange, year, yearrange | format, valueFormat, disabledDate, clearable, startPlaceholder, endPlaceholder, shortcuts |
| `'time-picker'`    | el-time-picker    | —                                                                                  | format, clearable, isRange, startPlaceholder, endPlaceholder                              |
| `'time-select'`    | el-time-select    | —                                                                                  | start, end, step, clearable, minTime, maxTime                                             |
| `'checkbox-group'` | el-checkbox-group | —                                                                                  | **options**, min, max, disabled                                                           |
| `'radio-group'`    | el-radio-group    | —                                                                                  | **options**, disabled, size                                                               |
| `'switch'`         | el-switch         | —                                                                                  | activeText, inactiveText, activeValue, inactiveValue, loading, size                       |
| `'slider'`         | el-slider         | —                                                                                  | min, max, step, showStops, range, marks                                                   |
| `'tree-select'`    | el-tree-select    | —                                                                                  | **data**, filterable, clearable, checkStrictly, props, multiple, showCheckbox             |
| `'transfer'`       | el-transfer       | —                                                                                  | **data**, **titles**, filterable, filterMethod, props                                     |
| `'custom'`         | 自定义            | —                                                                                  | component 直接传入 Vue 组件或 h() 渲染函数                                                |

> **编写任何控件属性前，必须查阅 [element-plus 官方文档](https://element-plus.org/) 确认属性名和类型。**

---

## 2. 属性分层传递（核心规则）

Field 属性按渲染目标逐层剥离：

```
<el-col :span="8">              <!-- Grid 层 -->
  <el-form-item label="城市">    <!-- FormItem 层 -->
    <el-select v-model="..." placeholder="选择" />  <!-- 输入控件层 -->
  </el-form-item>
</el-col>
```

**Grid 层 → `<el-col>`**（仅 grid 启用时）：`span`, `offset`, `push`, `pull`, `xs`, `sm`, `md`, `lg`, `xl`

**FormItem 层 → `<el-form-item>`**：`label`, `rules`, `error`, `required`, `size`, `showMessage`, `inlineMessage`, `labelWidth`；`formItemClass`/`formItemStyle`→`class`/`style`；`formItemDataAttrs`→`data-*`

**输入控件层 → 输入组件**：其余所有属性（`disabled`, `placeholder`, `clearable`, `options`, `filterable`, `maxlength`, `multiple` 等）；`componentClass`/`componentStyle`→`class`/`style`；`componentDataAttrs`→`data-*`

**渲染逻辑消费（不绑定 DOM）**：`component`, `fields`, `hidden`, `slots`, `modelProp`, `valueFormatter`, `componentContainer`, `extraProps`

### 2.1 modelProp

决定 `v-model:xxx` 的绑定变量名：

- 默认 `modelProp: 'modelValue'` → `v-model`（element-plus 惯例）
- **ProComponentProvider 已为 `switch` 预设 `modelProp: 'modelValue'`**，通常无需手动指定
- 自定义场景：`modelProp: 'visible'` → `v-model:visible`

### 2.2 element-plus 命名约定

- 使用 `clearable`（不是 `allowClear`）
- el-form-item 插槽为 `label` 和 `error`；其他 slot key 透传到底层输入组件（如 el-input 的 `prefix`/`suffix`/`append`/`prepend`）

---

## 3. 渐进式用法

### 第一阶段：基础渲染

完全依赖 Field 配置，**禁止手写 `<el-form-item>` 或 `<el-input>`**。

```ts
const form = useForm({ username: '', password: '' }, [
  {
    path: 'username',
    component: 'input',
    label: '用户名',
    placeholder: '请输入',
    rules: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  },
  {
    path: 'password',
    component: 'input',
    type: 'password',
    label: '密码',
    rules: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  },
]);
// 模板：<ProForm :form="form" />
```

### 第二阶段：字段联动

`disabled`, `hidden`, `rules` 等控制属性支持三种方式：

```ts
// computed() — 声明式，初始化联动首选
disabled: computed(() => !form.formData.hasLimit),

// ref() — 外部共享状态
const isDisabled = ref(false);

// setField() — 运行时命令式
form.setField('limitCount', { disabled: true });
```

**选择：初始化联动→`computed()`；事件触发→`setField()`；共享状态→`ref()`。**

### 第三阶段：自定义组件

```ts
// h() 挂载自定义组件
{ path: 'key', component: (p, ctx) => h(CustomInput, { ...p, ...ctx.attrs }) }
```

```html
<!-- 同名插槽接管渲染，scoped 内置所有绑定参数 -->
<ProForm :form="form">
  <template #agreement="scoped">
    <el-checkbox v-bind="scoped">阅读并同意协议</el-checkbox>
  </template>
</ProForm>
```

---

## 4. 反模式

```html
<!-- ❌ 禁止在 ProForm 内手写 el-form-item -->
<ProForm :form="form">
  <el-form-item label="姓名"
    ><el-input v-model="form.formData.name"
  /></el-form-item>
</ProForm>
```

```ts
// ❌ 不查文档盲目猜测 — element-plus 用 filterable，不是 searchable
{ path: 'city', component: 'select', searchable: true }
// ✅ 查 element-plus 文档确认后
{ path: 'city', component: 'select', filterable: true }

// span→Grid 层(el-col)；placeholder→控件层(el-input)
{ path: 'name', component: 'input', span: 12, placeholder: '请输入' }
```

---

## 5. ProComponentProvider：全局默认配置

统一配置子组件默认属性，避免逐字段重复。

### INJECT_CONFIG 预设默认值

| 组件                          | 预设默认值                                                                                                                                                                                                                         |
| :---------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `switch`                      | `{ modelProp: 'modelValue' }`                                                                                                                                                                                                      |
| `input`                       | `{ maxlength: 100, clearable: true, placeholder: '请输入' }`                                                                                                                                                                       |
| `input.textarea`              | `{ maxlength: 200, autosize: {minRows:3,maxRows:6}, showWordLimit: true, clearable: true, placeholder: '请输入' }`                                                                                                                 |
| `input.password`              | `{ maxlength: 100, clearable: true, showPassword: true, placeholder: '请输入' }`                                                                                                                                                   |
| `select` / `cascader`         | `{ clearable: true, placeholder: '请选择' }`                                                                                                                                                                                       |
| `input-number`                | `{ max: 10^15-1, min: -(10^15+1), controls: false, placeholder: '请输入', style: {width:'100%'} }`                                                                                                                                 |
| `date-picker` 系列            | `{ style: {width:'100%'} }` + 各子类型专用占位符                                                                                                                                                                                   |
| `time-picker` / `time-select` | `{ style: {width:'100%'}, placeholder: '请选择' }`                                                                                                                                                                                 |
| `tree-select`                 | `{ clearable: true, placeholder: '请选择' }`                                                                                                                                                                                       |
| `pro-table`                   | `{ pagination: {layout:'total,sizes,prev,pager,next,jumper',pageSizes:[10,20,30,40,50,100],background:true}, searchFormConfig: {layout:'grid',expand:{minExpandRows:2,expandStatus:false}}, control: true, addIndexColumn: true }` |
| `pro-form`                    | `{ grid: { gutter: 24 } }`                                                                                                                                                                                                         |
| `pro-form-item`               | `{ span: 8 }`                                                                                                                                                                                                                      |

### 优先级（高→低）

1. Field 级别配置
2. `ProComponentProvider` 的 `componentVars` 参数
3. `INJECT_CONFIG` 内置预设

### 覆盖示例

```vue
<template>
  <ProComponentProvider :component-vars="config">
    <ProForm :form="form" />
  </ProComponentProvider>
</template>
<script setup lang="ts">
const config = {
  'pro-form-item': { span: 6 },
  input: { maxlength: 200 },
  select: { filterable: true },
};
</script>
```

---

## 6. ProTable 速览

```ts
const table = useTable<any, Row>({
  columns: [
    { prop: 'id', label: 'ID', width: 80 },
    { prop: 'name', label: '姓名', width: 120 },
  ],
  // searchFields 与 ProForm fields 格式一致，支持相同分层剥离
  searchFields: [
    { path: 'name', component: 'input', placeholder: '搜索' },
    { path: 'status', component: 'select', options: [...] },
  ],
  data: [],
});
// 模板：<ProTable :table="table" :search="() => fetchData()" immediateSearch />
```

> element-plus Table Column 用 `prop`（非 `dataIndex`），数据源用 `data`（非 `dataSource`）。

---

## 7. 关键参考

1. **`node_modules/@qin-ui/element-plus-pro/api.json`** — 结构化 API 元数据
2. **`node_modules/@qin-ui/element-plus-pro/README.md`** — 完整文档和示例
3. **[https://element-plus.org/](https://element-plus.org/)** — 确认控件属性时必查
