/**
 * @module Core/useForm
 * @description 框架无关的表单状态核心：组合 `useFormData`（数据）、`useFields`（字段）、`useFormRef`（宿主实例）
 *
 * 对外提供统一的 `formData` 读写、字段增删改查与宿主 Form 实例方法桥接（`validate` / `clearValidate` 等）；
 * 本模块为底层基建，上层组件库做泛型绑定与二次导出。
 */
import { getCurrentInstance, inject } from 'vue';
import useFields, { type UseFieldsOptions } from './useFields';
import useFormData from './useFormData';
import useFormRef from './useFormRef';
import { InjectionFormKey } from './constants';
import type { Data, DeepPartial, ExtendWithAny } from '../shared/types';
import type { BaseField } from './types';

import type { UseFormDataReturn } from './useFormData';
import type { UseFieldsReturn } from './useFields';
import type { UseFormRefReturn } from './useFormRef';

/**
 * 表单实例类型：数据操作 + 字段操作 + 宿主实例桥接
 *
 * @template D - 表单数据类型
 * @template F - 字段配置类型
 * @template I - 底层 UI 框架 Form 组件实例类型
 *
 * @example
 * ```ts
 * const form: Form<User> = useForm({ name: '张三' })
 *
 * form.getFormData('name')           // '张三'（支持 'address.city' 深层路径）
 * form.setFormData('name', '李四')   // 路径写入
 * form.setFormData({ name: '王五' }) // 批量覆盖
 * form.setField('name', { label: '用户名' })
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
 * 创建表单实例
 *
 * @description 组合三个子 Hook：`useFormData`（数据）/ `useFields`（字段）/ `useFormRef`（宿主实例）；
 * `root=false` 时优先复用注入的父表单实例，无注入则告警并回退为独立根表单。
 *
 * @template D - 表单数据类型，应为一个对象类型
 * @template F - 字段配置类型，应继承 BaseField<D>
 *
 * @param {ExtendWithAny<DeepPartial<D>>} [initFormData] - 初始表单数据（内部持顶层浅拷贝）
 * @param {F[]} [initFields] - 初始字段配置数组
 * @param {boolean} [root=true] - 是否为根表单；`false` 时尝试复用注入的父表单实例
 *
 * @returns {Form<D, F>} 表单实例
 *
 * @example
 * ```ts
 * const form = useForm<User>(
 *   { name: '张三', age: 25 },
 *   [{ path: 'name', label: '姓名' }],
 *   true
 * )
 *
 * const shared = useForm<User>(false) // 复用父表单实例（无注入时回退独立根表单）
 * ```
 */
function useForm<D extends Data = Data, F extends BaseField<D> = BaseField<D>>(
  initFormData?: ExtendWithAny<DeepPartial<D>>,
  initFields?: F[],
  root?: boolean,
  options?: UseFieldsOptions
): Form<D, F>;

/**
 * 仅传入 root 标识的重载：`useForm(true)` 创建根表单、`useForm(false)` 取父表单实例
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
 * 创建表单代理：动态转发至当前实例，且方法引用恒等
 *
 * @description `:form` prop 运行期替换后，属性读写与方法调用实时路由到新实例；
 * 同一方法的引用恒等（`proxy.setFormData === proxy.setFormData`），可直接用作事件处理器与 watcher 依赖。
 *
 * @template F - 表单实例类型
 * @param {() => F | undefined} getCurrentForm - 返回当前活跃表单实例的 getter
 * @returns {F} 表单代理对象
 */
export function createFormProxy<F extends object = any>(
  getCurrentForm: () => F | undefined
): F {
  const methodCache = new Map<string | symbol, (...args: any[]) => any>();

  return new Proxy({} as F, {
    // 实时取当前实例；函数属性经缓存包装保证引用恒等（调用时再次取实例）
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
    // 转发写入当前实例；实例缺失时静默丢弃（挂载前写入为无效操作）
    set(_, prop, value) {
      const current = getCurrentForm();
      if (current) {
        (current as any)[prop] = value;
      }
      return true;
    },
    // 转发属性删除到当前实例；实例缺失时静默丢弃
    deleteProperty(_, prop) {
      const current = getCurrentForm();
      return current ? Reflect.deleteProperty(current, prop) : true;
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
