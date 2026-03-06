import type {
  FormItemProps,
  GridProps,
  GridItemProps,
  FormInstance,
  FormItemInstance,
} from '../../../shared/ui';
import {
  FormItem,
  Input,
  TextArea,
  InputPassword,
  InputSearch,
  InputNumber,
  InputOTP,
  AutoComplete,
  Select,
  Cascader,
  DatePicker,
  RangePicker,
  TimePicker,
  TimeRangePicker,
  CheckboxGroup,
  RadioGroup,
  Switch,
  Slider,
  TreeSelect,
  Transfer,
} from '../../../shared/ui';
import type {
  ComponentProps,
  ComponentSlots,
} from 'vue-component-type-helpers';
import {
  type CSSProperties,
  type Component,
  type Raw,
  type MaybeRef,
  type ComputedRef,
  VNode,
} from 'vue';
import type { Data, Path } from '../../../shared/core';

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
export type ContainerComponent = Component<PathProps>;

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
  slots?: Partial<ComponentSlots<typeof FormItem>>;
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
   * @description 字段formItem样式属性
   * @example { marginBottom: '8px', padding: '12px' }
   */
  formItemStyle?: CSSProperties;
  /**
   * @description 字段formItem样式类名
   * @example 'custom-form-item' | 'required-field'
   */
  formItemClass?: string;
  /**
   * @description 字段formItem容器包裹组件
   * @example (props, ctx) => h('div', { class: 'custom-container' }, ctx.slots.default?.())
   */
  formItemContainer?: ContainerComponent;
  /**
   * @description 将属性附加到 FormItem 的 DOM 节点
   * @example { 'data-form-item-test': 'test-value', 'aria-label': 'name' }
   */
  formItemDataAttrs?: Record<string, string>;
  /**
   * @description 字段component样式属性
   * @example { width: '100%', borderColor: '#d9d9d9' }
   */
  componentStyle?: CSSProperties;
  /**
   * @description 字段component样式类名
   * @example 'custom-input' | 'error-input'
   */
  componentClass?: string;
  /**
   * @description 字段component容器包裹组件
   * @example (props, ctx) => h('div', { class: 'input-wrapper' }, ctx.slots.default?.())
   */
  componentContainer?: ContainerComponent;
  /**
   * @description 将属性附加到表单组件的 DOM 节点
   * @example { 'data-test': 'input-value', 'aria-label': 'name' }
   */
  componentDataAttrs?: Record<string, string>;
  /**
   * @description 字段值处理函数，在onUpdateValue前执行，函数返回值将作为更新值，也可设置get和set函数，用于处理字段值
   * @example (val) => val?.trim()
   */
  valueFormatter?: ValueFormatter;
  /**
   * @description 组件v-model双向绑定更新属性名，默认'value'
   */
  modelProp?: string;
}

/**
 * @description 暴露给外部扩充自定义组件类型的接口
 * @example
 * ```ts
 * declare module 'antdv-next-pro' {
 *   interface CustomFieldTypeMap {
 *     'my-custom-input': typeof MyCustomInput;
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
export interface CustomFieldTypeMap<D extends Data = Data> {}

/**
 * @type {FieldTypeMap} 字段类型集合
 */
// prettier-ignore
export type FieldTypeMap<D extends Data = Data> = {
  /** 文本框 */
  'input': WithComponent<typeof Input, D>;
  /** 文本域 */
  'textarea': WithComponent<typeof TextArea, D>;
  /** 文本框-密码 */
  'input-password': WithComponent<typeof InputPassword, D>;
  /* 文本框-一次性密码输入框 */
  'input-otp': WithComponent<typeof InputOTP, D>;
  /** 文本框-搜索 */
  'input-search': WithComponent<typeof InputSearch, D>;
  /** 数字文本框 */
  'input-number': WithComponent<typeof InputNumber, D>;
  /** 下拉选择器 */
  'select': WithComponent<typeof Select, D>;
  /** 自动完成 */
  'auto-complete': WithComponent<typeof AutoComplete, D>;
  /** 级联选择器 */
  'cascader': WithComponent<typeof Cascader, D>;
  /** 日期选择器 */
  'date-picker': WithComponent<typeof DatePicker, D>;
  /** 日期选择器-范围 */
  'range-picker': WithComponent<typeof RangePicker, D>;
  /** 时间选择器 */
  'time-picker': WithComponent<typeof TimePicker, D>;
  /** 时间范围选择器 */
  'time-range-picker': WithComponent<typeof TimeRangePicker, D>;
  /** 复选框组 */
  'checkbox-group': WithComponent<typeof CheckboxGroup, D>;
  /** 单选框组 */
  'radio-group': WithComponent<typeof RadioGroup, D>;
  /** 开关 */
  'switch': WithComponent<typeof Switch, D>;
  /** 滑块 */
  'slider': WithComponent<typeof Slider, D>;
  /** 树形选择器 */
  'tree-select': WithComponent<typeof TreeSelect, D>;
  /** 穿梭框 */
  'transfer': WithComponent<typeof Transfer, D>;
  /** 自定义组件 */
  'custom': { component?: RenderComponentType | Raw<RenderComponentType> } & WithCommon<{ slots?: Slots } & Record<string, any>, D>;
} & { [K in keyof CustomFieldTypeMap<D>]: WithComponent<CustomFieldTypeMap[K], D> };

/**
 * @description 不支持响应式的属性名
 */
type NotSupportedRefOrGetterProps =
  | 'component'
  | 'formItemContainer'
  | 'componentContainer'
  | 'valueFormatter'
  | 'fields'
  | 'slots'
  | 'modelProp';

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

type WithCommon<T, D extends Data = Data> = WithRef<
  T & FormItemProps & GridItemProps & Base<D>
>;

/**
 * @description 自动从 Vue 组件提取 Props 和 Slots，并加上公共表单字段属性
 * @template T - Vue 组件类型
 * @template D - 数据对象类型
 */
type WithComponent<
  T extends abstract new (...args: any) => any,
  D extends Data = Data,
> = WithCommon<{ slots?: ComponentSlots<T> } & ComponentProps<T>, D>;

/**
 * @description 字段配置类型，包含所有字段属性和响应式支持
 * @template D - 数据对象类型
 */
export type Field<D extends Data = Data> = {
  [K in keyof FieldTypeMap]: {
    component?: K extends 'custom' ? FieldTypeMap<D>[K]['component'] : K;
  } & FieldTypeMap<D>[K];
}[keyof FieldTypeMap];

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
