import { ref } from 'vue';
import { type ProFormInstance } from '..';
import { type UseFormRef } from '../types';

const useFormRef: UseFormRef = () => {
  const formRef = ref<ProFormInstance>();

  const setFormRef = (val: ProFormInstance) => {
    formRef.value = val;
  };

  return { formRef, setFormRef };
};

export default useFormRef;
