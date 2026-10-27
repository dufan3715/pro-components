# 联动逻辑处理

使用 computed、ref、watch 三种方式实现表单字段联动。

<script setup>
import Demo from './demo.vue'
</script>

::: info 三种联动方式

1. **vue computed**：字段的 `hidden/disabled` 等属性直接使用 `computed` 创建响应式计算属性
2. **vue ref**：使用 `ref` 变量绑定字段属性，并在事件回调中修改
3. **setField**：在 `watch` 中调用 `setField` 动态更新字段配置

:::

### 表单展示

<br />
<Demo />

### 代码实现

<<< ./demo.vue
