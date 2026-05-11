<script lang="ts" setup>
import { ComponentVars } from '../types';
import { INJECT_COMPONENTS, ensureInjectConfig } from '../constants';
import { provide } from 'vue';
import { getObject } from '../../../shared/core';
import { ComponentName } from '../../form/constants';

type ComponentMap = Partial<Record<ComponentName, any>>;

defineOptions({
  name: 'ProComponentProvider',
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
    const config = ensureInjectConfig(key);
    provide(config.injectionKey, { ...config.default, ...getObject(val) });
  });
}
</script>

<template>
  <slot />
</template>
