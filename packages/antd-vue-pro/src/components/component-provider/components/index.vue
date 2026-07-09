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

/*
 * 遍历 componentVars 的每个 key，获取或创建对应的 inject 配置
 * 将用户提供的值合并到默认值上，通过 provide 注入到子组件树
 * 子组件通过 inject(config.injectionKey) 获取合并后的配置
 */
if (props.componentVars) {
  Object.entries(props.componentVars).forEach(([key, val]) => {
    const config = ensureInjectConfig(key);
    // 用户配置覆盖默认值
    provide(config.injectionKey, { ...config.default, ...getObject(val) });
  });
}

// 注入自定义组件映射，BaseField 在解析组件时会优先使用此映射
if (props.componentMap) {
  provide(INJECT_COMPONENTS, props.componentMap);
}
</script>

<template>
  <slot />
</template>
