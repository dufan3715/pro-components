# @qin-ui/pro-components-core

> Pro Components 的核心逻辑层，不绑定任何具体 UI 组件库。

## 简介

`@qin-ui/pro-components-core` 是 [@qin-ui](https://github.com/dufan3715/pro-components) 系列组件库的公共逻辑底座，提供了 `ProForm` / `ProTable` 背后的状态管理与数据流实现，包括：

- **表单数据管理**（响应式数据、深层路径读写、批量更新）
- **字段配置管理**（增删改查、嵌套字段、查找函数）
- **底层 Form 组件实例引用**
- **表格实例管理**（列、数据源、分页、搜索表单集成）
- **通用工具函数**（`getObject`、`camelizeProperties` 等）

它本身不渲染任何 UI，而是与具体 UI 组件库配合使用：

| UI 库          | 对应组件包                                                                           |
| -------------- | ------------------------------------------------------------------------------------ |
| antdv-next     | [`@qin-ui/antdv-next-pro`](https://www.npmjs.com/package/@qin-ui/antdv-next-pro)     |
| Ant Design Vue | [`@qin-ui/antd-vue-pro`](https://www.npmjs.com/package/@qin-ui/antd-vue-pro)         |
| Element Plus   | [`@qin-ui/element-plus-pro`](https://www.npmjs.com/package/@qin-ui/element-plus-pro) |
| Vant           | [`@qin-ui/vant-pro`](https://www.npmjs.com/package/@qin-ui/vant-pro)                 |

通常你不需要直接安装本包，安装上述任一组件包时会自动作为依赖引入。仅在需要复用其纯逻辑能力（脱离 UI 框架使用表单/字段管理）时才直接依赖。

## 核心 API

| API           | 类型 | 说明                                         |
| ------------- | ---- | -------------------------------------------- |
| `useForm`     | Hook | 创建表单实例，组合数据、字段、ref 三层能力   |
| `useTable`    | Hook | 创建表格实例，管理列、数据源、分页、搜索表单 |
| `useFields`   | Hook | 字段配置增删改查（支持嵌套）                 |
| `useFormData` | Hook | 表单数据管理（响应式 + 深层路径）            |
| `useFormRef`  | Hook | 底层 Form 组件实例引用管理                   |
| `Form`        | 类型 | 表单实例类型                                 |
| `Table`       | 类型 | 表格实例类型                                 |

### 使用示例

```ts
import { useForm, useTable } from '@qin-ui/pro-components-core';

interface User {
  name: string;
  age: number;
}

// 创建表单实例（纯逻辑，可配合任意 UI 库使用）
const form = useForm<User>({ name: '张三', age: 25 }, [
  { path: 'name', label: '姓名' },
]);

form.formData.name; // '张三'（响应式）
form.setFormData('name', '李四');
form.getField('name'); // 获取字段配置
```

## 设计特点

- **逻辑与 UI 解耦**：核心 Hook 不依赖任何 UI 框架，由各组件包绑定具体 UI 库的类型（如 antdv-next 的 `FormInstance`）
- **类型安全**：完整的 TypeScript 类型推导，支持深层路径（`getFormData('address.city')`）
- **源码可跳转**：发布产物带 declaration map，IDE 中 Go to Definition 可直达源码

## 技术栈

- Vue 3.3+（依赖 `reactive` / `ref` / `provide` / `inject`）

## License

[MIT](./LICENSE)
