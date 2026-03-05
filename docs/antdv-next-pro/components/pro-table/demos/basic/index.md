---
aside: false
---

# 基础表格

基础表格示例展示了 antdv-next-pro ProTable 的基本使用。

<script setup>
import Demo from './demo.vue'
</script>

::: info 表格的基本使用

1. 定义表格行数据类型（可选）
2. 使用 **useTable** hook 创建 table 对象，配置 `columns` 和 `searchFields`
3. 定义数据获取方法 **search**（更新 `dataSource` 和 `pageParam.total`）
4. 向 **ProTable** 传入 `table` 对象和 `search` 方法

:::

### 表格展示

<br />
<Demo />

### 代码实现

<<< ./demo.vue
