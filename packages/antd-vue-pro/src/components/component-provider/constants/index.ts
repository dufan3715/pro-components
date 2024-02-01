/* eslint-disable import/prefer-default-export, no-underscore-dangle, dot-notation */
/* 初始化组件配置inject keys */
import { ComponentVars } from '../types';

// prettier-ignore
export const INJECT_KEYS: Record<keyof ComponentVars, symbol> = {
  'pro-table': Symbol(''),
  'pro-form': Symbol(''),
  'pro-form-item': Symbol(''),
  // field
  'input': Symbol(''),
  'textarea': Symbol(''),
  'input-password': Symbol(''),
  'input-search': Symbol(''),
  'input-number': Symbol(''),
  'select': Symbol(''),
  'cascader': Symbol(''),
  'date-picker': Symbol(''),
  'date-picker.date': Symbol(''),
  'date-picker.week': Symbol(''),
  'date-picker.month': Symbol(''),
  'date-picker.year': Symbol(''),
  'date-picker.quarter': Symbol(''),
  'range-picker': Symbol(''),
  'time-picker': Symbol(''),
  'checkbox-group': Symbol(''),
  'radio-group': Symbol(''),
  'switch': Symbol(''),
  'slider': Symbol(''),
  'tree-select': Symbol(''),
  'transfer': Symbol(''),
};

const getPopupContainer = (triggerNode: any) =>
  triggerNode.closest('.ant-form');

// prettier-ignore
export const INIT_PROPS_MAP = new Map([
  [INJECT_KEYS['pro-table'], {}],
  [INJECT_KEYS['pro-form'], {}],
  [INJECT_KEYS['pro-form-item'], {}],
  // field
  [INJECT_KEYS['input'], { maxlength: 100, allowClear: true, placeholder: '请输入' }],
  [INJECT_KEYS['textarea'], { maxlength: 200, autoSize: { minRows: 3, maxRows: 6 }, showCount: true, allowClear: true, placeholder: '请输入' }],
  [INJECT_KEYS['input-password'], { maxlength: 100, allowClear: true, placeholder: '请输入' }],
  [INJECT_KEYS['input-number'], { max: 10 ** 15 - 1, min: -(10 ** 15 + 1), controls: false, allowClear: true, placeholder: '请输入' }],
  [INJECT_KEYS['select'], { allowClear: true, placeholder: '请选择', getPopupContainer }],
  [INJECT_KEYS['cascader'], { allowClear: true, placeholder: '请选择', getPopupContainer }],
  [INJECT_KEYS['date-picker'], { allowClear: true, getPopupContainer }],
  [INJECT_KEYS['date-picker.week'], { allowClear: true, getPopupContainer }],
  [INJECT_KEYS['date-picker.month'], { allowClear: true, getPopupContainer }],
  [INJECT_KEYS['date-picker.year'], { allowClear: true, getPopupContainer }],
  [INJECT_KEYS['date-picker.quarter'], { allowClear: true, getPopupContainer }],
  [INJECT_KEYS['time-picker'], { allowClear: true, getPopupContainer }],
  [INJECT_KEYS['range-picker'], { allowClear: true, getPopupContainer }],
  [INJECT_KEYS['checkbox-group'], { allowClear: true, getPopupContainer }],
  [INJECT_KEYS['radio-group'], {}],
  [INJECT_KEYS['switch'], {}],
  [INJECT_KEYS['slider'], {}],
  [INJECT_KEYS['tree-select'], {}],
  [INJECT_KEYS['transfer'], {}],
]);
