import { useForm as _useForm, type Form as _Form } from '../../../shared/core';
import type { Data, ExtendWithAny, DeepPartial } from '../../../shared/core';
import type { Field } from '../types';
import type { ComponentName } from '../constants';
import type { FormInstance } from '../../../shared/ui';

/**
 * @qin-ui/antdv-next-pro 的表单实例类型
 *
 * @description 在 core Form 类型的基础上：
 * 1. 将字段类型 F 默认绑定为本地 Field<ComponentName, D>，支持 antdv-next 所有内置组件类型
 * 2. 将底层表单实例 I 绑定为 antdv-next 的 FormInstance，使 formRef 获得完整的类型提示
 *
 * @template D - 表单数据类型
 * @template F - 字段配置类型，默认使用本地 Field 类型
 *
 * @example
 * ```ts
 * interface User { name: string; age: number }
 * const form: Form<User> = useForm({ name: '张三', age: 25 })
 * form.formRef.value?.validate() // 类型安全地访问 antdv-next Form validate 方法
 * ```
 
 * @public
 */
export type Form<
  D extends Data = Data,
  F extends Field<ComponentName, D> = Field<ComponentName, D>,
> = _Form<D, F, FormInstance>;

/**
 * 创建 @qin-ui/antdv-next-pro 表单实例的 Hook
 *
 * @description 类型安全的 re-export。将 core useForm 的泛型参数绑定为本地类型：
 * - 字段类型 F → Field<ComponentName, D>（支持 antdv-next 组件类型推导）
 * - 表单实例 → antdv-next 的 FormInstance
 *
 * @template D - 表单数据类型
 *
 * @example
 * ```ts
 * interface User { name: string; age: number }
 *
 * const form = useForm<User>(
 *   { name: '张三', age: 25 },
 *   [
 *     { path: 'name', label: '姓名', component: 'input' },
 *     { path: 'age', label: '年龄', component: 'input-number' },
 *   ],
 *   true
 * )
 * ```
 
 * @public
 */
export const useForm = _useForm as {
  <D extends Data = Data>(
    initFormData?: ExtendWithAny<DeepPartial<D>>,
    initFields?: Field<ComponentName, D>[],
    root?: boolean
  ): Form<D, Field<ComponentName, D>>;
  <D extends Data = Data>(root?: boolean): Form<D, Field<ComponentName, D>>;
};
