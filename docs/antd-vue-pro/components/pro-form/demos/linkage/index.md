# 联动逻辑

示例展示了ProForm中字段联动逻辑的处理方式。

<script setup>
import Demo from './demo.vue'
</script>

::: info 联动逻辑的处理方式

方式1. 使用 **vue computed** 进行依赖关联

方式2. 使用 **vue ref** 进行依赖关联

方式3. 使用 **vue watch** 动态调整字段配置

:::

### 表单展示

<br />
<Demo />

### 代码实现

<<< ./demo.vue
