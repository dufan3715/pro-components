# @qin-ui/vant-pro

基于 vant v4（`van-` 前缀，移动端）封装的 Schema 驱动表单组件库。
用 JS 配置对象描述 UI，不写 `<van-*>` 模板堆叠。ProForm 是渲染引擎，所有真实 UI 来自 vant。

## 安装与使用

```bash
pnpm add @qin-ui/vant-pro   # peerDeps: vant ^4, vue ^3.5
```

```ts
// 按需引入（推荐）
import { ProForm, useForm, useFormPopup } from '@qin-ui/vant-pro';
```

> 本包是移动端表单库，**仅提供 ProForm + ProComponentProvider**，不含 ProTable。

## 核心心智模型

**1. 配置驱动**：`useForm(数据, Field[])` 生成实例，ProForm 接收实例。

**2. 属性分层透传**（最关键）：vant 的结构是「`van-field` 容器 + 内部控件」**两层**（没有桌面端的 Grid Col 层）。Field 上的属性被"剥离到这两层"，写错层就失效：

| 属性                                                                                                                                                                                                                                                      | 落到哪一层                        | 说明     |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------- | :------- |
| `label`/`rules`/`required`/`clearable`/`inputAlign`/`errorMessageAlign`/`colon`/`readonly`/`clickable`/`isLink`/`labelWidth`/`labelAlign`/`labelClass`/`error`/`center`/`border`/`autosize`/`type`/`maxlength`/`placeholder`/`rows` + 所有 `on*` 事件回调 | `<van-field>` 容器层              | 表单项   |
| `columns`/`options`/`activeValue`/`min`/`max`/`step`/`count`/`size`/`direction`/`disabled` + 该控件其余 vant 原生属性                                                                                                                                     | 内部输入控件本身（van-picker 等） | 其余全部 |
| `component`/`hidden`/`modelProp`/`valueFormatter`/`displayFormatter`/`fields`/`slots`/`popup`/`fieldContainer`/`componentContainer`/`extraProps`                                                                                                          | ProForm 逻辑消费，**不绑到 DOM**  | 框架级   |

> 规则：`label`/`rules`/`placeholder` 等表单项属性给 `van-field`，控件特有属性（如 picker 的 `columns`）给内部控件。
> `fieldClass`/`fieldStyle` 绑到 `van-field`，`componentClass`/`componentStyle` 绑到内部控件。

## 速查

### component 映射（Field.component 字符串 -> vant 组件）

`field`->van-field · `switch`->Switch · `stepper`->Stepper · `rate`->Rate · `slider`->Slider ·
`uploader`->Uploader · `checkbox-group`->CheckboxGroup · `radio-group`->RadioGroup ·
`picker`->Picker · `date-picker`->DatePicker · `time-picker`->TimePicker · `cascader`->Cascader ·
`area`->Area · `signature`->Signature · `button`->Button · `custom`->用户自定义组件

> **`field` 特殊**：直接渲染 `van-field`，无内部控件包裹，所有属性绑到 van-field（用于纯文本/密码/数字输入）。
> `picker`/`date-picker`/`time-picker`/`cascader`/`area`/`signature` 通常配合 `popup: true` 使用弹窗模式。
> 写 Field 中输入控件的具体属性前，**属性名/类型以 https://vant-ui.com 官方文档为准**。

### 隐式默认行为（INJECT_CONFIG，易踩坑）

由 `ProComponentProvider` 注入，优先级低于 Field 配置。**vant 版预设极简**，仅以下两项有默认值，其余内置组件（switch/stepper/rate/slider/uploader/checkbox-group/radio-group/picker/date-picker/time-picker/cascader/area/signature/button）均 `{}` 无预设；表单右对齐与校验滚动定位属移动端体验默认，可在 Field 或 `componentVars` 中覆盖。下表为**库内置默认**，项目 Provider 可能已按 key 覆盖部分值，最终以现场读取的实际配置为准（见「项目级覆盖层」）：

| component  | 默认预设                                                                                                                                                         |
| :--------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pro-form` | `{ inputAlign: 'right', errorMessageAlign: 'right', required: 'auto', scrollToError: true, scrollToErrorPosition: 'nearest' }` -> 表单项右对齐、校验失败自动滚动 |
| `field`    | `{ clearable: true }`                                                                                                                                            |

> `modelProp` 默认 `'modelValue'`（vant 统一约定，即 `v-model:modelValue`）。
> **占位符由 locale 兜底**：未显式设置 `placeholder` 时自动生成（`input.placeholder`），语言随宿主 vant 语言自动切换。

### 项目级覆盖层（写码前必查，实时生效）

项目 `ProComponentProvider`（通常挂载在 App.vue 或布局组件）的配置介于 Field 属性与上表内置默认之间，优先级为 **Field 属性 > 项目 Provider > 内置默认**。

**硬规则：生成任何 Field / ProForm 代码前，先全局搜索项目源码（排除 node_modules），读取 Provider 实际配置：**

```
搜索: <ProComponentProvider   挂载点（通常在 App.vue / 布局 / Provider 包装组件）
Provider 注入面：`form` 不可经 `componentVars['pro-form']` 配置（由显式 `:form` 实例驱动）；传入不可注入键时在注入层静默忽略（类型面已限制，不输出告警）。

搜索: componentVars            项目覆盖的默认属性（field clearable、pro-form 对齐等）
搜索: componentMap             注册的自定义组件 / 接管的内置组件
搜索: :locale=                 覆盖的内置文案（占位符等）
```

- 配置值若抽离到独立文件（如 `:component-vars="providerVars"`），沿 import / 定义语句追到源头读取；
- `componentMap` 注册的 key 是合法的 `Field.component` 取值，应优先使用项目已注册组件，而非新写；
- 内置文案以项目 `locale` 覆盖为准，不硬编码默认文案；
- 全项目搜不到挂载点时，按上表内置默认工作。

### 内置文案（locale）

内置文案（占位符等）走 locale 体系，默认跟随宿主 vant 语言自动切换：

- `useLocale()` 返回 `{ t, lang }`：`t(key, params?)` 翻译函数（支持 `{placeholder}` 参数）、`lang` 当前语言（`'zh-CN'` / `'zh-TW'` / `'en-US'`）
- 包导出 `zhCN` / `zhTW` / `enUS` 三套语言包（类型 `ProLocale`）
- `ProComponentProvider` 的 `locale` prop 可覆盖任意内置文案（如 `{ 'input.placeholder': '请输入' }`），未覆盖的默认跟随宿主语言

### 不支持响应式的属性（不能包 ref/computed）

`component` / `componentContainer` / `fieldContainer` / `valueFormatter` / `displayFormatter` / `fields` / `slots` / `modelProp` / `popup`。

## 实例成员速查

### useForm -- 表单实例

```ts
useForm(initFormData, Field[], root = true)   // 重载一（常用）：初始数据 + 字段配置
useForm(true | false)                          // 重载二：仅拿实例（root）
```

返回 `Form` 实例（在 core 基础上**额外增加 `formPopup`**；`formData` 是 reactive 对象，不用 `.value`）：

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
| `form.formRef`                                                                        | 底层 vant Form 实例引用（Ref），`formRef.value?.validate()` / `.resetValidation()`                                         |
| `form.formPopup`                                                                      | **vant 独有**：弹窗管理对象，`open(path)` / `close()` / `visible` / `props` / `updateProps()`                              |

### useFormPopup -- 弹窗管理（vant 独有 Hook）

`useForm` 内部已集成 `formPopup`，通常直接用 `form.formPopup`。也可独立使用：`useFormPopup(true)`。

成员：`open(path)` / `close()` / `visible`（computed）/ `popupFieldPath`（Ref）/ `popupFieldValue`（Ref）/ `props`（reactive，默认 `{ position:'bottom', round:true, safeAreaInsetBottom:true }`）/ `updateProps(props)`。

### useFields / useFormRef -- 辅助 Hook

- **`useFields(fields?)`**：独立管理字段配置，返回 `{ fields, handleFieldUpdate, handleFieldValues }`，脱离 ProForm 单独管理字段。
- **`useFormRef()`**：获取 vant Form 实例 ref，返回 `{ formRef, setFormRef }`，`formRef.value?.validate()` 调用原生方法。

## 关键约定

### 自定义组件

`Field.component` 解析优先级（高 -> 低）：`teleport 插槽注入` > `ProComponentProvider.componentMap` > `内置 componentMap` > `原始 component 值`。

四种接入方式（完整代码见 skills）：

- **方式 1** `markRaw(SFC)`：单字段复用 SFC（**必须 markRaw**，否则被 Vue 深度代理触发性能警告）
- **方式 2** render 函数 `(props, ctx) => VNode`：需动态拼装 props
- **方式 3** `ProComponentProvider` 注入 `componentMap`：全局复用 / 覆盖内置组件，可追加 `declare module` 声明获强类型
- **方式 4** 模板 scoped slot：插槽名 = 字段 `path`，`v-bind="scoped"` 转发（teleport 机制，优先级最高）。ProForm 还支持 `default` 插槽渲染表单底部内容。

约定：默认 v-model 绑 `modelValue`（vant 统一约定），他 prop 用 `modelProp` 指定；组件会收到 `path` prop；除框架级属性外其余作 attrs 透传。

### valueFormatter -- 字段值转换

控制表单值与组件值之间的转换。**在表单数据写入前（computed setter 中，于 `onUpdate:modelValue` 写回前）执行**，支持两种形态：

```ts
// 函数形态：(新值, 旧值) => 转换后的值，写回 formData。仅 set（写入）方向生效，读取时不转换
{ path: 'name', valueFormatter: (val, oldVal) => val?.trim() }

// 对象形态：get 读出时转换，set 写入时转换（双向）
{ path: 'tags', component: 'picker',
  valueFormatter: { get: v => v ? v.split(',') : [], set: v => (v as string[])?.join(',') } }
```

### Popup 弹窗模式（vant 移动端核心特性）

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

## 反模式

- ❌ 在 `<ProForm>` 内手写 `<van-field>` -- ProForm 从 Field 配置自动渲染。
- ❌ 猜透传属性名 -- 先查 vant-ui.com（vant 用 `clearable` 不是 `allowClear`，不用 `mode:'multiple'`）。
- ❌ 把 `columns`（picker 数据）当 van-field 属性 -- 它属于内部控件层。
- ❌ 传 SFC 给 `component` 不用 `markRaw`。
- ❌ 移动端选择类字段忘了配 `popup: true` -- 桌面端没有的弹窗模式，是 vant 表单的核心用法。
- ❌ 不读项目 `ProComponentProvider` 实际配置就写 Field 属性 -- 默认值与组件映射可能已被项目覆盖。

## 按需深查

完整 API（详细签名、参数表、完整示例、ProComponentProvider 用法）：

- `.agents/skills/vant-pro/SKILL.md` — skills 入口（速查 + 参考导航）
- `.agents/skills/vant-pro/references/README.md` — 完整使用文档与进阶示例
- `.agents/skills/vant-pro/references/api.md` — 结构化 API 元数据
- `node_modules/@qin-ui/vant-pro/README.md` — 完整用法与进阶示例
- vant 组件属性查阅官方文档：https://vant-ui.com
- 项目注册了自定义 `componentMap` key 时，推荐补 `declare module` 环境类型声明（见 README 方式 3），使 `Field.component` 联合类型包含项目注册的 key
