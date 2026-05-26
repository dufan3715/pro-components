import { useForm as _useForm, type Form as _Form } from '../../../shared/core';
import type { Data, ExtendWithAny, DeepPartial } from '../../../shared/core';
import type { Field } from '../types';
import type { ComponentName } from '../constants';
import type { FormInstance } from '../../../shared/ui';

/**
 * @qin-ui/antd-vue-pro 的表单实例类型
 *
 * @description 在 core Form 类型的基础上：
 * 1. 将字段类型 F 默认绑定为本地 Field<ComponentName, D>，支持 Ant Design Vue 所有内置组件类型
 * 2. 将底层表单实例 I 绑定为 Ant Design Vue 的 FormInstance，使 formRef 获得完整的类型提示
 * @public
 *
 * @template D - 表单数据类型
 * @template F - 字段配置类型，默认使用本地 Field 类型
 *
 * @example
 * ```ts
 * interface User { name: string; age: number }
 * const form: Form<User> = useForm({ name: '张三', age: 25 })
 * form.formRef.value?.validate() // 类型安全地访问 Ant Design Vue 的 Form validate 方法
 * ```
 */
export type Form<
  D extends Data = Data,
  F extends Field<ComponentName, D> = Field<ComponentName, D>,
> = _Form<D, F, FormInstance>;

/**
 * 创建 @qin-ui/antd-vue-pro 表单实例的 Hook
 *
 * @description 类型安全的 re-export。将 core useForm 的泛型参数绑定为本地类型：
 * - 字段类型 F → Field<ComponentName, D>（支持 Ant Design Vue 组件类型推导）
 * - 表单实例 → Ant Design Vue 的 FormInstance
 *
 * 使用方式与 core useForm 完全一致，详见 {@link @qin-ui/core} 的 useForm 文档。
 * @public
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
 *
 * // 类型已绑定 Ant Design Vue
 * await form.formRef.value?.validate() // ✅ 类型正确
 * ```
 */
export const useForm = _useForm as {
  <D extends Data = Data>(
    initFormData?: ExtendWithAny<DeepPartial<D>>,
    initFields?: Field<ComponentName, D>[],
    root?: boolean
  ): Form<D, Field<ComponentName, D>>;
  <D extends Data = Data>(root?: boolean): Form<D, Field<ComponentName, D>>;
};
