import { Data, Path } from '../shared/types';

export interface BaseField<D extends Data = Data> {
  path?: Path<D> | any;
  name?: any;
  fields?: any[];
  [key: string]: any;
}

export type FieldUpdaterParam<
  D extends Data,
  F extends BaseField<D> = BaseField<D>,
> = {
  field: Readonly<F>;
  fieldIndex: number;
  parentField: F;
};

export type FieldUpdater<
  D extends Data,
  F extends BaseField<D> = BaseField<D>,
> = (param: FieldUpdaterParam<D, F>) => void;

export type FieldFindBy<
  D extends Data,
  F extends BaseField<D> = BaseField<D>,
> = (field: Readonly<F>) => boolean;

export type Fields<
  D extends Data = Data,
  F extends BaseField<D> = BaseField<D>,
> = F[];
