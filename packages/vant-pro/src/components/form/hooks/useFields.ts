import { FieldInstance } from '../../../shared/ui';
import {
  useFields as coreUseFields,
  type UseFieldsReturn,
} from '../../../shared/core';
import type { Data } from '../../../shared/core';
import type { Field, Fields } from '../types';
import type { ComponentName } from '../constants';

/**
 * 字段配置管理 Hook
 *
 * @description 基于 `@qin-ui/pro-components-core` 的 `useFields`，将泛型参数绑定为 Vant 的本地类型：
 * - 字段类型 F -> `Field<ComponentName, D>`（支持 Vant 组件类型推导）
 * - Field 实例 -> Vant 的 `FieldInstance`
 *
 * 提供对字段配置数组的增删改查操作，支持：
 * - 通过路径字符串或查找函数定位字段
 * - 深层嵌套字段的遍历和匹配
 * - 字段配置的合并/覆盖更新
 * - 字段的添加、插入、删除
 * - 父级字段查找
 *
 * @template D - 表单数据类型
 * @param {Fields<D>} [initFields] - 初始字段配置数组
 *
 * @returns 字段操作对象，包含以下属性：
 * - `fields` - 字段配置数组（响应式 Ref\<F[]\>）
 * - `getField(path)` - 获取字段配置，支持路径字符串或查找函数
 * - `setField(path, field, options?)` - 更新字段配置，默认合并模式
 * - `deleteField(path, options?)` - 删除字段配置
 * - `appendField(path, field, options?)` - 在指定字段后追加
 * - `prependField(path, field, options?)` - 在指定字段前插入
 * - `getParentField(path, options?)` - 获取父级字段配置
 *
 * @example
 * ```ts
 * interface User { name: string; age: number }
 *
 * const { fields, getField, setField } = useFields<User>([
 *   { path: 'name', label: '姓名', component: 'field' },
 *   { path: 'age', label: '年龄', component: 'stepper' },
 * ])
 *
 * // 通过路径获取
 * getField('name')
 * // 通过查找函数获取
 * getField(f => f.label === '姓名')
 * // 更新字段（合并模式）
 * setField('name', { label: '用户名', disabled: true })
 * ```
 *
 * @see {@link coreUseFields} 底层核心实现（来自 @qin-ui/pro-components-core）
 *
 * @public
 */
export function useFields<D extends Data = Data>(
  initFields?: Fields<D>
): UseFieldsReturn<D, Field<ComponentName, D>, FieldInstance>;
export function useFields(initFields?: any) {
  return coreUseFields(initFields);
}

/** useFields 返回值类型
 * @public
 */
export type UseFields<D extends Data = Data> = ReturnType<typeof useFields<D>>;
