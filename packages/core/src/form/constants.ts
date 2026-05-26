import { ComputedRef, InjectionKey } from 'vue';

/**
 * 表单注入 key
 * @description 用于在组件树中提供/注入表单实例
 */
export const InjectionFormKey: InjectionKey<any> = Symbol('form');

/**
 * 路径注入 key
 * @description 用于在组件树中提供/注入当前字段路径
 */
export const InjectionPathKey: InjectionKey<ComputedRef<string | undefined>> =
  Symbol('path');
