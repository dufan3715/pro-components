import { Component, InjectionKey } from 'vue';
import {
  Cascader,
  CheckboxGroup,
  DatePicker,
  Input,
  InputNumber,
  InputPassword,
  InputSearch,
  RadioGroup,
  Select,
  Slider,
  Switch,
  Textarea,
  TimePicker,
  Transfer,
  TreeSelect,
  RangePicker,
} from 'ant-design-vue';
import type {
  BaseComponentStringName,
  SetActivePath,
  UpdateFormData,
} from '../types';

// prettier-ignore
export const FORM_ITEM_SLOT_KEYS = ['label', 'extra', 'help', 'tooltip'] as const;

// prettier-ignore
export const COMPONENT_MAP =  new Map<BaseComponentStringName, Component>([
  ['input', Input],
  ['textarea', Textarea],
  ['input-search', InputSearch],
  ['input-password', InputPassword],
  ['input-number', InputNumber],
  ['select', Select],
  ['cascader', Cascader],
  ['date-picker', DatePicker],
  ['range-picker', RangePicker],
  ['time-picker', TimePicker],
  ['checkbox-group', CheckboxGroup],
  ['radio-group', RadioGroup],
  ['switch', Switch],
  ['slider', Slider],
  ['tree-select', TreeSelect],
  ['transfer', Transfer],
])

// inject keys
export const FORM_DATA: InjectionKey<Record<string, any>> = Symbol('formData');
export const UPDATE_FORM_DATA: InjectionKey<UpdateFormData> =
  Symbol('updateFormData');
export const UPDATE_ACTIVE_PATH: InjectionKey<SetActivePath> =
  Symbol('setActivePath');
