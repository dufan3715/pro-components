import { RequiredComponentVars } from '../types';
import { InjectionKey, Component, type ComputedRef } from 'vue';

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
  'pro-table': {
    injectionKey: Symbol(''),
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

export const INJECT_COMPONENTS: InjectionKey<
  | ComputedRef<Partial<Record<string, Component>> | undefined>
  | Partial<Record<string, Component>>
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
