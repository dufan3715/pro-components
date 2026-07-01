# @qin-ui/pro-components

> 基于 Vue 3 + TypeScript 的低代码配置驱动组件库，支持多种 UI 框架适配。

## 项目结构

此 monorepo 包含以下包：

| 包名                       | UI 框架           | npm 发布           |
| -------------------------- | ----------------- | ------------------ |
| `@qin-ui/core`             | 无（核心逻辑）    | 否（被 UI 层内联） |
| `@qin-ui/antd-vue-pro`     | ant-design-vue v4 | 是                 |
| `@qin-ui/antdv-next-pro`   | antdv-next        | 是                 |
| `@qin-ui/element-plus-pro` | element-plus      | 是                 |
| `@qin-ui/vant-pro`         | vant v4           | 是                 |

## 核心 API 概览

### `useForm<D>(initFormData?, initFields?, root?)`

创建表单实例，返回表单数据操作和字段操作方法。

```typescript
interface User {
  name: string;
  age: number;
}

const form = useForm<User>(
  { name: '张三', age: 25 },
  [{ path: 'name', label: '姓名', component: 'input' }],
  true
);

// 数据操作
form.formData; // 响应式表单数据
form.getFormData('name'); // '张三'
form.setFormData('name', '李四');
form.setFormData({ name: '王五', age: 30 }); // 批量设置

// 字段操作
form.fields; // 字段配置数组（响应式）
form.getField('name'); // 获取字段配置
form.setField('name', { label: '用户名' });
form.deleteField('age');
form.appendField('name', { path: 'email', label: '邮箱' });
form.prependField('name', { path: 'id', label: 'ID' });
form.getParentField('address.city'); // 获取父级字段
```

### `useTable<D, T>(params)`

创建表格实例，组合列管理、数据源、分页和搜索表单。

```typescript
interface SearchParams {
  keyword: string;
}
interface User {
  name: string;
  age: number;
}

const table = useTable<SearchParams, User>({
  columns: [
    { dataIndex: 'name', title: '姓名' }, // 推荐使用 dataIndex
    { dataIndex: 'age', title: '年龄', width: 80 },
  ],
  dataSource: [],
  pageParam: { current: 1, pageSize: 20, total: 0 },
  searchParam: { keyword: '' },
  searchFields: [{ path: 'keyword', label: '关键词', component: 'input' }],
});

// 列操作
table.setColumn('name', { title: '用户名' });
table.appendColumn('name', { dataIndex: 'email', title: '邮箱' });
table.deleteColumn('age');

// 分页操作
table.setPageParam({ current: 2 });
table.resetQueryParams();

// 搜索表单
table.searchForm.getFormData('keyword');
```

## ProComponentProvider 全局配置

全局配置提供者组件，用于配置所有子组件的默认属性。

```vue
<template>
  <ProComponentProvider
    :componentVars="{
      'pro-form': { labelCol: { span: 4 }, grid: { gutter: 24 } },
      'pro-form-item': { span: 8, validateFirst: true },
      input: { placeholder: '请输入', maxlength: 100 },
      select: { placeholder: '请选择', allowClear: true },
      'input-number': { placeholder: '请输入', controls: false },
    }"
    :componentMap="{
      'my-input': MyCustomInput,
    }"
  >
    <ProForm :form="form" :fields="fields" />
  </ProComponentProvider>
</template>
```

### componentVars 支持的配置项

| Key                    | 说明                                      |
| ---------------------- | ----------------------------------------- |
| `pro-form`             | ProForm 全局默认属性（如 grid 布局）      |
| `pro-table`            | ProTable 全局默认属性（如分页、搜索配置） |
| `pro-form-item`        | ProFormItem 全局默认属性（如 span 布局）  |
| `input`, `select`, ... | 各内置组件的默认属性                      |

### componentMap 自定义组件

替换或扩展内置组件，传入的组件会覆盖默认的同名组件。

## 字段配置（Field）

字段配置是 ProForm 的核心概念，每个字段是一个对象：

```typescript
// 基本字段
const field = {
  path: 'name', // 数据路径（类型安全）
  label: '姓名', // 标签，支持字符串或组件
  component: 'input', // 组件名（'input' | 'select' | 'date-picker' 等）
  hidden: false, // 是否隐藏
  disabled: false, // 是否禁用
  rules: [{ required: true, message: '必填' }], // 校验规则
  valueFormatter: (val: any, oldVal: any) => val?.trim(), // 值格式化
};

// 嵌套字段（分组）
const groupField = {
  path: 'address',
  label: '地址',
  fields: [
    // 嵌套子字段
    { path: 'city', label: '城市', component: 'input' },
    { path: 'street', label: '街道', component: 'input' },
  ],
  grid: true, // 嵌套字段启用网格布局
};
```

## 扩展自定义组件

```typescript
// 1. 类型扩展
declare module '@qin-ui/antd-vue-pro' {
  interface ComponentMap {
    'my-input': typeof MyInput;
  }
}

// 2. 配置中使用
const field = { path: 'field', component: 'my-input' };

// 或直接传入组件对象
const field = { path: 'field', component: MyInput };
```

## 表格列配置（Column）

```typescript
interface User {
  name: string;
  age: number;
}

const columns = [
  {
    dataIndex: 'name', // 优先使用 dataIndex
    title: '姓名',
    width: 120,
    fixed: 'left',
  },
  {
    key: 'action', // dataIndex 不满足时使用 key
    title: '操作',
    customRender: ({ record }) => html`<a>编辑</a>`,
  },
];
```
