import { ref } from 'vue';
import { type UseFormRef, FormInstance } from '../types';

const useFormRef: UseFormRef = () => {
  const formRef = ref<FormInstance>();

  const setFormRef = (val: FormInstance) => {
    formRef.value = val;
  };

  return { formRef, setFormRef };
};

export default useFormRef;
