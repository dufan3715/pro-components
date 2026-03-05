import { useFields as _useFields } from '../../../shared/core';
import type { Data } from '../../../shared/core';
import type { Field } from '../types';

/**
 * 类型断言 re-export @qin-ui/core 的 useFields，
 * 将泛型参数 F 的默认值覆盖为本地的 Field<D>，
 * 使得 fields、getField 等方法的类型推断包含 Ant Design Vue 的完整属性签名。
 */
export const useFields = _useFields as {
  <D extends Data = Data, F extends Field<D> = Field<D>>(
    initFields?: F[]
  ): ReturnType<typeof _useFields<D, F>>;
};

/** useFields 返回值类型，F 默认绑定为本地 Field<D> */
export type UseFields<
  D extends Data = Data,
  F extends Field<D> = Field<D>,
> = ReturnType<typeof useFields<D, F>>;
