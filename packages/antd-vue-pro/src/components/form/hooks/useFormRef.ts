import { ref } from 'vue';
import { FormInstance } from '../types';

/**
 * 表单组件实例引用
 * @returns {Object}
 * @property {Ref<FormInstance | undefined>} formRef - 表单组件实例引用
 * @property {Function} setFormRef - 更新实例引用
 */
const useFormRef = () => {
  const formRef = ref<FormInstance>();

  /**
   * 设置实例引用
   * @param {FormInstance} inst - 表单组件实例
   */
  const setFormRef = (inst: FormInstance) => {
    formRef.value = inst;
  };

  return { formRef, setFormRef };
};

export default useFormRef;
