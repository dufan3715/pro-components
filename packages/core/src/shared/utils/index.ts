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

/**
 * 安全地将任意值转换为对象
 *
 * @description 如果传入的值是普通对象（plain object），直接返回；
 * 否则返回空对象 `{}`。用于确保值始终为可操作的对象类型。
 *
 * @param val - 任意值
 * @returns 如果 val 是普通对象则返回它，否则返回空对象
 *
 * @example
 * ```ts
 * getObject({ name: 'test' }) // { name: 'test' }
 * getObject(null)              // {}
 * getObject(undefined)         // {}
 * getObject('string')          // {}
 * ```
 */
export function getObject(val: any): Record<string, any> {
  return isPlainObject(val) ? val : {};
}

/**
 * 将对象的所有属性名转为驼峰命名（camelCase）
 *
 * @description 遍历对象的所有属性，将 key 从 kebab-case 转换为 camelCase。
 * 底层使用 Vue 的 `camelize` 工具函数（匹配 `-\w` 正则）。
 * 常用于处理 kebab-case 风格的属性名转为 JS 惯用的 camelCase。
 *
 * @param obj - 源对象
 * @returns 属性名已转为驼峰格式的新对象
 *
 * @example
 * ```ts
 * camelizeProperties({ 'user-name': '张三', 'is-active': true })
 * // { userName: '张三', isActive: true }
 * ```
 */
export function camelizeProperties(
  obj: Record<string, any>
): Record<string, any> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [camelize(key), value])
  );
}
