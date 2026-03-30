# ProComponentProvider

通过 `componentVars` 和 `componentMap` 统一注入全局默认配置。

## 快速开始

```vue
<script setup lang="ts">
import { ProComponentProvider } from '@qin-ui/element-plus-pro';

const componentVars = {
  'pro-form': {
    grid: { gutter: 24 },
  },
  'pro-form-item': {
    span: 8,
  },
  'pro-table': {
    addIndexColumn: true,
    control: true,
    pagination: {
      layout: 'total, sizes, prev, pager, next, jumper',
    },
  },
  input: { clearable: true, placeholder: '请输入' },
  'input.textarea': { rows: 3, showWordLimit: true },
  select: { clearable: true, placeholder: '请选择' },
  'date-picker.daterange': { style: { width: '100%' } },
};
</script>

<template>
  <ProComponentProvider :component-vars="componentVars">
    <RouterView />
  </ProComponentProvider>
</template>
```

## 常用 key

- `pro-form`
- `pro-form-item`
- `pro-table`
- `input` / `input.password` / `input.textarea`
- `date-picker` / `date-picker.daterange` / `date-picker.datetimerange`
- `time-picker` / `time-select`

## 使用示例

- [基础使用](./demos/basic/)
