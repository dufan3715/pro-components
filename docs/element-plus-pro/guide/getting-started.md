# 快速开始

## 环境准备

- Vue 3.5+
- Element Plus 2.13.6+

## 安装

::: code-group

```bash [npm]
npm install @qin-ui/element-plus-pro element-plus
```

```bash [yarn]
yarn add @qin-ui/element-plus-pro element-plus
```

```bash [pnpm]
pnpm add @qin-ui/element-plus-pro element-plus
```

:::

## 引入

```ts
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';

const app = createApp(App);
app.use(ElementPlus);
app.mount('#app');
```

```vue
<script setup lang="ts">
import {
  ProForm,
  ProTable,
  ProComponentProvider,
  useForm,
  useTable,
} from '@qin-ui/element-plus-pro';
</script>
```

## 文档入口

- [ProForm](../components/pro-form/)
- [ProTable](../components/pro-table/)
- [ProComponentProvider](../components/pro-component-provider/)
