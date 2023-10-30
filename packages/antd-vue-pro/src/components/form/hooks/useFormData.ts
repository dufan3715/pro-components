/* eslint-disable no-unused-vars, no-param-reassign */
import { ref } from 'vue';
import { get, set } from 'lodash-es';
import type { GetFormData, SetFormData, UseFormData } from '../types';

const useFormData: UseFormData = initFormData => {
  const formData = ref(initFormData);

  const activePath = ref<string | null>(null);

  const getFormData: GetFormData = path => {
    if (!path) return undefined;
    return get(formData.value, path);
  };

  const setFormData: SetFormData = (path, value) => {
    let newValue = value;
    if (path) {
      activePath.value = path;
      if (typeof value === 'function') {
        const preValue = getFormData(path);
        newValue = value(preValue);
      }
      set(formData.value, path, newValue);
    } else {
      activePath.value = null;
      if (typeof value === 'function') {
        const preValue = formData.value;
        newValue = value(preValue);
      }
      formData.value = newValue;
    }
  };

  return { formData, getFormData, setFormData, activePath };
};

export default useFormData;
