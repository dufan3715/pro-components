---
aside: false
---

# 表格配置项

示例展示 ProTable 的拓展配置项与搜索区配置联动。

<script setup>
import Demo from './demo.vue'
</script>

::: info 表格拓展配置项

1. 是否在首列添加索引列
2. ProTable mounted 时，是否立即触发一次 search
3. 是否展示 `control`、`sizeControl`、`columnControl`
4. 查询表单配置 `searchFormConfig`：隐藏状态、布局、折叠展开等
5. 表格拓展插槽（`button-bar`、`toolbar`）展示

:::

### 表格展示

<br />
<Demo />

### 代码实现

<<< ./demo.vue
