# 快速开始

antdv-next-pro 是一个基于 antdv-next 的高级组件库，提供了更强大的表单和表格功能。

## 环境准备

- Vue 3.5+
- antdv-next 1.x
- 现代浏览器（支持 ES6+）

## 安装

::: code-group

```bash [npm]
npm install @qin-ui/antdv-next-pro
```

```bash [yarn]
yarn add @qin-ui/antdv-next-pro
```

```bash [pnpm]
pnpm add @qin-ui/antdv-next-pro
```

:::

## 引入组件

- 方式一：按需引入（推荐）

```vue
<script setup>
import { ProForm, useForm } from '@qin-ui/antdv-next-pro';
</script>
```

- 方式二：全局引入

```ts
import { createApp } from 'vue';
import App from './App.vue';
import ProComponents from '@qin-ui/antdv-next-pro';

const app = createApp(App);
app.use(ProComponents);
app.mount('#app');
```

## 使用

- [ProForm 组件文档](../components/pro-form/)
- [ProTable 组件文档](../components/pro-table/)
- [ProComponentProvider 组件文档](../components/pro-component-provider/)
