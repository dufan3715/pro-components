import type { ColumnType } from '../../../shared/ui';
import {
  Data,
  ExtendWithAny,
  KeyExpandString,
  Paths,
  Path,
} from '../../../shared/core';

type BivariantRender<D extends Data = Data> = {
  bivarianceHack(scope: ColumnScope<D>): any;
}['bivarianceHack'];

/**
 * Element Plus 表格列作用域
 * @template D - 表格行数据类型
 
 * @public
 */
export type ColumnScope<D extends Data = Data> = {
  /** 当前行数据 */
  row: ExtendWithAny<D>;
  /** 当前列配置 */
  column: Column<D>;
  /** 行索引 */
  $index: number;
  /** 单元格值 */
  cellValue: any;
};

/**
 * @qin-ui/element-plus-pro 表格列配置类型
 *
 * @description 基于 Element Plus 的 ColumnType 列类型，并添加：
 * - prop 作为主要字段（Element Plus 使用 prop 而非 dataIndex）
 * - key 作为辅助标识
 * - hidden 属性
 * - render 自定义渲染函数
 *
 * @template D - 表格行数据类型
 *
 * @example
 * ```ts
 * interface User { name: string; age: number }
 *
 * const columns: Columns<User> = [
 *   { prop: 'name', label: '姓名', width: 120 },
 *   { prop: 'age', label: '年龄', width: 80 },
 * ]
 * ```
 
 * @public
 */
export type Column<D extends Data = Data> = Partial<
  Omit<ColumnType<any>, 'prop' | 'property' | 'children' | 'render'>
> & {
  /** 列字段标识（辅助字段） */
  key?: Path<D>;
  /**
   * @description 列数据路径（主要字段）
   * Element Plus 使用 prop 而非 dataIndex
   * @example 'name' | 'address.city'
   */
  prop?: KeyExpandString<Extract<keyof D, string>> | Paths<D>;
  /** 是否隐藏该列 */
  hidden?: boolean;
  /** 自定义渲染函数 */
  render?: BivariantRender<D>;
};

/**
 * @qin-ui/element-plus-pro 表格列配置数组类型
 * @template D - 表格行数据类型
 
 * @public
 */
export type Columns<D extends Data = Data> = Array<Column<D>>;
