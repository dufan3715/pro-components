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

/** 带 `path` 的组件属性：容器与插槽组件按该路径关联字段 */
export type PathProps = { path?: string } & Data;

/** `modelValue` / `onUpdate:modelValue` 形态的 v-model 属性 */
export type VModelProps<T = any> = {
  modelValue?: T;
  'onUpdate:modelValue'?: (val: T) => void;
};

/**
 * 字段值格式化转换处理器
 *
 * @description
 * - 声明两个形参 `(newVal, oldVal)` 时，底层按需读取并传入写入前旧值快照深拷贝；
 * - 声明单形参 `(newVal)` 时，底层不读取旧值，不执行旧值深拷贝。
 */
export type ValueFormatter =
  | { (val: any, oldVal?: any): any }
  | { get?: (val: any) => any; set?: (val: any, oldVal?: any) => any };

/** 展示值格式化函数：将字段值转换为只读展示文本 */
export type DisplayFormatter = (val: any) => string;

/**
 * 自定义组件
 *
 * @description 以 `modelValue` / `onUpdate:modelValue` 绑定字段值，并通过 `path` 关联字段路径。
 */
export type RenderComponentType = Component<VModelProps & PathProps>;

/**
 * 插槽组件类型
 *
 * @description 支持组件定义、VNode、静态文本与返回插槽内容的函数；文本值按文本渲染，不作标签名解析。
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
 * 容器组件类型
 *
 * @description 支持组件定义、VNode 类型与 `Teleport` 等内置符号；未提供时不渲染包裹层。
 */
export type ContainerComponent =
  | Component<PathProps>
  | DefineComponent<PathProps>
  | VNodeTypes
  | symbol;

/**
 * 插槽对象类型
 *
 * @description 插槽名到插槽内容的映射，值按 `SlotComponentType` 渲染。
 */
export type Slots = {
  [name: string]: SlotComponentType;
};

/** 宿主 `van-field` 组件的插槽集合 */
export type FieldSlots = ComponentSlots<typeof VanField>;

type BaseCommon<D extends Data = Data> = {
  /**
   * 字段标识 namePath，同 name。
   *
   * 嵌套字段的 `path` 使用各自独立的完整路径（不与父级路径拼接），重复路径需自行保证唯一。
   */
  path?: Path<D>;
  /**
   * 字段是否隐藏；支持布尔、Ref 与 ComputedRef 形式，渲染期统一按 `toValue` 取值。
   */
  /*
   * hidden 与 disabled 声明原始值类型，类型面与渲染期的响应式形态（Ref / ComputedRef）由 WithRef 统一派生；
   * 此处再写 MaybeRefOrComputedRef 会形成二次包装
   */
  hidden?: boolean;
  /**
   * 字段是否禁用；字段级取值优先，未显式指定时继承上层（表单或宿主 Provider）的禁用上下文。
   */
  disabled?: boolean;
  /** 字段中文名称，支持字符串或组件 */
  label?: SlotComponentType;
  /** 字段插槽配置 */
  slots?: Partial<FieldSlots>;
  /** 嵌套 fields 容器包裹组件 */
  fieldContainer?: ContainerComponent;
  /** 额外的自定义属性，不会被当作组件参数 */
  extraProps?: Record<string, any>;
};

type BaseWithFields<D extends Data = Data> = BaseCommon<D> & {
  /** 嵌套子字段配置；分组场景可配合 `CellGroup` 包裹 */
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
  /** 表单字段 `component` 的样式属性 */
  componentStyle?: StyleValue;
  /** 表单字段 `component` 的样式类名 */
  componentClass?: ClassValue;
  /** 表单字段外层 `van-field` 的样式属性 */
  fieldStyle?: StyleValue;
  /** 表单字段外层 `van-field` 的样式类名 */
  fieldClass?: ClassValue;
  /** 字段 `component` 的容器包裹组件 */
  componentContainer?: ContainerComponent;
  /** 字段值处理函数，在 `onUpdateValue` 前执行 */
  valueFormatter?: ValueFormatter;
  /** Popup 展现形式下，将字段值转换为只读展示文字 */
  displayFormatter?: DisplayFormatter;
  /** 组件 v-model 双向绑定更新属性名，默认 `modelValue` */
  modelProp?: string;
  /** 是否通过 Popup 弹窗展示该组件；为 true 或传递 PopupProps 配置对象时开启 */
  popup?: boolean | Partial<PopupProps>;
};

/** 基础公共字段类型：含嵌套 fields 的容器字段，或无嵌套字段的控件字段 */
export type Base<D extends Data = Data> =
  | BaseWithFields<D>
  | BaseWithoutFields<D>;

/**
 * 字段类型集合
 *
 * @description 按组件名映射到对应的字段配置类型；`custom` 对应 `component` 直接传入的自定义组件。
 */
export type FieldTypeMap<D extends Data = Data> = {
  [K in ComponentName]: K extends 'custom'
    ? WithCommon<{ slots?: Slots; [x: string]: any }, D> & {
        component?: RenderComponentType | Raw<RenderComponentType>;
      }
    : WithComponent<GetComponentType<K>, D> & { component?: K };
};

/** 不支持 Ref / ComputedRef 包装的属性名 */
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

/**
 * 为对象属性添加响应式支持的类型
 *
 * @template T - 原始类型
 */
export type WithRef<T> = {
  [P in keyof T]: P extends NotSupportedRefOrGetterProps
    ? T[P]
    : T[P] extends (...args: any[]) => any
      ? T[P]
      : MaybeRefOrComputedRef<T[P]>;
};

/** 公共字段属性集合：宿主 `van-field` 透传属性与额外属性 T */
type WithCommonBase<T = unknown> = T &
  Partial<Omit<FieldProps, 'label' | 'name' | 'type'>>;

/** 无嵌套字段的字段配置（含宿主 Field 属性） */
type WithCommon<T, D extends Data = Data> = WithRef<
  WithCommonBase<T> & BaseWithoutFields<D>
>;

/** 含嵌套 fields 的字段配置（含宿主 Field 属性） */
type WithFields<D extends Data = Data> = WithRef<
  WithCommonBase & BaseWithFields<D>
>;

/**
 * 合并 VanField 插槽与组件插槽
 *
 * @description 同名键优先取宿主 Field 插槽类型，其次取组件插槽类型。
 */
export type MergeSlots<T, CS = ComponentSlots<T>> = Partial<{
  [K in keyof FieldSlots | keyof CS]: K extends keyof FieldSlots
    ? FieldSlots[K]
    : K extends keyof CS
      ? CS[K]
      : SlotComponentType;
}>;

/**
 * 自动从 Vue 组件提取 Props 和 Slots，并加上公共表单字段属性
 *
 * @template T - Vue 组件类型
 * @template D - 数据对象类型
 */
type WithComponent<T, D extends Data = Data> = Omit<
  WithCommon<Partial<ComponentProps<T>>, D>,
  keyof VNodeProps | 'slots'
> & {
  slots?: MergeSlots<T>;
};

/**
 * 字段配置类型，包含所有字段属性和响应式支持
 *
 * @template C - 组件名类型
 * @template D - 数据对象类型
 *
 * @public
 */
export type Field<
  C extends ComponentName = ComponentName,
  D extends Data = Data,
> = (FieldTypeMap<D>[C] | WithFields<D>) &
  Pick<AdditionalMethods<any>, 'getComponentRef' | 'getComponentComputedProps'>;

/**
 * 字段数组类型
 *
 * @template D - 数据对象类型
 *
 * @public
 */
export type Fields<D extends Data = Data> = Array<Field<ComponentName, D>>;
