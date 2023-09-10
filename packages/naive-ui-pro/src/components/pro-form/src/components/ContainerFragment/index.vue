<script lang="ts" setup>
import { defineComponent } from 'vue';
import type { RenderComponentType } from '../../types';

type Props = {
  component?: RenderComponentType | ReturnType<typeof defineComponent>;
  path?: string;
};

const props = defineProps<Props>();

defineOptions({
  name: 'ContainerFragment',
});
</script>

<template>
  <component :is="props.component" v-if="props.component" :path="props.path">
    <slot />
  </component>
  <slot v-else />
</template>
