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

## API

### ProTable Props

| 参数名           | 说明                                                       | 类型                                                                               | 默认值 |
| ---------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------ |
| table            | useTable 返回对象                                          | Table                                                                              | -      |
| search           | 表格数据查询获取方法                                       | `() => Promise<unknown>`                                                           | -      |
| addIndexColumn   | 是否添加索引列                                             | boolean                                                                            | -      |
| immediateSearch  | onMounted 时立即触发一次 search 事件                       | boolean                                                                            | -      |
| control          | 是否展示表格 size 和 column 控制按钮，支持分别控制         | boolean \| `{ sizeControl: boolean; columnControl: boolean }`                      | -      |
| searchFormConfig | 搜索表单配置                                               | SearchFormConfig                                                                   | -      |
| tableContainer   | 表格容器包裹组件，会渲染在 Table 外层，需要有 default slot | Component \| false                                                                 | -      |
| columns          | 直接传入列配置（覆盖 useTable 的 columns）                 | Columns                                                                            | -      |
| data             | 直接传入数据源（覆盖 useTable 的 data）                    | Array                                                                              | -      |
| pagination       | 分页器配置，传 `false` 禁用                                | false \| Partial<PaginationProps>                                                  | -      |
| v-model:size     | 表格尺寸双向绑定                                           | `'large' \| 'default' \| 'small'`                                                  | -      |
| v-model:loading  | 加载状态双向绑定                                           | boolean                                                                            | -      |
| ...              | 继承 Element Plus Table 组件的所有参数                     | [TableProps](https://element-plus.org/zh-CN/component/table.html#table-attributes) | -      |

### ProTable Slots

| 插槽名      | 说明           |
| ----------- | -------------- |
| search-form | 自定义搜索表单 |
| button-bar  | 自定义按钮组   |
| toolbar     | 自定义工具栏   |
| table       | 自定义表格     |

其余 el-table 列插槽（如 `el-table-column` 的 `default`、`header` 等）也会透传到内部 Table 组件。

## 搜索表单

### searchFields

`useTable` 的 `searchFields` 复用 ProForm 的 `Field` 配置，用于生成搜索区域。

### searchFormConfig

搜索表单的行为配置，常用字段：

| 字段           | 说明                                                            |
| -------------- | --------------------------------------------------------------- |
| `layout`       | `'grid'`（网格布局）或 `'inline'`（行内布局），默认 `'grid'`    |
| `expand`       | 是否可展开/折叠：`boolean` 或 `{ minExpandRows, expandStatus }` |
| `hidden`       | 隐藏搜索表单                                                    |
| `container`    | 搜索区域容器组件或 `false`                                      |
| `searchButton` | 自定义查询按钮组件或 `false` 隐藏                               |
| `resetButton`  | 自定义重置按钮组件或 `false` 隐藏                               |
| `expandButton` | 自定义展开/折叠按钮组件或 `false` 隐藏                          |
| `rowGap`       | 网格布局行间距，默认 `16`                                       |
| `columnGap`    | 网格布局列间距，默认 `24`                                       |

其余字段会透传到内部的 `SearchForm`/`ProForm`。

## useTable

创建表格对象的 hook。基于 `@qin-ui/pro-components-core` 封装，适配 Element Plus 的 API 风格（数据源使用 `data` 而非 `dataSource`）。

### 参数

| 参数           | 类型             | 说明                                                        |
| -------------- | ---------------- | ----------------------------------------------------------- |
| `columns`      | `Columns<T>`     | 初始列配置                                                  |
| `data`         | `T[]`            | 初始数据源（Element Plus 使用 `data`）                      |
| `pageParam`    | `PageParam`      | 初始分页参数，默认 `{ current: 1, pageSize: 10, total: 0 }` |
| `searchParam`  | `DeepPartial<D>` | 初始搜索参数                                                |
| `searchFields` | `Fields<D>`      | 搜索表单字段配置（复用 ProForm 的 Field）                   |

> ⚠️ **注意**：element-plus-pro 使用 `data` 而非 `dataSource`。这是与 antdv-next-pro/antd-vue-pro 等其他包的命名差异。

### 返回值

| 属性/方法                               | 类型                  | 说明                                                         |
| --------------------------------------- | --------------------- | ------------------------------------------------------------ |
| `columns`                               | `Ref<Columns<T>>`     | 列配置数组（响应式）                                         |
| `data`                                  | `Ref<T[]>`            | 数据源数组（响应式），对应 Element Plus Table 的 `data` 属性 |
| `pageParam`                             | `Reactive<PageParam>` | 分页参数（响应式），包含 `current`、`pageSize`、`total`      |
| `searchForm`                            | `Form<D>`             | 搜索表单实例（useForm 返回值）                               |
| `setColumn(key, column, options?)`      | `-`                   | 设置/更新列配置，支持 `merge`/`rewrite`；column 支持函数式   |
| `deleteColumn(path, options?)`          | `-`                   | 删除列，`options.all` 批量删除                               |
| `appendColumn(path, column, options?)`  | `-`                   | 在指定列后追加，传 `undefined` 在末尾追加                    |
| `prependColumn(path, column, options?)` | `-`                   | 在指定列前插入，传 `undefined` 在开头插入                    |
| `setPageParam(pageParam)`               | `-`                   | 设置分页参数，支持部分更新和函数式 `(prev) => next`          |
| `resetQueryParams()`                    | `-`                   | 重置分页和搜索条件到初始值                                   |

## 使用示例

- [基础表格](./demos/basic/)
- [表格配置项](./demos/configurable/)
- [Columns 渲染（formatter + render）](./demos/columns-render/)
