# @qin-ui/element-plus-pro

基于 Element Plus 的 Pro 组件库，提供：

- `ProForm`
- `ProTable`
- `ProComponentProvider`
- `useForm`
- `useTable`

## 安装

```bash
pnpm add @qin-ui/element-plus-pro element-plus
```

## 快速使用

```ts
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';

const app = createApp(App);
app.use(ElementPlus);
app.mount('#app');
```

```vue
<script setup lang="ts">
import { ProTable, useTable } from '@qin-ui/element-plus-pro';

const table = useTable({
  columns: [
    { prop: 'name', label: '姓名' },
    { prop: 'age', label: '年龄' },
  ],
});
</script>

<template>
  <ProTable :table="table" />
</template>
```

## ProTable columns

`columns` 采用 Element Plus 列协议为主，支持：

- 原生列字段：`prop`、`label`、`width`、`fixed`、`align`、`sortable`、`filters`、`filterMethod`、`children`
- 原生 `formatter`
- Pro 扩展：`render(scope)`、`hidden`

渲染优先级：`render(scope)` > `formatter`。

数据源语义统一为 `data`，不再对外支持 `dataSource`。

## ProForm 组件键名

`component` 使用 Element 风格键名，例如：

- `input`（可配合 `type: 'textarea' | 'password'`）
- `input-number`
- `autocomplete`
- `select` / `cascader`
- `date-picker`（可配合 `type: 'date' | 'dates' | 'daterange' | 'datetimerange'` 等）
- `time-picker` / `time-select`
- `checkbox-group` / `radio-group`
- `switch` / `slider` / `tree-select` / `transfer`

默认 `modelProp` 为 `modelValue`。

## Peer Dependencies

- `vue` `^3.5.0`
- `element-plus` `^2.13.6`
