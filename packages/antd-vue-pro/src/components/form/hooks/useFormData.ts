/* eslint-disable no-unused-vars, no-param-reassign */
import { ref } from 'vue';
import { get, set } from 'lodash-es';
import type { GetFormData, SetFormData, UseFormData } from '../types';

const useFormData: UseFormData = initFormData => {
  const formData = ref(initFormData);

  const activePath = ref<string>();

  const setActivePath = (path?: string) => {
    activePath.value = path;
  };

  const getFormData: GetFormData = path => {
    if (!path) return undefined;
    return get(formData.value, path);
  };

  const setFormData: SetFormData = (...args: any[]) => {
    let path;
    let value;
    if (args.length === 2) {
      [path, value] = args;
    } else {
      [value] = args;
    }
    if (path) {
      if (typeof value === 'function') {
        const preValue = getFormData(path);
        value = value(preValue);
      }
      set(formData.value, path, value);
    } else {
      if (typeof value === 'function') {
        const preValue = formData.value;
        value = value(preValue);
      }
      formData.value = value;
    }
  };

  return { formData, getFormData, setFormData, activePath, setActivePath };
};

export default useFormData;
