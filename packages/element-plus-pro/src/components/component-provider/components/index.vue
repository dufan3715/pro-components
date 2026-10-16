<script lang="ts" setup>
/**
 * 全局配置提供者组件
 *
 * @component ProComponentProvider
 * @public
 *
 * 用于在组件树的顶层配置所有子组件的全局默认属性。
 * 支持配置 ProForm、ProTable、ProFormItem 以及所有内置组件的默认属性。
 *
 * @param {ComponentVars} [componentVars] - 组件全局配置变量
 * @param {Record<ComponentName, any>} [componentMap] - 自定义组件映射，用于替换或扩展内置组件
 * @param {Partial<ProLocale>} [locale] - 内置文案覆盖，可覆盖任意 locale 文案（如查询/重置/序号/占位符等）
 *
 * @slot default - 需要应用全局配置的子组件内容
 *
 * @example
 * ```vue
 * <template>
 *   <ProComponentProvider
 *     :componentVars="{
 *       'pro-form': { grid: { gutter: 24 } },
 *       'input': { placeholder: '请输入', maxlength: 200 },
 *       'select': { placeholder: '请选择' },
 *     }"
 *   >
 *     <ProForm :form="form" />
 *   </ProComponentProvider>
 * </template>
 * ```
 */
import {
  INJECT_COMPONENTS,
  INJECT_CONFIG,
  ensureInjectConfig,
} from '../constants';
import type { ComponentVars } from '../types';
import { computed, provide } from 'vue';
import { getObject, omit } from '../../../shared/core';
import type { ComponentName } from '../../form/constants';
import { LOCALE_INJECT_KEY, type ProLocale } from '../../../locale';

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
  /**
   * @description 内置文案覆盖
   * 可覆盖任意 locale 文案（如查询/重置/序号/占位符等），
   * 未覆盖的文案默认跟随宿主组件库语言自动切换
   * @example { 'table.query': '搜索' }
   */
  locale?: Partial<ProLocale>;
};

const props = withDefaults(defineProps<Props>(), {
  componentVars: undefined,
  componentMap: undefined,
  locale: undefined,
});

/*
 * 遍历 componentVars 的每个 key，获取或创建对应的 inject 配置
 * 将用户提供的值合并到默认值上，剔除该注入项的不可注入键后通过 provide 响应式注入到子组件树
 * 子组件通过 inject(config.injectionKey) 获取合并后的计算属性配置
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
            ...getObject(props.componentVars?.[key as keyof ComponentVars]),
          },
          ignored ?? []
        )
      )
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
