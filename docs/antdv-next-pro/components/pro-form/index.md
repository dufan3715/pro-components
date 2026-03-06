# ProForm

基于 antdv-next Form 的高级表单封装，通过 Schema 配置驱动，内置所有常用输入组件，支持响应式属性、Grid 布局、嵌套字段、自定义组件等。

## API

### useForm

```ts
import { useForm } from '@qin-ui/antdv-next-pro';

// 初始化数据 + 字段配置
const form = useForm<DataType>(initData, initFields);
```

#### 参数

| 参数         | 类型             | 说明                                     |
| ------------ | ---------------- | ---------------------------------------- |
| `initData`   | `DeepPartial<D>` | 表单初始数据                             |
| `initFields` | `Field<D>[]`     | 表单字段初始配置                         |
| `root`       | `boolean`        | 是否为根 form 实例（用于嵌套 form 场景） |

#### 返回值

| 属性                       | 类型                             | 说明                                                                    |
| -------------------------- | -------------------------------- | ----------------------------------------------------------------------- |
| `formRef`                  | `Ref<FormInstance \| undefined>` | antdv-next `FormInstance` 引用，可调用 `validate`、`resetFields` 等方法 |
| `formData`                 | `Reactive<D>`                    | 响应式表单数据对象                                                      |
| `fields`                   | `Ref<Field<D>[]>`                | 响应式字段配置数组                                                      |
| `getFormData(path?)`       | `(path?) => any`                 | 读取字段值，不传 path 返回全部数据                                      |
| `setFormData(path, value)` | `-`                              | 设置字段值，value 支持函数形式 `(prev) => next`                         |
| `setField(path, patch)`    | `-`                              | 动态更新指定字段的配置项                                                |
| `resetFormData()`          | `-`                              | 将表单数据重置为初始值                                                  |

---

### ProForm Props

| 属性   | 类型                   | 默认值  | 说明                                                             |
| ------ | ---------------------- | ------- | ---------------------------------------------------------------- |
| `form` | `Form<D>`              | -       | `useForm` 返回的实例                                             |
| `grid` | `boolean \| GridProps` | `false` | 是否启用 Grid 网格布局，传入 `GridProps` 可定制 gutter、align 等 |
| 其余   | `FormProps`            | -       | 透传至 antdv-next `Form`（如 `layout`、`labelCol`、`colon` 等）  |

### ProForm Slots

| 插槽名    | 说明                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------- |
| `default` | 表单尾部内容（通常放提交 / 重置按钮）                                                               |
| `[path]`  | 按字段 path 命名的具名插槽，接管该字段的渲染。插槽 props 包含 `modelValue` 和 `onUpdate:modelValue` |

---

### 字段配置（Field）

所有字段共享 `Base` 公共属性，并叠加所选组件自身的 Props。

#### 公共属性（Base）

| 属性                 | 类型                                | 说明                                                                                        |
| -------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------- |
| `path`               | `Path<D>`                           | 字段标识，对应 formData 中的键路径（支持 `'a.b.c'` 嵌套）                                   |
| `name`               | `Path<D>`                           | 别名，优先于 `path` 作为 FormItem name（用于与 formData 解耦）                              |
| `label`              | `string \| Component`               | 字段标签，支持传入 Vue 组件                                                                 |
| `component`          | 见内置组件表                        | 所用组件名或 Vue 组件实例                                                                   |
| `hidden`             | `MaybeRef<boolean>`                 | 是否隐藏，支持 `ref` / `computed`                                                           |
| `rules`              | `RuleObject[]`                      | 校验规则（antdv-next FormItem rules）                                                       |
| `span`               | `number`                            | Grid 列宽（仅 grid 模式生效，1–24）                                                         |
| `xs/sm/md/lg/xl/xxl` | `number \| { span, offset }`        | 响应式列宽（同 antdv-next Col）                                                             |
| `fields`             | `Fields<D>`                         | 嵌套子字段，设置后当前字段表现为分组容器                                                    |
| `grid`               | `boolean \| GridProps`              | 子字段的 Grid 配置（仅 `fields` 不为空时有效）                                              |
| `slots`              | `Partial<ComponentSlots<FormItem>>` | FormItem 插槽（`label`、`extra`、`help`、`tooltip`）                                        |
| `formItemStyle`      | `MaybeRef<CSSProperties>`           | FormItem 样式                                                                               |
| `formItemClass`      | `MaybeRef<string>`                  | FormItem 类名                                                                               |
| `formItemContainer`  | `RenderComponentType`               | FormItem 外层包裹组件（函数式或 Vue 组件）                                                  |
| `formItemDataAttrs`  | `Record<string, string>`            | 附加到 FormItem DOM 节点的属性（如 `data-*`、`aria-*`）                                     |
| `componentStyle`     | `MaybeRef<CSSProperties>`           | 组件本身的样式                                                                              |
| `componentClass`     | `MaybeRef<string>`                  | 组件本身的类名                                                                              |
| `componentContainer` | `RenderComponentType`               | 组件外层包裹组件                                                                            |
| `componentDataAttrs` | `Record<string, string>`            | 附加到组件 DOM 节点的属性                                                                   |
| `valueFormatter`     | `ValueFormatter`                    | 值转换函数，在 v-model 读写时执行。支持函数 `(val, oldVal) => newVal` 或对象 `{ get, set }` |
| `modelProp`          | `string`                            | v-model 绑定属性名，默认 `'value'`                                                          |

> **响应式支持**：除 `component`、`fields`、`slots`、`modelProp`、`formItemContainer`、`componentContainer`、`valueFormatter` 外，所有属性均支持 `Ref` 或 `ComputedRef`。

#### 内置组件（component 取值）

| 值                  | 组件                     | 额外 Props                                       |
| ------------------- | ------------------------ | ------------------------------------------------ |
| `input`             | Input 文本框             | `maxlength`、`allowClear`、`prefix`、`suffix`... |
| `textarea`          | TextArea 文本域          | `autoSize`、`showCount`...                       |
| `input-password`    | InputPassword 密码框     | `visibilityToggle`...                            |
| `input-otp`         | InputOTP 一次性密码      | `length`...                                      |
| `input-search`      | InputSearch 搜索框       | `enterButton`、`onSearch`...                     |
| `input-number`      | InputNumber 数字输入     | `min`、`max`、`precision`、`step`...             |
| `select`            | Select 下拉选择          | `options`、`mode`、`allowClear`...               |
| `auto-complete`     | AutoComplete 自动完成    | `options`、`filterOption`...                     |
| `cascader`          | Cascader 级联选择        | `options`、`fieldNames`...                       |
| `date-picker`       | DatePicker 日期选择      | `picker`、`format`、`disabledDate`...            |
| `range-picker`      | RangePicker 日期范围     | `placeholder: [string, string]`...               |
| `time-picker`       | TimePicker 时间选择      | `format`、`minuteStep`...                        |
| `time-range-picker` | TimeRangePicker 时间范围 | 同上                                             |
| `checkbox-group`    | CheckboxGroup 复选框组   | `options`                                        |
| `radio-group`       | RadioGroup 单选框组      | `options`、`optionType`...                       |
| `switch`            | Switch 开关              | `checkedChildren`、`unCheckedChildren`...        |
| `slider`            | Slider 滑块              | `min`、`max`、`step`、`range`...                 |
| `tree-select`       | TreeSelect 树形选择      | `treeData`、`multiple`...                        |
| `transfer`          | Transfer 穿梭框          | `dataSource`、`titles`...                        |
| `custom`            | 完全自定义               | 需同时传入 Vue 组件 `component: markRaw(MyComp)` |
