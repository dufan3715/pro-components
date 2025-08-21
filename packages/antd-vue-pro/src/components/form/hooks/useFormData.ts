import { reactive } from 'vue';
import { Path, Data, ExtendWithAny, DeepPartial } from '../../../shared/types';
import { get, isPlainObject, set } from '../../../shared/utils';
/**
 * 表单数据处理hook
 * @param initFormData 初始表单数据
 * @returns {Object} { formData, getFormData, setFormData }
 * @property {Reactive<D>} formData - 表单数据Reactive<D>
 * @property {Function} getFormData - 获取指定字段数据路径path的值
 * @property {Function} setFormData - 设置指定字段数据路径path的值, path为空时设置所有字段数据
 */
const useFormData = <D extends Data = Data>(
  initFormData: ExtendWithAny<DeepPartial<D>> = {} as ExtendWithAny<
    DeepPartial<D>
  >
) => {
  const formData = reactive(initFormData as ExtendWithAny<D>);

  /**
   * 获取指定字段数据路径的值
   * @param path - 字段数据路径
   */
  function getFormData(path: Path<D>) {
    if (!path) return undefined;
    return get(formData, path) as any;
  }

  /**
   * 设置指定字段数据路径的值
   * @param path 字段数据路径
   * @param value 值
   */
  function setFormData(path: Path<D>, value: any): void;
  function setFormData(path: Path<D>, value: (v: any) => any): void;
  /**
   * 设置表单数据
   * @param value 表单数据
   */
  function setFormData(value: ExtendWithAny<DeepPartial<D>>): void;
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

  return { formData, getFormData, setFormData };
};

export default useFormData;
