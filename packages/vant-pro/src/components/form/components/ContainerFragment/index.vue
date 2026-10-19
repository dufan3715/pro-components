<script lang="ts" setup>
/**
 * 容器分片渲染组件：为表单行或表单项动态渲染外部包裹容器（如 `CellGroup`、`Cell` 等布局容器）。
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

defineProps<Props>();

defineOptions({ name: 'ContainerFragment', inheritAttrs: false });
</script>

<template>
  <component :is="component" v-if="component" v-bind="$attrs">
    <slot />
  </component>
  <slot v-else />
</template>
