import { Component } from 'vue';
import {
  Cascader,
  CheckboxGroup,
  DatePicker,
  AutoComplete,
  Input,
  InputNumber,
  InputPassword,
  InputSearch,
  RadioGroup,
  Select,
  Slider,
  Switch,
  TextArea,
  TimePicker,
  TimeRangePicker,
  Transfer,
  TreeSelect,
  RangePicker,
  InputOTP,
} from '../../../shared/ui';
import type { BaseComponentStringName } from '../types';

// prettier-ignore
export const FORM_ITEM_SLOT_KEYS = ['label', 'extra', 'help', 'tooltip'] as const;

// prettier-ignore
export const COMPONENT_MAP =  new Map<BaseComponentStringName | string, Component>([
  ['input', Input],
  ['textarea', TextArea],
  ['input-search', InputSearch],
  ['input-password', InputPassword],
  ['input-number', InputNumber],
  ['input-otp', InputOTP],
  ['auto-complete', AutoComplete],
  ['select', Select],
  ['cascader', Cascader],
  ['date-picker', DatePicker],
  ['range-picker', RangePicker],
  ['time-picker', TimePicker],
  ['time-range-picker', TimeRangePicker],
  ['checkbox-group', CheckboxGroup],
  ['radio-group', RadioGroup],
  ['switch', Switch],
  ['slider', Slider],
  ['tree-select', TreeSelect],
  ['transfer', Transfer],
])

/**
 * 注册自定义组件
 * @param name 组件名称标识
 * @param component Vue组件
 */
export const registerComponent = (name: string, component: Component) => {
  COMPONENT_MAP.set(name, component);
};

export const TeleportComponentNamePrefix = 'TeleportComponent_';

// inject keys
export { InjectionFormKey, InjectionPathKey } from '../../../shared/core';
