---
aside: false
---

# 内置文案语言切换

示例展示了 ProTable / ProForm 内置文案（查询、重置、序号、占位符、共 X 条等）如何跟随宿主组件库语言自动切换。

<script setup>
import Demo from './demo.vue'
</script>

::: info 实现方式

1. 通过 `el-config-provider :locale` 切换 element-plus 语言（zh-cn / zh-tw / en）
2. pro-components 内置文案自动跟随切换，无需任何额外配置
3. 如需覆盖个别文案，可通过 `ProComponentProvider :locale` 按 key 覆盖（如 `{ 'table.query': '搜索' }`）

:::

### 语言切换

<br />

<Demo />

### 代码实现

<<< ./demo.vue
