<script lang="ts" setup>
/**
 * @component ProComponentProvider
 * @description @qin-ui/vant-pro 全局配置提供者组件
 *
 * 用于在组件树的顶层配置所有子组件的全局默认属性。
 *
 * @param {ComponentVars} [componentVars] - 组件全局配置变量
 * @param {Record<ComponentName, any>} [componentMap] - 自定义组件映射
 * @param {Partial<ProLocale>} [locale] - 内置文案覆盖，可覆盖任意 locale 文案（如占位符等）
 *
 * @slot default - 子组件内容
 *
 * @example
 * ```vue
 * <ProComponentProvider
 *   :componentVars="{ 'field': { placeholder: '请输入' } }"
 * >
 *   <ProForm :form="form" />
 * </ProComponentProvider>
 * ```
 
 * @public
 */
import type { ComponentVars } from '../types';
import {
  INJECT_CONFIG,
  INJECT_COMPONENTS,
  ensureInjectConfig,
} from '../constants';
import { computed, provide, toValue } from 'vue';
import { getObject } from '../../../shared/core';
import type { ComponentName } from '../../form/constants';
import { LOCALE_INJECT_KEY, type ProLocale } from '../../../locale';

type ComponentMap = Partial<Record<ComponentName | (string & {}), any>>;

defineOptions({
  name: 'ProComponentProvider',
  inheritAttrs: false,
});

type Props = {
  /** 组件全局配置，可配置所有内置组件的默认属性 */
  componentVars?: ComponentVars;
  /** 自定义组件映射，用于替换或扩展内置组件 */
  componentMap?: ComponentMap;
  /**
   * 内置文案覆盖，可覆盖任意 locale 文案（如占位符等），
   * 未覆盖的文案默认跟随宿主组件库语言自动切换
   */
  locale?: Partial<ProLocale>;
};

const props = defineProps<Props>();

/*
 * 遍历 componentVars 的每个 key，获取或创建对应的 inject 配置
 * 将用户提供的值合并到默认值上，通过 provide 响应式注入到子组件树
 * 子组件通过 inject(config.injectionKey) 获取合并后的计算属性配置
 */
(Object.keys(INJECT_CONFIG) as Array<keyof typeof INJECT_CONFIG>).forEach(
  key => {
    const config = INJECT_CONFIG[key];
    provide(
      config.injectionKey as any,
      computed(() => ({
        ...config.default,
        ...getObject(
          toValue(props.componentVars)?.[key as keyof ComponentVars]
        ),
      }))
    );
  }
);

// 为内置集合之外的 componentVars 自定义 key 补建同构注入通道
if (props.componentVars) {
  Object.keys(props.componentVars).forEach(key => {
    if (!(key in INJECT_CONFIG)) {
      const config = ensureInjectConfig(key);
      provide(
        config.injectionKey as any,
        computed(() => ({
          ...config.default,
          ...getObject((props.componentVars as any)?.[key]),
        }))
      );
    }
  });
}

// 注入自定义组件映射，BaseField 在解析组件时会优先使用此映射
provide(
  INJECT_COMPONENTS,
  computed(() => props.componentMap)
);

// 注入内置文案覆盖，useLocale 在解析文案时会优先使用
provide(
  LOCALE_INJECT_KEY,
  computed(() => props.locale)
);
</script>

<template>
  <slot />
</template>
