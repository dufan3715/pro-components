import { useFields as _useFields } from '../../../shared/core';
import type { Data } from '../../../shared/core';
import type { Field, Fields } from '../types';

/**
 * 类型断言 re-export @qin-ui/core 的 useFields，
 * 将泛型参数 F 的默认值覆盖为本地的 Field<D>，
 * 使得 fields、getField 等方法的类型推断包含 UI 库的完整属性签名。
 */
export const useFields = _useFields as {
  <D extends Data = Data>(
    initFields?: Fields<D>
  ): ReturnType<typeof _useFields<D, Field<D>>>;
};

/** useFields 返回值类型，固定为本地 Fields<D> */
export type UseFields<D extends Data = Data> = ReturnType<typeof useFields<D>>;
