# ProComponentProvider

全局组件默认配置提供者，通过 `componentVars` 统一设置所有 Pro 组件的默认属性，避免在每处重复传入相同的 Props。

## 何时使用

- 需要为 ProForm/ProTable 统一默认配置
- 需要在项目级统一输入组件的默认 props
- 需要注册或覆盖内置表单组件

## 快速开始

```vue
<script setup lang="ts">
import { ProComponentProvider } from '@qin-ui/antdv-next-pro';

const componentVars = {
  // ProForm 全局默认配置
  'pro-form': {
    grid: { gutter: 24 },
    labelCol: { span: 6 },
    wrapperCol: { span: 18 },
  },
  // ProForm 每个字段的 FormItem 默认配置
  'pro-form-item': {
    validateFirst: true,
    span: 6,
  },
  // ProTable 全局默认配置
  'pro-table': {
    addIndexColumn: true,
    immediateSearch: true,
    bordered: true,
    pagination: { showTotal: total => `共 ${total} 条`, showSizeChanger: true },
  },
  // 全局 Input 默认配置
  input: { allowClear: true, maxlength: 200 },
  // 全局 Select 默认配置
  select: { allowClear: true, placeholder: '请选择' },
  // 全局 DatePicker 默认配置
  'date-picker': { style: { width: '100%' }, format: 'YYYY-MM-DD' },
};
</script>

<template>
  <ProComponentProvider :component-vars="componentVars">
    <RouterView />
  </ProComponentProvider>
</template>
```

## API

### Props

| 属性            | 类型            | 说明                                        |
| --------------- | --------------- | ------------------------------------------- |
| `componentVars` | `ComponentVars` | 各组件的默认 Props 配置（见下方支持的 key） |
| `componentMap`  | `ComponentMap`  | 注册新增自定义组件，或覆盖内置原生组件      |

### 合并规则

- 全局配置通过 `provide/inject` 注入
- 子组件会将全局配置与局部 Props 深度合并
- 局部 Props 优先级更高

## ComponentVars 支持的 key

| Key                   | 对应组件                       | 类型说明                                                                                        |
| --------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `pro-table`           | ProTable                       | `TableProps` + `{ control, searchFormConfig, immediateSearch, addIndexColumn, tableContainer }` |
| `pro-form`            | ProForm                        | `FormProps`（排除 `form`、`grid`）+ `{ grid: GridProps }`                                       |
| `pro-form-item`       | 每个字段的 FormItem + GridItem | `FormItemProps` + `GridItemProps`（`span`、`xs`~`xxl`）+ `{ formItemContainer }`                |
| `input`               | Input                          | `ComponentProps<typeof Input>` + Base 组件公共属性                                              |
| `textarea`            | TextArea                       | `ComponentProps<typeof TextArea>` + Base                                                        |
| `input-password`      | InputPassword                  | `ComponentProps<typeof InputPassword>` + Base                                                   |
| `input-search`        | InputSearch                    | `ComponentProps<typeof InputSearch>` + Base                                                     |
| `input-number`        | InputNumber                    | `ComponentProps<typeof InputNumber>` + Base                                                     |
| `input-otp`           | InputOTP                       | `ComponentProps<typeof InputOTP>` + Base                                                        |
| `auto-complete`       | AutoComplete                   | `ComponentProps<typeof AutoComplete>` + Base                                                    |
| `select`              | Select                         | `ComponentProps<typeof Select>` + Base                                                          |
| `cascader`            | Cascader                       | `ComponentProps<typeof Cascader>` + Base                                                        |
| `date-picker`         | DatePicker                     | `ComponentProps<typeof DatePicker>` + Base                                                      |
| `date-picker.date`    | DatePicker (date 模式)         | 同上                                                                                            |
| `date-picker.week`    | DatePicker (week 模式)         | 同上                                                                                            |
| `date-picker.month`   | DatePicker (month 模式)        | 同上                                                                                            |
| `date-picker.year`    | DatePicker (year 模式)         | 同上                                                                                            |
| `date-picker.quarter` | DatePicker (quarter 模式)      | 同上                                                                                            |
| `range-picker`        | RangePicker                    | `ComponentProps<typeof RangePicker>` + Base                                                     |
| `time-picker`         | TimePicker                     | `ComponentProps<typeof TimePicker>` + Base                                                      |
| `time-range-picker`   | TimeRangePicker                | `ComponentProps<typeof TimeRangePicker>` + Base                                                 |
| `checkbox-group`      | CheckboxGroup                  | `ComponentProps<typeof CheckboxGroup>` + Base                                                   |
| `radio-group`         | RadioGroup                     | `ComponentProps<typeof RadioGroup>` + Base                                                      |
| `switch`              | Switch                         | `ComponentProps<typeof Switch>` + Base                                                          |
| `slider`              | Slider                         | `ComponentProps<typeof Slider>` + Base                                                          |
| `tree-select`         | TreeSelect                     | `ComponentProps<typeof TreeSelect>` + Base                                                      |
| `transfer`            | Transfer                       | `ComponentProps<typeof Transfer>` + Base                                                        |

> Base 公共属性包含：`valueFormatter`、`componentContainer`、`modelProp`、`componentClass`、`componentStyle`。

## 进阶：注册与覆盖组件

### 注册新组件

```vue
<script setup lang="ts">
import { ProComponentProvider } from '@qin-ui/antdv-next-pro';
import MyCustomUpload from '@/components/MyCustomUpload.vue';

const customComponents = {
  'custom-upload': MyCustomUpload,
};
</script>

<template>
  <ProComponentProvider :component-map="customComponents">
    <RouterView />
  </ProComponentProvider>
</template>
```

注册后，作用域内的 `ProForm` 可以在字段配置中直接写 `component: 'custom-upload'`。

### 覆盖默认组件

```vue
<script setup lang="ts">
import { ProComponentProvider } from '@qin-ui/antdv-next-pro';
import SafeInput from '@/components/SafeInput.vue';

const overrideComponents = {
  input: SafeInput,
};
</script>

<template>
  <ProComponentProvider :component-map="overrideComponents">
    <RouterView />
  </ProComponentProvider>
</template>
```

此时页面内所有声明为 `component: 'input'` 的字段，都会渲染为 `SafeInput` 组件。

## 扩展点与最佳实践（简版）

- 优先在 App 级包裹，避免重复配置
- 需要局部差异时，可在局部再次包裹覆盖
- 组件注册解决运行时渲染，类型提示请配合 TS 声明合并
