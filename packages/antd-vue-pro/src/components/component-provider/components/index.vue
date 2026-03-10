<script lang="ts" setup>
import { ComponentVars } from '../types';
import { INJECT_CONFIG, INJECT_COMPONENTS } from '../constants';
import { provide, Component } from 'vue';
import { getObject, KeyExpandString } from '../../../shared/core';
import { ComponentName } from '../../form/constants';

type ComponentMap = Partial<Record<KeyExpandString<ComponentName>, Component>>;

defineOptions({
  inheritAttrs: false,
});

type Props = {
  componentVars?: ComponentVars;
  componentMap?: ComponentMap;
};

const props = defineProps<Props>();

if (props.componentMap) {
  provide(INJECT_COMPONENTS, props.componentMap);
}

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
