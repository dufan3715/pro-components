import type { RequiredComponentVars } from '../types';
import type { InjectionKey, Component } from 'vue';
import { type ComputedRef } from 'vue';

/** 单个组件名的注入配置：注入 key、默认值与不接受 Provider 注入的键 */
export type InjectConfigEntry<T = any> = {
  injectionKey: InjectionKey<T>;
  default: T;
  /** 不接受 Provider 注入的键，注入层静默剔除 */
  ignoreProps?: readonly string[];
};

/** 内置组件名的注入配置表：每个组件名对应一份默认值，Provider 注入值与之合并 */
export const INJECT_CONFIG: {
  [key in keyof RequiredComponentVars]: InjectConfigEntry<
    RequiredComponentVars[key]
  >;
} = {
  'pro-form': {
    injectionKey: Symbol(''),
    // 表单实例由 `:form` 显式传入
    ignoreProps: ['form'],
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

/** 自定义组件映射的注入 key：ProComponentProvider 注入，BaseField 解析组件时优先取用 */
export const INJECT_COMPONENTS: InjectionKey<
  | ComputedRef<Partial<Record<string, Component>> | undefined>
  | Partial<Record<string, Component>>
> = Symbol('INJECT_COMPONENTS');

/** 内置集合之外的组件名经此登记的注入通道，无原型链 */
const DYNAMIC_INJECT_CONFIG: Record<string, InjectConfigEntry> =
  Object.create(null);

/** `key` 缺失或非字符串时使用的匿名注入通道 */
const ANONYMOUS_INJECT_CONFIG: InjectConfigEntry = {
  injectionKey: Symbol('anonymous:config'),
  default: {},
};

/**
 * 按组件名取注入配置
 *
 * @description 先查内置配置表，再查动态登记的通道；`key` 缺失或非字符串时返回匿名配置，
 * 未登记的字符串组件名补建通道后返回。
 *
 * @param key - 组件名
 * @returns 对应的注入配置；入参非字符串时返回匿名配置
 */
export const getInjectConfig = (key?: any): InjectConfigEntry => {
  if (!key || typeof key !== 'string') {
    return ANONYMOUS_INJECT_CONFIG;
  }
  return ensureInjectConfig(key);
};

/**
 * 按组件名取注入配置，未登记时补建
 *
 * @description 补建的通道使用独立的 Symbol 注入 key 与空默认值，同一组件名重复调用返回同一配置。
 *
 * @param key - 组件名
 * @returns 已存在或新建的注入配置
 */
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
