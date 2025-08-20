---
aside: false
---

# 表格配置项

示例展示了ProTable的拓展配置项。

<script setup>
import Demo from './demo.vue'
</script>

::: info 表格拓展配置项

1. 是否在首例添加索引列
2. pro-table mounted时，立即触发一次search方法调用
3. 是否展示control、sizeControl、columnControl
4. 查询表单配置searchFormConfig，隐藏状态、布局、折叠展开等，拓展自ProForm
5. 表格拓展插槽展示

   ...更多配置项使用参照源代码类型定义

:::

### 表格展示

<br />

<Demo />

### 代码实现

<<< ./demo.vue
