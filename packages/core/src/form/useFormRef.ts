import { ref } from 'vue';

export interface UseFormRefReturn<F = any> {
  /**
   * 表单组件实例的响应式引用（Vue ref）
   * @description 通过此 ref 可访问到底层 UI 框架的 Form 实例
   */
  formRef: import('vue').Ref<F | undefined>;

  /**
   * 设置表单组件实例
   * @description 内部方法，由组件自动调用
   */
  setFormRef: (inst: F) => void;
}

/**
 * 表单组件实例引用 Hook
 *
 * @description 用于获取和设置底层 UI 框架（如 ant-design-vue、element-plus）的 Form 组件实例。
 * 在 ProForm 组件内部自动调用 setFormRef 绑定实例，外部可通过 formRef 访问。
 *
 * @template F - 底层 Form 组件实例类型，默认为 any
 *
 * @returns {UseFormRefReturn<F>} 表单组件实例引用管理对象
 *
 * @example
 * ```ts
 * const { formRef, setFormRef } = useFormRef<InstanceType<typeof AForm>>()
 * setFormRef(formComponentInstance)
 * console.log(formRef.value) // 可通过 formRef 访问底层 Form 实例的方法
 * ```
 */
const useFormRef = <F = any>(): UseFormRefReturn<F> => {
  const formRef = ref<F>();

  const setFormRef = (inst: F) => {
    formRef.value = inst;
  };

  return { formRef, setFormRef };
};

export default useFormRef;
