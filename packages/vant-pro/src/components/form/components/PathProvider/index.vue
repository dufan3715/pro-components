<script lang="ts" setup>
import { computed, provide } from 'vue';
import { InjectionPathKey } from '../../constants';

const props = defineProps<{ path?: string | number | (string | number)[] }>();

const namePath = computed(() => {
  return Array.isArray(props.path)
    ? props.path.join('.')
    : (props.path as string | undefined);
});

provide(InjectionPathKey, namePath);
</script>

<template>
  <slot :path="namePath" />
</template>
