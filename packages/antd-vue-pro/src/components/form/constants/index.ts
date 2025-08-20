import { Component, ComputedRef, InjectionKey } from 'vue';
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
} from '../../../shared/ui';
import type { BaseComponentStringName } from '../types';
import { type Form } from '../hooks/useForm';

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

export const TeleportComponentNamePrefix = 'TeleportComponent_';

// inject keys
export const FORM: InjectionKey<Form> = Symbol('form');
export const PATH: InjectionKey<ComputedRef<string | undefined>> =
  Symbol('path');
