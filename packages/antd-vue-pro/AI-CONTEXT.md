# @qin-ui/antd-vue-pro

> 基于 ant-design-vue v4 的配置驱动表单和表格组件库。

## 安装

```bash
npm install @qin-ui/antd-vue-pro ant-design-vue vue
```

## 快速开始

```typescript
import { ProForm, ProTable } from '@qin-ui/antd-vue-pro';
import { useForm, useTable } from '@qin-ui/antd-vue-pro';
```

## 核心导出

### 组件

| 组件名                 | 描述             |
| ---------------------- | ---------------- |
| `ProForm`              | 配置驱动表单组件 |
| `ProTable`             | 配置驱动表格组件 |
| `ProComponentProvider` | 全局配置提供者   |

### Hooks

| Hook               | 描述         |
| ------------------ | ------------ |
| `useForm<D>()`     | 创建表单实例 |
| `useFields<D>()`   | 字段配置管理 |
| `useFormRef()`     | 表单组件引用 |
| `useTable<D, T>()` | 创建表格实例 |

## ProForm 使用

```vue
<template>
  <ProForm :form="form" @submit="onSubmit">
    <template #name="{ value }">
      <a-input :value="value" />
    </template>
  </ProForm>
</template>

<script setup lang="ts">
interface User {
  name: string;
  age: number;
}

const form = useForm<User>({ name: '张三' }, [
  { path: 'name', label: '姓名', component: 'input' },
  { path: 'age', label: '年龄', component: 'input-number' },
]);
</script>
```

## ProTable 使用

```vue
<template>
  <ProTable :table="table" />
</template>

<script setup lang="ts">
interface User {
  name: string;
  age: number;
}

const table = useTable({
  columns: [
    { dataIndex: 'name', title: '姓名' },
    { dataIndex: 'age', title: '年龄' },
  ],
  dataSource: [],
});
</script>
```

## 字段配置（Field）

每个字段支持以下属性：

- `path` - 数据路径（类型安全）
- `label` - 字段标签
- `component` - 组件名（内置支持: input, select, date-picker, cascader 等）
- `hidden` - 是否隐藏
- `disabled` - 是否禁用
- `rules` - 校验规则
- `valueFormatter` - 值格式化函数
- `fields` - 嵌套子字段
- `grid` - 网格布局
- `slots` - FormItem 插槽配置
- `componentStyle/componentClass` - 组件样式
- `componentContainer` - 组件容器包装
- `formItemStyle/formItemClass` - FormItem 样式
- `formItemContainer` - FormItem 容器包装
- `modelProp` - v-model 绑定属性名

完整类型定义见 `Field<ComponentName, D>`。

## 表格列配置（Column）

每列支持以下属性：

- `dataIndex` - 数据路径（优先使用）
- `key` - 列标识（dataIndex 不满足时使用）
- `hidden` - 是否隐藏
- 所有 ant-design-vue ColumnType 属性（title, width, fixed, align 等）

## 类型扩展

```typescript
declare module '@qin-ui/antd-vue-pro' {
  interface ComponentMap {
    'my-custom-component': typeof MyComponent;
  }
}
```
