<script lang="ts" setup>
import { provide } from 'vue';
import { ComponentVars } from '../types';

type Props = {
  componentVars: ComponentVars;
};

const props = defineProps<Props>();

if (props.componentVars) {
  Object.values(props.componentVars).forEach(item => {
    Object.entries(item).forEach(([key, value]) => {
      provide(key, value);
    });
  });
}
</script>

<template>
  <slot />
</template>
