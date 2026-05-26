import {
  Field,
  Button,
  Picker,
  DatePicker,
  TimePicker,
  Cascader,
  Area,
  Signature,
  Switch,
  Stepper,
  Rate,
  Slider,
  Uploader,
  CheckboxGroup,
  RadioGroup,
} from '../../../shared/ui';

/**
 * 内置组件映射表
 * @description Vant 内置支持的组件类型映射
 */
export type BaseComponentMap = {
  field: typeof Field;
  switch: typeof Switch;
  stepper: typeof Stepper;
  rate: typeof Rate;
  slider: typeof Slider;
  uploader: typeof Uploader;
  'checkbox-group': typeof CheckboxGroup;
  'radio-group': typeof RadioGroup;
  picker: typeof Picker;
  'date-picker': typeof DatePicker;
  'time-picker': typeof TimePicker;
  cascader: typeof Cascader;
  area: typeof Area;
  signature: typeof Signature;
  button: typeof Button;
};

/**
 * 组件映射扩展接口
 * @description 通过 TypeScript 声明合并添加自定义组件
 *
 * @example
 * ```ts
 * declare module '@qin-ui/vant-pro' {
 *   interface ComponentMap {
 *     'my-custom': typeof MyComponent;
 *   }
 * }
 * ```
 
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ComponentMap {}

/**
 * 组件名称联合类型
 * @description 所有支持的组件名称
 
 * @public
 */
export type ComponentName =
  | keyof BaseComponentMap
  | keyof ComponentMap
  | 'custom';

/**
 * 根据组件名获取组件类型
 * @template K - 组件名称
 */
export type GetComponentType<K extends ComponentName> =
  K extends keyof ComponentMap
    ? ComponentMap[K]
    : K extends keyof BaseComponentMap
      ? BaseComponentMap[K]
      : never;

/**
 * 组件名称到 Vant 组件的映射
 */
export const componentMap: BaseComponentMap = {
  field: Field,
  switch: Switch,
  stepper: Stepper,
  rate: Rate,
  slider: Slider,
  uploader: Uploader,
  'checkbox-group': CheckboxGroup,
  'radio-group': RadioGroup,
  picker: Picker,
  'date-picker': DatePicker,
  'time-picker': TimePicker,
  cascader: Cascader,
  area: Area,
  signature: Signature,
  button: Button,
};

/**
 * Teleport 组件名称前缀
 * @description 用于通过插槽动态替换指定 path 的组件
 */
export const TeleportComponentNamePrefix = 'TeleportComponent_';

// inject keys
export { InjectionFormKey, InjectionPathKey } from '../../../shared/core';
