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

/**
 * FormItem 插槽名称列表
 * @description 用于在字段配置中透传 FormItem 的插槽
 */
export const FORM_ITEM_SLOT_KEYS = [
  'label',
  'extra',
  'help',
  'tooltip',
] as const;

/**
 * 组件映射扩展接口
 * @description 暴露给外部扩充自定义组件类型的接口。
 * 用户可通过 TypeScript 的声明合并（module augmentation）添加自定义组件。
 * @public
 *
 * @example
 * ```ts
 * // 在项目中任意 .d.ts 文件中
 * declare module '@qin-ui/antd-vue-pro' {
 *   interface ComponentMap {
 *     'my-custom-input': typeof MyCustomInput;
 *     'my-editor': typeof MyRichTextEditor;
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ComponentMap {}

/**
 * 内置组件映射表
 * @description Ant Design Vue 内置支持的组件类型映射
 */
// prettier-ignore
export type BaseComponentMap = {
  'input': typeof Input;
  'textarea': typeof Textarea;
  'input-search': typeof InputSearch;
  'input-password': typeof InputPassword;
  'input-number': typeof InputNumber;
  'select': typeof Select;
  'cascader': typeof Cascader;
  'date-picker': typeof DatePicker;
  'range-picker': typeof RangePicker;
  'time-picker': typeof TimePicker;
  'checkbox-group': typeof CheckboxGroup;
  'radio-group': typeof RadioGroup;
  'switch': typeof Switch;
  'slider': typeof Slider;
  'tree-select': typeof TreeSelect;
  'transfer': typeof Transfer;
}

/**
 * 组件名称联合类型
 * @description 所有支持的组件名称，包括内置组件、用户扩展组件和自定义组件 'custom'
 * - 内置组件：'input' | 'select' | 'date-picker' 等
 * - 扩展组件：通过 ComponentMap 声明的自定义组件名
 * - 'custom'：完全自定义渲染组件
 * @public
 *
 * @example
 * ```ts
 * type Name = ComponentName
 * // 'input' | 'select' | 'date-picker' | ... | 'custom'
 * ```
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
 * 组件名称到 Ant Design Vue 组件的映射
 */
// prettier-ignore
export const componentMap: BaseComponentMap = {
  'input': Input,
  'textarea': Textarea,
  'input-search': InputSearch,
  'input-password': InputPassword,
  'input-number': InputNumber,
  'select': Select,
  'cascader': Cascader,
  'date-picker': DatePicker,
  'range-picker': RangePicker,
  'time-picker': TimePicker,
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
