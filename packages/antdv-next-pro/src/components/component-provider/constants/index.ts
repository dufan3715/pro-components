import { RequiredComponentVars } from '../types';
import { InjectionKey, Component } from 'vue';

const getPopupContainer = (triggerNode: any) =>
  triggerNode.closest('.ant-form');

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
        showTotal: total => `共 ${total} 条`,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '30', '40', '50', '100'],
        showQuickJumper: true,
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
    default: { grid: { gutter: { xs: 8, sm: 16, md: 16, lg: 24 } } },
  },
  'pro-form-item': {
    injectionKey: Symbol(''),
    default: { validateFirst: true, span: 8 },
  },
  // field
  input: {
    injectionKey: Symbol(''),
    default: { maxlength: 100, allowClear: true, placeholder: '请输入' },
  },
  textarea: {
    injectionKey: Symbol(''),
    default: {
      maxlength: 200,
      autoSize: { minRows: 3, maxRows: 6 },
      showCount: true,
      allowClear: true,
      placeholder: '请输入',
    },
  },
  'input-password': {
    injectionKey: Symbol(''),
    default: { maxlength: 100, allowClear: true, placeholder: '请输入' },
  },
  'input-search': {
    injectionKey: Symbol(''),
    default: {},
  },
  'input-number': {
    injectionKey: Symbol(''),
    default: {
      max: 10 ** 15 - 1,
      min: -(10 ** 15 + 1),
      controls: false,
      placeholder: '请输入',
      style: { width: '100%' },
    } as any,
  },
  'input-otp': {
    injectionKey: Symbol(''),
    default: {},
  },
  'auto-complete': {
    injectionKey: Symbol(''),
    default: { allowClear: true, placeholder: '请选择', getPopupContainer },
  },
  select: {
    injectionKey: Symbol(''),
    default: { allowClear: true, placeholder: '请选择', getPopupContainer },
  },
  cascader: {
    injectionKey: Symbol(''),
    default: { allowClear: true, placeholder: '请选择', getPopupContainer },
  },
  'date-picker': {
    injectionKey: Symbol(''),
    default: { allowClear: true, getPopupContainer, style: { width: '100%' } },
  },
  'date-picker.date': {
    injectionKey: Symbol(''),
    default: { allowClear: true, getPopupContainer, style: { width: '100%' } },
  },
  'date-picker.week': {
    injectionKey: Symbol(''),
    default: { allowClear: true, getPopupContainer, style: { width: '100%' } },
  },
  'date-picker.month': {
    injectionKey: Symbol(''),
    default: { allowClear: true, getPopupContainer, style: { width: '100%' } },
  },
  'date-picker.year': {
    injectionKey: Symbol(''),
    default: { allowClear: true, getPopupContainer, style: { width: '100%' } },
  },
  'date-picker.quarter': {
    injectionKey: Symbol(''),
    default: { allowClear: true, getPopupContainer, style: { width: '100%' } },
  },
  'range-picker': {
    injectionKey: Symbol(''),
    default: { allowClear: true, getPopupContainer, style: { width: '100%' } },
  },
  'time-picker': {
    injectionKey: Symbol(''),
    default: { allowClear: true, getPopupContainer, style: { width: '100%' } },
  },
  'time-range-picker': {
    injectionKey: Symbol(''),
    default: { allowClear: true, getPopupContainer, style: { width: '100%' } },
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
    default: { modelProp: 'checked' },
  },
  slider: {
    injectionKey: Symbol(''),
    default: {},
  },
  'tree-select': {
    injectionKey: Symbol(''),
    default: {},
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
