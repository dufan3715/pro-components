/**
 * @module Core/useForm
 * @description 框架无关（Framework-Agnostic）的表单状态管理核心
 *
 * ## 架构设计说明
 *
 * `useForm` 是表单系统的核心大脑。它的核心设计理念是 **"状态管理与 UI 渲染解耦"**。
 * 表单逻辑不依赖具体 UI 框架（如 Ant Design / Element Plus），是纯粹的 Vue 响应式状态流（Reactive Data）。
 *
 * ### 核心职责
 * 1. **数据中枢**：统一管理表单数据 (`formData`) 的读写，支持基于路径（如 `'user.address.city'`）的深层数据代理操作。
 * 2. **字段调度**：集成 `useFields` 引擎，负责所有表单字段的动态配置、显隐控制及状态联动。
 * 3. **实例桥接**：集成 `useFormRef`，代理底层 UI 框架特有的方法（如 `validate`, `clearValidate`），提供抹平差异的标准化 API 表面。
 *
 * @internal 本模块为底层基建，上层组件库（如 antdv-next-pro）会对其进行泛型绑定和二次导出。
 */
import { getCurrentInstance, inject } from 'vue';
import useFields, { type UseFieldsOptions } from './useFields';
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
  root?: boolean,
  options?: UseFieldsOptions
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
  // 运行时按入参形态分派两种重载：单参 boolean 仅为 root 标记，否则为 数据+字段+root
  let initFormData = {} as any,
    initFields = [],
    root = true,
    options: UseFieldsOptions | undefined;
  if (args.length === 1) {
    if (typeof args[0] === 'boolean') {
      root = args[0];
    } else {
      initFormData = args[0] ?? {};
      root = true;
    }
  } else if (args.length >= 2) {
    initFormData = args[0] ?? {};
    initFields = args[1];
    root = (args[2] as boolean) ?? true;
    options = args[3] as UseFieldsOptions | undefined;
  }
  // root=false：优先复用注入的父表单实例（子表单与父完全同体）；不可得时告警并回退为独立根表单
  if (!root) {
    if (getCurrentInstance()) {
      const injectForm = inject(InjectionFormKey);
      if (injectForm) return injectForm;
    }
    console.warn(
      '[useForm] root=false 但未找到注入的父表单实例（当前不在 ProForm 组件上下文中），已回退为创建独立根表单。'
    );
  }
  return {
    ...useFormData<D>(initFormData),
    ...useFields<D, F>(initFields, options),
    ...useFormRef(),
  };
}

/**
 * 创建具有方法引用记忆化与动态目标代理能力的表单代理对象
 *
 * @description
 * 1. 动态转发：当下游组件持有本代理时，若顶层 ProForm 的 `:form` prop 发生动态替换，所有属性读写与方法调用均实时路由至最新的 Form 实例；
 * 2. 引用稳定性：同一方法的函数引用恒等（`proxy.setFormData === proxy.setFormData`），可直接用作事件处理器与 watcher 依赖。
 *
 * @template F - 表单实例类型
 * @param {() => F | undefined} getCurrentForm - 返回当前活跃表单实例的 getter 函数
 * @returns {F} 具有引用稳定性的表单代理对象
 *
 * @public
 */
export function createFormProxy<F extends object = any>(
  getCurrentForm: () => F | undefined
): F {
  const methodCache = new Map<string | symbol, (...args: any[]) => any>();

  return new Proxy({} as F, {
    /*
     * 每次访问实时取当前实例：:form 运行期替换后属性读写无需重绑
     * 函数属性经 methodCache 包装后引用恒等（调用时再次取当前实例，双重保证动态路由）
     */
    get(_, prop) {
      const current = getCurrentForm() as any;
      const val = current?.[prop];
      if (typeof val === 'function') {
        let cached = methodCache.get(prop);
        if (!cached) {
          cached = (...args: any[]) =>
            (getCurrentForm() as any)?.[prop]?.(...args);
          methodCache.set(prop, cached);
        }
        return cached;
      }
      return val;
    },
    // 转发写入当前实例；实例缺失时静默丢弃（返回 true，挂载前经代理写入是无效操作）
    set(_, prop, value) {
      const current = getCurrentForm();
      if (current) {
        (current as any)[prop] = value;
      }
      return true;
    },
    // 以下三个 trap 支撑 in / Object.keys / 展开 / JSON 序列化对当前实例的反射
    has(_, prop) {
      const current = getCurrentForm();
      return Boolean(current && prop in current);
    },
    ownKeys() {
      const current = getCurrentForm();
      return current ? Reflect.ownKeys(current) : [];
    },
    getOwnPropertyDescriptor(_, prop) {
      const current = getCurrentForm();
      return current
        ? Reflect.getOwnPropertyDescriptor(current, prop)
        : undefined;
    },
  });
}

export default useForm;
