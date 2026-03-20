<script lang="ts" setup>
import { Input } from 'antdv-next';

defineProps<{ content?: string; placeholder?: string }>();
const emit = defineEmits<{ (e: 'update:content', val: string): void }>();
</script>

<template>
  <Input
    :value="content"
    :placeholder="placeholder || '自定义 text 组件（modelProp=content）'"
    @update:value="val => emit('update:content', val)"
  />
</template>
