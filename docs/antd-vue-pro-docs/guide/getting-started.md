# 快速开始

antd-vue-pro是一个基于 Ant Design Vue 的高级组件库，提供了更强大的表单和表格功能。本文将指导您如何在项目中安装和使用。

## 环境准备

在开始之前，请确保您的开发环境满足以下要求：

- Vue 3.3+
- Ant Design Vue 4.x
- 现代浏览器（支持 ES6+）

## 安装

使用 npm 包安装：

::: code-group

```bash [npm]
# 使用 npm
npm install @qin-ui/antd-vue-pro
```

```bash [yarn]
# 使用 yarn
yarn add @qin-ui/antd-vue-pro
```

```bash [pnpm]
# 使用 pnpm
pnpm add @qin-ui/antd-vue-pro
```

:::

## 引入组件

- 方式一：按需引入（推荐）
  您可以只引入需要的组件：

```vue
<script setup>
import { ProForm, useForm } from '@qin-ui/antd-vue-pro';
</script>
```

- 方式二：全局引入
  在 main.js 或 main.ts 中全局注册组件：

```ts
import { createApp } from 'vue';
import App from './App.vue';
import ProComponents from '@qin-ui/antd-vue-pro';

const app = createApp(App);
app.use(ProComponents);
app.mount('#app');
```

## 使用

- [ProForm 组件文档](../components/pro-form/)
- [ProTable 组件文档](../components/pro-table/)
- [ProComponentProvider 组件文档](../components/pro-component-provider/)
