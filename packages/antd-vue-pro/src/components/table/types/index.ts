import type { ColumnType } from '../../../shared/ui';
import { Data, KeyExpandString, Paths, Path } from '../../../shared/types';

export type Column<D extends Data = Data> = Omit<
  ColumnType,
  'dataIndex' | 'key'
> & {
  dataIndex?: KeyExpandString<Extract<keyof D, string>> | Paths<D>;
  key?: Path<D>;
  hidden?: boolean;
};

export type Columns<D extends Data = Data> = Array<Column<D>>;
