# ProTable

基于 antdv-next Table 的高级表格封装，集成搜索联动、分页、列显隐控制、尺寸切换等功能。

## 基础示例

::: demo 通过 useTable 创建表格对象，绑定到 ProTable
antdv-next-pro/components/pro-table/demos/basic
:::

## 高级配置示例

::: demo 搜索联动、列控制、尺寸控制、自定义搜索区域容器
antdv-next-pro/components/pro-table/demos/configurable
:::

## API

### useTable

```ts
import { useTable } from '@qin-ui/antdv-next-pro';

const table = useTable<DataType>({
  columns,
  dataSource,
  pageParam,
  searchParam,
  searchFields,
});
```

#### 参数

| 参数           | 类型             | 说明                                           |
| -------------- | ---------------- | ---------------------------------------------- |
| `columns`      | `Column<D>[]`    | 列配置（见下方 Column 说明）                   |
| `dataSource`   | `T[]`            | 静态数据源（不使用接口时）                     |
| `pageParam`    | `PageParam`      | 分页初始参数（`{ current, pageSize, total }`） |
| `searchParam`  | `DeepPartial<D>` | 搜索表单初始参数                               |
| `searchFields` | `Fields<D>`      | 搜索表单字段配置（与 ProForm Field 完全一致）  |

#### 返回值

| 属性                  | 类型                  | 说明                           |
| --------------------- | --------------------- | ------------------------------ |
| `columns`             | `Ref<Column<D>[]>`    | 响应式列配置                   |
| `dataSource`          | `Ref<T[]>`            | 响应式数据源                   |
| `searchForm`          | `Form<D>`             | 搜索表单实例（useForm 返回值） |
| `pageParam`           | `Reactive<PageParam>` | 当前分页参数                   |
| `setPageParam(param)` | `-`                   | 更新分页参数                   |
| `resetQueryParams()`  | `-`                   | 重置所有搜索条件和分页         |

---

### ProTable Props

| 属性               | 类型                                                            | 默认值  | 说明                                                                 |
| ------------------ | --------------------------------------------------------------- | ------- | -------------------------------------------------------------------- |
| `table`            | `Table<D>`                                                      | -       | `useTable` 返回的实例                                                |
| `search`           | `() => Promise<any>`                                            | -       | 触发数据查询的回调（分页变化、搜索、重置时自动调用）                 |
| `addIndexColumn`   | `boolean`                                                       | `false` | 在首列自动插入序号列（从 1 开始）                                    |
| `immediateSearch`  | `boolean`                                                       | `false` | 组件挂载后是否立即调用一次 `search`                                  |
| `control`          | `boolean \| { sizeControl?: boolean; columnControl?: boolean }` | `true`  | 是否显示右上角工具栏（尺寸切换 / 列显隐控制）                        |
| `searchFormConfig` | `SearchFormConfig`                                              | -       | 搜索区域配置（见下方）                                               |
| `tableContainer`   | `Component \| false`                                            | -       | 表格区域外层包裹容器，传 `false` 禁用默认容器                        |
| `v-model:size`     | `'large' \| 'middle' \| 'small'`                                | -       | 表格尺寸双向绑定                                                     |
| `v-model:loading`  | `boolean`                                                       | -       | 加载状态双向绑定                                                     |
| 其余               | `TableProps`                                                    | -       | 透传至 antdv-next `Table`（如 `bordered`、`scroll`、`rowSelection`） |

#### SearchFormConfig

| 属性        | 类型                                     | 说明                              |
| ----------- | ---------------------------------------- | --------------------------------- |
| `layout`    | `'inline' \| 'horizontal' \| 'vertical'` | 搜索表单布局                      |
| `grid`      | `boolean \| GridProps`                   | 是否启用 Grid 布局                |
| `expand`    | `boolean`                                | 是否展开全部搜索项                |
| `hidden`    | `boolean`                                | 是否完全隐藏搜索区域              |
| `container` | `Component \| false`                     | 搜索区域外层容器，传 `false` 禁用 |

### ProTable Slots

| 插槽名        | 说明                                                              |
| ------------- | ----------------------------------------------------------------- |
| `search-form` | 完全替换搜索区域                                                  |
| `button-bar`  | 表格右上角左侧按钮区                                              |
| `toolbar`     | 表格右上角右侧工具区（在 control 按钮左侧）                       |
| `table`       | 完全替换表格区域                                                  |
| 其余          | 透传至 antdv-next `Table` 所有插槽（如 `bodyCell`、`headerCell`） |

---

### Column 配置

`Column` 继承自 antdv-next `ColumnType`，并扩展了以下属性：

| 属性        | 类型         | 说明                                    |
| ----------- | ------------ | --------------------------------------- |
| `dataIndex` | `Path<D>`    | 支持 `'a.b.c'` 嵌套路径，IDE 有类型提示 |
| `key`       | `Path<D>`    | 列唯一标识                              |
| `hidden`    | `boolean`    | 是否在列控制面板中隐藏该列（不渲染）    |
| 其余        | `ColumnType` | 同 antdv-next Table Column 所有属性     |
