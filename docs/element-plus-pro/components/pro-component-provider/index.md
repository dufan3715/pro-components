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
  <ProComponentProvider :componentVars="componentVars">
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

## 内置文案语言切换 (locale)

组件内置文案（查询、重置、序号、占位符、共 X 条等）默认跟随宿主应用 `el-config-provider :locale` 自动切换，内置 zh-CN / zh-TW / en-US 三套语言，无需额外配置。

如需覆盖个别文案，可通过 `locale` prop 按 key 覆盖（未覆盖的 key 仍跟随语言切换）：

```vue
<template>
  <ProComponentProvider :locale="{ 'table.query': '搜索' }">
    <RouterView />
  </ProComponentProvider>
</template>
```

## 使用示例

- [基础使用](./demos/basic/)
- [内置文案语言切换](./demos/locale/)

## AI 编码工具适配

本组件承载的 `componentVars` / `componentMap` / `locale` 属于**项目级覆盖层**，优先级介于 Field 属性与库内置默认之间。包内 AI 上下文已要求 AI 编码工具在生成任何字段/列配置代码前，先搜索并读取项目源码中本组件的实际配置（机制说明见 [AI 编码助手接入指南](/ai-integration-guide.html)），因此项目修改配置后无需任何额外操作。
