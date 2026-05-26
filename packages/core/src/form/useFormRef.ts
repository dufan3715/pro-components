import { ref } from 'vue';

/**
 * 表单组件实例引用 Hook
 *
 * @description 用于获取和设置底层 UI 框架（如 ant-design-vue、element-plus）的 Form 组件实例。
 * 在 ProForm 组件内部自动调用 setFormRef 绑定实例，外部可通过 formRef 访问。
 *
 * @template F - 底层 Form 组件实例类型，默认为 any
 *
 * @returns {object} 表单组件实例引用管理对象
 * @returns {Ref<F | undefined>} .formRef - 表单组件实例的响应式引用
 * @returns {Function} .setFormRef(inst) - 设置表单组件实例
 *
 * @example
 * ```ts
 * const { formRef, setFormRef } = useFormRef<InstanceType<typeof AForm>>()
 * setFormRef(formComponentInstance)
 * console.log(formRef.value) // 可通过 formRef 访问底层 Form 实例的方法
 * ```
 */
const useFormRef = <F = any>() => {
  const formRef = ref<F>();

  const setFormRef = (inst: F) => {
    formRef.value = inst;
  };

  return { formRef, setFormRef };
};

export default useFormRef;
