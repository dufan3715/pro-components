# 自定义组件使用

自定义组件使用示例展示了ProForm中如何使用自定义组件。

<script setup>
import Demo from './demo.vue'
</script>

::: info 自定义组件使用

方式1. 使用Field中 **component** 属性

方式2. 使用 **ProForm插槽**

对同一个字段同时使用方式1和方式2时，方式2 **ProForm插槽** 的优先级高于方式1 **component** 属性配置

:::

### 表单展示

<br />
<Demo />

### 代码实现

<<< ./demo.vue

### CustomInput 代码实现

<<< ./CustomInput.vue
