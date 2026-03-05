import { useFormRef as _useFormRef } from '../../../shared/core';
import type { FormInstance } from '../../../shared/ui';

/**
 * 类型断言 re-export @qin-ui/core 的 useFormRef，
 * 将 FormInstance 泛型参数绑定为本地 UI 库（Ant Design Vue）的 FormInstance。
 */
export const useFormRef = _useFormRef as {
  (): ReturnType<typeof _useFormRef<FormInstance>>;
};
