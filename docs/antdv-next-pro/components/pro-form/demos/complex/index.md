---
aside: false
---

# 复杂表单

展示嵌套字段、分组布局和多栏网格布局的使用方式。

<script setup>
import Demo from './demo.vue'
</script>

::: info 复杂表单特性

- **grid 布局**：通过 `grid` prop 启用多栏（2/3/4列）自适应布局
- **嵌套字段**：通过 `fields` 配置子字段，实现表单分组
- **container**：每个字段可指定外层容器组件

:::

### 表单展示

<br />
<Demo />

### 代码实现

<<< ./demo.vue
