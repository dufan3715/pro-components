import { FormItemInstance } from '../../../shared/ui';
import { useFields as _useFields } from '../../../shared/core';
import type { Data } from '../../../shared/core';
import type { Field, Fields } from '../types';
import type { ComponentName } from '../constants';

/**
 * @qin-ui/antd-vue-pro 的字段配置管理 Hook
 *
 * @description 类型安全的 re-export。将 core useFields 的泛型参数绑定为本地类型：
 * - 字段类型 F → Field<ComponentName, D>（支持 Ant Design Vue 组件类型推导）
 * - FormItem 实例 → Ant Design Vue 的 FormItemInstance
 *
 * 提供对字段配置数组的增删改查操作，详见 `@qin-ui/core` 的 useFields 文档。
 * @public
 *
 * @template D - 表单数据类型
 *
 * @example
 * ```ts
 * interface User { name: string; age: number }
 *
 * const { fields, getField, setField } = useFields<User>([
 *   { path: 'name', label: '姓名', component: 'input' },
 *   { path: 'age', label: '年龄', component: 'input-number' },
 * ])
 *
 * // 获取字段（类型安全，包含 Ant Design Vue 组件属性）
 * getField('name') // 返回值包含 input 组件的所有可选属性
 * ```
 */
export const useFields = _useFields as {
  <D extends Data = Data>(
    initFields?: Fields<D>
  ): ReturnType<
    typeof _useFields<D, Field<ComponentName, D>, FormItemInstance>
  >;
};

/**
 * useFields 返回值类型，固定为本地 Fields<D>
 * @public
 */
export type UseFields<D extends Data = Data> = ReturnType<typeof useFields<D>>;
