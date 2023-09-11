import { InjectionKey, Ref } from 'vue';
import {
  NCascader,
  NCheckboxGroup,
  NDatePicker,
  NInput,
  NInputNumber,
  NRadioGroup,
  NSelect,
  NSlider,
  NSwitch,
  NTimePicker,
  NTransfer,
  NTreeSelect,
} from 'naive-ui';
import type {
  ComponentMap,
  RuleType,
  UpdateFormData,
  UpdateRefs,
  UseCommand,
} from '../types';

// prettier-ignore
// export const asyncImportComponentMap: AsyncImportComponentMap = {
//   'input': () => import('naive-ui/es/input/src/Input'),
//   'input-number': () => import('naive-ui/es/input-number/src/InputNumber'),
//   'select': () => import('naive-ui/es/select/src/Select'),
//   'cascader': () => import('naive-ui/es/cascader/src/Cascader'),
//   'date-picker': () => import('naive-ui/es/date-picker/src/DatePicker'),
//   'time-picker': () => import('naive-ui/es/time-picker/src/TimePicker'),
//   'checkbox-group': () => import('naive-ui/es/checkbox/src/CheckboxGroup'),
//   'radio-group': () => import('naive-ui/es/radio/src/RadioGroup'),
//   'switch': () => import('naive-ui/es/switch/src/Switch'),
//   'slider': () => import('naive-ui/es/slider/src/Slider'),
//   'tree-select': () => import('naive-ui/es/tree-select/src/TreeSelect'),
//   'transfer': () => import('naive-ui/es/transfer/src/Transfer'),
// }

// prettier-ignore
export const componentMap: ComponentMap = {
  'input': NInput,
  'input-number': NInputNumber,
  'select': NSelect,
  'cascader': NCascader,
  'date-picker': NDatePicker,
  'time-picker': NTimePicker,
  'checkbox-group': NCheckboxGroup,
  'radio-group': NRadioGroup,
  'switch': NSwitch,
  'slider': NSlider,
  'tree-select': NTreeSelect,
  'transfer': NTransfer,
}

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

// enum
export const ruleTypeMap = new Map<RuleType, string>([
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
