# @qin-ui/vant-pro

> 基于 **Vant 4** 和 **Vue 3.x** 二次封装的移动端高级表单组件库，专门针对移动端 H5 精细化打造，助您极速构建交互流畅、配置驱动的移动端表单应用。

<p align="center">
  <img src="https://img.shields.io/badge/Vant-4.x-blue" alt="Vant 4.x" />
  <img src="https://img.shields.io/badge/Vue-3.5%2B-brightgreen" alt="Vue 3.5+" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT" />
</p>

## 📝 [使用示例和文档详细内容](https://dufan3715.github.io/pro-components/)

---

## ✨ 特性

- 🛡️ 基于 **Vant 4+** 封装，支持 Vue 3.5+
- 🔥 提供 **ProForm** 高级表单组件，通过配置即可快速生成移动端表单
- 📱 移动端优先，内置 **Popup 弹窗表单**支持（Picker、DatePicker、Area 等）
- ⚙️ 通过 JSON 配置动态生成表单字段，支持字段联动与嵌套分组
- 🧩 支持自定义组件扩展，灵活应对复杂业务场景
- 🎨 提供 **ProComponentProvider** 统一管理组件全局默认属性
- 📐 完善的 TypeScript 类型推导，提供极致开发体验

> 本包是移动端表单库，**仅提供 ProForm + ProComponentProvider**，不含 ProTable。

---

## 📦 安装

确保已安装 `vant` (v4+) 和 `vue` (v3.5+)：

```bash
npm i @qin-ui/vant-pro
# 或
pnpm add @qin-ui/vant-pro
```

> 注意：`@qin-ui/vant-pro` 将 `vant` 和 `vue` 作为 peerDependencies，需自行安装。

---

## 🤖 AI 辅助开发

本项目内置 AI 上下文初始化工具。安装后在项目根目录执行：

```bash
npx @qin-ui/vant-pro init-ai
```

将在项目中生成双载体 AI 上下文，使 Cursor / Claude Code / Codex 等 AI 工具深度理解本库的 Schema 驱动用法与属性透传规则：

- `AGENTS.md` - 核心使用规则（跨工具开放约定，会话时自动注入，AI 默认加载）
- `.agents/skills/vant-pro.md` - 完整 API 参考（支持 skills 发现的工具按需调取）

> 生成的 `AGENTS.md` 使用标记区块写入，重复执行 `init-ai` 可安全更新，不影响项目内其他库的指令。建议将生成的文件提交到 Git 仓库，团队共享 AI 上下文。

---

## 🚀 快速开始

### 全局注册

```typescript
import { createApp } from 'vue';
import Vant from 'vant';
import 'vant/lib/index.css';
import VantPro from '@qin-ui/vant-pro';
import App from './App.vue';

const app = createApp(App);
app.use(Vant);
app.use(VantPro); // 全局注册 ProForm、ProComponentProvider
app.mount('#app');
```

### 按需引入（推荐）

```vue
<script setup lang="ts">
import { useForm, ProForm } from '@qin-ui/vant-pro';

type FormData = { name: string; age: number };

const form = useForm<FormData>({ name: '', age: 18 }, [
  {
    path: 'name',
    label: '姓名',
    component: 'field',
    placeholder: '请输入姓名',
    clearable: true,
  },
  {
    path: 'age',
    label: '年龄',
    component: 'stepper',
  },
]);
</script>

<template>
  <ProForm :form="form" />
</template>
```

---

## 🧱 属性分层透传（核心规则）

ProForm 是渲染引擎，所有真实 UI 来自 vant。vant 的结构是「`van-field` 容器 + 内部控件」**两层**（移动端没有桌面端的 Grid Col 层）。**Field 上的属性会被"剥离到这两层"，写错层就失效**：

```
<van-field label="城市" placeholder="选择">   ← van-field 容器层
  <van-picker :columns="[...]" />            ← 内部控件层
</van-field>
```

| 属性                                                                                                                                                                                                                                                                                          | 落到哪一层                          | 说明           |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------- | :------------- |
| `label` / `rules` / `required` / `clearable` / `inputAlign` / `errorMessageAlign` / `colon` / `readonly` / `clickable` / `isLink` / `labelWidth` / `labelAlign` / `labelClass` / `error` / `center` / `border` / `autosize` / `type` / `maxlength` / `placeholder` / `rows` + 所有 `on*` 事件 | `<van-field>` 容器层                | 表单项相关属性 |
| `columns` / `options` / `activeValue` / `min` / `max` / `step` / `count` / `size` / `direction` / `disabled` + 该控件其余 vant 原生属性                                                                                                                                                       | 内部输入控件本身（`van-picker` 等） | 其余全部       |
| `component` / `hidden` / `modelProp` / `valueFormatter` / `displayFormatter` / `fields` / `slots` / `popup` / `fieldContainer` / `componentContainer` / `extraProps`                                                                                                                          | ProForm 逻辑消费，**不绑到 DOM**    | 框架级属性     |

> **规则**：`label`/`rules`/`placeholder` 等表单项属性给 `van-field`，控件特有属性（如 picker 的 `columns`）给内部控件。`fieldClass`/`fieldStyle` 绑到 `van-field`，`componentClass`/`componentStyle` 绑到内部控件。
> 输入控件的具体属性名/类型请以 [vant 官方文档](https://vant-ui.com/) 为准（vant 用 `clearable` 不是 `allowClear`）。

---

## 📚 组件文档

### 1. ProComponentProvider

用于全局配置 Vant Pro 各组件的默认属性，通过 `component-vars` prop 传递，内部通过 `provide` / `inject` 下发配置给所有子组件。

#### 使用示例

```vue
<script setup>
import { ProComponentProvider } from '@qin-ui/vant-pro';
</script>

<template>
  <ProComponentProvider
    :component-vars="{
      field: { clearable: true, placeholder: '请选择' },
      'pro-form': { inputAlign: 'center', required: 'auto' },
    }"
  >
    <ProForm :form="form" />
  </ProComponentProvider>
</template>
```

#### Props

| 参数名         | 说明                        | 类型          | 默认值 |
| -------------- | --------------------------- | ------------- | ------ |
| component-vars | 需要 provide 到子组件的配置 | ComponentVars | -      |

#### 内置默认预设（INJECT_CONFIG）

ProComponentProvider 内置了一套默认属性预设，**即使不配置 `component-vars` 也会生效**。Field 配置优先级最高，会覆盖这些预设。vant 版预设极简，仅以下两项有默认值，其余内置组件均无预设：

| component  | 默认预设                                                                                                                                                         |
| :--------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pro-form` | `{ inputAlign: 'right', errorMessageAlign: 'right', required: 'auto', scrollToError: true, scrollToErrorPosition: 'nearest' }` -- 表单项右对齐、校验失败自动滚动 |
| `field`    | `{ clearable: true, placeholder: '请输入' }`                                                                                                                     |

> `modelProp` 默认 `'modelValue'`（vant 统一约定，即 `v-model:modelValue`）。

`ComponentVars` 支持为以下组件类型配置默认属性：`pro-form` / `field` / `switch` / `stepper` / `rate` / `slider` / `uploader` / `checkbox-group` / `radio-group` / `picker` / `date-picker` / `time-picker` / `cascader` / `area` / `signature` / `button`。

---

### 2. ProForm

ProForm 是基于 Vant Form 高级封装的移动端表单组件，通过配置式 `fields` 字段描述即可快速生成表单，无需编写大量模板代码。

#### 何时使用

- 需要通过 JSON 配置生成表单，而非编写大量模板代码
- 需要表单字段的嵌套分组与动态联动
- 需要移动端 Popup 弹窗式的字段选择（Picker、DatePicker、Area 等）
- 需要统一表单布局和样式

#### useForm Hook

`useForm` 是 ProForm 的核心 Hook，用于创建表单实例，管理表单数据与字段配置。

```typescript
import { useForm } from '@qin-ui/vant-pro';

const form = useForm<FormDataType>(initialData, fields, root?)
```

| 参数         | 说明             | 类型                        | 默认值 |
| ------------ | ---------------- | --------------------------- | ------ |
| `initData`   | 表单初始数据     | `DeepPartial<D>`            | -      |
| `initFields` | 表单字段配置     | `Field<ComponentName, D>[]` | -      |
| `root`       | 是否为根表单实例 | `boolean`                   | `true` |

**返回值 (Form 实例)**（`formData` 是 reactive 对象，不用 `.value`）：

| 属性/方法                      | 说明                                                                                          | 类型                             |
| :----------------------------- | :-------------------------------------------------------------------------------------------- | :------------------------------- |
| `formData`                     | 响应式表单数据对象，可直接读写，支持深层路径                                                  | `Reactive<D>`                    |
| `fields`                       | 响应式表单字段配置数组引用                                                                    | `Ref<Field[]>`                   |
| `formRef`                      | 底层 Vant Form 组件实例引用                                                                   | `Ref<FormInstance \| undefined>` |
| `getFormData(path)`            | 安全获取指定字段路径（支持深层 'a.b'）的数据值                                                | `(path?) => any`                 |
| `setFormData(path, val)`       | 安全更新指定路径的值，支持批量对象或函数式更新                                                | `(path, val) => void`            |
| `getField(path, opts?)`        | 获取指定 path 的字段配置，支持查找函数定位                                                    | `(path, opts) => Field`          |
| `setField(path, patch, opts?)` | 增量更新指定字段的配置参数（如 label、hidden 等），支持 merge 或 rewrite 更新                 | `(path, patch, opts) => void`    |
| `deleteField(path)`            | 删除特定 path 的表单字段配置                                                                  | `(path) => void`                 |
| `appendField(path, field)`     | 在指定字段 path 后面动态追加新字段                                                            | `(path, field) => void`          |
| `prependField(path, field)`    | 在指定字段 path 前面动态插入新字段                                                            | `(path, field) => void`          |
| `getParentField(path)`         | 查找获取当前子字段的父级配置项，一级字段返回虚拟根容器                                        | `(path) => Field`                |
| `formPopup`                    | **vant 独有**：弹窗管理对象，`open(path)` / `close()` / `visible` / `props` / `updateProps()` | `FormPopup`                      |

> 校验与重置通过 `formRef` 调用 vant 原生方法：`form.formRef.value?.validate()`、`form.formRef.value?.resetValidation()`。

#### useFormPopup

`useForm` 内部已集成 `useFormPopup`（即 `form.formPopup`），用于控制 Popup 弹窗的开关与配置。也可独立使用：

```typescript
import { useFormPopup } from '@qin-ui/vant-pro';

const formPopup = useFormPopup(true);
formPopup.open('fieldName'); // 打开弹窗
formPopup.close(); // 关闭弹窗
formPopup.updateProps({ position: 'top' }); // 更新弹窗属性
```

| 属性/方法         | 说明                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `props`           | Popup 的 props（reactive，默认 `{ position:'bottom', round:true, safeAreaInsetBottom:true }`） |
| `visible`         | 弹窗是否可见（computed）                                                                       |
| `popupFieldPath`  | 当前打开的字段路径（ref）                                                                      |
| `popupFieldValue` | 当前弹窗字段的值（ref）                                                                        |
| `open(path)`      | 打开指定字段的弹窗                                                                             |
| `close()`         | 关闭弹窗                                                                                       |
| `updateProps()`   | 更新弹窗属性                                                                                   |

#### Props

| 参数名 | 说明                     | 类型 | 默认值 |
| ------ | ------------------------ | ---- | ------ |
| `form` | `useForm` 返回的表单实例 | Form | -      |

同时继承 Vant [Form Props](https://vant-ui.com/) 的所有属性。不传递 `form` prop 时，ProForm 内部会自行创建一个表单实例。

#### 字段配置（Field）

每个字段支持的配置项如下：

| 属性名               | 说明                               | 类型                             | 默认值    |
| -------------------- | ---------------------------------- | -------------------------------- | --------- |
| `path`               | 字段路径，对应表单数据中的属性名   | `Path<D>`                        | -         |
| `label`              | 字段标签，支持字符串或插槽组件     | `SlotComponentType`              | -         |
| `component`          | 字段组件类型，见下方支持列表       | `ComponentName`                  | `'field'` |
| `hidden`             | 是否隐藏字段，支持响应式           | `MaybeRef<boolean>`              | `false`   |
| `disabled`           | 是否禁用字段，支持响应式           | `MaybeRef<boolean>`              | `false`   |
| `required`           | 是否必填                           | `boolean`                        | -         |
| `placeholder`        | 占位提示文字                       | `string`                         | -         |
| `clearable`          | 是否可清空                         | `boolean`                        | -         |
| `fields`             | 嵌套子字段（用于分组）             | `Field[]`                        | -         |
| `valueFormatter`     | 值格式化器（输入转换）             | `ValueFormatter`                 | -         |
| `displayFormatter`   | 展示格式化器（Popup 字段回显文字） | `DisplayFormatter`               | -         |
| `componentContainer` | 字段组件外层包裹容器               | `ContainerComponent`             | -         |
| `fieldContainer`     | 嵌套字段的外层包裹容器             | `ContainerComponent`             | -         |
| `componentStyle`     | 字段组件样式                       | `CSSProperties`                  | -         |
| `componentClass`     | 字段组件类名                       | `any`                            | -         |
| `fieldStyle`         | 字段外层样式                       | `CSSProperties`                  | -         |
| `fieldClass`         | 字段外层类名                       | `any`                            | -         |
| `modelProp`          | 自定义组件 v-model 绑定的属性名    | `string`                         | -         |
| `popup`              | 是否以 Popup 弹窗形式展示该字段    | `boolean \| Partial<PopupProps>` | `false`   |
| `slots`              | 字段插槽配置                       | `Slots`                          | -         |

##### `valueFormatter` 字段值转换

控制表单值与组件值之间的转换（如 Picker 的数组与字符串互转）。在 `onUpdate:modelValue` 之前执行，支持两种形态：

```ts
// 函数形态：(新值, 旧值) => 转换后的值，写回 formData
{ path: 'name', component: 'field', valueFormatter: (val, oldVal) => val?.trim() }

// 对象形态：get 读出时转换，set 写入时转换
{
  path: 'tags',
  component: 'picker',
  valueFormatter: {
    get: (val) => (val ? val.split(',') : []),       // formData -> 组件显示
    set: (val) => (val as string[])?.join(','),       // 组件 -> formData
  },
}
```

> ⚠️ `valueFormatter` 不支持响应式（不能包 `ref`/`computed`），与 `component` / `fields` / `slots` / `modelProp` / `displayFormatter` / `popup` 等同属不支持响应式的属性。

##### 🔄 响应式联动

控制类属性（`disabled` / `hidden` / `rules` 等）支持三种响应式模式，按场景选最简的：

```ts
// A. computed() 声明式 -- 初始化时已知的联动（首选）
disabled: computed(() => !form.formData.enabled),

// B. ref() -- 外部共享状态
const isDisabled = ref(false);
disabled: isDisabled,

// C. setField() 命令式 -- 事件驱动的运行时变更
form.setField('limitCount', { disabled: true });
```

> **规则**：初始化时已知的联动用 `computed()`，运行时事件触发的用 `setField()`，外部共享状态用 `ref()`。能用 `computed()` 解决就不要用 `setField()`。

###### 不支持响应式的属性

以下属性不能包 `ref`/`computed`（会失效或引发渲染异常），只能传静态值：

| 属性                                    | 原因                                                |
| :-------------------------------------- | :-------------------------------------------------- |
| `component`                             | 组件对象/函数，响应式代理会破坏渲染（需 `markRaw`） |
| `valueFormatter` / `displayFormatter`   | 纯转换函数，无需响应式                              |
| `fields`                                | 嵌套字段数组结构，响应式代理会干扰内部解析          |
| `slots`                                 | 插槽内容，响应式代理会破坏渲染                      |
| `modelProp` / `popup`                   | 字符串/布尔标识，无需响应式                         |
| `componentContainer` / `fieldContainer` | 容器组件，需 `markRaw`                              |

> 动态切换 `component` 或 `slots` 时，用 `setField()` 命令式更新，而非包 `computed`。

---

### 内置组件映射（`component` 可选值）

| 内置键名           | 对应 Vant 组件 | 说明                                                           |
| :----------------- | :------------- | :------------------------------------------------------------- |
| `'field'`          | Field          | 文本/密码/数字输入（特殊：无内部控件包裹，直接渲染 van-field） |
| `'switch'`         | Switch         | 开关                                                           |
| `'stepper'`        | Stepper        | 步进器                                                         |
| `'rate'`           | Rate           | 评分                                                           |
| `'slider'`         | Slider         | 滑块                                                           |
| `'uploader'`       | Uploader       | 文件上传                                                       |
| `'checkbox-group'` | CheckboxGroup  | 复选框组                                                       |
| `'radio-group'`    | RadioGroup     | 单选按钮组                                                     |
| `'picker'`         | Picker         | 选择器（常配 `popup: true`）                                   |
| `'date-picker'`    | DatePicker     | 日期选择（常配 `popup: true`）                                 |
| `'time-picker'`    | TimePicker     | 时间选择（常配 `popup: true`）                                 |
| `'cascader'`       | Cascader       | 级联选择（常配 `popup: true`）                                 |
| `'area'`           | Area           | 省市区选择（常配 `popup: true`）                               |
| `'signature'`      | Signature      | 签名板（常配 `popup: true`）                                   |
| `'button'`         | Button         | 按钮                                                           |
| `'custom'`         | 自定义组件     | 完全渲染自定义组件                                             |

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

在根用 `componentMap` 注册，Field 里用字符串引用。**可覆盖内置组件**。

```vue
<script setup lang="ts">
import { ProComponentProvider } from '@qin-ui/vant-pro';
import MyIdCardScanner from './components/MyIdCardScanner.vue';

const componentMap = {
  'id-scanner': MyIdCardScanner,
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
declare module '@qin-ui/vant-pro' {
  interface ComponentMap {
    'id-scanner': typeof MyIdCardScanner;
  }
}
```

之后 `component: 'id-scanner'` 即获精准属性类型联想与校验。

#### 方式 4：模板 scoped slot（声明式，简单替换）

插槽名 = 字段 `path`，绑定参数通过 `v-bind="scoped"` 转发（teleport 机制，优先级最高）：

```vue
<ProForm :form="form">
  <template #agreement="scoped">
    <van-checkbox v-bind="scoped">同意协议</van-checkbox>
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

- **v-model**：默认绑 `modelValue`（`v-model:modelValue`，vant 统一约定）。若组件用别的 prop，通过字段 `modelProp` 指定。
- **接收 path**：组件会收到 `path` prop（字段路径），可用于透传或标识。
- **属性透传**：Field 上除框架级属性外（`component` / `hidden` / `modelProp` / `valueFormatter` / `displayFormatter` / `fields` / `slots` / `popup` / `fieldContainer` / `componentContainer` / `extraProps` 等），其余作为 attrs 透传给自定义组件。

---

### 使用 Popup 弹窗

对于需要弹窗展示的字段（如 Picker、DatePicker 等），配置 `popup: true` 即可开启弹窗模式。表单项以只读 `van-field` 展示，点击后底部弹出 Popup，内部控件在 Popup 中渲染；确认则提交值，取消则丢弃修改。

```vue
<script setup lang="ts">
const form = useForm({ date: '', area: [] }, [
  {
    path: 'date',
    label: '日期',
    component: 'date-picker',
    popup: true,
    displayFormatter: (val: string) => val || '请选择日期',
  },
  {
    path: 'area',
    label: '地区',
    component: 'area',
    popup: true,
    title: '请选择所在地区',
    displayFormatter: (val: string[]) => val?.join(' ') || '请选择地区',
  },
]);
</script>
```

> `displayFormatter` 是 vant 独有属性，控制弹窗字段在只读 `van-field` 上的回显文本。

### 嵌套分组字段

使用 `fields` 属性可以实现字段的嵌套分组（分组节点只配 `label` + `fields`，无 `path`/`component`）：

```vue
<script setup lang="ts">
const form = useForm({}, [
  {
    label: '基本信息',
    fields: [
      { path: 'name', label: '姓名', component: 'field' },
      { path: 'age', label: '年龄', component: 'stepper' },
    ],
  },
  {
    label: '联系信息',
    fields: [
      { path: 'phone', label: '手机号', component: 'field' },
      { path: 'email', label: '邮箱', component: 'field' },
    ],
  },
]);
</script>
```

#### Slots

| 插槽名    | 说明                                         |
| --------- | -------------------------------------------- |
| `default` | 表单底部自定义内容                           |
| `{path}`  | 按字段 path 命名的插槽，可覆盖指定字段的渲染 |

---

### 3. useFields

独立使用字段管理 Hook，当需要单独管理字段配置时可以使用：

```typescript
import { useFields } from '@qin-ui/vant-pro';

const { fields, handleFieldUpdate, handleFieldValues } = useFields([
  { path: 'name', label: '姓名', component: 'field' },
]);
```

### 4. useFormRef

获取 Vant Form 实例 ref：

```typescript
import { useFormRef } from '@qin-ui/vant-pro';

const { formRef, setFormRef } = useFormRef();

// 可直接调用 Vant Form 实例方法
// formRef.value?.validate()
```

---

## ❌ 反模式

- ❌ 在 `<ProForm>` 内手写 `<van-field>` -- ProForm 从 Field 配置自动渲染。
- ❌ 猜透传属性名 -- 先查 vant-ui.com（vant 用 `clearable` 不是 `allowClear`，不用 `mode:'multiple'`）。
- ❌ 把 `columns`（picker 数据）当 van-field 属性 -- 它属于内部控件层。
- ❌ 传 SFC 给 `component` 不用 `markRaw`。
- ❌ 移动端选择类字段（picker/date-picker/area 等）忘了配 `popup: true` -- 弹窗模式是 vant 表单的核心用法。

---

## Peer Dependencies

| 依赖包名称 | 推荐版本要求 |
| :--------- | :----------- |
| `vue`      | `^3.5.0`     |
| `vant`     | `^4.0.0`     |

---

## 🤝 贡献

欢迎通过 [GitHub Issues](https://github.com/dufan3715/pro-components/issues) 提交反馈或建议。

## 📄 许可证

基于 [MIT](LICENSE) 开源许可证。
