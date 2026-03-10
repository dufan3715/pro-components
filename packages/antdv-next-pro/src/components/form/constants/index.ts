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

// prettier-ignore
export const FORM_ITEM_SLOT_KEYS = ['label', 'extra', 'help', 'tooltip'] as const;

// prettier-ignore
export type BaseComponentMap = {
  'input': typeof Input;
  'textarea': typeof TextArea;
  'input-search': typeof InputSearch;
  'input-password': typeof InputPassword;
  'input-number': typeof InputNumber;
  'input-otp': typeof InputOTP;
  'auto-complete': typeof AutoComplete;
  'select': typeof Select;
  'cascader': typeof Cascader;
  'date-picker': typeof DatePicker;
  'range-picker': typeof RangePicker;
  'time-picker': typeof TimePicker;
  'time-range-picker': typeof TimeRangePicker;
  'checkbox-group': typeof CheckboxGroup;
  'radio-group': typeof RadioGroup;
  'switch': typeof Switch;
  'slider': typeof Slider;
  'tree-select': typeof TreeSelect;
  'transfer': typeof Transfer;
}

/**
 * @description 暴露给外部扩充自定义组件类型的接口
 * @example
 * ```ts
 * declare module 'antdv-next-pro' {
 *   interface ComponentMap {
 *     'my-custom-input': typeof MyCustomInput;
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ComponentMap {}

export type ComponentName = keyof BaseComponentMap | keyof ComponentMap;

export type GetComponentType<K extends ComponentName> =
  K extends keyof ComponentMap
    ? ComponentMap[K]
    : K extends keyof BaseComponentMap
      ? BaseComponentMap[K]
      : never;

// prettier-ignore
export const componentMap: BaseComponentMap = {
  'input': Input,
  'textarea': TextArea,
  'input-search': InputSearch,
  'input-password': InputPassword,
  'input-number': InputNumber,
  'input-otp': InputOTP,
  'auto-complete': AutoComplete,
  'select': Select,
  'cascader': Cascader,
  'date-picker': DatePicker,
  'range-picker': RangePicker,
  'time-picker': TimePicker,
  'time-range-picker': TimeRangePicker,
  'checkbox-group': CheckboxGroup,
  'radio-group': RadioGroup,
  'switch': Switch,
  'slider': Slider,
  'tree-select': TreeSelect,
  'transfer': Transfer,
}

export const TeleportComponentNamePrefix = 'TeleportComponent_';

// inject keys
export { InjectionFormKey, InjectionPathKey } from '../../../shared/core';
