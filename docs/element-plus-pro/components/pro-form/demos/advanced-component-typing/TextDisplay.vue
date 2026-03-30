<script lang="ts" setup>
defineProps<{ content?: string; placeholder?: string }>();
</script>

<template>
  <span class="text-display">
    {{ content || placeholder || '自定义 text 组件（modelProp=content）' }}
  </span>
</template>

<style scoped>
.text-display {
  color: #606266;
}
</style>
