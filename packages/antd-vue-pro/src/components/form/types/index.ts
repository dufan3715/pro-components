import type {
  FormItemProps,
  GridProps,
  GridItemProps,
  InputProps,
  InputNumberProps,
  SelectProps,
  CascaderProps,
  DatePickerProps,
  TimePickerProps,
  CheckboxGroupProps,
  RadioGroupProps,
  SwitchProps,
  SliderProps,
  TreeSelectProps,
  TransferProps,
  TextAreaProps,
  Select,
  FormItemInstance,
  FormInstance,
  RangePickerProps,
} from '../../../shared/ui';
import {
  type CSSProperties,
  type Component,
  type Raw,
  type MaybeRef,
  type ComputedRef,
  VNode,
} from 'vue';
import { FORM_ITEM_SLOT_KEYS } from '../constants';
import type { Data, KeyExpandString, Path } from '../../../shared/types';

export type { FormInstance };

export type PathProps = { path?: string } & Data;

export type VModelProps<T = any> = {
  value?: T;
  'onUpdate:value'?: (val: T) => void;
};

export type ValueFormatter =
  | { (val: any, oldVal: any): any }
  | { get?: (val: any) => any; set?: (val: any, oldVal: any) => any };

/**
 * @description 自定义组件
 * @example (p, ctx) => h('div', ctx.attrs)
 */
export type RenderComponentType = Component<VModelProps & PathProps>;

/**
 * @description 插槽组件类型
 */
export type SlotComponentType =
  | Component<PathProps>
  | VNode
  | string
  | number
  | boolean
  | null
  | undefined
  | ((...args: any[]) => SlotComponentType);

/**
 * @description 容器组件类型
 */
export type ContainerComponent = Component<PathProps> | null;

/**
 * @description 插槽对象类型
 */
export type Slots = {
  [name: string]: SlotComponentType;
};

export type Option = { label: string; value: any; [x: string]: any };
export type Options = Array<Option>;

export type Grid = boolean | (GridProps & {});

/**
 * @type {Object} Base - 基础公共字段类型
 */
export interface Base<D extends Data = Data> {
  /**
   * @description 字段标识namePath, 同name
   * @example 'name' | 'age' | 'sex' | ...
   */
  path?: Path<D>;
  /**
   * @description 字段是否隐藏
   */
  hidden?: boolean;
  /**
   * @description 字段中文名称，支持字符串或组件
   * @example '姓名' | '年龄' | '性别' | () => h('span', '自定义标签')
   */
  label?: SlotComponentType;
  /**
   * @description 字段插槽配置，可包含formItem插槽和component插槽
   * @example
   * ```js
   * slots: {
   *   label: () => h('div', { style: { fontSize: '12px' } }, '年龄'),
   *   addonAfter: '岁',
   *   suffix: () => h('span', '元')
   * }
   * ```
   */
  slots?: Partial<
    Record<(typeof FORM_ITEM_SLOT_KEYS)[number], SlotComponentType>
  >;
  /**
   * @description 字段formItem样式属性
   * @example { marginBottom: '8px', padding: '12px' }
   */
  style?: CSSProperties;
  /**
   * @description 字段formItem样式类名
   * @example 'custom-form-item' | 'required-field'
   */
  className?: string;
  /**
   * @description 嵌套子字段配置
   * @example [{ key: 'firstName', label: '名' }, { key: 'lastName', label: '姓' }]
   */
  fields?: Fields<D>;
  /**
   * @description 网格布局属性，true表示使用默认网格布局，针对具有嵌套字段的字段
   * @example boolean | { gutter: 24 }
   */
  grid?: Grid;
  /**
   * @description 字段formItem容器包裹组件
   * @example (props, ctx) => h('div', { class: 'custom-container' }, ctx.slots.default?.())
   */
  container?: ContainerComponent;
  /**
   * @description 字段component样式属性
   * @example { width: '100%', borderColor: '#d9d9d9' }
   */
  componentStyle?: CSSProperties;
  /**
   * @description 字段component样式类名
   * @example 'custom-input' | 'error-input'
   */
  componentClassName?: string;
  /**
   * @description 字段component容器包裹组件
   * @example (props, ctx) => h('div', { class: 'input-wrapper' }, ctx.slots.default?.())
   */
  componentContainer?: ContainerComponent;
  /**
   * @description 字段值处理函数，在onUpdateValue前执行，函数返回值将作为更新值，也可设置get和set函数，用于处理字段值
   * @example (val) => val?.trim()
   */
  valueFormatter?: ValueFormatter;
  /**
   * @description 组件v-model双向绑定更新属性名，默认'value'
   */
  modelName?: string;
  /**
   * @description 以data-form-item-开始的属性名将会被渲染至formItem的dom节点
   * @example { 'data-form-item-test': 'test-value' }
   */
  [key: `data-form-item-${string}`]: string;
  /**
   * @description 以data-component-开始的属性名将会被渲染至component的dom节点
   * @example { 'data-component-test': 'test-value' }
   */
  [key: `data-component-${string}`]: string;
}

/**
 * @description 字段插槽类型
 * @template T - 插槽名称联合类型
 */
type CompSlot<T extends string> = Partial<
  Record<KeyExpandString<T>, SlotComponentType>
>;
// prettier-ignore
type InputSlots = CompSlot<'addonAfter' | 'addonBefore' | 'clearIcon' | 'prefix' | 'suffix'>;
// prettier-ignore
type InputNumberSlots = CompSlot<'addonAfter' | 'addonBefore' | 'prefix' | 'upIcon' | 'downIcon'>
// prettier-ignore
type SelectSlots = CompSlot<keyof InstanceType<typeof Select>['$slots']>
// prettier-ignore
type CascaderSlots = CompSlot<'clearIcon' | 'expandIcon' | 'maxTagPlaceholder' | 'notFoundContent' | 'removeIcon' | 'suffixIcon' | 'tagRender'>
// prettier-ignore
type DatePickerSlots = CompSlot<'dateRender' | 'renderExtraFooter' | 'separator' | 'monthCellRender'>
// prettier-ignore
type RangePickerSlots = CompSlot<'dateRender' | 'renderExtraFooter' | 'separator'>
// prettier-ignore
type TimePickerSlots = CompSlot<'clearIcon' | 'renderExtraFooter' | 'suffixIcon'>
// prettier-ignore
type SwitchSlots = CompSlot<'checkedChildren' | 'unCheckedChildren'>
// prettier-ignore
type SliderSlots = CompSlot<'mark'>
// prettier-ignore
type TreeSelectSlots = CompSlot<'maxTagPlaceholder' | 'notFoundContent' | 'placeholder' | 'searchPlaceholder' | 'suffixIcon' |'tagRender' | 'title'>
// prettier-ignore
type TransferSlots = CompSlot<'footer' | 'render'>

/**
 * @type {CompType} 字段类型集合
 */
// prettier-ignore
export type CompType = {
  /** 文本框 */
  'input': { component: 'input', slots?: InputSlots } & InputProps;
  /** 文本域 */
  'textarea': { component: 'textarea', slots?: InputSlots } & TextAreaProps;
  /** 文本框-密码 */
  'input-password': { component: 'input-password', slots?: InputSlots } & InputProps;
  /** 文本框-搜索 */
  'input-search': { component: 'input-search', slots?: InputSlots } & InputProps;
  /** 数字文本框 */
  'input-number': { component: 'input-number', slots?: InputNumberSlots } & InputNumberProps;
  /** 下拉选择器 */
  'select': { component: 'select', slots?: SelectSlots } & SelectProps;
  /** 级联选择器 */
  'cascader': { component: 'cascader', slots?: CascaderSlots } & CascaderProps;
  /** 日期选择器 */
  'date-picker': { component: 'date-picker', slots?: DatePickerSlots } & DatePickerProps;
  /** 日期选择器-范围 */
  'range-picker': { component: 'range-picker', slots?: RangePickerSlots } & RangePickerProps;
  /** 时间选择器 */
  'time-picker': { component: 'time-picker', slots?: TimePickerSlots } & TimePickerProps;
  /** 复选框组 */
  'checkbox-group': { component: 'checkbox-group' } & CheckboxGroupProps;
  /** 单选框组 */
  'radio-group': { component: 'radio-group' } & RadioGroupProps;
  /** 开关 */
  'switch': { component: 'switch', slots?: SwitchSlots } & SwitchProps;
  /** 滑块 */
  'slider': { component: 'slider', slots?: SliderSlots } & SliderProps;
  /** 树形选择器 */
  'tree-select': { component: 'tree-select', slots?: TreeSelectSlots } & TreeSelectProps;
  /** 穿梭框 */
  'transfer': { component: 'transfer', slots?: TransferSlots } & TransferProps;
  /** 自定义组件 */
  'custom': { component?: RenderComponentType | Raw<RenderComponentType>, slots?: Slots } & Record<string, any>;
};

/**
 * @description 不支持响应式的属性名
 */
type NotSupportedRefOrGetterProps =
  | 'container'
  | 'componentContainer'
  | 'valueFormatter'
  | 'fields'
  | 'slots'
  | 'modelName';

type MaybeRefOrComputedRef<T = any> = MaybeRef<T> | ComputedRef<T>;

/**
 * @description 为对象属性添加响应式支持的类型
 * @template T - 原始类型
 */
export type WithRef<T> = {
  [P in keyof T]: P extends NotSupportedRefOrGetterProps
    ? T[P]
    : T[P] extends (...args: any[]) => any
      ? T[P]
      : MaybeRefOrComputedRef<T[P]>;
};

/**
 * @description 字段配置类型，包含所有字段属性和响应式支持
 * @template D - 数据对象类型
 */
export type Field<D extends Data = Data> = WithRef<
  CompType[keyof CompType] &
    Omit<FormItemProps, 'label'> &
    GridItemProps &
    Base<D>
>;

/**
 * @description 字段数组类型
 * @template D - 数据对象类型
 */
export type Fields<D extends Data = Data> = Array<Field<D>>;

/**
 * @description 基础组件字符串名称类型
 */
export type BaseComponentStringName = Exclude<
  Field['component'],
  RenderComponentType | undefined
>;

export type WithAdditionalMethodsGetter<T> = T & {
  /**
   * @description 获取FormItem实例的方法
   */
  getFormItemRef?: () => FormItemInstance;
  /**
   * @description 获取传入FormItem组件的属性
   */
  getFormItemComputedProps?: () => Readonly<FormItemProps>;
  /**
   * @description 获取组件实例的方法
   */
  getComponentRef?: () => any;
  /**
   * @description 获取传入Component组件的属性
   */
  getComponentComputedProps?: () => Readonly<{
    disabled?: boolean;
    [x: string]: any;
  }>;
};
