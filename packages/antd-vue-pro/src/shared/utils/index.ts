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
import { camelize } from 'vue';

export function getObject(val: any): Record<string, any> {
  return isPlainObject(val) ? val : {};
}

export function camelizeProperties(
  obj: Record<string, any>
): Record<string, any> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [camelize(key), value])
  );
}
