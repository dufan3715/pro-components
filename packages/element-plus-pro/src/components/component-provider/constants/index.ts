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
    default: { grid: { gutter: 24 } } as any,
  },
  'pro-form-item': {
    injectionKey: Symbol(''),
    default: { span: 8 } as any,
  },
  input: {
    injectionKey: Symbol(''),
    default: { maxlength: 100, clearable: true, placeholder: '请输入' },
  },
  'input.textarea': {
    injectionKey: Symbol(''),
    default: {
      maxlength: 200,
      autosize: { minRows: 3, maxRows: 6 },
      showWordLimit: true,
      clearable: true,
      placeholder: '请输入',
    },
  },
  'input.password': {
    injectionKey: Symbol(''),
    default: {
      showPassword: true,
      maxlength: 100,
      clearable: true,
      placeholder: '请输入',
    },
  },
  'input-number': {
    injectionKey: Symbol(''),
    default: {
      max: 10 ** 15 - 1,
      min: -(10 ** 15 + 1),
      controls: false,
      placeholder: '请输入',
      style: { width: '100%' },
    },
  },
  autocomplete: {
    injectionKey: Symbol(''),
    default: { clearable: true, placeholder: '请输入' },
  },
  select: {
    injectionKey: Symbol(''),
    default: { clearable: true, placeholder: '请选择' },
  },
  cascader: {
    injectionKey: Symbol(''),
    default: { clearable: true, placeholder: '请选择' },
  },
  'date-picker': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' }, placeholder: '请选择' },
  },
  'date-picker.date': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' }, placeholder: '请选择' },
  },
  'date-picker.dates': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' }, placeholder: '请选择' },
  },
  'date-picker.daterange': {
    injectionKey: Symbol(''),
    default: {
      style: { width: '100%' },
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期',
    },
  },
  'date-picker.week': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' }, placeholder: '请选择' },
  },
  'date-picker.month': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' }, placeholder: '请选择' },
  },
  'date-picker.monthrange': {
    injectionKey: Symbol(''),
    default: {
      style: { width: '100%' },
      startPlaceholder: '开始月份',
      endPlaceholder: '结束月份',
    },
  },
  'date-picker.months': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' }, placeholder: '请选择' },
  },
  'date-picker.yearrange': {
    injectionKey: Symbol(''),
    default: {
      style: { width: '100%' },
      startPlaceholder: '开始年份',
      endPlaceholder: '结束年份',
    },
  },
  'date-picker.year': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' }, placeholder: '请选择' },
  },
  'date-picker.years': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' }, placeholder: '请选择' },
  },
  'date-picker.datetime': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' }, placeholder: '请选择' },
  },
  'date-picker.datetimerange': {
    injectionKey: Symbol(''),
    default: {
      style: { width: '100%' },
      startPlaceholder: '开始时间',
      endPlaceholder: '结束时间',
    },
  },
  'time-picker': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' }, placeholder: '请选择' },
  },
  'time-select': {
    injectionKey: Symbol(''),
    default: { style: { width: '100%' }, placeholder: '请选择' },
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
    default: { clearable: true, placeholder: '请选择' },
  },
  transfer: {
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
