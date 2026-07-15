# @qin-ui/vant-pro

基于 vant v4（`van-` 前缀，移动端）封装的 Schema 驱动表单组件库。
用 JS 配置对象描述 UI，不写 `<van-*>` 模板堆叠。ProForm 是渲染引擎，所有真实 UI 来自 vant。

## 安装与注册

```bash
pnpm add @qin-ui/vant-pro   # peerDeps: vant ^4, vue ^3.5
```

```ts
import VantPro from '@qin-ui/vant-pro';
import '@qin-ui/vant-pro/vant-pro.css';
app.use(VantPro); // 全局注册 ProForm / ProComponentProvider
```

> 本包是移动端表单库，**仅提供 ProForm + ProComponentProvider**，不含 ProTable。

## 两条核心心智模型

**1. 配置驱动**：`useForm(数据, Field[])` 生成实例，ProForm 接收实例。

**2. 属性分层透传**（最关键）：vant 的结构是「`van-field` 容器 + 内部控件」**两层**（没有桌面端的 Grid Col 层）。Field 上的属性被"剥离到这两层"，写错层就失效：

| 属性                                                                                                                                                                                                                                                      | 落到哪一层                        | 说明     |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------- | :------- |
| `label`/`rules`/`required`/`clearable`/`inputAlign`/`errorMessageAlign`/`colon`/`readonly`/`clickable`/`isLink`/`labelWidth`/`labelAlign`/`labelClass`/`error`/`center`/`border`/`autosize`/`type`/`maxlength`/`placeholder`/`rows` + 所有 `on*` 事件回调 | `<van-field>` 容器层              | 表单项   |
| `columns`/`options`/`activeValue`/`min`/`max`/`step`/`count`/`size`/`direction`/`disabled` + 该控件其余 vant 原生属性                                                                                                                                     | 内部输入控件本身（van-picker 等） | 其余全部 |
| `component`/`hidden`/`modelProp`/`valueFormatter`/`displayFormatter`/`fields`/`slots`/`popup`/`fieldContainer`/`componentContainer`/`extraProps`                                                                                                          | ProForm 逻辑消费，**不绑到 DOM**  | 框架级   |

> 规则：`label`/`rules`/`placeholder` 等表单项属性给 `van-field`，控件特有属性（如 picker 的 `columns`）给内部控件。
> `fieldClass`/`fieldStyle` 绑到 `van-field`，`componentClass`/`componentStyle` 绑到内部控件。

## component 映射（Field.component 字符串 -> vant 组件）

`field`->van-field · `switch`->Switch · `stepper`->Stepper · `rate`->Rate · `slider`->Slider ·
`uploader`->Uploader · `checkbox-group`->CheckboxGroup · `radio-group`->RadioGroup ·
`picker`->Picker · `date-picker`->DatePicker · `time-picker`->TimePicker · `cascader`->Cascader ·
`area`->Area · `signature`->Signature · `button`->Button · `custom`->用户自定义组件

> **`field` 特殊**：直接渲染 `van-field`，无内部控件包裹，所有属性绑到 van-field（用于纯文本/密码/数字输入）。
> `picker`/`date-picker`/`time-picker`/`cascader`/`area`/`signature` 通常配合 `popup: true` 使用弹窗模式。
> 写 Field 中输入控件的具体属性前，**属性名/类型以 https://vant-ui.com 官方文档为准**。

## 隐式默认行为（INJECT_CONFIG，易踩坑）

由 `ProComponentProvider` 注入，优先级低于 Field 配置。**vant 版预设极简**，仅以下两项有默认值，其余内置组件（switch/stepper/rate/slider/uploader/checkbox-group/radio-group/picker/date-picker/time-picker/cascader/area/signature/button）均 `{}` 无预设：

| component  | 默认预设                                                                                                                                                         |
| :--------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pro-form` | `{ inputAlign: 'right', errorMessageAlign: 'right', required: 'auto', scrollToError: true, scrollToErrorPosition: 'nearest' }` -> 表单项右对齐、校验失败自动滚动 |
| `field`    | `{ clearable: true, placeholder: '请输入' }`                                                                                                                     |

> `modelProp` 默认 `'modelValue'`（vant 统一约定，即 `v-model:modelValue`）。

## useForm -- 表单实例

```ts
// 重载一（常用）：初始数据 + 字段配置
const form = useForm<User>({ name: '张三', age: 25 }, [
  {
    path: 'name',
    label: '姓名',
    component: 'field',
    rules: [{ required: true }],
  },
]);
// 重载二：仅拿实例（root=true/false）
const form = useForm<User>(true);
```

返回 `Form` 实例（在 core 基础上**额外增加 `formPopup`**；`formData` 是 reactive 对象，不用 `.value`）：

| 成员                                                                                  | 说明                                                                                          |
| :------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------- |
| `form.formData`                                                                       | 响应式数据，可直接读写，支持深层路径 `formData.address.city`                                  |
| `form.getFormData(path)` / `form.setFormData(path, value)`                            | 路径读写；setFormData 还支持 `setFormData(path, prev=>new)` 和 `setFormData({...})` 批量覆盖  |
| `form.fields`                                                                         | 字段配置数组（Ref）                                                                           |
| `form.getField(path)` / `form.setField(path, patch)`                                  | 字段增改查；setField 默认合并，`{updateType:'rewrite'}` 覆盖                                  |
| `form.deleteField` / `form.appendField` / `form.prependField` / `form.getParentField` | 字段增删                                                                                      |
| `form.formRef`                                                                        | 底层 vant Form 实例引用（Ref），`formRef.value?.validate()` / `.resetValidation()`            |
| `form.formPopup`                                                                      | **vant 独有**：弹窗管理对象，`open(path)` / `close()` / `visible` / `props` / `updateProps()` |

## ProForm 最小示例

```vue
<script setup lang="ts">
import { ProForm, useForm } from '@qin-ui/vant-pro';
interface User {
  username: string;
  age: number;
  gender: string;
}
const form = useForm<User>({ username: '', age: 18, gender: 'male' }, [
  {
    path: 'username',
    component: 'field',
    label: '用户名',
    rules: [{ required: true }],
  },
  { path: 'age', component: 'stepper', label: '年龄' },
  {
    path: 'gender',
    component: 'picker',
    label: '性别',
    columns: ['男', '女'],
    popup: true,
    displayFormatter: v => v || '请选择',
  },
]);
const submit = async () => {
  await form.formRef.value?.validate();
  console.log(form.formData);
};
</script>
<template>
  <ProForm :form="form" />
  <van-button type="primary" @click="submit">提交</van-button>
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

在根用 `componentMap` 注册，Field 里用字符串引用。**可覆盖内置组件**。

```vue
<script setup lang="ts">
import { ProComponentProvider } from '@qin-ui/vant-pro';
import MyIdCardScanner from './components/MyIdCardScanner.vue';
const componentMap = { 'id-scanner': MyIdCardScanner };
</script>
<template>
  <ProComponentProvider :component-map="componentMap">
    <ProForm :form="form" />
  </ProComponentProvider>
</template>
```

**追加全局声明获取强类型补全**（项目任意 `.d.ts`）：

```ts
declare module '@qin-ui/vant-pro' {
  interface ComponentMap {
    'id-scanner': typeof MyIdCardScanner;
  }
}
// 之后 component: 'id-scanner' 即获精准属性类型联想
```

### 方式 4：模板 scoped slot（声明式，简单替换）

插槽名 = 字段 `path`，绑定参数通过 `v-bind="scoped"` 转发（teleport 机制，优先级最高）。ProForm 还支持 `default` 插槽渲染表单底部内容。

```vue
<ProForm :form="form">
  <template #agreement="scoped">
    <van-checkbox v-bind="scoped">同意协议</van-checkbox>
  </template>
</ProForm>
```

### 选择建议

- 单字段复用一个 SFC -> 方式 1（markRaw(SFC)）
- 单字段、需动态拼装 props -> 方式 2（render 函数）
- 多处复用 / 替换内置组件 -> 方式 3（componentMap + 声明扩充）
- 简单声明式替换、不想写 h() -> 方式 4（scoped slot）

### 自定义组件需遵守的约定

- **v-model**：默认绑 `modelValue`（`v-model:modelValue`，vant 统一约定）。若组件用别的 prop，通过字段 `modelProp` 指定
- **接收 path**：组件会收到 `path` prop（字段路径）
- **属性透传**：Field 上除框架级属性外（component/hidden/modelProp/valueFormatter/displayFormatter/fields/slots/popup/fieldContainer/componentContainer/extraProps 等），其余作为 attrs 透传给自定义组件

## valueFormatter -- 字段值转换

控制表单值与组件值之间的转换（如 Picker 的数组与字符串互转）。**在 onUpdate:modelValue 前执行**，支持两种形态：

```ts
// 函数形态：(新值, 旧值) => 转换后的值，写回 formData
{ path: 'name', valueFormatter: (val, oldVal) => val?.trim() }

// 对象形态：get 读出时转换，set 写入时转换
{ path: 'tags', component: 'picker',
  valueFormatter: {
    get: (val) => val ? val.split(',') : [],     // formData -> 组件显示
    set: (val) => (val as string[])?.join(','),   // 组件 -> formData
  } }
```

## Popup 弹窗模式（vant 移动端核心特性）

移动端选择类字段（picker/date-picker/time-picker/cascader/area/signature）通常以**底部弹出层**形式展示。配置 `popup: true` 后：表单项以只读 `van-field` 展示，点击弹出 Popup，内部控件在 Popup 中渲染；确认则提交值，取消则丢弃修改。

```ts
{ path: 'city', component: 'picker', label: '城市',
  columns: ['北京', '上海', '广州'],
  popup: true,                                   // 开启弹窗模式
  displayFormatter: (val) => val || '请选择',     // 只读 van-field 的回显文本
}
```

- `popup`：`boolean` 或 `Partial<PopupProps>`（自定义弹窗属性，如 `position`/`round`）
- `displayFormatter`：**(vant 独有)** 控制弹窗字段在只读 `van-field` 上的展示文本

## useFormPopup -- 弹窗管理（vant 独有 Hook）

`useForm` 内部已集成 `formPopup`，通常直接用 `form.formPopup`。也可独立使用：

```ts
import { useFormPopup } from '@qin-ui/vant-pro';
const popup = useFormPopup(true); // root=true 创建独立实例
popup.open('address'); // 打开指定字段的弹窗
popup.close(); // 关闭
popup.updateProps({ position: 'top' }); // 更新弹窗属性
```

| 成员                       | 说明                                                                                       |
| :------------------------- | :----------------------------------------------------------------------------------------- |
| `popup.open(path)`         | 打开指定字段 path 的弹窗                                                                   |
| `popup.close()`            | 关闭弹窗                                                                                   |
| `popup.visible`            | 弹窗是否可见（computed）                                                                   |
| `popup.popupFieldPath`     | 当前打开的字段路径（Ref）                                                                  |
| `popup.popupFieldValue`    | 当前弹窗字段的值（Ref）                                                                    |
| `popup.props`              | Popup 属性（reactive，默认 `{ position:'bottom', round:true, safeAreaInsetBottom:true }`） |
| `popup.updateProps(props)` | 更新 Popup 属性                                                                            |

## useFields / useFormRef -- 辅助 Hook

- **`useFields(fields?)`**：独立管理字段配置，返回 `{ fields, handleFieldUpdate, handleFieldValues }`，用于脱离 ProForm 单独管理字段。
- **`useFormRef()`**：获取 vant Form 实例 ref，返回 `{ formRef, setFormRef }`，`formRef.value?.validate()` 调用原生方法。

## 响应式联动（三种模式，选最简的）

```ts
disabled: computed(() => !form.formData.enabled),   // A 声明式，初始化时已知（首选）
const isDisabled = ref(false);                        // B 外部共享状态
form.setField('limitCount', { disabled: true });      // C 命令式，事件驱动
```

> **不支持响应式**（不能包 ref/computed）的属性：`component` / `componentContainer` / `fieldContainer` / `valueFormatter` / `displayFormatter` / `fields` / `slots` / `modelProp` / `popup`。

## 反模式

- ❌ 在 `<ProForm>` 内手写 `<van-field>` -- ProForm 从 Field 配置自动渲染。
- ❌ 猜透传属性名 -- 先查 vant-ui.com（vant 用 `clearable` 不是 `allowClear`，不用 `mode:'multiple'`）。
- ❌ 把 `columns`（picker 数据）当 van-field 属性 -- 它属于内部控件层。
- ❌ 传 SFC 给 `component` 不用 `markRaw`。
- ❌ 移动端选择类字段忘了配 `popup: true` -- 桌面端没有的弹窗模式，是 vant 表单的核心用法。

## 按需深查

- `node_modules/@qin-ui/vant-pro/api.json` -- 结构化 API 元数据（函数签名、参数、类型）。
- `node_modules/@qin-ui/vant-pro/README.md` -- 完整用法与进阶示例。
- 底层 vant 组件属性查阅官方文档：https://vant-ui.com 。
