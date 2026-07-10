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

/**
 * FormItem 插槽名称列表
 * @description 用于在字段配置中透传 FormItem 的插槽
 */
// prettier-ignore
export const FORM_ITEM_SLOT_KEYS = ['label', 'extra', 'help', 'tooltip'] as const;

/**
 * 内置组件映射表
 * @description antdv-next 内置支持的组件类型映射。
 * 每个 key 对应 Field 配置中 `component` 可使用的字符串值，
 * value 为实际渲染的 antdv-next 组件。
 *
 * @public
 */
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
 * 组件映射扩展接口
 * @description 暴露给外部扩充自定义组件类型的接口。
 * 用户可通过 TypeScript 的声明合并（module augmentation）添加自定义组件。
 *
 * @example
 * ```ts
 * // 在项目中任意 .d.ts 文件中
 * declare module '@qin-ui/antdv-next-pro' {
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
 * 组件名称到 antdv-next 组件的运行时映射
 * @description ProForm 通过此映射将 Field 配置中的 component 字符串解析为实际 Vue 组件。
 * 例如 `component: 'input'` → `Input`, `component: 'select'` → `Select`。
 *
 * @public
 */
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

/**
 * Teleport 组件名称前缀
 * @description 用于通过插槽动态替换指定 path 的组件
 */
export const TeleportComponentNamePrefix = 'TeleportComponent_';

// inject keys
export { InjectionFormKey, InjectionPathKey } from '../../../shared/core';
