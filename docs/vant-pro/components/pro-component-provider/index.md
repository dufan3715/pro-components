# ProComponentProvider

`ProComponentProvider` 用于提供全局共享的状态或组件配置。在移动端应用中，它可以用于挂载全局共享的弹窗容器，也可以为所有的表单内部组件提供统一的默认 Props 配置。

## API

### Props

| 属性          | 说明                                                                            | 类型                 | 默认值 |
| ------------- | ------------------------------------------------------------------------------- | -------------------- | ------ |
| componentVars | 各组件的默认全局属性配置，例如统一 `pro-form` 的 `inputAlign`、`required` 等    | `ComponentVars`      | `{}`   |
| componentMap  | 用于向作用域内部注册全局自定义组件。注册后可以在 `ProForm` 中通过字符串直接引用 | `ComponentMap`       | -      |
| locale        | 按 key 覆盖内置文案（如占位符等）                                               | `Partial<ProLocale>` | -      |

### Slots

| 插槽名称 | 说明 |
| -------- | ---- |
| default  | 内容 |

## 内置文案语言切换 (locale)

组件内置文案（如占位符「请输入」等）默认跟随宿主应用 vant `Locale.use(lang)` 自动切换，内置 zh-CN / zh-TW / en-US 三套语言，无需额外配置。

如需覆盖个别文案，可通过 `locale` prop 按 key 覆盖（未覆盖的 key 仍跟随语言切换）：

```vue
<template>
  <ProComponentProvider :locale="{ 'input.placeholder': 'Type here' }">
    <RouterView />
  </ProComponentProvider>
</template>
```

## 使用示例

- [内置文案语言切换](./demos/locale/)

## 注册全局组件

`componentMap` 参数允许你向 `ProComponentProvider` 下的作用域提供自定义组件，或者覆盖内置组件（如 `field` 的渲染行为）。这在解决**运行时渲染**时非常有用。

```vue
<script setup lang="ts">
import { ProComponentProvider } from '@qin-ui/vant-pro';
import MyUpload from './MyUpload.vue';
import MagicField from './MagicField.vue';

const customMap = {
  // 1. 扩充新的自定义组件标识
  'my-upload': MyUpload,

  // 2. 覆盖并接管内置的 field 渲染
  field: MagicField,
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

> **注意**：注册组件解决的是**运行时渲染**问题；如果你需要**开发时 TypeScript 类型提示**（比如配置 `component: 'my-upload'` 后自动带出 Params 校验），请参考 `ProForm` 文档中的 **高级：拓展、覆盖组件** 章节进行环境类型扩展。

## AI 编码工具适配

本组件承载的 `componentVars` / `componentMap` / `locale` 属于**项目级覆盖层**，优先级介于 Field 属性与库内置默认之间。包内 AI 上下文已要求 AI 编码工具在生成任何字段/列配置代码前，先搜索并读取项目源码中本组件的实际配置（机制说明见 [AI 编码助手接入指南](/ai-integration-guide.html)），因此项目修改配置后无需任何额外操作。
