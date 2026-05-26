import type { ColumnType } from '../../../shared/ui';
import { Data, KeyExpandString, Paths, Path } from '../../../shared/core';

/**
 * @qin-ui/antdv-next-pro 表格列配置类型
 *
 * @description 继承 antdv-next 的 ColumnType 列类型，并添加：
 * - 类型安全的 dataIndex（基于泛型 D 推导路径），优先使用
 * - key 作为辅助标识
 * - hidden 属性用于控制列显隐
 *
 * @template D - 表格行数据类型
 *
 * @example
 * ```ts
 * interface User { name: string; age: number }
 *
 * const columns: Columns<User> = [
 *   { dataIndex: 'name', title: '姓名', width: 120 },
 *   { dataIndex: 'age', title: '年龄', width: 80 },
 * ]
 * ```
 
 * @public
 */
export type Column<D extends Data = Data> = Omit<
  ColumnType,
  'dataIndex' | 'key'
> & {
  /**
   * @description 列数据路径（主要字段），优先使用 dataIndex 进行字段匹配
   * @example 'name' | 'address.city' | ['address', 'city']
   */
  dataIndex?: KeyExpandString<Extract<keyof D, string>> | Paths<D>;
  /**
   * @description 列字段标识（辅助字段），当 dataIndex 不满足需求时使用
   */
  key?: Path<D>;
  /**
   * @description 是否隐藏该列
   * @default false
   */
  hidden?: boolean;
};

/**
 * @qin-ui/antdv-next-pro 表格列配置数组类型
 * @template D - 表格行数据类型
 
 * @public
 */
export type Columns<D extends Data = Data> = Array<Column<D>>;
