import { getCurrentInstance, inject, provide, reactive } from 'vue';
import { Path, Data, ExtendWithAny, DeepPartial } from '../shared/types';
import { isPlainObject } from '../shared/utils';
import { get, isDangerousKey, normalizePathKey, set } from '../shared/path';

const InjectionFormDataKey = Symbol('form-data');

export interface UseFormDataReturn<D extends Data = Data> {
  /**
   * 响应式表单数据（Vue reactive）
   * @description 包含整个表单的状态，基于 Vue reactive 实现
   */
  formData: ExtendWithAny<D>;

  /**
   * 获取表单数据
   *
   * @description 支持通过顶级字段 key 或点分隔深层路径（如 `'address.city'`）读取数据。
   *
   * @template K - 顶级字段 Key
   * @param {K} path - 数据字段路径
   * @returns {D[K]} 对应路径的值
   *
   * @example
   * ```ts
   * const name = getFormData('name')           // 顶级字段（强类型推导）
   * const city = getFormData('address.city')   // 2 层嵌套（强类型推导）
   * const street = getFormData('user.address.street') // 3 层嵌套（强类型推导）
   * const dynamic = getFormData(dynamicPath)   // 动态深层路径
   * ```
   */
  getFormData<K extends keyof D>(path: K): D[K];
  getFormData<K extends keyof D & string, K1 extends keyof D[K] & string>(
    path: `${K}.${K1}`
  ): D[K][K1];
  getFormData<
    K extends keyof D & string,
    K1 extends keyof D[K] & string,
    K2 extends keyof D[K][K1] & string,
  >(
    path: `${K}.${K1}.${K2}`
  ): D[K][K1][K2];
  getFormData(path: Path<D>): any;

  /**
   * 设置表单数据
   *
   * @description 支持以下四种调用方式：
   * - **1. 路径设置**：`setFormData('name', '张三')` 或 `setFormData('address.city', '北京')`
   * - **2. 路径函数式更新**：`setFormData('count', prev => (prev ?? 0) + 1)`
   * - **3. 批量覆盖**：`setFormData({ name: '李四', age: 20 })`（全量替换，未指定的 key 会被删除）
   * - **4. 函数式批量更新**：`setFormData(prev => ({ ...prev, name: '王五' }))`
   *
   * @template K - 顶级字段 Key
   * @param {K} path - 顶级字段路径
   * @param {D[K] | ((preValue: Readonly<D[K]>) => D[K])} value - 新值或基于旧值的更新函数
   *
   * @example
   * ```ts
   * // 1. 字段设置
   * setFormData('name', '李四')
   * setFormData('address.city', '上海')
   *
   * // 2. 字段函数式更新
   * setFormData('count', prev => (prev ?? 0) + 1)
   *
   * // 3. 批量覆盖整个表单
   * setFormData({ name: '王五', age: 30 })
   *
   * // 4. 函数式批量更新
   * setFormData(prev => ({ ...prev, name: '赵六' }))
   * ```
   */
  setFormData<K extends keyof D>(
    path: K,
    value: D[K] | ((preValue: Readonly<D[K]>) => D[K])
  ): void;
  setFormData(
    path: Path<D>,
    value: any | ((preValue: Readonly<any>) => any)
  ): void;
  setFormData(value: ExtendWithAny<DeepPartial<D>>): void;
  setFormData(
    updater: (
      formData: ExtendWithAny<D>
    ) => ExtendWithAny<DeepPartial<D>> | void | undefined
  ): void;
}

/**
 * 表单数据管理 Hook
 *
 * @description 基于 Vue reactive 实现的响应式表单数据源，提供：
 * - 响应式 `formData` 对象
 * - 基于点分隔路径（如 `'user.address.city'`）的深层 `getFormData` / `setFormData`
 * - 批量数据覆盖和函数式更新
 * - 多级表单数据注入支持（若无初始数据则尝试从父级 inject）
 *
 * @template D - 表单数据对象的类型定义
 * @param {ExtendWithAny<DeepPartial<D>>} [initFormData] - 初始表单数据
 * @returns {UseFormDataReturn<D>} 表单数据操作方法集合
 *
 * @example
 * ```ts
 * interface UserForm {
 *   name: string
 *   age: number
 *   address: { city: string; street: string }
 * }
 *
 * const { formData, getFormData, setFormData } = useFormData<UserForm>({
 *   name: '张三',
 *   address: { city: '北京', street: '' },
 * })
 *
 * // 读取
 * getFormData('name') // => '张三'
 * getFormData('address.city') // => '北京'
 *
 * // 设置
 * setFormData('name', '李四')
 * setFormData('address.city', '上海')
 * setFormData({ name: '王五', age: 30 }) // 批量覆盖
 * setFormData(prev => ({ ...prev, name: '赵六' })) // 函数式更新
 * ```
 */
const useFormData = <D extends Data = Data>(
  initFormData?: ExtendWithAny<DeepPartial<D>>
): UseFormDataReturn<D> => {
  // 未传初始数据且处于组件上下文时，复用父级提供的数据 store（子表单默认与父共享数据）
  if (initFormData === undefined && getCurrentInstance()) {
    const injectFormDataStore = inject(InjectionFormDataKey, undefined);
    if (injectFormDataStore) return injectFormDataStore as never;
  }

  const initialObject = isPlainObject(initFormData)
    ? initFormData
    : ({} as ExtendWithAny<D>);
  const formData = reactive(initialObject as ExtendWithAny<D>);

  function getFormData(path: Path<D>) {
    if (path === undefined || path === null) return undefined;
    return get(
      formData,
      typeof path === 'string' ? path : normalizePathKey(path)
    ) as any;
  }

  function setFormData(...args: any[]) {
    // 单实现分派四种重载形态：两参为路径设置/函数式更新，单参为批量覆盖/函数式批量
    let path;
    let value;
    if (args.length >= 2) {
      [path, value] = args;
      if (path === undefined || path === null) return;
    } else {
      [value] = args;
    }
    if (path !== undefined && path !== null) {
      if (typeof value === 'function') {
        const preValue = getFormData(path);
        value = value(preValue);
      }
      set(
        formData,
        typeof path === 'string' ? path : normalizePathKey(path),
        value
      );
    } else {
      if (typeof value === 'function') {
        const preValue = formData;
        value = value(preValue);
      }
      if (!isPlainObject(value)) return;
      // 危险键在批量入口即被丢弃，不参与后续合并
      const safeValue: Record<string, any> = {};
      Object.entries(value).forEach(([key, val]) => {
        if (!isDangerousKey(key)) safeValue[key] = val;
      });
      // 批量覆盖：先删除新对象不含的自有 key 再合并——全量替换语义（非 merge），formData 引用保持不变
      const newKeys = new Set(Object.keys(safeValue));
      Object.keys(formData).forEach(key => {
        if (!newKeys.has(key)) {
          delete (formData as any)[key];
        }
      });
      Object.assign(formData, safeValue);
    }
  }

  const formDataStore = { formData, getFormData, setFormData } as any;
  // 组件上下文中把数据 store 提供给下游，支撑多级表单的数据复用
  if (getCurrentInstance()) {
    provide(InjectionFormDataKey, formDataStore);
  }

  return formDataStore;
};

export default useFormData;
