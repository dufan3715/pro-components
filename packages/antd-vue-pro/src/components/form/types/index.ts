import type {
  GridProps,
  GridItemProps,
  FormInstance,
  FormItemProps,
} from '../../../shared/ui';
import { FormItem } from '../../../shared/ui';
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
  VNodeProps,
} from 'vue';
import { ComponentName, GetComponentType } from '../constants';
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

type BaseCommon<D extends Data = Data> = {
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
   * @description 字段是否禁用
   */
  disabled?: boolean;
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
   * @description 额外的自定义属性，不会被当作组件参数，仅用做给字段添加标识属性等功能
   * @example { group: 'group-1' }
   */
  extraProps?: Record<string, any>;
};

type BaseWithFields<D extends Data = Data> = BaseCommon<D> & {
  /**
   * @description 嵌套子字段配置
   * @example [{ key: 'firstName', label: '名' }, { key: 'lastName', label: '姓' }]
   */
  fields: Fields<D>;
  /**
   * @description 网格布局属性，true表示使用默认网格布局，针对具有嵌套字段的字段
   * @example boolean | { gutter: 24 }
   */
  grid?: Grid;
  component?: never;
  componentStyle?: never;
  componentClass?: never;
  componentContainer?: never;
  valueFormatter?: never;
  modelProp?: never;
  componentDataAttrs?: never;
};

type BaseWithoutFields<D extends Data = Data> = BaseCommon<D> & {
  fields?: undefined;
  grid?: never;
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
   * @description 字段值处理函数，在onUpdateValue前执行，函数返回值将作为更新值，也可设置get和set函数，用于处理字段值
   * @example (val) => val?.trim()
   */
  valueFormatter?: ValueFormatter;
  /**
   * @description 组件v-model双向绑定更新属性名，默认'value'
   */
  modelProp?: string;
  /**
   * @description 将属性附加到表单组件的 DOM 节点
   * @example { 'data-test': 'input-value', 'aria-label': 'name' }
   */
  componentDataAttrs?: Record<string, string>;
};

/**
 * @type {Object} Base - 基础公共字段类型
 */
export type Base<D extends Data = Data> =
  | BaseWithFields<D>
  | BaseWithoutFields<D>;

/**
 * @type {FieldTypeMap} 字段类型集合
 */
export type FieldTypeMap<D extends Data = Data> = {
  [K in ComponentName]: K extends 'custom'
    ? WithCommon<{ slots?: Slots; [x: string]: any }, D> & {
        component?: RenderComponentType | Raw<RenderComponentType>;
      }
    : WithComponent<GetComponentType<K>, D> & { component?: K };
};

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

type WithCommonBase<T = unknown> = T &
  Omit<FormItemProps, 'label'> &
  GridItemProps;

type WithCommon<T, D extends Data = Data> = WithRef<
  WithCommonBase<T> & BaseWithoutFields<D>
>;

type WithFields<D extends Data = Data> = WithRef<
  WithCommonBase & BaseWithFields<D>
>;

/**
 * @description 自动从 Vue 组件提取 Props 和 Slots，并加上公共表单字段属性
 * @template T - Vue 组件类型
 * @template D - 数据对象类型
 */
type WithComponent<
  T extends abstract new (...args: any) => any,
  D extends Data = Data,
> = WithCommon<
  { slots?: ComponentSlots<T> } & Omit<ComponentProps<T>, keyof VNodeProps>,
  D
>;

/**
 * @description 字段配置类型，包含所有字段属性和响应式支持
 * @template D - 数据对象类型
 */
export type Field<
  C extends ComponentName = ComponentName,
  D extends Data = Data,
> = FieldTypeMap<D>[C] | WithFields<D>;

/**
 * @description 字段数组类型
 * @template D - 数据对象类型
 */
export type Fields<D extends Data = Data> = Array<Field<ComponentName, D>>;
