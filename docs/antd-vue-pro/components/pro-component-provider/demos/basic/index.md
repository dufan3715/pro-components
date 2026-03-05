---
aside: false
---

# pro-component-provider

示例展示了ProComponentProvider的基本使用。

<script setup>
import Demo from './demo.vue'
</script>

::: info 基本使用

1. 定义componentVars参数
2. 使用ProComponentProvider组件包裹ProForm、ProTable组件，并传入定义componentVars参数

可通过包裹项目App组件对全局Pro组件进行配置，在需要特殊化配置的场景下，可单独再包裹Pro组件传入参数进行配置覆盖

:::

### 示例展示

<br />
<Demo />

### 代码实现

<<< ./demo.vue{86-98}
