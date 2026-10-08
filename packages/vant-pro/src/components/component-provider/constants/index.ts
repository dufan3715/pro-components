import type { RequiredComponentVars } from '../types';
import type { InjectionKey, Component } from 'vue';
import { type ComputedRef } from 'vue';

export type InjectConfigEntry<T = any> = {
  injectionKey: InjectionKey<T>;
  default: T;
};

export const INJECT_CONFIG: {
  [key in keyof RequiredComponentVars]: {
    injectionKey: InjectionKey<RequiredComponentVars[key]>;
    default: RequiredComponentVars[key];
  };
} = {
  'pro-form': {
    injectionKey: Symbol(''),
    default: {
      inputAlign: 'right',
      errorMessageAlign: 'right',
      required: 'auto',
      scrollToError: true,
      scrollToErrorPosition: 'nearest',
    },
  },
  field: {
    injectionKey: Symbol(''),
    default: { clearable: true },
  },
  switch: {
    injectionKey: Symbol(''),
    default: {},
  },
  stepper: {
    injectionKey: Symbol(''),
    default: {},
  },
  rate: {
    injectionKey: Symbol(''),
    default: {},
  },
  slider: {
    injectionKey: Symbol(''),
    default: {},
  },
  uploader: {
    injectionKey: Symbol(''),
    default: {},
  },
  'checkbox-group': {
    injectionKey: Symbol(''),
    default: {},
  },
  'radio-group': {
    injectionKey: Symbol(''),
    default: {},
  },
  picker: {
    injectionKey: Symbol(''),
    default: {},
  },
  'date-picker': {
    injectionKey: Symbol(''),
    default: {},
  },
  'time-picker': {
    injectionKey: Symbol(''),
    default: {},
  },
  cascader: {
    injectionKey: Symbol(''),
    default: {},
  },
  area: {
    injectionKey: Symbol(''),
    default: {},
  },
  signature: {
    injectionKey: Symbol(''),
    default: {},
  },
  button: {
    injectionKey: Symbol(''),
    default: {},
  },
};

export const INJECT_COMPONENTS: InjectionKey<
  | ComputedRef<Partial<Record<string, Component>> | undefined>
  | Partial<Record<string, Component>>
> = Symbol('INJECT_COMPONENTS');

const DYNAMIC_INJECT_CONFIG: Record<string, InjectConfigEntry> =
  Object.create(null);

const ANONYMOUS_INJECT_CONFIG: InjectConfigEntry = {
  injectionKey: Symbol('anonymous:config'),
  default: {},
};

export const getInjectConfig = (key?: any): InjectConfigEntry => {
  if (!key || typeof key !== 'string') {
    return ANONYMOUS_INJECT_CONFIG;
  }
  return ensureInjectConfig(key);
};

export const ensureInjectConfig = (key: string): InjectConfigEntry => {
  const existing =
    (INJECT_CONFIG as Record<string, InjectConfigEntry>)[key] ||
    DYNAMIC_INJECT_CONFIG[key];
  if (existing) return existing;
  const created: InjectConfigEntry = {
    injectionKey: Symbol(`dynamic:${key}`),
    default: {},
  };
  DYNAMIC_INJECT_CONFIG[key] = created;
  return created;
};
