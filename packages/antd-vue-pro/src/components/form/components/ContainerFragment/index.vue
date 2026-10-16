<script lang="ts" setup>
/**
 * 容器分片渲染组件。用于动态渲染表单行或表单项的外部包裹容器（例如 Grid 行、Col 列等布局容器）。
 *
 * @component ContainerFragment
 *
 * @public
 */
import type { ContainerComponent } from '../../types';

type Props = {
  /** 容器组件，未提供时不渲染包裹层 */
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
