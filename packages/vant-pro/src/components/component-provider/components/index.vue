<script lang="ts" setup>
/**
 * 全局配置提供者组件
 *
 * @component ProComponentProvider
 * @description 在组件树的顶层配置所有子组件的全局默认属性。
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
 *
 * @public
 */
import {
  INJECT_CONFIG,
  INJECT_COMPONENTS,
  ensureInjectConfig,
} from '../constants';
import type { ComponentVars } from '../types';
import { computed, provide, toValue } from 'vue';
import { getObject, omit } from '../../../shared/core';
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
 * 内置组件名按各自注入 key 下发「默认值 + componentVars」的合并结果，不可注入键在注入层剔除；
 * 合并结果为响应式，子组件按注入 key 读取
 */
(Object.keys(INJECT_CONFIG) as Array<keyof typeof INJECT_CONFIG>).forEach(
  key => {
    const config = INJECT_CONFIG[key];
    const ignored = config.ignoreProps;
    provide(
      config.injectionKey as any,
      computed(() =>
        omit(
          {
            ...config.default,
            ...getObject(
              toValue(props.componentVars)?.[key as keyof ComponentVars]
            ),
          },
          ignored ?? []
        )
      )
    );
  }
);

// 为内置集合之外的 componentVars 自定义 key 补建同构注入通道（按 setup 期的 key 集合登记）
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
