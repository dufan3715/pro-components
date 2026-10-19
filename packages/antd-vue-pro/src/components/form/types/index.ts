import type {
  GridProps,
  GridItemProps,
  FormInstance,
  FormItemProps,
} from '../../../shared/ui';
import type { FormItem } from '../../../shared/ui';
import type {
  ComponentProps,
  ComponentSlots,
} from 'vue-component-type-helpers';
import type { VNode, VNodeProps } from 'vue';
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
import type { AdditionalMethods } from '../../../shared/core';
import type { FormItemInstance } from '../../../shared/ui';

export type { FormInstance };

/** 带 `path` 的组件属性：容器与插槽组件按该路径关联字段 */
export type PathProps = { path?: string } & Data;

/** `value` / `onUpdate:value` 形态的 v-model 属性 */
export type VModelProps<T = any> = {
  value?: T;
  'onUpdate:value'?: (val: T) => void;
};

/**
 * 字段值格式化/转换处理器
 *
 * @description 支持函数形态或包含 get/set 方法的对象形态。
 *
 * ### 行为与契约说明
 * 1. **旧值参数按需注入**：底层基于函数的形参声明个数（`fn.length > 1`）决定是否读取旧值。若转换逻辑需要使用旧值，请显式声明两个形参 `(val, oldVal) => ...`（请勿使用默认参数或 `...args` 剩余参数，否则 `fn.length` 无法正确识别）；
 * 2. **只读快照副本**：传入的 `oldVal` 为只读快照副本，不得依赖原地修改写回；仅当 formatter 声明双形参时才克隆旧值，单参转换零开销。
 *
 * @example
 * ```ts
 * // 1. 单参数转换（常见）：无需旧值，零多余开销
 * valueFormatter: (val) => val?.trim()
 *
 * // 2. 双参数转换：需要基于旧值做对比或回退
 * valueFormatter: (val, oldVal) => (isValid(val) ? val : oldVal)
 *
 * // 3. 对象形态：分别定义读（展示）与写（存储）转换
 * valueFormatter: {
 *   get: (val) => (val ? dayjs(val).format('YYYY-MM-DD') : ''),
 *   set: (val, oldVal) => (val ? dayjs(val).valueOf() : undefined),
 * }
 * ```
 */
export type ValueFormatter =
  | { (val: any, oldVal?: any): any }
  | { get?: (val: any) => any; set?: (val: any, oldVal?: any) => any };

/**
 * 自定义组件
 *
 * @example (p, ctx) => h('div', ctx.attrs)
 */
export type RenderComponentType = Component<VModelProps & PathProps>;

/**
 * 插槽组件类型
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
 */
export type ContainerComponent = Component<PathProps>;

/**
 * 插槽对象类型
 */
export type Slots = {
  [name: string]: SlotComponentType;
};

/** 选项项：`label` 展示文案与 `value` 取值，其余键透传控件 */
export type Option = { label: string; value: any; [x: string]: any };
/** 选项数组 */
export type Options = Array<Option>;

/** 表单栅格开关：`true` 启用默认栅格，或传 `GridProps` 自定义 */
export type Grid = boolean | (GridProps & {});

/** FormItem 自身的插槽集合（label / extra / help / tooltip 等） */
export type FormItemSlots = ComponentSlots<typeof FormItem>;

type BaseCommon<D extends Data = Data> = {
  /**
   * 字段标识namePath, 同name
   *
   * 字段标识按 `name`、`path` 的顺序取首个非 `null` / `undefined` 的值（`name` 优先），
   * 结果经 `normalizePathKey` 归一化，供渲染标识与 core 字段查找 API（`getField` / `setField` 等）共用；
   * `name` 仅参与标识解析，不落入控件属性透传。与 `element-plus-pro` 口径不同（该包宿主标识键为 `prop`，`name` 仅透传控件）。
   * 嵌套字段的 `path` 使用各自独立的完整路径（不与父级路径拼接），重复路径需自行保证唯一。
   *
   * @example 'name' | 'age' | 'sex' | ...
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
  /**
   * 字段中文名称，支持字符串或组件
   *
   * @example '姓名' | '年龄' | '性别' | () => h('span', '自定义标签')
   */
  label?: SlotComponentType;
  /**
   * 字段插槽配置，可包含formItem插槽和component插槽
   *
   * @example
   * ```js
   * slots: {
   *   label: () => h('div', { style: { fontSize: '12px' } }, '年龄'),
   *   addonAfter: '岁',
   *   suffix: () => h('span', '元')
   * }
   * ```
   */
  slots?: Partial<FormItemSlots>;
  /**
   * 字段formItem样式属性
   *
   * @example { marginBottom: '8px', padding: '12px' }
   */
  formItemStyle?: StyleValue;
  /**
   * 字段formItem样式类名
   *
   * @example 'custom-form-item' | 'required-field'
   */
  formItemClass?: ClassValue;
  /**
   * 字段formItem容器包裹组件
   *
   * @example (props, ctx) => h('div', { class: 'custom-container' }, ctx.slots.default?.())
   */
  formItemContainer?: ContainerComponent;
  /**
   * 将属性附加到 FormItem 的 DOM 节点
   *
   * @example { 'data-form-item-test': 'test-value', 'aria-label': 'name' }
   */
  formItemDataAttrs?: Record<string, string>;
  /**
   * 额外的自定义属性，不会被当作组件参数，仅用做给字段添加标识属性等功能
   *
   * @example { group: 'group-1' }
   */
  extraProps?: Record<string, any>;
};

type BaseWithFields<D extends Data = Data> = BaseCommon<D> & {
  /**
   * 嵌套子字段配置
   *
   * @example [{ key: 'firstName', label: '名' }, { key: 'lastName', label: '姓' }]
   */
  fields: Fields<D>;
  /**
   * 网格布局属性，true表示使用默认网格布局，针对具有嵌套字段的字段
   *
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
   * 字段component样式属性
   *
   * @example { width: '100%', borderColor: '#d9d9d9' }
   */
  componentStyle?: StyleValue;
  /**
   * 字段component样式类名
   *
   * @example 'custom-input' | 'error-input'
   */
  componentClass?: ClassValue;
  /**
   * 字段component容器包裹组件
   *
   * @example (props, ctx) => h('div', { class: 'input-wrapper' }, ctx.slots.default?.())
   */
  componentContainer?: ContainerComponent;
  /**
   * 字段值处理函数，在onUpdateValue前执行，函数返回值将作为更新值，也可设置get和set函数，用于处理字段值
   *
   * @example (val) => val?.trim()
   */
  valueFormatter?: ValueFormatter;
  /**
   * 组件v-model双向绑定更新属性名，默认'value'
   */
  modelProp?: string;
  /**
   * 将属性附加到表单组件的 DOM 节点
   *
   * @example { 'data-test': 'input-value', 'aria-label': 'name' }
   */
  componentDataAttrs?: Record<string, string>;
};

/** 基础公共字段类型 */
export type Base<D extends Data = Data> =
  | BaseWithFields<D>
  | BaseWithoutFields<D>;

/** 字段类型集合 */
export type FieldTypeMap<D extends Data = Data> = {
  [K in ComponentName]: K extends 'custom'
    ? WithCommon<{ slots?: Slots; [x: string]: any }, D> & {
        component?: RenderComponentType | Raw<RenderComponentType>;
      }
    : WithComponent<GetComponentType<K>, D> & { component?: K };
};

/**
 * 不支持响应式的属性名
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

/**
 * 公共字段属性集合：FormItem 透传属性与 GridItem 栅格属性
 *
 * 栅格行为边界：字段显式指定 `span` 时整体接管栅格，不再叠加 Provider 注入的响应式断点；
 * 未指定 `span` 时使用注入的断点配置。
 */
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
 * 合并 FormItem 插槽与组件插槽
 */
export type MergeSlots<T, CS = ComponentSlots<T>> = Partial<{
  [K in keyof FormItemSlots | keyof CS]: K extends keyof FormItemSlots
    ? FormItemSlots[K]
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
 * @template D - 数据对象类型
 * @public
 */
export type Field<
  C extends ComponentName = ComponentName,
  D extends Data = Data,
> = (FieldTypeMap<D>[C] | WithFields<D>) & AdditionalMethods<FormItemInstance>;

/**
 * 字段数组类型
 *
 * @template D - 数据对象类型
 * @public
 */
export type Fields<D extends Data = Data> = Array<Field<ComponentName, D>>;
