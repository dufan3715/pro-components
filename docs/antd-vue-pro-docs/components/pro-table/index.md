# Pro Table

ProTable 是基于 Ant Design Vue Table 的高级表格封装，提供了搜索、分页等常用功能的集成。

## 何时使用

- 需要通过配置生成表格而不是编写大量模板代码
- 需要集成搜索表单和工具栏
- 需要统一表格布局和样式

::: tip 配合 useTable 使用
antd-vue-pro 导出了一个名为 `useTable` 的自定义 Hook，用于处理表格数据和表格列配置， 配合`useTable` 可以更轻松地使用 ProTable。
:::

## API

### Props

| 参数名           | 说明                                                      | 类型                                                     | 默认值 |
| ---------------- | --------------------------------------------------------- | -------------------------------------------------------- | ------ |
| table            | useTable返回对象                                          | Object                                                   | -      |
| search           | 表格数据查询获取方法                                      | Function                                                 | -      |
| addIndexColumn   | 是否添加索引列                                            | boolean                                                  | -      |
| immediateSearch  | onMounted 时立即触发一次search事件                        | boolean                                                  | -      |
| control          | 是否展示表格 size 和 column 控制按钮                      | boolean                                                  | -      |
| searchFormConfig | 索栏查询字段表单配置                                      | Object                                                   | -      |
| tableContainer   | 表格容器包裹组件，会渲染在Table的外层，需要有default slot | Component                                                | -      |
| ...              | 继承 Ant Design Vue Table 组件的所有参数                  | [TableProps](https://antdv.com/components/table-cn/#api) | -      |

### Slots

| 插槽名      | 说明           |
| ----------- | -------------- |
| search-form | 自定义搜索表单 |
| button-bar  | 自定义按钮组   |
| toolbar     | 自定义工具栏   |
| table       | 自定义表格     |

## 默认配置

通过 `pro-component-provider` 提供的默认配置：
