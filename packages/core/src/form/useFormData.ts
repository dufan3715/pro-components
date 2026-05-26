import { inject, provide, reactive } from 'vue';
import { Path, Data, ExtendWithAny, DeepPartial } from '../shared/types';
import { get, isPlainObject, set } from '../shared/utils';

const InjectionFormDataKey = Symbol('form-data');

/**
 * 表单数据处理 Hook
 *
 * @description 提供响应式表单数据的管理能力，支持：
 * - 响应式数据存储（基于 Vue reactive）
 * - 深层路径读写（支持点号分隔，如 'address.city'）
 * - 类型安全的路径提示（传入泛型 D 后，path 参数可获得类型推导）
 * - 父子表单自动注入（非根表单会从注入中获取数据）
 * @public
 *
 * @template D - 表单数据类型，应为一个对象类型
 * @param {ExtendWithAny<DeepPartial<D>>} [initFormData] - 初始表单数据
 *
 * @returns {object} 表单数据操作对象
 * @returns {D & Record<string, any>} .formData - 响应式表单数据
 * @returns {Function} .getFormData(path) - 获取指定路径的数据
 * @returns {Function} .setFormData(path, value) - 设置指定路径的数据
 *
 * @example
 * ```ts
 * interface User { name: string; age: number; address: { city: string } }
 *
 * const { formData, getFormData, setFormData } = useFormData<User>({
 *   name: '张三',
 *   address: { city: '北京' }
 * })
 *
 * // 读取
 * getFormData('name')           // '张三'
 * getFormData('address.city')   // '北京'
 * formData.name                 // '张三'（响应式）
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
) => {
  if (!initFormData) {
    const injectFormDataStore = inject(InjectionFormDataKey, undefined);
    if (injectFormDataStore) return injectFormDataStore as never;
  }

  const formData = reactive((initFormData ?? {}) as ExtendWithAny<D>);

  /**
   * 获取指定路径的表单数据
   *
   * @template K - 数据对象的顶级 key
   * @param {K} path - 数据路径
   * @returns {D[K]} 对应路径的值
   *
   * @example
   * ```ts
   * getFormData('name') // 顶级字段
   * getFormData('address.city') // 嵌套字段
   * ```
   */
  function getFormData<K extends keyof D>(path: K): D[K];

  /**
   * 获取二级路径的表单数据
   *
   * @template K - 顶级 key
   * @template K1 - 二级 key
   * @param {`${K}.${K1}`} path - 点号分隔的二级路径
   * @returns {D[K][K1]} 对应路径的值
   */
  function getFormData<
    K extends keyof D & string,
    K1 extends keyof D[K] & string,
  >(path: `${K}.${K1}`): D[K][K1];

  /**
   * 获取三级路径的表单数据
   */
  function getFormData<
    K extends keyof D & string,
    K1 extends keyof D[K] & string,
    K2 extends keyof D[K][K1] & string,
  >(path: `${K}.${K1}.${K2}`): D[K][K1][K2];

  /**
   * 获取任意路径的表单数据（通用重载）
   */
  function getFormData(path: Path<D>): any;

  function getFormData(path: Path<D>) {
    if (!path) return undefined;
    return get(formData, path) as any;
  }

  /**
   * 设置指定路径的表单数据（传入路径和值）
   *
   * @param {Path<D>} path - 数据路径
   * @param {any} value - 要设置的值
   *
   * @example
   * ```ts
   * setFormData('name', '李四')
   * setFormData('address.city', '上海')
   * ```
   */
  function setFormData(path: Path<D>, value: any): void;

  /**
   * 设置指定路径的表单数据（传入路径和更新函数）
   *
   * @param {Path<D>} path - 数据路径
   * @param {Function} value - 更新函数，接收旧值返回新值
   *
   * @example
   * ```ts
   * setFormData('count', prev => prev + 1)
   * ```
   */
  function setFormData(path: Path<D>, value: (v: any) => any): void;

  /**
   * 批量设置表单数据（覆盖整个表单）
   *
   * @param {ExtendWithAny<DeepPartial<D>>} value - 完整或部分表单数据
   *
   * @example
   * ```ts
   * setFormData({ name: '王五', age: 30 })
   * ```
   */
  function setFormData(value: ExtendWithAny<DeepPartial<D>>): void;

  /**
   * 批量设置表单数据（函数式更新整个表单）
   *
   * @param {Function} value - 更新函数，接收当前完整数据返回新数据
   */
  function setFormData(
    value: (v: ExtendWithAny<DeepPartial<D>>) => ExtendWithAny<DeepPartial<D>>
  ): void;

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
      set(formData, path, value);
    } else {
      if (typeof value === 'function') {
        const preValue = formData;
        value = value(preValue);
      }
      if (!isPlainObject(value)) return;
      Object.keys(formData).forEach(key => {
        delete (formData as any)[key];
      });
      Object.assign(formData, value);
    }
  }

  const formDataStore = { formData, getFormData, setFormData };
  provide(InjectionFormDataKey, formDataStore as any);

  return formDataStore;
};

export default useFormData;
