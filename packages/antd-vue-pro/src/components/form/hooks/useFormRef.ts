import { useFormRef as _useFormRef } from '../../../shared/core';
import type { FormInstance } from '../../../shared/ui';

/**
 * @qin-ui/antd-vue-pro 的表单组件实例引用 Hook
 *
 * @description 类型安全的 re-export。将 core useFormRef 的泛型参数绑定为 Ant Design Vue 的 FormInstance，
 * 使 formRef 获取到完整的 Ant Design Vue Form 组件 API 类型提示。
 * @public
 *
 * @returns {object} 表单组件实例引用管理对象
 * @returns {Ref<FormInstance | undefined>} .formRef - Ant Design Vue Form 实例的响应式引用
 * @returns {Function} .setFormRef(inst) - 设置表单组件实例
 *
 * @example
 * ```ts
 * const { formRef, setFormRef } = useFormRef()
 * // formRef.value 的类型为 FormInstance | undefined
 * // 可安全调用 Ant Design Vue 的 Form API
 * await formRef.value?.validate()
 * formRef.value?.resetFields()
 * ```
 */
export const useFormRef = _useFormRef as {
  (): ReturnType<typeof _useFormRef<FormInstance>>;
};
