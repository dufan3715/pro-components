# 高级：拓展、覆盖组件

当内置的组件无法满足所有需求时，你可能需要编写自己的自定义组件。虽然你可以使用 `component: 'custom'` 和传入渲染函数来解决，但如果你有一个全局复用的组件，你可能希望它像内置的 `field` 或 `picker` 一样被优雅地调用。

你可以通过在 `ProComponentProvider` 中注册 `componentMap` 来实现这一点，并通过 TypeScript 的**模块扩充**（Module Augmentation）来获得完美的类型提示。

<script setup>
import Demo from './demo.vue'
</script>

### 运行时渲染演示

<br />
<Demo />

### 1. 扩充类型定义

在你的项目中（例如 `src/typings/vant-pro.d.ts` 或 `env.d.ts` 中），对 `@qin-ui/vant-pro` 的 `ComponentMap` 接口进行声明合并。

```ts
// env.d.ts
import MyUploadComponent from '@/components/MyUpload.vue';
import { TextEllipsis } from 'vant';

declare module '@qin-ui/vant-pro' {
  // 扩充 ComponentMap
  interface ComponentMap {
    'my-upload': typeof MyUploadComponent;
    textEllipsis: typeof TextEllipsis;
  }
}
```

### 2. 代码实现

在运行时使用 `ProComponentProvider` 注入实际的组件实例，并使用 `useForm` 进行渲染：

<<< ./demo.vue
