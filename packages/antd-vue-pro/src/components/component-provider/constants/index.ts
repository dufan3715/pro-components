/* 初始化组件配置inject keys default */
import { RequiredComponentVars } from '../types';
import { InjectionKey } from 'vue';

const getPopupContainer = (triggerNode: any) =>
  triggerNode.closest('.ant-form');

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
    },
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
    default: { modelName: 'checked' },
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
