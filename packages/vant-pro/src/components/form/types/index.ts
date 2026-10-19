import type { Field as VanField } from '../../../shared/ui';
import { type FormInstance, type FieldProps } from '../../../shared/ui';
import type {
  ComponentProps,
  ComponentSlots,
} from 'vue-component-type-helpers';
import type { VNodeProps, DefineComponent, VNodeTypes, VNode } from 'vue';
import {
  type ClassValue,
  type Component,
  type Raw,
  type MaybeRef,
  type ComputedRef,
  type StyleValue,
} from 'vue';
import type { ComponentName, GetComponentType } from '../constants';
import type { Data, Path } from '../../../shared/core';
import type { PopupProps } from '../hooks/useFormPopup';
import type { AdditionalMethods } from '../../../shared/core';

export type { FormInstance };

export type PathProps = { path?: string } & Data;

export type VModelProps<T = any> = {
  modelValue?: T;
  'onUpdate:modelValue'?: (val: T) => void;
};

/**
 * 字段值格式化转换函数/对象
 *
 * @description
 * - 声明两个形参 `(newVal, oldVal)` 时，底层按需读取并传入写入前旧值快照深拷贝；
 * - 声明单形参 `(newVal)` 时，底层不读取旧值，不执行旧值深拷贝。
 */
export type ValueFormatter =
  | { (val: any, oldVal?: any): any }
  | { get?: (val: any) => any; set?: (val: any, oldVal?: any) => any };

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

export type FieldSlots = ComponentSlots<typeof VanField>;

type BaseCommon<D extends Data = Data> = {
  /**
   * @description 字段标识namePath, 同name；
   * 嵌套字段的 `path` 使用各自独立的完整路径（不与父级路径拼接），重复路径需自行保证唯一。
   */
  path?: Path<D>;
  /**
   * @description 字段是否隐藏；支持布尔、Ref 与 ComputedRef 形式，渲染期统一按 `toValue` 取值。
   */
  /*
   * hidden 与 disabled 声明原始值类型，类型面与渲染期的响应式形态（Ref / ComputedRef）由 WithRef 统一派生；
   * 此处再写 MaybeRefOrComputedRef 会形成二次包装
   */
  hidden?: boolean;
  /**
   * @description 字段是否禁用；字段级取值优先，未显式指定时继承上层（表单或宿主 Provider）的禁用上下文。
   */
  disabled?: boolean;
  /**
   * @description 字段中文名称，支持字符串或组件
   */
  label?: SlotComponentType;
  /**
   * @description 字段插槽配置
   */
  slots?: Partial<FieldSlots>;
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
  componentStyle?: StyleValue;
  /**
   * @description 表单字段component样式类名
   */
  componentClass?: ClassValue;
  /**
   * @description 表单字段外层 van-field 样式属性
   */
  fieldStyle?: StyleValue;
  /**
   * @description 表单字段外层 van-field 样式类名
   */
  fieldClass?: ClassValue;
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

/**
 * @description 合并 VanField 插槽与组件插槽
 */
export type MergeSlots<T, CS = ComponentSlots<T>> = Partial<{
  [K in keyof FieldSlots | keyof CS]: K extends keyof FieldSlots
    ? FieldSlots[K]
    : K extends keyof CS
      ? CS[K]
      : SlotComponentType;
}>;

type WithComponent<T, D extends Data = Data> = Omit<
  WithCommon<Partial<ComponentProps<T>>, D>,
  keyof VNodeProps | 'slots'
> & {
  slots?: MergeSlots<T>;
};

export type Field<
  C extends ComponentName = ComponentName,
  D extends Data = Data,
> = (FieldTypeMap<D>[C] | WithFields<D>) &
  Pick<AdditionalMethods<any>, 'getComponentRef' | 'getComponentComputedProps'>;

export type Fields<D extends Data = Data> = Array<Field<ComponentName, D>>;
