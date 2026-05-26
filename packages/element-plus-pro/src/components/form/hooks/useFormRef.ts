import { useFormRef as _useFormRef } from '../../../shared/core';
import type { FormInstance } from '../../../shared/ui';

/**
 * @qin-ui/element-plus-pro 的表单组件实例引用 Hook
 *
 * @description 类型安全的 re-export。将 core useFormRef 的泛型参数绑定为 Element Plus 的 FormInstance，
 * 使 formRef 获取到完整的 Element Plus Form 组件 API 类型提示。
 *
 * @returns {object} 表单组件实例引用管理对象
 * @returns {Ref<FormInstance | undefined>} .formRef - Element Plus Form 实例的响应式引用
 * @returns {Function} .setFormRef(inst) - 设置表单组件实例
 *
 * @example
 * ```ts
 * const { formRef, setFormRef } = useFormRef()
 * await formRef.value?.validate()
 * formRef.value?.resetFields()
 * ```
 
 * @public
 */
export const useFormRef = _useFormRef as {
  (): ReturnType<typeof _useFormRef<FormInstance>>;
};
