---
aside: false
---

# ProComponentProvider 基础使用

示例展示 ProComponentProvider 的基础使用与全局默认配置注入能力。

<script setup>
import Demo from './demo.vue'
</script>

::: info 基本使用

1. 定义 `componentVars` 参数
2. 使用 ProComponentProvider 统一包裹 ProForm、ProTable 并注入默认配置
3. 观察全局配置对字段组件与表格搜索区的整体影响

:::

### 示例展示

<br />
<Demo />

### 代码实现

<<< ./demo.vue
