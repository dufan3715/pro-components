import type { ColumnType } from '../../../shared/ui';
import { Data, ExtendWithAny, Path } from '../../../shared/core';

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
  prop?: Path<D>;
  /** 是否隐藏该列 */
  /**
   * @description 列是否隐藏；支持布尔、Ref 与 getter 形式，渲染期按 `toValue` 取值。
   * 分组列的子列 `hidden` 不参与过滤（仅顶层列参与）。
   */
  hidden?: boolean;
  /** 自定义渲染函数 */
  render?: BivariantRender<D>;
  /** 嵌套子列（用于表头分组） */
  children?: Column<D>[];
};

/**
 * @qin-ui/element-plus-pro 表格列配置数组类型
 * @template D - 表格行数据类型
 
 * @public
 */
export type Columns<D extends Data = Data> = Array<Column<D>>;

/**
 * 列控制配置（用于 control.columnControl）
 *
 * @template K - 列 key 类型，ProTable 中传入 Path<RecordType> 获得自动补全
 *
 * @example
 * ```ts
 * const config: ColumnControlConfig<'name' | 'age'> = {
 *   labels: { name: '姓名', age: '年龄' },
 *   excludedKeys: [],
 *   disabledKeys: ['name'],
 *   disableCheckAll: false,
 * }
 * ```
 */
export type ColumnControlConfig<K extends string | number = string | number> = {
  /** 列在下拉中的自定义显示名称映射（key 为列标识），用于定制展示文案或覆盖非字符串标题 */
  labels?: Partial<Record<K, string>>;
  /** 不在下拉中出现的列 keys（始终展示，不参与勾选） */
  excludedKeys?: K[];
  /** 在下拉中显示但不可取消勾选的列 keys（始终展示，始终勾选） */
  disabledKeys?: K[];
  /** 禁用全选/取消全选 */
  disableCheckAll?: boolean;
};
