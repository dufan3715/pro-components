import { ComputedRef, InjectionKey } from 'vue';

// inject keys
export const InjectionFormKey: InjectionKey<any> = Symbol('form');
export const InjectionPathKey: InjectionKey<ComputedRef<string | undefined>> =
  Symbol('path');
