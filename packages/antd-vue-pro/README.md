# antd-vue-pro

> 二次封装 ant-design-vue 组件，提供 ProForm 和 ProTable 高级组件。

---

## ✨ 特性

- 🛡️ 基于 ant-design-vue 4+封装，支持 Vue 3.3+
- 🔥 提供 ProForm 和 ProTable 高级组件
- ⚙️ 支持表单字段动态生成、表格列动态配置

---

## 📦 安装

```javascript
npm i @qin-ui/antd-vue-pro
```

> 注意：2.0版本进行了逻辑重构，从v1.x 升级至 v2.x 版本有api调整，useForm/formData由ref调整为reactive

---

## 📚 组件文档

### 1. ProComponentProvider

组件接收参数名为component-vars的props，内部provide所接收的props供所有被包裹的组件inject

#### API

- Props

  | 参数名         | 说明              | 类型          | 默认值 |
  | -------------- | ----------------- | ------------- | ------ |
  | component-vars | 需要provide的配置 | ComponentVars |        |

### 2. ProForm

ProForm 是基于 Ant Design Vue Form 的高级表单封装，提供了更简洁的表单数据管理和字段配置方式。

#### 何时使用

- 需要通过配置生成表单而不是编写大量模板代码
- 需要表单字段的动态增减
- 需要统一表单布局和样式

::: tip 配合 useForm 使用
antd-vue-pro 导出了一个名为 `useForm` 的自定义 Hook，用于处理表单数据和字段配置， 配合`useForm` 可以更轻松地使用 ProForm。
:::

#### API

- Props

| 参数名 | 说明                                    | 类型                                                              | 默认值 |
| ------ | --------------------------------------- | ----------------------------------------------------------------- | ------ |
| form   | useForm 返回对象                        | Form                                                              | -      |
| grid   | 是否启用栅格布局                        | boolean \| [GridProps](https://antdv.com/components/grid-cn/#api) | -      |
| ...    | 继承 Ant Design Vue Form 组件的所有参数 | [FormProps](https://antdv.com/components/form-cn/#form)           | -      |

- Events

| 事件名 | 说明                                    | 类型                                                                   |
| ------ | --------------------------------------- | ---------------------------------------------------------------------- |
| ...    | 继承 Ant Design Vue Form 组件的所有事件 | [FormEvents](https://antdv.com/components/form-cn/#%E4%BA%8B%E4%BB%B6) |

- Methods

| 方法名 | 说明                                    | 类型                                                                    |
| ------ | --------------------------------------- | ----------------------------------------------------------------------- |
| ...    | 继承 Ant Design Vue Form 组件的所有方法 | [FormMethods](https://antdv.com/components/form-cn/#%E6%96%B9%E6%B3%95) |

### 3. ProTable

ProTable 是基于 Ant Design Vue Table 的高级表格封装，提供了搜索、分页等常用功能的集成。

#### 何时使用

- 需要通过配置生成表格而不是编写大量模板代码
- 需要集成搜索表单和工具栏
- 需要统一表格布局和样式

::: tip 配合 useTable 使用
antd-vue-pro 导出了一个名为 `useTable` 的自定义 Hook，用于处理表格数据和表格列配置， 配合`useTable` 可以更轻松地使用 ProTable。
:::

#### API

- Props

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

- Slots

| 插槽名      | 说明           |
| ----------- | -------------- |
| search-form | 自定义搜索表单 |
| button-bar  | 自定义按钮组   |
| toolbar     | 自定义工具栏   |
| table       | 自定义表格     |

## [更多使用示例和文档详细内容](https://dufan3715.github.io/pro-components/)
