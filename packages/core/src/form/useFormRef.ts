import { ref } from 'vue';
import type { Ref } from 'vue';

/**
 * useFormRef 返回值：宿主 Form 实例引用与绑定方法
 */
export interface UseFormRefReturn<F = any> {
  /** 底层 UI 框架 Form 实例的响应式引用 */
  formRef: Ref<F | undefined>;

  /** 绑定表单组件实例（由组件 ref 自动调用；卸载时传入 null 清空） */
  setFormRef: (inst: F) => void;
}

/**
 * 表单组件实例引用 Hook
 *
 * @description 保存底层 UI 框架（ant-design-vue / element-plus 等）的 Form 实例：
 * 由组件 ref 经 `setFormRef` 绑定，外部经 `formRef` 调用宿主实例方法（validate / resetFields 等）。
 *
 * @template F - 底层 Form 组件实例类型，默认为 any
 * @returns {UseFormRefReturn<F>} 实例引用与绑定方法
 */
const useFormRef = <F = any>(): UseFormRefReturn<F> => {
  const formRef = ref<F>();

  const setFormRef = (inst: F) => {
    formRef.value = inst;
  };

  return { formRef, setFormRef };
};

export default useFormRef;
