import type { Data, Path } from '../shared/types';

/**
 * 基础字段配置：`path` / `name` 为字段标识，`fields` 声明嵌套子字段
 *
 * @template D - 表单数据类型，应为一个对象类型
 *
 * @example
 * ```ts
 * const field: BaseField<{ address: { city: string } }> = {
 *   path: 'address',
 *   label: '地址',
 *   fields: [{ path: 'address.city', label: '城市' }],
 * }
 * ```
 */
export interface BaseField<D extends Data = Data> {
  /** 字段路径：数据对象的 key 路径，支持点号分隔的深层路径（`'user.address.city'`） */
  path?: Path<D> | any;
  /**
   * 字段名称（与 `path` 同义，二者取一）
   * @deprecated 请改用 `path`
   */
  name?: any;
  /** 嵌套子字段配置数组（分组 / 嵌套字段） */
  fields?: any[];
  /** 其他任意自定义属性 */
  [key: string]: any;
}

/**
 * 字段更新回调的入参：命中字段、其在父数组中的索引与父级容器
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
  /** 包含当前字段的父级字段；一级字段时为虚拟根容器（`{ fields }`） */
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
 * 字段查找函数：返回 true 即命中
 * @template D - 表单数据类型
 * @template F - 字段配置类型
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
 * 字段实例暴露的额外方法（由适配层 BaseFormItem 实现）
 * @template FormItemInstance - FormItem 组件实例类型
 */
export type AdditionalMethods<FormItemInstance> = {
  /** 获取 FormItem 实例 */
  getFormItemRef?: () => FormItemInstance;
  /** 获取传入 FormItem 的属性 */
  getFormItemComputedProps?: () => Readonly<{ [x: string]: any }>;
  /** 获取字段控件实例 */
  getComponentRef?: () => any;
  /** 获取传入字段控件的属性 */
  getComponentComputedProps?: () => Readonly<{
    disabled?: boolean;
    [x: string]: any;
  }>;
};
