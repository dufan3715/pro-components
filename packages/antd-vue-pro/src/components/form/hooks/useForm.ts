import { useForm as _useForm, type Form as _Form } from '../../../shared/core';
import type { Data, ExtendWithAny, DeepPartial } from '../../../shared/core';
import type { Field } from '../types';
import type { FormInstance } from '../../../shared/ui';

/**
 * 重新定义 Form 类型：
 * 1. 将第二个泛型参数 F 默认绑定为本地 Field<D>；
 * 2. 将 core Form 的第三个泛型参数 I 绑定为本地 UI 库（Ant Design Vue）的 FormInstance，
 *    使 formRef 的类型变为 Ref<FormInstance | undefined>。
 */
export type Form<D extends Data = Data, F extends Field<D> = Field<D>> = _Form<
  D,
  F,
  FormInstance
>;

type NormalizeField<D extends Data, F extends Field<D>> = [F] extends [never]
  ? Field<D>
  : F;

/**
 * 类型断言 re-export @qin-ui/core 的 useForm，
 * 将默认返回的 Form<D, BaseField<D>> 覆盖为本地的 Form<D, Field<D>>。
 */
export const useForm = _useForm as {
  <D extends Data = Data, F extends Field<D> = Field<D>>(
    initFormData?: ExtendWithAny<DeepPartial<D>>,
    initFields?: F[],
    root?: boolean
  ): Form<D, NormalizeField<D, F>>;
  <D extends Data = Data, F extends Field<D> = Field<D>>(
    root?: boolean
  ): Form<D, NormalizeField<D, F>>;
};
