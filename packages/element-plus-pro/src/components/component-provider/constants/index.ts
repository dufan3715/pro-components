import type { RequiredComponentVars } from '../types';
import type { InjectionKey, Component } from 'vue';
import { type ComputedRef } from 'vue';

/** 全量 componentVars 注入通道：运行期新增的自定义组件键由此读取（按组件名取配置） */
export const INJECT_COMPONENT_VARS: InjectionKey<
  ComputedRef<Record<string, any> | undefined> | Record<string, any>
> = Symbol('COMPONENT_VARS');

/** 注入项配置：注入 key、内置默认值与不可注入键清单 */
export type InjectConfigEntry<T = any> = {
  injectionKey: InjectionKey<T>;
  default: T;
  /** 不接受 Provider 注入的键，注入层静默剔除 */
  ignoreProps?: readonly string[];
};

/**
 * 注入项配置表：键为内置组件名与 `pro-*` 组件名，值为注入 key、内置默认值与不可注入键清单
 */
export const INJECT_CONFIG: {
  [key in keyof RequiredComponentVars]: InjectConfigEntry<
    RequiredComponentVars[key]
  >;
} = {
  'pro-table': {
    injectionKey: Symbol(''),
    // 数据取自 `:table` 实例或显式 `:data`；列与加载态非类型面成员，同样在注入层忽略
    ignoreProps: ['loading', 'columns', 'data'],
    default: {
      pagination: {
        layout: 'total, sizes, prev, pager, next, jumper',
        pageSizes: [10, 20, 30, 40, 50, 100],
        background: true,
      },
      searchFormConfig: {
        layout: 'grid',
        expand: { minExpandRows: 2, expandStatus: false },
      },
      control: true,
      addIndexColumn: true,
    },
  },
  'pro-form': {
    injectionKey: Symbol(''),
    // 表单实例由 `:form` 显式传入
    ignoreProps: ['form'],
    default: { grid: { gutter: 24 } },
  },
  'pro-form-item': {
    injectionKey: Symbol(''),
    default: { span: 8 },
  },
  input: {
    injectionKey: Symbol(''),
    default: { maxlength: 100, clearable: true },
  },
  'input.textarea': {
    injectionKey: Symbol(''),
    default: {
      maxlength: 200,
      autosize: { minRows: 3, maxRows: 6 },
      showWordLimit: true,
      clearable: true,
    },
  },
  'input.password': {
    injectionKey: Symbol(''),
    default: {
      showPassword: true,
      maxlength: 100,
      clearable: true,
    },
  },
  'input-number': {
    injectionKey: Symbol(''),
    default: {
      max: 10 ** 15 - 1,
      min: -(10 ** 15 - 1),
      controls: false,
      style: { width: '100%' },
    },
  },
  autocomplete: {
    injectionKey: Symbol(''),
    default: { clearable: true },
  },
  select: {
    injectionKey: Symbol(''),
    default: { clearable: true },
  },
  cascader: {
    injectionKey: Symbol(''),
    default: { clearable: true },
  },
  'date-picker': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' } },
  },
  'date-picker.date': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' } },
  },
  'date-picker.dates': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' } },
  },
  'date-picker.daterange': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' } },
  },
  'date-picker.week': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' } },
  },
  'date-picker.month': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' } },
  },
  'date-picker.monthrange': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' } },
  },
  'date-picker.months': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' } },
  },
  'date-picker.yearrange': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' } },
  },
  'date-picker.year': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' } },
  },
  'date-picker.years': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' } },
  },
  'date-picker.quarter': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' } },
  },
  'date-picker.quarters': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' } },
  },
  'date-picker.quarterrange': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' } },
  },
  'date-picker.datetime': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' } },
  },
  'date-picker.datetimerange': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' } },
  },
  'time-picker': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' } },
  },
  'time-select': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' } },
  },
  'checkbox-group': {
    injectionKey: Symbol(''),
    default: {},
  },
  'radio-group': {
    injectionKey: Symbol(''),
    default: {},
  },
  switch: {
    injectionKey: Symbol(''),
    default: { modelProp: 'modelValue' },
  },
  slider: {
    injectionKey: Symbol(''),
    default: {},
  },
  'tree-select': {
    injectionKey: Symbol(''),
    default: { clearable: true },
  },
  transfer: {
    injectionKey: Symbol(''),
    default: {},
  },
};

/** componentMap 注入 key：BaseField 解析组件时优先取用 */
export const INJECT_COMPONENTS: InjectionKey<
  | ComputedRef<Partial<Record<string, Component>> | undefined>
  | Partial<Record<string, Component>>
> = Symbol('INJECT_COMPONENTS');

const DYNAMIC_INJECT_CONFIG: Record<string, InjectConfigEntry> =
  Object.create(null);

/**
 * 读取注入项配置
 *
 * @param {string} key - 组件名或自定义注入键
 * @returns {InjectConfigEntry | undefined} 内置或动态注入项配置，未注册时返回 undefined
 */
export const getInjectConfig = (key: string): InjectConfigEntry | undefined => {
  return (
    (INJECT_CONFIG as Record<string, InjectConfigEntry>)[key] ||
    DYNAMIC_INJECT_CONFIG[key]
  );
};

/**
 * 读取注入项配置，未注册时按组件名补建动态注入项
 *
 * @param {string} key - 组件名或自定义注入键
 * @returns {InjectConfigEntry} 已存在或新建的注入项配置
 */
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
