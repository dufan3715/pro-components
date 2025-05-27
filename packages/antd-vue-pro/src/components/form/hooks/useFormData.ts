import { reactive, ref } from 'vue';
import { get, set } from 'lodash-es';
import type { GetFormData, SetFormData, UseFormData } from '../types';

const useFormData: UseFormData = initFormData => {
  const formData = reactive(initFormData);

  const activePath = ref<string>();

  const getFormData: GetFormData = path => {
    if (!path) return undefined;
    return get(formData, path);
  };

  const setFormData: SetFormData = (...args: any[]) => {
    let path;
    let value;
    if (args.length >= 2) {
      [path, value] = args;
    } else {
      [value] = args;
    }
    if (path) {
      if (typeof value === 'function') {
        const preValue = getFormData(path);
        value = value(preValue);
      }
      activePath.value = path;
      set(formData, path, value);
    } else {
      if (typeof value === 'function') {
        const preValue = formData;
        value = value(preValue);
      }
      Object.keys(formData).forEach(key => {
        delete formData[key];
      });
      Object.assign(formData, value);
    }
  };

  return { formData, getFormData, setFormData, activePath };
};

export default useFormData;
