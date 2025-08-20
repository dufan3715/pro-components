---
aside: false
---

# 基础表格

示例展示了ProTable的基本使用。

<script setup>
import Demo from './demo.vue'
</script>

::: info 表格的基本使用

1. 定义表格行数据类型（可选）
2. 使用**useTable** hook创建table对象
3. 定义表格数据获取方法**search**
4. 向**ProTable**表格组件传入创建的table对象和search方法

:::

### 表格展示

<br />

<Demo />

### 代码实现

<<< ./demo.vue
