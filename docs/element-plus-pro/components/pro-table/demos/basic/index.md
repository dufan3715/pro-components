---
aside: false
---

# 基础表格

基础表格示例展示了 element-plus-pro ProTable 的基本使用。

<script setup>
import Demo from './demo.vue'
</script>

::: info 表格的基本使用

1. 定义表格行数据类型（可选）
2. 使用 **useTable** 创建 table 对象并配置 `columns` 与 `searchFields`
3. 定义 **search** 方法，更新 `table.data` 与 `pageParam.total`
4. 向 **ProTable** 传入 `table` 与 `search`

:::

### 表格展示

<br />
<Demo />

### 代码实现

<<< ./demo.vue
