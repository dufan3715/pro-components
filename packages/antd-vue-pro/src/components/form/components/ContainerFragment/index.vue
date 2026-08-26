<script lang="ts" setup>
/**
 * @component ContainerFragment
 * @description 容器分片渲染组件。用于动态渲染表单行或表单项的外部包裹容器（例如 Grid 行、Col 列等布局容器）。
 *
 * @public
 */
import type { ContainerComponent } from '../../types';

type Props = {
  component?: ContainerComponent;
};

const props = withDefaults(defineProps<Props>(), {
  component: undefined,
});

defineOptions({ name: 'ContainerFragment', inheritAttrs: false });
</script>

<template>
  <component :is="props.component" v-if="props.component" v-bind="$attrs">
    <slot />
  </component>
  <slot v-else />
</template>
