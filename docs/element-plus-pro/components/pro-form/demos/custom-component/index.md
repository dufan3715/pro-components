# 自定义组件使用

展示 ProForm 中使用自定义组件的两种方式。

<script setup>
import Demo from './demo.vue'
</script>

::: info 两种使用方式

1. 在 `Field.component` 里直接传组件
2. 使用 ProForm 插槽（同名 path）覆盖渲染

当同字段同时存在两种方式时，插槽优先级更高。

:::

### 表单展示

<br />
<Demo />

### 代码实现

<<< ./demo.vue

### CustomInput 代码实现

<<< ./CustomInput.vue
