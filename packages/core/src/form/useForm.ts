/**
 * @module Core/useForm
 * @description 框架无关（Framework-Agnostic）的表单状态管理核心
 *
 * ## 架构设计说明
 *
 * `useForm` 是表单系统的核心大脑。它的核心设计理念是 **"状态管理与 UI 渲染解耦"**。
 * 在这里，表单逻辑不再依赖于具体的 UI 框架（如 Ant Design / Element Plus），而是被抽象为了纯粹的 Vue 响应式状态流（Reactive Data）。
 *
 * ### 核心职责
 * 1. **数据中枢**：统一管理表单数据 (`formData`) 的读写，支持基于路径（如 `'user.address.city'`）的深层数据代理操作。
 * 2. **字段调度**：集成 `useFields` 引擎，负责所有表单字段的动态配置、显隐控制及状态联动。
 * 3. **实例桥接**：集成 `useFormRef`，代理底层 UI 框架特有的方法（如 `validate`, `clearValidate`），提供抹平差异的标准化 API 表面。
 *
 * @internal 本模块为底层基建，上层组件库（如 antdv-next-pro）会对其进行泛型绑定和二次导出。
 */
import { inject } from 'vue';
import useFields from './useFields';
import useFormData from './useFormData';
import useFormRef from './useFormRef';
import { InjectionFormKey } from './constants';
import { Data, DeepPartial, ExtendWithAny } from '../shared/types';
import { BaseField } from './types';

import type { UseFormDataReturn } from './useFormData';
import type { UseFieldsReturn } from './useFields';
import type { UseFormRefReturn } from './useFormRef';

/**
 * 表单实例类型
 * @template D - 表单数据类型
 * @template F - 字段配置类型
 * @template I - 底层 UI 框架 Form 组件实例类型
 *
 * 组合了表单数据操作、字段操作和表单 ref 操作的能力。
 *
 * @example
 * ```ts
 * // 定义数据类型
 * interface User {
 *   name: string
 *   age: number
 *   address: { city: string; street: string }
 * }
 *
 * // 创建表单实例
 * const form: Form<User> = useForm({
 *   name: '张三',
 *   age: 25,
 * })
 *
 * // 读取数据
 * form.getFormData('name') // '张三'
 * form.getFormData('address.city') // 支持深层路径
 *
 * // 设置数据
 * form.setFormData('name', '李四')
 * form.setFormData({ name: '王五', age: 30 }) // 批量设置
 *
 * // 字段操作
 * form.getField('name') // 获取字段配置
 * form.setField('name', { label: '用户名' }) // 更新字段配置
 * ```
 */
export interface Form<
  D extends Data = Data,
  F extends BaseField<D> = BaseField<D>,
  I = any,
> extends UseFormDataReturn<D>,
    UseFieldsReturn<D, F>,
    UseFormRefReturn<I> {}

/**
 * 创建表单实例的核心 Hook
 *
 * @description useForm 是 ProForm 的核心，它组合了三个子 Hook：
 * - useFormData: 表单数据管理（响应式数据、读取、更新）
 * - useFields: 字段配置管理（增删改查字段配置）
 * - useFormRef: 底层 UI 框架 Form 组件实例引用
 *
 * @template D - 表单数据类型，应为一个对象类型
 * @template F - 字段配置类型，应继承 BaseField<D>
 *
 * @param {ExtendWithAny<DeepPartial<D>>} [initFormData] - 初始表单数据
 * @param {F[]} [initFields] - 初始字段配置数组
 * @param {boolean} [root=true] - 是否为根表单。如果为 false，会尝试从注入中获取父表单实例
 *
 * @returns {Form<D, F>} 表单实例，包含数据操作、字段操作和 ref 操作
 *
 * @example
 * ```ts
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
 * // 方式三：获取父表单实例（非根）
 * const form = useForm<User>(false)
 * ```
 */
function useForm<D extends Data = Data, F extends BaseField<D> = BaseField<D>>(
  initFormData?: ExtendWithAny<DeepPartial<D>>,
  initFields?: F[],
  root?: boolean
): Form<D, F>;

/**
 * 创建表单实例的核心 Hook（仅传入 root 标识的重载）
 *
 * @template D - 表单数据类型
 * @template F - 字段配置类型
 * @param {boolean} root - 是否为根表单
 * @returns {Form<D, F>} 表单实例
 */
function useForm<D extends Data = Data, F extends BaseField<D> = BaseField<D>>(
  root?: boolean
): Form<D, F>;

function useForm<D extends Data = Data, F extends BaseField<D> = BaseField<D>>(
  ...args: any[]
) {
  let initFormData = {} as any,
    initFields = [],
    root = true;
  if (args.length === 1) {
    root = args[0] as boolean;
  } else if (args.length >= 2) {
    initFormData = args[0] ?? {};
    initFields = args[1];
    root = (args[2] as boolean) ?? root;
  }
  if (!root) {
    const injectForm = inject(InjectionFormKey);
    if (injectForm) return injectForm;
  }
  return {
    ...useFormData<D>(initFormData),
    ...useFields<D, F>(initFields),
    ...useFormRef(),
  };
}

export default useForm;
