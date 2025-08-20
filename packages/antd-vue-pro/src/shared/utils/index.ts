export {
  toPath,
  get,
  set,
  omit,
  pick,
  cloneDeep,
  isPlainObject,
} from 'lodash-es';

import { isPlainObject } from 'lodash-es';

export function getObject(val: any): Record<string, any> {
  return isPlainObject(val) ? val : {};
}
