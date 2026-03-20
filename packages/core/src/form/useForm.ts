import { inject } from 'vue';
import useFields from './useFields';
import useFormData from './useFormData';
import useFormRef from './useFormRef';
import { InjectionFormKey } from './constants';
import { Data, DeepPartial, ExtendWithAny } from '../shared/types';
import { BaseField } from './types';

export type Form<
  D extends Data = Data,
  F extends BaseField<D> = BaseField<D>,
  I = any,
> = ReturnType<typeof useFormData<D>> &
  ReturnType<typeof useFields<D, F>> &
  ReturnType<typeof useFormRef<I>>;

function useForm<D extends Data = Data, F extends BaseField<D> = BaseField<D>>(
  initFormData?: ExtendWithAny<DeepPartial<D>>,
  initFields?: F[],
  root?: boolean
): Form<D, F>;

function useForm<D extends Data = Data, F extends BaseField<D> = BaseField<D>>(
  root?: boolean
): Form<D, F>;

function useForm<D extends Data = Data, F extends BaseField<D> = BaseField<D>>(
  ...args: any[]
) {
  let initFormData = {} as any,
    initFields = [],
    root = true;
  if (args.length === 1) {
    root = args[0] as boolean;
  } else if (args.length >= 2) {
    initFormData = args[0] ?? {};
    initFields = args[1];
    root = (args[2] as boolean) ?? root;
  }
  if (!root) {
    const injectForm = inject(InjectionFormKey);
    if (injectForm) return injectForm;
  }
  return {
    ...useFormData<D>(initFormData),
    ...useFields<D, F>(initFields),
    ...useFormRef(),
  };
}

export default useForm;
