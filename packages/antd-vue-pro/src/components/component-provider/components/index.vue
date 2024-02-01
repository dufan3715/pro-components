<script lang="ts" setup>
import { ComponentVars } from '../types';
import { useProviderProps } from '../hooks';
import { INJECT_KEYS } from '../constants';

type Props = {
  componentVars: ComponentVars;
};

const props = defineProps<Props>();

if (props.componentVars) {
  Object.entries(props.componentVars).forEach(([key, val]) => {
    const injectKey = INJECT_KEYS[key as keyof ComponentVars];
    useProviderProps(injectKey, val);
  });
}
</script>

<template>
  <slot />
</template>
