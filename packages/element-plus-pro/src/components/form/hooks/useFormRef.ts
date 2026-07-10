import {
  useFormRef as coreUseFormRef,
  type UseFormRefReturn,
} from '../../../shared/core';
import type { FormInstance } from '../../../shared/ui';

/**
 * 表单组件实例引用 Hook
 *
 * @description 基于 `@qin-ui/pro-components-core` 的 `useFormRef`，将泛型参数绑定为 Element Plus 的 `FormInstance`，
 * 使 formRef 获取到完整的 Element Plus Form 组件 API 类型提示（如 `validate()`、`resetFields()` 等）。
 *
 * `formRef` 由 ProForm 组件内部自动通过 `setFormRef` 绑定，无需手动调用。
 *
 * @returns 表单组件实例引用管理对象：
 * - `formRef` — Element Plus Form 组件实例的响应式引用（`Ref<FormInstance | undefined>`）
 * - `setFormRef(inst)` — 设置 Form 组件实例，由 ProForm 内部自动调用
 *
 * @example
 * ```ts
 * const { formRef, setFormRef } = useFormRef()
 *
 * // formRef 由 ProForm 自动绑定，可直接使用
 * await formRef.value?.validate()
 * formRef.value?.resetFields()
 * formRef.value?.scrollToField('username')
 * ```
 *
 * @see {@link coreUseFormRef} 底层核心实现（来自 @qin-ui/pro-components-core）
 *
 * @public
 */
export function useFormRef(): UseFormRefReturn<FormInstance> {
  return coreUseFormRef();
}
