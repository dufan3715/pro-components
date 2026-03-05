import { ref } from 'vue';

const useFormRef = <F = any>() => {
  const formRef = ref<F>();

  const setFormRef = (inst: F) => {
    formRef.value = inst;
  };

  return { formRef, setFormRef };
};

export default useFormRef;
