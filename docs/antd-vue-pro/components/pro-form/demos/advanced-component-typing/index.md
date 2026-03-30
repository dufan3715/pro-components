# 高级：拓展、覆盖组件

本示例展示如何在 ProForm 中**拓展自定义组件**并**覆盖内置组件类型提示**，对应 `/antd-vue-pro/components/pro-form/#高级-typescript-类型推导与覆盖` 的进阶用法。

<script setup>
import Demo from './demo.vue'
</script>

::: info 关键思路

1. 运行时：使用 `ProComponentProvider` 注册 `componentMap`，让 `component: 'text'` 能正确渲染。
2. 类型提示：通过 **声明合并** 扩展 `ComponentMap`，让字段 `component` 自动获得类型推导。
3. 覆盖提示：在 `ComponentMap` 中重写 `input`，即可替换默认组件的 Props 类型提示。
4. 全局默认：通过 `componentVars` 设置 `text` 的 `modelProp` 默认值。

:::

### 表单展示

<br />
<Demo />

### 代码实现

<<< ./demo.vue

### CustomInput 代码实现

<<< ../custom-component/CustomInput.vue

### 类型声明示例

```ts
import 'antd-vue-pro';
import type CustomInput from '../custom-component/CustomInput.vue';
import type { TypographyText } from 'ant-design-vue';

declare module 'antd-vue-pro' {
  interface ComponentMap {
    text: typeof TypographyText;
    input: typeof CustomInput;
  }
}
```
