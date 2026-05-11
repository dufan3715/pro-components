import { RequiredComponentVars } from '../types';
import { InjectionKey, Component } from 'vue';

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
    default: { clearable: true, placeholder: '请输入' },
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
  Partial<Record<string, Component>>
> = Symbol('INJECT_COMPONENTS');

const DYNAMIC_INJECT_CONFIG: Record<string, InjectConfigEntry> =
  Object.create(null);

export const getInjectConfig = (key: string): InjectConfigEntry | undefined => {
  return (
    (INJECT_CONFIG as Record<string, InjectConfigEntry>)[key] ||
    DYNAMIC_INJECT_CONFIG[key]
  );
};

export const ensureInjectConfig = (key: string): InjectConfigEntry => {
  const existing = getInjectConfig(key);
  if (existing) return existing;
  const created: InjectConfigEntry = {
    injectionKey: Symbol(`dynamic:${key}`),
    default: {},
  };
  DYNAMIC_INJECT_CONFIG[key] = created;
  return created;
};
