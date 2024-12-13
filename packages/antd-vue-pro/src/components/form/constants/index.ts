import { Component, InjectionKey, Ref } from 'vue';
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
  ActionType,
  SetActivePath,
  UpdateFormData,
  UseCommand,
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
export const FORM_DATA = Symbol('formData') as InjectionKey<
  Record<string, any>
>;
export const UPDATE_FORM_DATA = Symbol(
  'updateFormData'
) as InjectionKey<UpdateFormData>;
export const COMMAND = Symbol('command') as InjectionKey<
  Ref<ReturnType<UseCommand> | null>
>;
export const UPDATE_ACTIVE_PATH = Symbol(
  'setActivePath'
) as InjectionKey<SetActivePath>;

// enum
export const RULE_TYPE_MAP = new Map<ActionType, string>([
  ['setValue', '字段赋值'],
  ['setHidden', '字段隐藏/显示'],
  ['setDisabled', '字段禁用/启用'],
  ['setOptions', '字段选项枚举变更'],
  ['setRules', '字段校验规则变更'],
  ['setField', '字段配置变更'],
  ['triggerValidate', '字段触发校验'],
  ['triggerClearValidate', '字段触发清除校验'],
  ['triggerMessage', '字段触发提示'],
]);

// regexp
/**
 * @description js函数声明字符串正则
 */
export const FunctionRegexp = /^\s*function\s*\w*\s*\([^)]*\)\s*{([\s\S]*)}/g;
/**
 * @description js箭头函数字符串正则
 */
export const ArrowFunctionRegexp =
  /^\s*(?:\([^)]*\)|\w+)\s*=>\s*\(?({[\s\S]*}|[^;]*)\)?/g;
