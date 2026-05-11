# @qin-ui/vant-pro

> 基于 Vant 4 和 @qin-ui/core 二次封装的移动端高级表单组件库。

## [📖 使用示例和文档详情](https://dufan3715.github.io/pro-components/)

---

## ✨ 特性

- 🛡️ 基于 **Vant 4+** 封装，支持 Vue 3.3+
- 🔥 提供 **ProForm** 高级表单组件，通过配置即可快速生成移动端表单
- 📱 移动端优先，内置 Popup 弹窗表单支持（Picker、DatePicker、Area 等）
- ⚙️ 通过 JSON 配置动态生成表单字段，支持字段联动与嵌套分组
- 🧩 支持自定义组件扩展，灵活应对复杂业务场景
- 🎨 提供 **ProComponentProvider** 统一管理组件全局默认属性
- 📐 完善的 TypeScript 类型推导，提供极致开发体验

---

## 📦 安装

确保已安装 `vant`：

```bash
npm i @qin-ui/vant-pro
# 或
pnpm add @qin-ui/vant-pro
# 或
yarn add @qin-ui/vant-pro
```

> 注意：`@qin-ui/vant-pro` 将 `vant` 和 `vue` 作为 peerDependencies，需自行安装。

---

## 🚀 快速开始

### 全局注册

```typescript
import { createApp } from 'vue';
import Vant from 'vant';
import 'vant/lib/index.css';
import ProComponents from '@qin-ui/vant-pro';

const app = createApp(App);

app.use(Vant);
app.use(ProComponents); // 全局注册 ProForm、ProComponentProvider

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

#### API

| 参数名         | 说明                        | 类型          | 默认值 |
| -------------- | --------------------------- | ------------- | ------ |
| component-vars | 需要 provide 到子组件的配置 | ComponentVars | -      |

`ComponentVars` 支持为以下组件类型配置默认属性：

| 组件 Key         | 对应的 Vant 组件 |
| ---------------- | ---------------- |
| `pro-form`       | Form             |
| `field`          | Field            |
| `switch`         | Switch           |
| `stepper`        | Stepper          |
| `rate`           | Rate             |
| `slider`         | Slider           |
| `uploader`       | Uploader         |
| `checkbox-group` | CheckboxGroup    |
| `radio-group`    | RadioGroup       |
| `picker`         | Picker           |
| `date-picker`    | DatePicker       |
| `time-picker`    | TimePicker       |
| `cascader`       | Cascader         |
| `area`           | Area             |
| `signature`      | Signature        |
| `button`         | Button           |

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

| 参数        | 说明             | 类型                        | 默认值 |
| ----------- | ---------------- | --------------------------- | ------ |
| initialData | 表单初始数据     | `DeepPartial<D>`            | -      |
| fields      | 表单字段配置     | `Field<ComponentName, D>[]` | -      |
| root        | 是否为根表单实例 | `boolean`                   | `true` |

**返回值**：

| 属性/方法     | 说明                                                                     |
| ------------- | ------------------------------------------------------------------------ |
| `data`        | 表单数据对象（reactive）                                                 |
| `fields`      | 表单字段配置数组（ref / computed）                                       |
| `formRef`     | 表单 ref 实例                                                            |
| `setFormRef`  | 设置表单 ref 的方法                                                      |
| `validate`    | 校验表单方法，返回 Promise                                               |
| `resetFields` | 重置表单数据为初始值                                                     |
| `formPopup`   | Popup 弹窗控制对象（`open`、`close`、`visible`、`props`、`updateProps`） |

#### useFormPopup

`useForm` 内部集成了 `useFormPopup` Hook，用于控制 Popup 弹窗的开关与配置。你也可以独立使用它：

```typescript
import { useFormPopup } from '@qin-ui/vant-pro';

const formPopup = useFormPopup();
formPopup.open('fieldName'); // 打开弹窗
formPopup.close(); // 关闭弹窗
formPopup.updateProps({ closeable: true }); // 更新弹窗属性
```

| 属性/方法        | 说明                       |
| ---------------- | -------------------------- |
| `props`          | Popup 的 props（reactive） |
| `visible`        | 弹窗是否可见（computed）   |
| `popupFieldPath` | 当前打开的字段路径（ref）  |
| `open(path)`     | 打开指定字段的弹窗         |
| `close()`        | 关闭弹窗                   |
| `updateProps()`  | 更新弹窗属性               |

#### Props

| 参数名 | 说明                     | 类型 | 默认值 |
| ------ | ------------------------ | ---- | ------ |
| form   | `useForm` 返回的表单实例 | Form | -      |

同时继承 Vant [Form Props](https://vant-contrib.gitee.io/vant/#/zh-CN/form#form-props) 的所有属性。

::: tip
如果不传递 `form` prop，ProForm 内部会自行创建一个表单实例。
:::

#### 字段配置（Field）

每个字段支持的配置项如下：

| 属性名               | 说明                               | 类型                             | 默认值    |
| -------------------- | ---------------------------------- | -------------------------------- | --------- |
| `path`               | 字段路径，对应表单数据中的属性名   | `Path<D>`                        | -         |
| `label`              | 字段标签，支持字符串或插槽组件     | `SlotComponentType`              | -         |
| `component`          | 字段组件类型，见下方支持列表       | `ComponentName`                  | `'field'` |
| `hidden`             | 是否隐藏字段                       | `boolean`                        | `false`   |
| `disabled`           | 是否禁用字段                       | `boolean`                        | `false`   |
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

**支持的内置组件类型** `component`：

| 类型               | 说明       | 对应 Vant 组件 |
| ------------------ | ---------- | -------------- |
| `'field'`          | 文本输入框 | Field          |
| `'switch'`         | 开关       | Switch         |
| `'stepper'`        | 步进器     | Stepper        |
| `'rate'`           | 评分       | Rate           |
| `'slider'`         | 滑块       | Slider         |
| `'uploader'`       | 文件上传   | Uploader       |
| `'checkbox-group'` | 复选框组   | CheckboxGroup  |
| `'radio-group'`    | 单选框组   | RadioGroup     |
| `'picker'`         | 选择器     | Picker         |
| `'date-picker'`    | 日期选择   | DatePicker     |
| `'time-picker'`    | 时间选择   | TimePicker     |
| `'cascader'`       | 级联选择   | Cascader       |
| `'area'`           | 省市区选择 | Area           |
| `'signature'`      | 签名板     | Signature      |
| `'button'`         | 按钮       | Button         |
| `'custom'`         | 自定义组件 | -              |

#### 使用 Popup 弹窗

对于需要弹窗展示的字段（如 Picker、DatePicker 等），配置 `popup: true` 即可开启弹窗模式：

```vue
<script setup lang="ts">
const form = useForm({ date: '' }, [
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
    title: '请选择所在地区'
    displayFormatter: (val: string[]) => val?.join(' ') || '请选择地区',
  },
]);
</script>
```

#### 嵌套分组字段

使用 `fields` 属性可以实现字段的嵌套分组：

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

#### 自定义组件

通过使用 `component` 属性传入自定义组件：

```vue
<script setup lang="ts">
import { useForm } from '@qin-ui/vant-pro';
import MyCustomInput from './MyCustomInput.vue';

const form = useForm({ custom: '' }, [
  {
    path: 'custom',
    label: '自定义',
    component: MyCustomInput,
    placeholder: '请输入',
  },
]);
</script>
```

#### Slots

| 插槽名   | 说明                                         |
| -------- | -------------------------------------------- |
| default  | 表单底部自定义内容                           |
| `{path}` | 按字段 path 命名的插槽，可覆盖指定字段的渲染 |

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

## 🤝 贡献

欢迎通过 [GitHub Issues](https://github.com/dufan3715/pro-components/issues) 提交反馈或建议。

## 📄 许可证

[MIT](LICENSE)
