import type { ColumnType } from '../../../shared/ui';
import {
  Data,
  ExtendWithAny,
  KeyExpandString,
  Paths,
  Path,
} from '../../../shared/core';

type BivariantRender<D extends Data = Data> = {
  bivarianceHack(scope: ColumnScope<D>): any;
}['bivarianceHack'];

export type ColumnScope<D extends Data = Data> = {
  row: ExtendWithAny<D>;
  column: Column<D>;
  $index: number;
  cellValue: any;
};

export type Column<D extends Data = Data> = Partial<
  Omit<ColumnType<any>, 'prop' | 'property' | 'children' | 'render'>
> & {
  key?: Path<D>;
  prop?: KeyExpandString<Extract<keyof D, string>> | Paths<D>;
  hidden?: boolean;
  render?: BivariantRender<D>;
};

export type Columns<D extends Data = Data> = Array<Column<D>>;
