import { ref } from 'vue';
import { get, set } from 'lodash-es';
import type { FormData, GetFormData, SetFormData, UseFormData } from '../types';

const useFormData: UseFormData = (initFormData: FormData) => {
  const formData = ref(initFormData);

  const getFormData: GetFormData = path => {
    return get(formData.value, path);
  };

  const setFormData: SetFormData = (path, value) => {
    let newValue = value;
    if (path) {
      if (typeof value === 'function') {
        const preValue = getFormData(path);
        newValue = value(preValue);
      }
      set(formData.value, path, newValue);
    } else {
      if (typeof value === 'function') {
        const preValue = formData.value;
        newValue = value(preValue);
      }
      formData.value = newValue;
    }
  };

  return { formData, getFormData, setFormData };
};

export default useFormData;
