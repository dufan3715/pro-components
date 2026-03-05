# 基础表单

基础表单示例展示了ProForm的基本使用。

<script setup>
import Demo from './demo.vue'
</script>

::: info 表单的基本使用

1. 定义表单数据类型（可选，定义数据类型后创建和使用表单对象会有字段path推断提示）
2. 使用 **useForm** hook 创建表单对象
3. 向 **ProForm** 表单组件传入创建的表单对象

:::

### 表单展示

<br />
<Demo />

### 代码实现

<<< ./demo.vue
