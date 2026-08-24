import { getCurrentInstance, inject, provide, reactive } from 'vue';
import { Path, Data, ExtendWithAny, DeepPartial } from '../shared/types';
import { isPlainObject } from '../shared/utils';
import { getByPath, setByPath } from '../shared/path';

const InjectionFormDataKey = Symbol('form-data');

export interface UseFormDataReturn<D extends Data = Data> {
  /**
   * 响应式表单数据（Vue reactive）
   * @description 包含整个表单的状态，基于 Vue reactive 实现
   */
  formData: ExtendWithAny<D>;

  /**
   * 获取指定路径的表单数据
   *
   * @template K - 数据对象的顶级 key
   * @param {K} path - 数据路径
   * @returns {D[K]} 对应路径的值
   *
   * @example
   * ```ts
   * const name = getFormData('name')
   * const city = getFormData('address.city')
   * ```
   */
  getFormData<K extends keyof D>(path: K): D[K];
  /**
   * 获取深层路径的表单数据
   *
   * @param {Path<D>} path - 点分隔的深层路径
   * @returns {any} 对应路径的值
   */
  getFormData(path: Path<D>): any;

  /**
   * 设置指定路径的表单数据
   *
   * @param {Path<D>} path - 数据路径
   * @param {any} value - 新值，支持直接值或基于旧值的更新函数
   *
   * @example
   * ```ts
   * // 直接设置
   * setFormData('name', '张三')
   * setFormData('address.city', '北京')
   *
   * // 函数式更新（基于旧值）
   * setFormData('count', prev => (prev ?? 0) + 1)
   * ```
   */
  setFormData(
    path: Path<D>,
    value: any | ((preValue: Readonly<any>) => any)
  ): void;
  /**
   * 批量覆盖表单数据（全量替换）
   *
   * @description 用新对象全量替换当前 formData，不在新对象中的 key 会被删除
   * @param {DeepPartial<D>} value - 新的表单数据对象
   *
   * @example
   * ```ts
   * setFormData({ name: '李四', age: 20 })
   * ```
   */
  setFormData(value: DeepPartial<D>): void;
  /**
   * 基于当前数据函数式批量更新
   *
   * @param {Function} updater - 接收当前 formData，返回新的数据对象
   *
   * @example
   * ```ts
   * setFormData(prev => ({ ...prev, name: '王五' }))
   * ```
   */
  setFormData(
    value: (formData: ExtendWithAny<D>) => DeepPartial<D> | undefined
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
  if (initFormData === undefined) {
    const injectFormDataStore = inject(InjectionFormDataKey, undefined);
    if (injectFormDataStore) return injectFormDataStore as never;
  }

  const formData = reactive((initFormData ?? {}) as ExtendWithAny<D>);

  function getFormData(path: Path<D>) {
    if (!path) return undefined;
    return getByPath(formData, path) as any;
  }

  function setFormData(...args: any[]) {
    let path;
    let value;
    if (args.length >= 2) {
      [path, value] = args;
      if (!path) return;
    } else {
      [value] = args;
    }
    if (path) {
      if (typeof value === 'function') {
        const preValue = getFormData(path);
        value = value(preValue);
      }
      setByPath(formData, path, value);
    } else {
      if (typeof value === 'function') {
        const preValue = formData;
        value = value(preValue);
      }
      if (!isPlainObject(value)) return;
      const newKeys = new Set(Object.keys(value));
      Object.keys(formData).forEach(key => {
        if (!newKeys.has(key)) {
          delete (formData as any)[key];
        }
      });
      Object.assign(formData, value);
    }
  }

  const formDataStore = { formData, getFormData, setFormData } as any;
  if (getCurrentInstance()) {
    provide(InjectionFormDataKey, formDataStore);
  }

  return formDataStore;
};

export default useFormData;
