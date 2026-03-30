import {
  Cascader,
  CheckboxGroup,
  DatePicker,
  AutoComplete,
  Input,
  InputNumber,
  RadioGroup,
  Select,
  Slider,
  Switch,
  TimePicker,
  TimeSelect,
  Transfer,
  TreeSelect,
} from '../../../shared/ui';

// prettier-ignore
export const FORM_ITEM_SLOT_KEYS = ['label', 'error'] as const;

// prettier-ignore
export type BaseComponentMap = {
  'input': typeof Input;
  'input-number': typeof InputNumber;
  'autocomplete': typeof AutoComplete;
  'select': typeof Select;
  'cascader': typeof Cascader;
  'date-picker': typeof DatePicker;
  'time-picker': typeof TimePicker;
  'time-select': typeof TimeSelect;
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
 * declare module '@qin-ui/element-plus-pro' {
 *   interface ComponentMap {
 *     'my-custom-input': typeof MyCustomInput;
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ComponentMap {}

export type ComponentName =
  | keyof BaseComponentMap
  | keyof ComponentMap
  | 'custom';

export type GetComponentType<K extends ComponentName> =
  K extends keyof ComponentMap
    ? ComponentMap[K]
    : K extends keyof BaseComponentMap
      ? BaseComponentMap[K]
      : never;

// prettier-ignore
export const componentMap: BaseComponentMap = {
  'input': Input,
  'input-number': InputNumber,
  'autocomplete': AutoComplete,
  'select': Select,
  'cascader': Cascader,
  'date-picker': DatePicker,
  'time-picker': TimePicker,
  'time-select': TimeSelect,
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
