import { InjectionKey } from 'vue';

/**
 * 表单注入 key
 * @description 用于在组件树中提供/注入表单实例
 */
export const InjectionFormKey: InjectionKey<any> = Symbol('form');

/**
 * 表单插槽注入 key
 * @description 用于在组件树中提供/注入表单动态插槽集合
 */
export const InjectionFormSlotsKey: InjectionKey<Record<string, any>> =
  Symbol('form-slots');

/**
 * 表单路径注入 key
 * @deprecated 仅用于旧版本 npm 包向前兼容解析
 */
export const InjectionPathKey: InjectionKey<any> = Symbol('path');
