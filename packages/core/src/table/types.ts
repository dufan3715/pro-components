import { Data, Path } from '../shared/types';

export interface BaseColumn<D extends Data = Data> {
  key?: Path<D>;
  dataIndex?: Path<D> | Path<D>[];
  children?: BaseColumn<D>[];
  [key: string]: any;
}

export type Columns<
  D extends Data = Data,
  C extends BaseColumn<D> = BaseColumn<D>,
> = Array<C>;

export interface PageParam {
  current: number;
  pageSize: number;
  total: number;
  [key: string]: any;
}

export type UpdateColumnOptions = {
  all?: boolean;
};

export type ColumnUpdaterParam<
  D extends Data,
  C extends BaseColumn<D> = BaseColumn<D>,
> = {
  column: Readonly<C>;
  columnIndex: number;
  group: Columns<D, C>;
};

export type ColumnUpdater<
  D extends Data,
  C extends BaseColumn<D> = BaseColumn<D>,
> = (param: ColumnUpdaterParam<D, C>) => void;

export type ColumnFindBy<
  D extends Data,
  C extends BaseColumn<D> = BaseColumn<D>,
> = (column: Readonly<C>) => boolean;
