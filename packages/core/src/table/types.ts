import { Data, Path } from '../shared/types';

/**
 * 基础表格列配置接口
 * @template D - 表格数据类型，应为一个对象类型
 *
 * @example
 * ```ts
 * interface User { name: string; age: number; address: { city: string } }
 *
 * // 简单列
 * const column: BaseColumn<User> = {
 *   key: 'name',
 *   title: '姓名',
 * }
 *
 * // 带数据索引和嵌套列
 * const column: BaseColumn<User> = {
 *   key: 'address',
 *   title: '地址',
 *   children: [
 *     { key: 'city', title: '城市' },
 *   ],
 * }
 * ```
 */
export interface BaseColumn<D extends Data = Data> {
  /**
   * @description 列字段路径（数据对象的 key 路径），支持点号分隔的深层路径
   * @example 'name' | 'address.city'
   */
  key?: Path<D>;
  /**
   * @description 数据索引，与 key 作用类似，支持数组格式
   * @example 'name' | ['address', 'city']
   */
  dataIndex?: Path<D> | Path<D>[];
  /**
   * @description 嵌套子列配置，用于实现表头分组
   * @example [{ key: 'firstName', title: '名' }, { key: 'lastName', title: '姓' }]
   */
  children?: BaseColumn<D>[];
  /** 其他任意自定义属性（如 title、width、fixed 等 UI 属性） */
  [key: string]: any;
}

/**
 * 列配置数组类型
 * @template D - 表格数据类型
 * @template C - 列配置类型
 */
export type Columns<
  D extends Data = Data,
  C extends BaseColumn<D> = BaseColumn<D>,
> = Array<C>;

/**
 * 分页参数
 *
 * @example
 * ```ts
 * const pageParam: PageParam = {
 *   current: 1,
 *   pageSize: 10,
 *   total: 100,
 * }
 * ```
 */
export interface PageParam {
  /** 当前页码 */
  current: number;
  /** 每页条数 */
  pageSize: number;
  /** 总记录数 */
  total: number;
  /** 其他自定义分页属性 */
  [key: string]: any;
}

/**
 * 列更新选项
 */
export type UpdateColumnOptions = {
  /**
   * @description 是否更新所有匹配的列
   * - true: 更新所有匹配的列
   * - false/undefined: 只更新第一个匹配的列
   */
  all?: boolean;
};

/**
 * 列更新回调的参数对象
 * @template D - 表格数据类型
 * @template C - 列配置类型
 */
export type ColumnUpdaterParam<
  D extends Data,
  C extends BaseColumn<D> = BaseColumn<D>,
> = {
  /** 当前匹配到的列配置（只读） */
  column: Readonly<C>;
  /** 当前列在父级 columns 数组中的索引 */
  columnIndex: number;
  /** 包含当前列的组（一级列则为根 columns 数组的包装对象） */
  group: Columns<D, C>;
};

/**
 * 列更新回调函数类型
 * @template D - 表格数据类型
 * @template C - 列配置类型
 */
export type ColumnUpdater<
  D extends Data,
  C extends BaseColumn<D> = BaseColumn<D>,
> = (param: ColumnUpdaterParam<D, C>) => void;

/**
 * 列查找函数类型，通过自定义函数匹配列
 * @template D - 表格数据类型
 * @template C - 列配置类型
 *
 * @example
 * ```ts
 * // 查找 title 为 '姓名' 的列
 * const findBy: ColumnFindBy<MyData> = (column) => column.title === '姓名'
 *
 * // 查找所有宽度小于 100 的列
 * const findBy: ColumnFindBy<MyData> = (column) => column.width && column.width < 100
 * ```
 */
export type ColumnFindBy<
  D extends Data,
  C extends BaseColumn<D> = BaseColumn<D>,
> = (column: Readonly<C>) => boolean;
