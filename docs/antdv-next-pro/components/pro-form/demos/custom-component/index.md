# 自定义组件使用

自定义组件使用示例展示了 ProForm 中如何使用自定义组件。

<script setup>
import Demo from './demo.vue'
</script>

::: info 两种使用方式

**方式1**：使用 Field 中的 **component** 属性，传入 `markRaw` 包裹的组件引用

**方式2**：使用 **ProForm 插槽**，以字段 `path` 为插槽名，接收字段 props 并自定义渲染

当同一字段同时使用两种方式时，**方式2（插槽）优先级更高**。

:::

### 表单展示

<br />
<Demo />

### 代码实现

<<< ./demo.vue

### CustomInput 代码实现

<<< ./CustomInput.vue
