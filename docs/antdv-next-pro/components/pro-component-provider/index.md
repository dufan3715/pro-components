# ProComponentProvider

全局组件配置提供者。

## 介绍

`ProComponentProvider` 允许在应用顶层统一配置所有 Pro 组件的默认属性，避免在每个组件上重复传入相同的 Props。

## API

### Props

| 属性     | 说明              | 类型                     | 默认值 |
| -------- | ----------------- | ------------------------ | ------ |
| proForm  | ProForm 全局配置  | `Partial<ProFormProps>`  | -      |
| proTable | ProTable 全局配置 | `Partial<ProTableProps>` | -      |

## 示例

```vue
<template>
  <ProComponentProvider
    :pro-table="{ addIndexColumn: true, immediateSearch: true }"
  >
    <App />
  </ProComponentProvider>
</template>
```
