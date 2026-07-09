import {
  useForm as coreUseForm,
  type Form as _Form,
} from '../../../shared/core';
import type { Data, ExtendWithAny, DeepPartial } from '../../../shared/core';
import type { Field } from '../types';
import type { ComponentName } from '../constants';
import type { FormInstance } from '../../../shared/ui';

/**
 * 表单实例类型
 *
 * @description 在 core Form 类型的基础上，将字段类型 F 绑定为本地 Field<ComponentName, D>，
 * 将底层表单实例 I 绑定为 antdv-next 的 FormInstance，使 formRef 获得完整的类型提示。
 *
 * @template D - 表单数据类型
 * @template F - 字段配置类型，默认使用本地 Field 类型
 *
 * @property formData  - 响应式表单数据对象，可直接读写，支持深层路径如 `formData.address.city`
 * @property getFormData - 获取指定路径的表单数据，支持点号分隔的深层路径，如 `getFormData('address.city')`
 * @property setFormData - 设置表单数据，支持三种调用方式：<br>
 *   1. `setFormData(path, value)` — 设置指定路径的值<br>
 *   2. `setFormData(path, prev => newVal)` — 函数式更新<br>
 *   3. `setFormData({ ... })` — 批量覆盖整个表单
 * @property fields      - 字段配置数组（响应式 Ref），ProForm 根据此数组渲染表单字段
 * @property getField     - 获取字段配置，支持路径字符串（如 `'name'`）或查找函数（如 `f => f.label === '姓名'`）
 * @property setField     - 更新字段配置，默认合并模式（Object.assign），可通过 `{ updateType: 'rewrite' }` 覆盖
 * @property deleteField  - 删除字段配置，支持 `{ all: true }` 批量删除所有匹配项
 * @property appendField  - 在指定字段后追加新字段，传 `undefined` 则在末尾追加
 * @property prependField - 在指定字段前插入新字段，传 `undefined` 则在开头插入
 * @property getParentField - 获取指定字段的父级字段配置，用于嵌套字段场景
 * @property formRef      - 底层 antdv-next Form 组件实例的响应式引用（Ref），可调用 `validate()`、`resetFields()` 等方法
 * @property setFormRef   - 设置底层 Form 组件实例，由 ProForm 内部自动调用，一般无需手动使用
 *
 * @example
 * ```ts
 * interface User { name: string; age: number }
 * const form: Form<User> = useForm({ name: '张三', age: 25 })
 *
 * form.formData.name           // 直接读写响应式数据
 * form.getFormData('name')     // 通过路径读取
 * form.setFormData('name', '李四')  // 更新数据
 * form.formRef.value?.validate()    // 访问底层 Form 实例
 * ```
 *
 * @public
 */
export type Form<
  D extends Data = Data,
  F extends Field<ComponentName, D> = Field<ComponentName, D>,
> = _Form<D, F, FormInstance>;

/**
 * 创建表单实例的 Hook
 *
 * @description 基于 `@qin-ui/pro-components-core` 的 `useForm`，将泛型参数绑定为 antdv-next 的本地类型：
 * - 字段类型 F → `Field<ComponentName, D>`（支持 antdv-next 所有内置组件类型推导）
 * - 表单实例 → antdv-next 的 `FormInstance`（使 formRef 获得完整的类型提示）
 *
 * 表单实例组合了三个子模块的能力：
 * - **useFormData**：表单数据管理（响应式数据、读写、批量更新）
 * - **useFields**：字段配置管理（增删改查字段配置，支持嵌套）
 * - **useFormRef**：底层 Form 组件实例引用
 *
 * @template D - 表单数据类型
 *
 * @param {ExtendWithAny<DeepPartial<D>>} [initFormData] - 初始表单数据
 * @param {Field<ComponentName, D>[]} [initFields] - 初始字段配置数组
 * @param {boolean} [root=true] - 是否为根表单。设为 `false` 时尝试从父组件注入获取表单实例
 *
 * @returns {Form<D>} 表单实例，包含数据操作、字段操作和 ref 操作
 *
 * @example
 * ```ts
 * interface User { name: string; age: number }
 *
 * // 方式一：同时传入初始数据和字段
 * const form = useForm<User>(
 *   { name: '张三', age: 25 },
 *   [
 *     { path: 'name', label: '姓名', component: 'input' },
 *     { path: 'age', label: '年龄', component: 'input-number' },
 *   ],
 *   true
 * )
 *
 * // 方式二：仅设置 root 标识
 * const form = useForm<User>(true)
 *
 * // 使用
 * const { formData, formRef, fields, setFormData, getField } = form
 * setFormData('name', '李四')
 * await formRef.value?.validate()
 * ```
 *
 * @public
 */
export function useForm<D extends Data = Data>(
  initFormData?: ExtendWithAny<DeepPartial<D>>,
  initFields?: Field<ComponentName, D>[],
  root?: boolean
): Form<D, Field<ComponentName, D>>;
export function useForm<D extends Data = Data>(
  root?: boolean
): Form<D, Field<ComponentName, D>>;
export function useForm(...args: any[]) {
  return coreUseForm(...(args as any));
}
