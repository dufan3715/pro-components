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

/**
 * FormItem 插槽名称列表
 * @description 用于在字段配置中透传 FormItem 的插槽（Element Plus 版本）
 */
// prettier-ignore
export const FORM_ITEM_SLOT_KEYS = ['label', 'error'] as const;

/**
 * 内置组件映射表
 * @description Element Plus 内置支持的组件类型映射
 */
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
 * 组件映射扩展接口
 * @description 暴露给外部扩充自定义组件类型的接口。
 * 用户可通过 TypeScript 的声明合并（module augmentation）添加自定义组件。
 *
 * @example
 * ```ts
 * declare module '@qin-ui/element-plus-pro' {
 *   interface ComponentMap {
 *     'my-custom-input': typeof MyCustomInput;
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
 * 组件名称到 Element Plus 组件的映射
 */
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

/**
 * Teleport 组件名称前缀
 * @description 用于通过插槽动态替换指定 path 的组件
 */
export const TeleportComponentNamePrefix = 'TeleportComponent_';

// inject keys
export { InjectionFormKey, InjectionPathKey } from '../../../shared/core';
