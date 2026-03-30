# ProTable

基于 `el-table` + `el-table-column` 的高级表格封装，支持搜索、分页、列显隐与列级渲染。

## 快速开始

```vue
<script setup lang="ts">
import { ProTable, useTable } from '@qin-ui/element-plus-pro';

const table = useTable({
  columns: [
    { prop: 'name', label: '姓名' },
    { prop: 'age', label: '年龄' },
  ],
  searchFields: [{ label: '姓名', path: 'name', component: 'input' }],
});

const search = async () => {
  // 拉取数据后更新 table.data / pageParam
};
</script>

<template>
  <ProTable :table="table" :search="search" />
</template>
```

## columns 协议

`columns` 采用 Element Plus 列定义为主，并保留 Pro 扩展字段：

- 原生字段：`prop`、`label`、`width`、`fixed`、`align`、`sortable`、`filters`、`filterMethod`
- 原生格式化：`formatter`
- Pro 扩展：`render(scope)`、`hidden`

渲染优先级：`render(scope)` > `formatter`。

## 数据源参数

- `ProTable` 透传 Element Plus 的 `data` 参数作为表格数据源
- `useTable` 支持 `data` 初始化数据
- `dataSource` 在 `element-plus-pro` 中不再对外支持

## 使用示例

- [基础表格](./demos/basic/)
- [表格配置项](./demos/configurable/)
- [Columns 渲染（formatter + render）](./demos/columns-render/)
