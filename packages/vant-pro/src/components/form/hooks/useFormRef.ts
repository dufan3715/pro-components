import { useFormRef as _useFormRef } from '../../../shared/core';
import type { FormInstance } from '../../../shared/ui';

export const useFormRef = _useFormRef as {
  (): ReturnType<typeof _useFormRef<FormInstance>>;
};
