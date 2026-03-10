# Pro Component Provider

ProComponentProvider 是一个提供全局组件配置的容器组件。通过该组件可以统一配置所有 Pro 组件的默认属性。

## 何时使用

- 需要为整个应用中的 Pro 组件设置统一的默认属性
- 希望减少重复配置，提高开发效率

## API

### Props

| 参数名        | 说明                                         | 类型          | 默认值 |
| ------------- | -------------------------------------------- | ------------- | ------ |
| componentVars | 需要 Provide 下发的属性默认配置              | ComponentVars | -      |
| componentMap  | 需要动态注册的自定义组件或欲覆盖的原生组件表 | ComponentMap  | -      |

## ComponentVars 配置项

ComponentVars 包含以下可配置组件：

- `pro-table`: ProTable 组件默认配置
- `pro-form`: ProForm 组件默认配置
- `pro-form-item`: ProFormItem 组件默认配置
- 各种表单字段组件如 `input`, `select`, `date-picker` 等

每种组件可以配置其对应的 Ant Design Vue 组件属性。

## 组件动态注册与覆盖 (componentMap)

除了提供默认配置，`ProComponentProvider` 还允许你将自己的业务组件注入到表单库系统内，或者拦截并覆盖已有的基础组件。

### 示例用法

```vue
<script setup lang="ts">
import { ProComponentProvider } from 'antd-vue-pro';
import MyUpload from '@/components/MyUpload.vue';
import MagicInput from '@/components/MagicInput.vue';

const customMap = {
  // 1. 扩充新的自定义组件标识
  'my-upload': MyUpload,

  // 2. 覆盖并接管内置的 input 渲染
  input: MagicInput,
};
</script>

<template>
  <!-- 向 Provider 下的作用域注入组件 -->
  <ProComponentProvider :component-map="customMap">
    <!-- 内部的 ProForm 此时可以通过 component: 'my-upload' 渲染新组件 -->
    <RouterView />
  </ProComponentProvider>
</template>
```

> **注意**：注册组件解决的是**运行时渲染**问题；如果你需要**开发时 TypeScript 类型提示**（比如配置 `component: 'my-upload'` 后自动带出 Params 校验），请参考 `ProForm` 文档中的 **高级：TypeScript 类型推导与覆盖** 章节进行环境类型扩展。
