<script lang="ts" setup>
import type { ContainerComponent } from '../../types';

type Props = {
  component?: ContainerComponent;
};

defineProps<Props>();

defineOptions({ name: 'ContainerFragment', inheritAttrs: false });
</script>

<template>
  <component :is="component" v-if="component" v-bind="$attrs">
    <slot />
  </component>
  <slot v-else />
</template>
