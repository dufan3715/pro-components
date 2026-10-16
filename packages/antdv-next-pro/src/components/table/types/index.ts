import type { ColumnType } from '../../../shared/ui';
import type { Data, KeyExpandString, Paths, Path } from '../../../shared/core';
import type { ComputedRef, MaybeRef } from 'vue';
type MaybeRefOrComputedRef<T = any> = MaybeRef<T> | ComputedRef<T>;

/**
 * 表格列配置类型
 *
 * @description 继承 antdv-next 的 ColumnType 列类型，并添加：
 * - 类型安全的 dataIndex（基于泛型 D 推导路径），优先使用
 * - key 作为辅助标识
 * - hidden 用于控制列显隐，按 `MaybeRefOrComputedRef<boolean>` 重声明（宿主列类型的 boolean 形态先剔除）
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
 *
 * @public
 */
export type Column<D extends Data = Data> = Omit<
  ColumnType,
  'dataIndex' | 'key' | 'hidden'
> & {
  /**
   * 列数据路径（主要字段）
   *
   * @example 'name' | 'address.city' | ['address', 'city']
   */
  dataIndex?: KeyExpandString<Extract<keyof D, string>> | Paths<D>;
  /**
   * 列字段标识（辅助字段）
   */
  key?: Path<D>;
  /**
   * 列是否隐藏；支持布尔、Ref 与 ComputedRef 形式，渲染期按 `toValue` 取值。
   * 分组列的子列同样参与过滤（递归生效）。
   * @default false
   */
  hidden?: MaybeRefOrComputedRef<boolean>;
  /**
   * 分组子列；提供时该列作为分组表头渲染，子列沿用同一配置类型
   */
  children?: Column<D>[];
};

/**
 * 表格列配置数组类型
 * @template D - 表格行数据类型
 *
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
