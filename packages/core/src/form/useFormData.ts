import { getCurrentInstance, inject, provide, reactive } from 'vue';
import type { Path, Data, ExtendWithAny, DeepPartial } from '../shared/types';
import { isPlainObject } from '../shared/utils';
import { get, isDangerousKey, set } from '../shared/path';

const InjectionFormDataKey = Symbol('form-data');

/**
 * useFormData 返回值：响应式数据对象与读写方法
 */
export interface UseFormDataReturn<D extends Data = Data> {
  /** 响应式表单数据（Vue reactive），路径读写与批量覆盖共用同一对象 */
  formData: ExtendWithAny<D>;

  /**
   * 获取表单数据
   *
   * @description 支持顶级字段 key 与点分隔深层路径（`'address.city'`），也可传段数组
   * @template K - 顶级字段 Key
   * @param {K} path - 数据字段路径
   * @returns {D[K]} 对应路径的值，未命中为 `undefined`
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
   * 设置表单数据，四种调用方式：
   *
   * - 路径设置 / 函数式更新：`setFormData('name', '张三')`、`setFormData('count', prev => prev + 1)`
   * - 批量覆盖：`setFormData({ name: '李四' })`（全量替换，未指定的 key 会被删除）
   * - 函数式批量更新：`setFormData(prev => ({ ...prev, name: '王五' }))`
   *
   * @template K - 顶级字段 Key
   * @param {K} path - 顶级字段路径
   * @param {D[K] | ((preValue: Readonly<D[K]>) => D[K])} value - 新值或基于旧值的更新函数
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
 * 表单数据管理 Hook：响应式 `formData` + 路径读写 + 批量覆盖 + 多级表单共享
 *
 * @description 入参收编：内部持 `initFormData` 的**顶层浅拷贝**——批量覆盖的删除与顶层写入不改写调用方对象；
 * 嵌套对象按引用共享，嵌套字段的就地变异对调用方可见。未传初始数据且处于组件上下文时复用父级数据 store。
 *
 * @template D - 表单数据对象的类型定义
 * @param {ExtendWithAny<DeepPartial<D>>} [initFormData] - 初始表单数据
 * @returns {UseFormDataReturn<D>} 数据读写方法集合
 *
 * @example
 * ```ts
 * const { getFormData, setFormData } = useFormData<UserForm>({
 *   name: '张三',
 *   address: { city: '北京' },
 * })
 *
 * getFormData('address.city')   // '北京'
 * setFormData('name', '李四')   // 路径写入
 * setFormData({ name: '王五' }) // 批量覆盖
 * ```
 */
const useFormData = <D extends Data = Data>(
  initFormData?: ExtendWithAny<DeepPartial<D>>
): UseFormDataReturn<D> => {
  // 未传初始数据且处于组件上下文时复用父级数据 store（子表单默认与父共享数据）
  if (initFormData === undefined && getCurrentInstance()) {
    const injectFormDataStore = inject(InjectionFormDataKey, undefined);
    if (injectFormDataStore) return injectFormDataStore as never;
  }

  const initialObject = isPlainObject(initFormData)
    ? initFormData
    : ({} as ExtendWithAny<D>);
  // 顶层浅拷贝：批量覆盖的删除与顶层写入不改写调用方对象，嵌套对象仍共享引用
  const formData = reactive({ ...initialObject } as ExtendWithAny<D>);

  function getFormData(path: Path<D>) {
    if (path === undefined || path === null) return undefined;
    return get(formData, path as any) as any;
  }

  function setFormData(...args: any[]) {
    // 按入参数量分派：两参为路径设置 / 函数式更新，单参为批量覆盖 / 函数式批量
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
      set(formData, path as any, value);
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
      // 批量覆盖为全量替换，formData 引用不变
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
  // 组件上下文中向子表单提供数据 store
  if (getCurrentInstance()) {
    provide(InjectionFormDataKey, formDataStore);
  }

  return formDataStore;
};

export default useFormData;
