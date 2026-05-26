import { Data, Path } from '../shared/types';

/**
 * 基础字段配置接口
 * @template D - 表单数据类型，应为一个对象类型
 *
 * @example
 * ```ts
 * // 简单的文本输入字段
 * const field: BaseField<{ name: string }> = {
 *   path: 'name',
 *   label: '姓名',
 * }
 *
 * // 带嵌套子字段
 * const field: BaseField<{ address: { city: string; street: string } }> = {
 *   path: 'address',
 *   label: '地址',
 *   fields: [
 *     { path: 'city', label: '城市' },
 *     { path: 'street', label: '街道' },
 *   ],
 * }
 * ```
 */
export interface BaseField<D extends Data = Data> {
  /**
   * @description 字段路径（数据对象的 key 路径），支持点号分隔的深层路径
   * @example 'name' | 'user.address.city'
   */
  path?: Path<D> | any;
  /**
   * @description 字段名称，与 path 作用相同，两者选其一即可
   * @deprecated 推荐使用 path 替代
   */
  name?: any;
  /**
   * @description 嵌套子字段配置数组，用于实现分组/嵌套字段
   * @example [{ path: 'firstName', label: '名' }, { path: 'lastName', label: '姓' }]
   */
  fields?: any[];
  /** 其他任意自定义属性 */
  [key: string]: any;
}

/**
 * 字段更新回调的参数对象
 * @template D - 表单数据类型
 * @template F - 字段配置类型，继承自 BaseField<D>
 */
export type FieldUpdaterParam<
  D extends Data,
  F extends BaseField<D> = BaseField<D>,
> = {
  /** 当前匹配到的字段配置（只读） */
  field: Readonly<F>;
  /** 当前字段在父级 fields 数组中的索引 */
  fieldIndex: number;
  /** 包含当前字段的父级字段（如果是一级字段，则 parentField 为虚拟的根容器） */
  parentField: F;
};

/**
 * 字段更新回调函数类型
 * @template D - 表单数据类型
 * @template F - 字段配置类型
 */
export type FieldUpdater<
  D extends Data,
  F extends BaseField<D> = BaseField<D>,
> = (param: FieldUpdaterParam<D, F>) => void;

/**
 * 字段查找函数类型，通过自定义函数匹配字段
 * @template D - 表单数据类型
 * @template F - 字段配置类型
 * @example
 * ```ts
 * // 查找 label 为 '姓名' 的字段
 * const findBy: FieldFindBy<MyData> = (field) => field.label === '姓名'
 * ```
 */
export type FieldFindBy<
  D extends Data,
  F extends BaseField<D> = BaseField<D>,
> = (field: Readonly<F>) => boolean;

/**
 * 字段配置数组类型
 * @template D - 表单数据类型
 * @template F - 字段配置类型
 */
export type Fields<
  D extends Data = Data,
  F extends BaseField<D> = BaseField<D>,
> = F[];

/**
 * FormItem 实例提供的额外方法
 * @template FormItemInstance - FormItem 组件实例类型
 */
export type AdditionalMethods<FormItemInstance> = {
  /**
   * @description 获取 FormItem 实例的方法
   */
  getFormItemRef?: () => FormItemInstance;
  /**
   * @description 获取传入 FormItem 组件的属性
   */
  getFormItemComputedProps?: () => Readonly<{ [x: string]: any }>;
  /**
   * @description 获取组件实例的方法
   */
  getComponentRef?: () => any;
  /**
   * @description 获取传入 Component 组件的属性
   */
  getComponentComputedProps?: () => Readonly<{
    disabled?: boolean;
    [x: string]: any;
  }>;
};
