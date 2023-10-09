<script lang="ts" setup>
import { isVNode } from 'vue';
import { SlotComponentType } from '../../types';

type Props = {
  component: SlotComponentType;
};
defineProps<Props>();
</script>

<template>
  <component
    :is="component"
    v-if="isVNode(component) || typeof component === 'function'" />
  <template v-else>{{ component }}</template>
</template>
