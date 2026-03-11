<script lang="ts" setup>
import { ComponentVars } from '../types';
import { INJECT_COMPONENTS, ensureInjectConfig } from '../constants';
import { provide } from 'vue';
import { getObject } from '../../../shared/core';
import { ComponentName } from '../../form/constants';

type ComponentMap = Partial<Record<ComponentName, any>>;
defineOptions({
  inheritAttrs: false,
});

type Props = {
  componentVars?: ComponentVars;
  componentMap?: ComponentMap;
};

const props = defineProps<Props>();

if (props.componentVars) {
  Object.entries(props.componentVars).forEach(([key, val]) => {
    const config = ensureInjectConfig(key);
    provide(config.injectionKey, { ...config.default, ...getObject(val) });
  });
}

/**
 * 注册或重写自定义组件
 */
if (props.componentMap) {
  provide(INJECT_COMPONENTS, props.componentMap);
}
</script>

<template>
  <slot />
</template>
