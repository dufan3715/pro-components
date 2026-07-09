<script lang="ts" setup>
/**
 * @component ProComponentProvider
 * @description @qin-ui/vant-pro 全局配置提供者组件
 *
 * 用于在组件树的顶层配置所有子组件的全局默认属性。
 *
 * @param {ComponentVars} [componentVars] - 组件全局配置变量
 * @param {Record<ComponentName, any>} [componentMap] - 自定义组件映射
 *
 * @slot default - 子组件内容
 *
 * @example
 * ```vue
 * <ProComponentProvider
 *   :componentVars="{ 'field': { placeholder: '请输入' } }"
 * >
 *   <ProForm :form="form" :fields="fields" />
 * </ProComponentProvider>
 * ```
 
 * @public
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
  /** 组件全局配置，可配置所有内置组件的默认属性 */
  componentVars?: ComponentVars;
  /** 自定义组件映射，用于替换或扩展内置组件 */
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
