---
aside: false
---

# 列控制与持久化

示例展示了 ProTable 列控制配置（`control.columnControl`）与列显隐持久化（外部实现）。

<script setup>
import Demo from './demo.vue'
</script>

::: info 本示例包含

1. `labels`：为 label 为 vnode 的列提供下拉展示文本
2. `excludedKeys`：列不出现在列控制下拉中（如操作列，始终展示）
3. `disabledKeys`：列在下拉中显示但不可取消勾选（始终展示）
4. `disableCheckAll`：禁用全选
5. 持久化由外部实现：`watch(table.columns, ...)` 保存 + `table.setColumn` 恢复

:::

### 表格展示

<br />

<Demo />

### 代码实现

<<< ./demo.vue
