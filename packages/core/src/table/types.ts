import type { Data, Path } from '../shared/types';

/**
 * 基础表格列配置：`key` / `dataIndex` 定位字段，`children` 声明表头分组
 *
 * @template D - 表格数据类型，应为一个对象类型
 *
 * @example
 * ```ts
 * const column: BaseColumn<User> = { key: 'name', title: '姓名' }
 * const grouped: BaseColumn<User> = {
 *   key: 'address',
 *   title: '地址',
 *   children: [{ key: 'address.city', title: '城市' }],
 * }
 * ```
 */
export interface BaseColumn<D extends Data = Data> {
  /** 列字段路径：数据对象的 key 路径，支持点号分隔的深层路径（`'address.city'`） */
  key?: Path<D>;
  /** 数据索引（与 `key` 同义，支持 `['address','city']` 数组形式） */
  dataIndex?: Path<D> | Path<D>[];
  /** 嵌套子列配置（表头分组） */
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
 * @description `resetQueryParams` 对分页为快照合并写：恢复初始化快照中存在的键，运行期新增的键保留
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
 * 列更新选项：`all` 控制是否作用于全部匹配列
 */
export type UpdateColumnOptions = {
  /** 是否更新所有匹配的列（默认只更新第一个匹配） */
  all?: boolean;
};

/**
 * 列更新回调的入参：命中列、其在组内的索引与所在组
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
  /** 包含当前列的组（数组引用；一级列为根 columns 数组） */
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
 * 列查找函数：返回 true 即命中
 * @template D - 表格数据类型
 * @template C - 列配置类型
 */
export type ColumnFindBy<
  D extends Data,
  C extends BaseColumn<D> = BaseColumn<D>,
> = (column: Readonly<C>) => boolean;
