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
