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

export type AdditionalMethods<FormItemInstance> = {
  /**
   * @description 获取FormItem实例的方法
   */
  getFormItemRef?: () => FormItemInstance;
  /**
   * @description 获取传入FormItem组件的属性
   */
  getFormItemComputedProps?: () => Readonly<{ [x: string]: any }>;
  /**
   * @description 获取组件实例的方法
   */
  getComponentRef?: () => any;
  /**
   * @description 获取传入Component组件的属性
   */
  getComponentComputedProps?: () => Readonly<{
    disabled?: boolean;
    [x: string]: any;
  }>;
};
