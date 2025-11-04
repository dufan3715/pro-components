<script lang="ts" setup>
import { ComponentVars } from '../types';
import { INJECT_CONFIG } from '../constants';
import { provide } from 'vue';
import { getObject } from '../../../shared/utils';

defineOptions({
  inheritAttrs: false,
});

type Props = {
  componentVars: ComponentVars;
};

const props = defineProps<Props>();

if (props.componentVars) {
  Object.entries(props.componentVars).forEach(([key, val]) => {
    const config = INJECT_CONFIG[key as keyof ComponentVars];
    if (!config) return;
    provide(config.injectionKey, { ...config.default, ...getObject(val) });
  });
}
</script>

<template>
  <slot />
</template>
