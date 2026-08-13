---
aside: false
---

# 内置文案语言切换

示例展示了 ProForm 内置占位符（请输入）如何跟随宿主组件库语言自动切换。

<script setup>
import Demo from './demo.vue'
</script>

::: info 实现方式

1. 通过 vant 的 `Locale.use(lang)` 切换语言（zh-CN / zh-TW / en-US）
2. pro-components 内置文案自动跟随切换，无需任何额外配置
3. 如需覆盖个别文案，可通过 `ProComponentProvider :locale` 按 key 覆盖（如 `{ 'input.placeholder': 'Type here' }`）

:::

### 语言切换

<br />

<Demo />

### 代码实现

<<< ./demo.vue
