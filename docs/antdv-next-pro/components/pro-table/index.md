# ProTable

基于 antdv-next Table 的高级表格封装，集成搜索联动、分页、列显隐控制、尺寸切换等功能。

## 何时使用

- 需要通过配置生成表格而不是编写大量模板代码
- 需要集成搜索表单和工具栏
- 需要统一表格布局和样式

::: tip 配合 useTable 使用
antdv-next-pro 导出了一个名为 `useTable` 的自定义 Hook，用于处理表格数据和列配置，配合 `useTable` 可以更轻松地使用 ProTable。
:::

## 架构与数据流

![ProTable 架构图](/diagrams/ProTable.jpg)

ProTable 的核心结构可以理解为三块：

- `ProTable(BaseTable)` 负责整合 table props、搜索表单、控制按钮
- `SearchForm` 基于 `ProForm` 渲染搜索字段
- `UITable`（antdv-next Table）负责最终表格渲染

数据流的核心路径如下：

- `useTable` 生成 `columns` / `dataSource` / `pageParam` / `searchForm`
- `ProTable` 读取 `searchForm.fields` 决定是否展示搜索区域
- 调用 `search` 时触发加载，并根据分页更新再次请求
- `Table` 的 `onChange` 会同步 `pageParam` 并触发 `search`

## 快速开始

最小使用步骤：

1. 使用 `useTable` 创建表格对象
2. 传入 `search` 方法并渲染 `ProTable`

```vue
<script setup lang="ts">
import { ProTable, useTable } from '@qin-ui/antdv-next-pro';

type Row = { name: string; age: number };

const table = useTable<Row>({
  columns: [
    { title: '姓名', dataIndex: 'name' },
    { title: '年龄', dataIndex: 'age' },
  ],
  searchFields: [{ label: '姓名', path: 'name', component: 'input' }],
});

const search = async () => {
  // 请求数据并更新 table.dataSource
};
</script>

<template>
  <ProTable :table="table" :search="search" />
</template>
```

## API

### Props

| 参数名           | 说明                                                       | 类型                                                          | 默认值 |
| ---------------- | ---------------------------------------------------------- | ------------------------------------------------------------- | ------ |
| table            | useTable 返回对象                                          | Object                                                        | -      |
| search           | 表格数据查询获取方法                                       | Function                                                      | -      |
| addIndexColumn   | 是否添加索引列                                             | boolean                                                       | -      |
| immediateSearch  | onMounted 时立即触发一次 search 事件                       | boolean                                                       | -      |
| control          | 是否展示表格 size 和 column 控制按钮                       | boolean \| { sizeControl?: boolean; columnControl?: boolean } | -      |
| searchFormConfig | 搜索表单配置                                               | Object                                                        | -      |
| tableContainer   | 表格容器包裹组件，会渲染在 Table 外层，需要有 default slot | Component                                                     | -      |
| v-model:size     | 表格尺寸双向绑定                                           | 'large' \| 'middle' \| 'small'                                | -      |
| v-model:loading  | 加载状态双向绑定                                           | boolean                                                       | -      |
| ...              | 继承 antdv-next Table 组件的所有参数                       | [TableProps](https://antdv.com/components/table-cn/#api)      | -      |

### Slots

| 插槽名      | 说明           |
| ----------- | -------------- |
| search-form | 自定义搜索表单 |
| button-bar  | 自定义按钮组   |
| toolbar     | 自定义工具栏   |
| table       | 自定义表格     |

## 列配置（Column）

`Column` 基于 antdv-next `ColumnType` 扩展而来，常用字段如下：

| 字段        | 说明                            |
| ----------- | ------------------------------- |
| `dataIndex` | 列字段，支持路径数组            |
| `key`       | 列标识，默认由 `dataIndex` 推导 |
| `hidden`    | 是否隐藏该列                    |

其余字段均继承 antdv-next `ColumnType`。

## 搜索表单

### searchFields

`useTable` 的 `searchFields` 复用 ProForm 的 `Field` 配置，用于生成搜索区域。

### searchFormConfig

搜索表单的行为配置，常用字段：

| 字段           | 说明                       |
| -------------- | -------------------------- |
| `layout`       | `grid` 或 `inline`         |
| `expand`       | 是否可展开，或配置展开行数 |
| `hidden`       | 隐藏搜索表单               |
| `container`    | 搜索区域容器组件或 `false` |
| `searchButton` | 自定义搜索按钮组件         |
| `resetButton`  | 自定义重置按钮组件         |
| `expandButton` | 自定义展开按钮组件         |

其余字段会透传到内部的 `SearchForm`/`ProForm`。

## Types

- `Table`：`useTable` 的返回类型，包含 `columns` / `dataSource` / `pageParam` / `searchForm` 等
- `Column` / `Columns`：表格列配置类型，扩展 `ColumnType` 并新增 `hidden`
- `Fields`：搜索表单字段类型（复用 ProForm 的 `Field`）

## 扩展点与最佳实践（简版）

- 搜索表单复用 `Field` 配置，复杂联动请参考 ProForm 的字段策略
- 使用 `control` 开启列控制与尺寸切换
- 如需统一默认配置，可使用 `ProComponentProvider` 注入 `pro-table`
