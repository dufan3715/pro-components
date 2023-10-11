<script lang="ts" setup>
import { defineComponent } from 'vue';
import type { RenderComponentType } from '../../types';

type Props = {
  component?: RenderComponentType | ReturnType<typeof defineComponent>;
  path?: string;
};

defineProps<Props>();

defineOptions({
  name: 'ContainerFragment',
});
</script>

<template>
  <component :is="component" v-if="component" :path="path">
    <slot />
  </component>
  <slot v-else />
</template>
