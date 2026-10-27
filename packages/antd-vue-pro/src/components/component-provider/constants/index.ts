import type { RequiredComponentVars } from '../types';
import type { InjectionKey, Component } from 'vue';
import { type ComputedRef } from 'vue';

const getPopupContainer = (triggerNode: any) =>
  triggerNode.closest?.("form[class*='-form']") ||
  (typeof document !== 'undefined' ? document.body : undefined);

/** 自定义组件映射的注入 key：ProComponentProvider 注入，BaseField 解析组件时优先取用 */
export const INJECT_COMPONENTS: InjectionKey<
  | ComputedRef<Partial<Record<string, Component>> | undefined>
  | Partial<Record<string, Component>>
> = Symbol('INJECT_COMPONENTS');

/** 全量 componentVars 注入通道：运行期新增的自定义组件键由此读取（按组件名取配置） */
export const INJECT_COMPONENT_VARS: InjectionKey<
  ComputedRef<Record<string, any> | undefined> | Record<string, any>
> = Symbol('COMPONENT_VARS');

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
  'pro-table': {
    injectionKey: Symbol(''),
    // 列 / 数据源取自组件绑定或 `:table` 实例，加载态由组件自身状态驱动
    ignoreProps: ['loading', 'columns', 'dataSource'],
    default: {
      pagination: {
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
    // 表单实例由 `:form` 显式传入；grid 仅作为启用时的参数默认值，不开启网格
    ignoreProps: ['form'],
    default: { grid: { gutter: { xs: 8, sm: 16, md: 16, lg: 24 } } },
  },
  'pro-form-item': {
    injectionKey: Symbol(''),
    default: { validateFirst: true, span: 8 },
  },
  // field
  input: {
    injectionKey: Symbol(''),
    default: { maxlength: 100, allowClear: true },
  },
  textarea: {
    injectionKey: Symbol(''),
    default: {
      maxlength: 200,
      autoSize: { minRows: 3, maxRows: 6 },
      showCount: true,
      allowClear: true,
    },
  },
  'input-password': {
    injectionKey: Symbol(''),
    default: { maxlength: 100, allowClear: true },
  },
  'input-search': {
    injectionKey: Symbol(''),
    default: {},
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
  select: {
    injectionKey: Symbol(''),
    default: { allowClear: true, getPopupContainer },
  },
  cascader: {
    injectionKey: Symbol(''),
    default: { allowClear: true, getPopupContainer },
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

/** 内置集合之外的组件名经此登记的注入通道，无原型链 */
const DYNAMIC_INJECT_CONFIG: Record<string, InjectConfigEntry> =
  Object.create(null);

/**
 * 按组件名取注入配置
 * @description 先查内置配置表，再查动态登记的通道
 * @param key - 组件名（含 `date-picker.month` 等子类型段）
 * @returns 对应注入配置，未登记时为 `undefined`
 */
export const getInjectConfig = (key: string): InjectConfigEntry | undefined => {
  return (
    (INJECT_CONFIG as Record<string, InjectConfigEntry>)[key] ||
    DYNAMIC_INJECT_CONFIG[key]
  );
};

/**
 * 按组件名取注入配置，未登记时补建
 * @description 补建的通道使用独立的 Symbol 注入 key 与空默认值，同一组件名重复调用返回同一配置
 * @param key - 组件名
 * @returns 已存在或新建的注入配置
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
