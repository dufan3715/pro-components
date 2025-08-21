<script lang="ts" setup>
import { isVNode } from 'vue';
import { SlotComponentType } from '../../types';

defineOptions({ name: 'SlotComponent', inheritAttrs: false });

type Props = {
  component?: SlotComponentType;
};
defineProps<Props>();
</script>

<template>
  <component
    :is="component"
    v-if="isVNode(component) || typeof component === 'function'"
    v-bind="$attrs"
  />
  <template v-else>{{ component }}</template>
</template>
