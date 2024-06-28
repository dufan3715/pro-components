import { ref } from 'vue';
import { type ProFormInstance } from '..';
import { type UseFormRef } from '../types';

const useFormRef: UseFormRef = () => {
  const formRef = ref<ProFormInstance>();

  return { formRef };
};

export default useFormRef;
