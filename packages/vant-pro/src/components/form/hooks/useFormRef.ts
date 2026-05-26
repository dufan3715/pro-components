import { useFormRef as _useFormRef } from '../../../shared/core';
import type { FormInstance } from '../../../shared/ui';

/**
 * @qin-ui/vant-pro 的表单组件实例引用 Hook
 *
 * @description 类型安全的 re-export。将 core useFormRef 的泛型参数绑定为 Vant 的 FormInstance。
 *
 * @returns {object} 表单组件实例引用管理对象
 * @returns {Ref<FormInstance | undefined>} .formRef - Vant Form 实例的响应式引用
 * @returns {Function} .setFormRef(inst) - 设置表单组件实例
 *
 * @example
 * ```ts
 * const { formRef, setFormRef } = useFormRef()
 * formRef.value?.submit()
 * ```
 
 * @public
 */
export const useFormRef = _useFormRef as {
  (): ReturnType<typeof _useFormRef<FormInstance>>;
};
