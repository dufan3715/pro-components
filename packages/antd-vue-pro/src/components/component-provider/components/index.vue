<script lang="ts" setup>
import { provide } from 'vue';
import { ComponentVars } from '../types';
import { INJECT_COMPONENT_PROPS_KEYS as formInjectKeys } from '../../form';

type Props = {
  componentVars: ComponentVars;
};

const props = defineProps<Props>();

if (props.componentVars) {
  Object.values(props.componentVars).forEach(item => {
    const injectKeys: Record<string, any> = { ...formInjectKeys };
    Object.entries(item).forEach(([key, value]) => {
      if (Object.hasOwn(injectKeys, key)) {
        provide(injectKeys[key], value);
      }
    });
  });
}
</script>

<template>
  <slot />
</template>
