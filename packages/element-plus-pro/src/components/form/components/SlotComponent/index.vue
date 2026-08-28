<script lang="ts" setup>
/**
 * @component SlotComponent
 * @description 插槽渲染辅助组件。用于在表单或表格的自定义插槽中动态渲染外部传入的 VNode、渲染函数或静态字符串。
 *
 * @public
 */
import { SlotComponentType } from '../../types';

defineOptions({ name: 'SlotComponent', inheritAttrs: false });

type Props = {
  component?: SlotComponentType;
};
defineProps<Props>();

// 可组件化渲染判定：VNode / 函数（含函数式组件）/ 组件定义对象；
// 其余（string/number/boolean/null/undefined）一律按文本渲染，
// 避免字符串返回值被 <component :is> 当作标签名解析
const isRenderable = (c: Props['component']) =>
  c !== null &&
  c !== undefined &&
  (typeof c === 'function' || typeof c === 'object');
</script>

<template>
  <component :is="component" v-if="isRenderable(component)" v-bind="$attrs" />
  <template v-else>{{ component }}</template>
</template>
