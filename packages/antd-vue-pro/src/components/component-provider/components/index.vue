<script lang="ts" setup>
/**
 * @component ProComponentProvider
 * @description @qin-ui/antd-vue-pro 全局配置提供者组件
 * @public
 *
 * 用于在组件树的顶层配置所有子组件的全局默认属性。
 * 支持配置 ProForm、ProTable、ProFormItem 以及所有内置组件的默认属性。
 *
 * @param {ComponentVars} [componentVars] - 组件全局配置变量
 * @param {Record<ComponentName, any>} [componentMap] - 自定义组件映射，用于替换或扩展内置组件
 *
 * @slot default - 需要应用全局配置的子组件内容
 *
 * @example
 * ```vue
 * <template>
 *   <ProComponentProvider
 *     :componentVars="{
 *       'pro-form': { labelCol: { span: 4 } },
 *       'input': { placeholder: '请输入', maxlength: 200 },
 *       'select': { placeholder: '请选择' },
 *     }"
 *   >
 *     <ProForm :form="form" :fields="fields" />
 *   </ProComponentProvider>
 * </template>
 * ```
 */
import { ComponentVars } from '../types';
import { INJECT_COMPONENTS, ensureInjectConfig } from '../constants';
import { provide } from 'vue';
import { getObject } from '../../../shared/core';
import { ComponentName } from '../../form/constants';

type ComponentMap = Partial<Record<ComponentName, any>>;

defineOptions({
  name: 'ProComponentProvider',
  inheritAttrs: false,
});

type Props = {
  /**
   * @description 组件全局配置
   * 可配置所有内置组件和 Pro 组件的默认属性
   * @example { 'input': { placeholder: '请输入' }, 'pro-form': { grid: { gutter: 24 } } }
   */
  componentVars?: ComponentVars;
  /**
   * @description 自定义组件映射
   * 用于替换或扩展内置组件，传入的组件会覆盖默认的同名组件
   * @example { 'input': MyCustomInput, 'select': MyCustomSelect }
   */
  componentMap?: ComponentMap;
};

const props = defineProps<Props>();

if (props.componentMap) {
  provide(INJECT_COMPONENTS, props.componentMap);
}

if (props.componentVars) {
  Object.entries(props.componentVars).forEach(([key, val]) => {
    const config = ensureInjectConfig(key);
    provide(config.injectionKey, { ...config.default, ...getObject(val) });
  });
}
</script>

<template>
  <slot />
</template>
