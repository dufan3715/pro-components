# @qin-ui/vant-pro — AI 上下文

> Schema-driven高级表单组件库，基于 **vant v4**（Vue 3 移动端UI，`van-` 前缀）。
> 核心思想：用 JS 对象描述 UI，而非在模板中堆砌组件标签。

---

## 1. 三层架构

```
Field[] 配置层（用户编写的 JS 对象）
  { path:'city', component:'picker', label:'城市', columns:[...], popup:true }
        ↓
@qin-ui/vant-pro（Schema 解析 + 属性分层剥离）
  van-field 属性 → <van-field> / 其余属性 → 内部输入控件
        ↓
vant v4（Vue 3 移动端组件库）
  van-field / van-picker / van-switch / van-stepper / ...
```

ProForm 是**渲染引擎**，不是组件库。所有 UI 来自 vant。Field 配置的属性被**逐层剥离**，分发到 `van-field`（容器）和内部控件。

### 组件映射表（componentMap，15 个内置组件）

| Field `component`  | 渲染的 vant 组件 | 备注                                         |
| :----------------- | :--------------- | :------------------------------------------- |
| `'field'`          | Field            | **特殊：直接渲染 van-field，无内部控件包裹** |
| `'switch'`         | Switch           | v-model 绑定 `modelValue`（vant 默认约定）   |
| `'stepper'`        | Stepper          |                                              |
| `'rate'`           | Rate             |                                              |
| `'slider'`         | Slider           |                                              |
| `'uploader'`       | Uploader         |                                              |
| `'checkbox-group'` | CheckboxGroup    |                                              |
| `'radio-group'`    | RadioGroup       |                                              |
| `'picker'`         | Picker           | 常用 popup 模式（底部弹出）                  |
| `'date-picker'`    | DatePicker       | 常用 popup 模式                              |
| `'time-picker'`    | TimePicker       | 常用 popup 模式                              |
| `'cascader'`       | Cascader         | 常用 popup 模式                              |
| `'area'`           | Area             | 常用 popup 模式                              |
| `'signature'`      | Signature        | 常用 popup 模式                              |
| `'button'`         | Button           |                                              |
| `'custom'`         | 自定义           | 传入 Vue 组件或 h() 渲染函数                 |

> **编写任何输入控件属性前，必须查阅 [vant v4 官方文档](https://vant-ui.com/) 确认属性名和类型。**

---

## 2. 属性分层传递机制

Field 配置的属性**逐层剥离**，分发到两个目标：

**van-field 容器层（fieldAttrs）：**
`label`, `rules`, `required`, `clearable`, `inputAlign`, `errorMessageAlign`, `colon`, `readonly`, `clickable`, `isLink`, `labelWidth`, `labelAlign`, `labelClass`, `error`, `center`, `border`, `autosize`, `type`, `maxlength`, `placeholder`, `rows`，以及所有 `on*` 事件回调。`fieldClass`/`fieldStyle` → `class`/`style` 绑定到 van-field。

**内部控件层（bindAttrs）：**
除上述外的其余属性（`columns`, `options`, `activeValue`, `min`, `max`, `step`, `count`, `size`, `direction`, `disabled` 等）。`componentClass`/`componentStyle` → 内部组件的 `class`/`style`。

**剥离逻辑：**

- 第一阶段（GroupedFieldAttrs）：解构 `path`, `fields`, `hidden`, `extraProps` → 剩余 → `componentProps` → BaseField
- 第二阶段（BaseField）：解构 `valueFormatter`, `displayFormatter`, `modelProp`, `slots`, `popup` 等 → 匹配 vant Field.props 的属性 + `on*` → `fieldAttrs` → van-field；其余 → `bindAttrs` → 内部控件

**`'field'` 特殊：** `component: 'field'` 直接渲染 van-field，无内部控件包裹，所有属性绑定到 van-field。

### modelProp

默认 `modelProp: 'modelValue'` → `v-model:modelValue`（vant 组件统一使用 `modelValue` 作为 v-model 绑定属性名）。

---

## 3. 渐进式用法

### 3.1 基础渲染

完全依赖 Field 配置，**禁止手写 `<van-field>` 或 `<van-switch>`**。

```ts
import { ProForm, useForm } from '@qin-ui/vant-pro';
const form = useForm({ username: '', password: '' }, [
  {
    path: 'username',
    component: 'field',
    label: '用户名',
    placeholder: '请输入用户名',
    rules: [{ required: true }],
  },
  {
    path: 'password',
    component: 'field',
    label: '密码',
    type: 'password',
    rules: [{ required: true }],
  },
]);
```

```html
<template><ProForm :form="form" /></template>
```

### 3.2 字段联动

初始化联动用 `computed()`，运行时联动用 `setField()`，外部状态用 `ref()`。**越简单越好：**

```ts
// computed() — 初始化时已确定的联动
disabled: computed(() => !form.formData.enabled);

// setField() — 事件触发时动态修改
form.setField('limitCount', { disabled: true });
```

### 3.3 自定义组件

```ts
// h() 挂载或插槽接管
component: (p, ctx) => h(CustomPicker, { ...p, ...ctx.attrs }),
```

```html
<ProForm :form="form">
  <template #city="scoped"><CustomPicker v-bind="scoped" /></template>
</ProForm>
```

### 3.4 Popup 弹窗模式

Field 配置 `popup: true` 时：表单项以只读 van-field 展示，点击后底部弹出 Popup，内部控件在 Popup 中渲染。确认提交值，取消丢弃修改。`displayFormatter` 控制只读展示文本。

```ts
{ path: 'city', component: 'picker', label: '城市', columns: ['北京','上海'], popup: true, displayFormatter: (v) => v || '请选择' }
```

---

## 4. 反模式

- **禁止手写 van-field**：所有表单项通过 Field 配置驱动，ProForm 自动渲染 van-field
- **禁止猜测属性名**：编写组件属性前必须查 [vant 文档](https://vant-ui.com/)，vant 不使用 `allowClear`/`mode:'multiple'` 等第三方库命名
- **联动选简单方式**：初始化联动用 `computed()`，运行时用 `setField()`，避免过度设计

---

## 5. ProComponentProvider 全局默认配置

通过 `ProComponentProvider` 在应用顶层统一配置默认属性，避免重复。属性优先级：Field 级别 > componentVars > INJECT_CONFIG 预设。

### INJECT_CONFIG 预设默认值

| 组件         | 预设默认值                                                                                                                     |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------- |
| `pro-form`   | `{ inputAlign: 'right', errorMessageAlign: 'right', required: 'auto', scrollToError: true, scrollToErrorPosition: 'nearest' }` |
| `field`      | `{ clearable: true, placeholder: '请输入' }`                                                                                   |
| 其余所有组件 | `{}`（无预设，直接使用 vant 默认值）                                                                                           |

### componentVars 额外配置键

`valueFormatter`, `displayFormatter`, `componentContainer`, `modelProp`, `popup` — 可通过 ProComponentProvider 全局统一配置。

```vue
<ProComponentProvider
  :component-vars="{
    'pro-form': { inputAlign: 'left' },
    field: { clearable: false, placeholder: '请输入内容' },
    switch: { activeColor: '#07c160' },
    stepper: { integer: true, min: 0 },
  }"
>
  <ProForm :form="form" />
</ProComponentProvider>
```

---

## 6. 关键参考文件

1. **`node_modules/@qin-ui/vant-pro/api.json`** — 结构化 API 元数据（函数签名、类型定义、JSDoc）
2. **`node_modules/@qin-ui/vant-pro/README.md`** — 完整使用文档和代码示例
3. **`https://vant-ui.com/`** — vant v4 官方文档（确认组件属性时必查）
4. 源码类型定义 — `src/components/form/types/index.ts`（Field 类型）、`src/components/form/constants/index.ts`（componentMap）、`src/components/component-provider/constants/index.ts`（INJECT_CONFIG）
