import { describe, it, expect } from 'vitest';
import useFormRef from '../src/form/useFormRef';

describe('useFormRef', () => {
  it('FR-01 初始 formRef 为 undefined', () => {
    const { formRef } = useFormRef();
    expect(formRef.value).toBeUndefined();
  });

  it('FR-02 setFormRef 后更新', () => {
    const { formRef, setFormRef } = useFormRef<any>();
    setFormRef({ fake: 1 });
    expect(formRef.value).toEqual({ fake: 1 });
  });
});
