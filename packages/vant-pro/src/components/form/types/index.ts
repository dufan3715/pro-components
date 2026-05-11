import { type FormInstance, type FieldProps } from '../../../shared/ui';
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
  VNodeProps,
  DefineComponent,
  VNodeTypes,
  VNode,
} from 'vue';
import { ComponentName, GetComponentType } from '../constants';
import type { Data, Path } from '../../../shared/core';
import { PopupProps } from '../hooks/useFormPopup';

export type { FormInstance };

export type PathProps = { path?: string } & Data;

export type VModelProps<T = any> = {
  modelValue?: T;
  'onUpdate:modelValue'?: (val: T) => void;
};

export type ValueFormatter =
  | { (val: any, oldVal: any): any }
  | { get?: (val: any) => any; set?: (val: any, oldVal: any) => any };

export type DisplayFormatter = (val: any) => string;

/**
 * @description 自定义组件
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
export type ContainerComponent =
  | Component<PathProps>
  | DefineComponent<PathProps>
  | VNodeTypes
  | symbol;

/**
 * @description 插槽对象类型
 */
export type Slots = {
  [name: string]: SlotComponentType;
};

type BaseCommon<D extends Data = Data> = {
  /**
   * @description 字段标识namePath, 同name
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
   */
  label?: SlotComponentType;
  /**
   * @description 字段插槽配置
   */
  slots?: Slots;
  /**
   * @description 嵌套 fields 容器包裹组件
   */
  fieldContainer?: ContainerComponent;
  /**
   * @description 额外的自定义属性，不会被当作组件参数
   */
  extraProps?: Record<string, any>;
};

type BaseWithFields<D extends Data = Data> = BaseCommon<D> & {
  /**
   * @description 嵌套子字段配置 (Vant 中主要用于分组，或者通过 CellGroup 包裹)
   */
  fields: Fields<D>;
  component?: never;
  componentStyle?: never;
  componentClass?: never;
  componentContainer?: never;
  fieldStyle?: never;
  fieldClass?: never;
  valueFormatter?: never;
  displayFormatter?: never;
  modelProp?: never;
  popup?: never;
};

type BaseWithoutFields<D extends Data = Data> = BaseCommon<D> & {
  fields?: undefined;
  /**
   * @description 表单字段component样式属性
   */
  componentStyle?: CSSProperties;
  /**
   * @description 表单字段component样式类名
   */
  componentClass?: any;
  /**
   * @description 表单字段外层 van-field 样式属性
   */
  fieldStyle?: CSSProperties;
  /**
   * @description 表单字段外层 van-field 样式类名
   */
  fieldClass?: any;
  /**
   * @description 字段component容器包裹组件
   */
  componentContainer?: ContainerComponent;
  /**
   * @description 字段值处理函数，在onUpdateValue前执行
   */
  valueFormatter?: ValueFormatter;
  /**
   * @description 针对 Popup 展现形式的组件，将选中值转化为输入框展示文字
   */
  displayFormatter?: DisplayFormatter;
  /**
   * @description 组件v-model双向绑定更新属性名
   */
  modelProp?: string;
  /**
   * @description 是否通过 Popup 弹窗展示该组件（为 true 或传递 PopupProps 配置对象时开启）
   */
  popup?: boolean | Partial<PopupProps>;
};

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

type NotSupportedRefOrGetterProps =
  | 'component'
  | 'fieldContainer'
  | 'componentContainer'
  | 'valueFormatter'
  | 'displayFormatter'
  | 'fields'
  | 'slots'
  | 'modelProp'
  | 'popup';

type MaybeRefOrComputedRef<T = any> = MaybeRef<T> | ComputedRef<T>;

export type WithRef<T> = {
  [P in keyof T]: P extends NotSupportedRefOrGetterProps
    ? T[P]
    : T[P] extends (...args: any[]) => any
      ? T[P]
      : MaybeRefOrComputedRef<T[P]>;
};

type WithCommonBase<T = unknown> = T &
  Partial<Omit<FieldProps, 'label' | 'name' | 'type'>>;

type WithCommon<T, D extends Data = Data> = WithRef<
  WithCommonBase<T> & BaseWithoutFields<D>
>;

type WithFields<D extends Data = Data> = WithRef<
  WithCommonBase & BaseWithFields<D>
>;

type WithComponent<
  T extends abstract new (...args: any) => any,
  D extends Data = Data,
> = WithCommon<
  { slots?: Partial<ComponentSlots<T>> } & Partial<
    Omit<ComponentProps<T>, keyof VNodeProps>
  >,
  D
>;

export type Field<
  C extends ComponentName = ComponentName,
  D extends Data = Data,
> = FieldTypeMap<D>[C] | WithFields<D>;

export type Fields<D extends Data = Data> = Array<Field<ComponentName, D>>;
