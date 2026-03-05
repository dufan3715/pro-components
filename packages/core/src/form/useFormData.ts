import { inject, provide, reactive } from 'vue';
import { Path, Data, ExtendWithAny, DeepPartial } from '../shared/types';
import { get, isPlainObject, set } from '../shared/utils';

const InjectionFormDataKey = Symbol('form-data');

/**
 * 表单数据处理hook
 * @param initFormData 初始表单数据
 * @returns {Object} { formData, getFormData, setFormData }
 */
const useFormData = <D extends Data = Data>(
  initFormData?: ExtendWithAny<DeepPartial<D>>
) => {
  if (!initFormData) {
    const injectFormDataStore = inject(InjectionFormDataKey, undefined);
    if (injectFormDataStore) return injectFormDataStore as never;
  }

  const formData = reactive((initFormData ?? {}) as ExtendWithAny<D>);

  function getFormData<K extends keyof D>(path: K): D[K];

  function getFormData<
    K extends keyof D & string,
    K1 extends keyof D[K] & string,
  >(path: `${K}.${K1}`): D[K][K1];

  function getFormData<
    K extends keyof D & string,
    K1 extends keyof D[K] & string,
    K2 extends keyof D[K][K1] & string,
  >(path: `${K}.${K1}.${K2}`): D[K][K1][K2];

  function getFormData(path: Path<D>): any;

  function getFormData(path: Path<D>) {
    if (!path) return undefined;
    return get(formData, path) as any;
  }

  function setFormData(path: Path<D>, value: any): void;
  function setFormData(path: Path<D>, value: (v: any) => any): void;
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

  const formDataStore = { formData, getFormData, setFormData };
  provide(InjectionFormDataKey, formDataStore as any);

  return formDataStore;
};

export default useFormData;
