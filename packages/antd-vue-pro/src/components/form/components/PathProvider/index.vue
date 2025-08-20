<script lang="ts" setup>
import { computed, provide } from 'vue';
import { PATH } from '../../constants';
import { NamePath } from '../../../../shared/ui';

const props = defineProps<{ path?: NamePath }>();

const namePath = computed(() => {
  return Array.isArray(props.path)
    ? props.path.join('.')
    : (props.path as string | undefined);
});

provide(PATH, namePath);
</script>

<template>
  <slot :path="namePath" />
</template>
