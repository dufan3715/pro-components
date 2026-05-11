import { FieldInstance } from '../../../shared/ui';
import { useFields as _useFields } from '../../../shared/core';
import type { Data } from '../../../shared/core';
import type { Field, Fields } from '../types';
import type { ComponentName } from '../constants';

export const useFields = _useFields as {
  <D extends Data = Data>(
    initFields?: Fields<D>
  ): ReturnType<typeof _useFields<D, Field<ComponentName, D>, FieldInstance>>;
};

export type UseFields<D extends Data = Data> = ReturnType<typeof useFields<D>>;
