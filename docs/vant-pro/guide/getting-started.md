# 快速开始

## 安装

首先确保你已经安装了 `vant`。

```bash
npm install vant @qin-ui/vant-pro
# 或者
yarn add vant @qin-ui/vant-pro
# 或者
pnpm add vant @qin-ui/vant-pro
```

## 全局引入

在 `main.ts` 中引入样式和组件：

```typescript
import { createApp } from 'vue';
import App from './App.vue';
import Vant from 'vant';
import 'vant/lib/index.css';

const app = createApp(App);

app.use(Vant);
app.mount('#app');
```

## 按需引入（局部）

直接在需要的地方导入 `@qin-ui/vant-pro` 暴露出的钩子和组件，通过 `useForm` 进行表单开发。

```vue
<template>
  <ProForm :form="form" />
</template>

<script setup lang="ts">
import { useForm, ProForm } from '@qin-ui/vant-pro';

type FormData = { name: string };

const form = useForm<FormData>({}, [
  {
    path: 'name',
    label: '姓名',
    component: 'field',
    placeholder: '请输入姓名',
  },
]);
</script>
```
