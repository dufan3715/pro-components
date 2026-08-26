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
const props = withDefaults(defineProps<Props>(), {
  component: undefined,
});
</script>

<template>
  <component
    :is="props.component"
    v-if="isVNode(props.component) || typeof props.component === 'function'"
    v-bind="$attrs"
  />
  <template v-else>{{ props.component }}</template>
</template>
