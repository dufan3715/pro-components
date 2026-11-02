---
aside: false
---

# 单元格省略 Tooltip

示例展示 ProTable 的单元格溢出省略与共享 Tooltip。

<script setup>
import Demo from './demo.vue'
</script>

::: info 单元格省略 Tooltip

1. `ellipsisTooltip` 为 truthy 时，全局启用所有可转换列；
2. 关闭开关后，示例列未单独开启 `showTooltip`，因此不展示 Tooltip；
3. 操作列通过 `ellipsis: false` 退出全局启用，避免按钮被省略样式裁剪；
4. 仅文本横向溢出时展示 Tooltip。

:::

### 表格展示

<br />

<Demo />

### 代码实现

<<< ./demo.vue
