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
  RuleType,
  SetActivePath,
  UpdateFormData,
  UpdateRefs,
  UseCommand,
} from '../types';

export const FORM_ITEM_SLOT_KEYS = ['label', 'extra', 'help'] as const;

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
export const UPDATE_REFS = Symbol('updateRefs') as InjectionKey<UpdateRefs>;
export const COMMAND = Symbol('command') as InjectionKey<
  Ref<ReturnType<UseCommand> | null>
>;
export const UPDATE_ACTIVE_PATH = Symbol(
  'setActivePath'
) as InjectionKey<SetActivePath>;

// enum
export const RULE_TYPE_MAP = new Map<RuleType, string>([
  ['value', '字段赋值'],
  ['hidden', '字段隐藏/显示'],
  ['disabled', '字段禁用/启用'],
  ['options', '字段选项枚举变更'],
  ['validateRule', '字段校验规则变更'],
  ['fieldMergeOverrides', '字段配置变更'],
  ['validate', '字段触发校验'],
  ['clearValidate', '字段触发清除校验'],
  ['message', '字段触发提示'],
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

/* 初始化组件配置inject keys */
// prettier-ignore
export const INJECT_COMPONENT_PROPS_KEYS = {
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
  'time-picker': Symbol(''),
  'checkbox-group': Symbol(''),
  'radio-group': Symbol(''),
  'switch': Symbol(''),
  'slider': Symbol(''),
  'tree-select': Symbol(''),
  'transfer': Symbol(''),
};

const PROPS_KEYS = INJECT_COMPONENT_PROPS_KEYS;

// prettier-ignore
export const INIT_COMPONENT_PROPS_MAP = new Map([
  [PROPS_KEYS.input, { maxlength: 100, allowClear: true, placeholder: '请输入' }],
  [PROPS_KEYS.textarea, { maxlength: 200, autoSize: { minRows: 3, maxRows: 6 }, showCount: true, allowClear: true, placeholder: '请输入' }],
  [PROPS_KEYS['input-password'], { maxlength: 100, allowClear: true, placeholder: '请输入' }],
  [PROPS_KEYS['input-number'], { max: 10 ** 15 - 1, min: -(10 ** 15 + 1), controls: false, allowClear: true, placeholder: '请输入' }],
  [PROPS_KEYS.select, { allowClear: true, placeholder: '请选择' }],
  [PROPS_KEYS.cascader, { allowClear: true }],
  [PROPS_KEYS['date-picker'], { allowClear: true }],
  [PROPS_KEYS['date-picker.week'], { allowClear: true }],
  [PROPS_KEYS['date-picker.month'], { allowClear: true }],
  [PROPS_KEYS['date-picker.year'], { allowClear: true }],
  [PROPS_KEYS['date-picker.quarter'], { allowClear: true }],
  [PROPS_KEYS['time-picker'], { allowClear: true }],
  [PROPS_KEYS['checkbox-group'], { allowClear: true }],
  [PROPS_KEYS['radio-group'], {}],
  [PROPS_KEYS.switch, {}],
  [PROPS_KEYS.slider, {}],
  [PROPS_KEYS['tree-select'], {}],
  [PROPS_KEYS.transfer, {}],
]);
