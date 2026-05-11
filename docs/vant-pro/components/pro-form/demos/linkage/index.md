# 处理逻辑联动

在复杂表单中，经常会遇到字段之间的联动需求，例如“当选择了某个选项时，才显示另一个输入框”，或者“根据某个选项动态更改后续字段的配置”。

利用 `@qin-ui/core` 的 `useForm`，你可以轻松监听 `form.formData` 的变化，并通过 `form.setField` 响应式对象来实现联动。

<script setup>
import Demo from './demo.vue'
</script>

### 表单展示

<br />
<Demo />

### 代码实现

<<< ./demo.vue
