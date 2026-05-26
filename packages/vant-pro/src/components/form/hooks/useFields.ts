import { FieldInstance } from '../../../shared/ui';
import { useFields as _useFields } from '../../../shared/core';
import type { Data } from '../../../shared/core';
import type { Field, Fields } from '../types';
import type { ComponentName } from '../constants';

/**
 * @qin-ui/vant-pro 的字段配置管理 Hook
 *
 * @description 类型安全的 re-export。将 core useFields 的泛型参数绑定为本地类型：
 * - 字段类型 F → Field<ComponentName, D>（支持 Vant 组件类型推导）
 * - Field 实例 → Vant 的 FieldInstance
 *
 * @template D - 表单数据类型
 *
 * @example
 * ```ts
 * interface User { name: string; age: number }
 *
 * const { fields, getField, setField } = useFields<User>([
 *   { path: 'name', label: '姓名', component: 'field' },
 *   { path: 'age', label: '年龄', component: 'stepper' },
 * ])
 * ```
 
 * @public
 */
export const useFields = _useFields as {
  <D extends Data = Data>(
    initFields?: Fields<D>
  ): ReturnType<typeof _useFields<D, Field<ComponentName, D>, FieldInstance>>;
};

/** useFields 返回值类型，固定为本地 Fields<D>
 * @public
 */
export type UseFields<D extends Data = Data> = ReturnType<typeof useFields<D>>;
