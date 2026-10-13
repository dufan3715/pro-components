import type { InjectionKey, ShallowRef } from 'vue';

/** 表单实例的注入 key（组件树 provide / inject） */
export const InjectionFormKey: InjectionKey<any> = Symbol('form');

/** 表单动态插槽集合的注入 key */
export const InjectionFormSlotsKey: InjectionKey<
  ShallowRef<Record<string, any>>
> = Symbol('form-slots');
