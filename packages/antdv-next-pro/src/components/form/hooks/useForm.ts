import { useForm as _useForm, type Form as _Form } from '../../../shared/core';
import type { Data, ExtendWithAny, DeepPartial } from '../../../shared/core';
import type { Field } from '../types';
import type { ComponentName } from '../constants';
import type { FormInstance } from '../../../shared/ui';

/**
 * 重新定义 Form 类型：
 * 1. 将第二个泛型参数 F 默认绑定为本地 Field<ComponentName, D>；
 * 2. 将 core Form 的第三个泛型参数 I 绑定为本地 UI 库（antdv-next）的 FormInstance，
 *    使 formRef 的类型变为 Ref<FormInstance | undefined>。
 */
export type Form<
  D extends Data = Data,
  F extends Field<ComponentName, D> = Field<ComponentName, D>,
> = _Form<D, F, FormInstance>;

/**
 * 类型断言 re-export @qin-ui/core 的 useForm，
 * 将默认返回的 Form<D, BaseField<D>> 覆盖为本地的 Form<D, Field<ComponentName, D>>。
 */
export const useForm = _useForm as {
  <D extends Data = Data>(
    initFormData?: ExtendWithAny<DeepPartial<D>>,
    initFields?: Field<ComponentName, D>[],
    root?: boolean
  ): Form<D, Field<ComponentName, D>>;
  <D extends Data = Data>(root?: boolean): Form<D, Field<ComponentName, D>>;
};
