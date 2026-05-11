import { useForm as _useForm, type Form as _Form } from '../../../shared/core';
import type { Data, ExtendWithAny, DeepPartial } from '../../../shared/core';
import type { Field } from '../types';
import type { ComponentName } from '../constants';
import type { FormInstance } from '../../../shared/ui';
import { useFormPopup, type FormPopup } from './useFormPopup';

export type Form<
  D extends Data = Data,
  F extends Field<ComponentName, D> = Field<ComponentName, D>,
> = _Form<D, F, FormInstance> & { formPopup: FormPopup };

export function useForm<D extends Data = Data>(
  initFormData?: ExtendWithAny<DeepPartial<D>>,
  initFields?: Field<ComponentName, D>[],
  root?: boolean
): Form<D, Field<ComponentName, D>>;
export function useForm<D extends Data = Data>(
  root?: boolean
): Form<D, Field<ComponentName, D>>;
export function useForm(...args: any[]) {
  let root = true;
  if (args.length === 1) {
    root = args[0] as boolean;
  } else if (args.length >= 2) {
    root = (args[2] as boolean) ?? root;
  }

  const form = _useForm(...args);
  const formPopup = useFormPopup(root);

  return { ...form, formPopup };
}
