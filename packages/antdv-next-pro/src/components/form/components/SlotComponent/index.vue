<script lang="ts" setup>
/**
 * @component SlotComponent
 * @description 插槽渲染辅助组件。用于在表单或表格的自定义插槽中动态渲染外部传入的 VNode、渲染函数或静态字符串。
 *
 * @public
 */
import { isVNode } from 'vue';
import { SlotComponentType } from '../../types';

defineOptions({ name: 'SlotComponent', inheritAttrs: false });

type Props = {
  component?: SlotComponentType;
};
defineProps<Props>();
</script>

<template>
  <component
    :is="component"
    v-if="isVNode(component) || typeof component === 'function'"
    v-bind="$attrs"
  />
  <template v-else>{{ component }}</template>
</template>
