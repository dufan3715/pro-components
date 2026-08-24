export { toPath, get, set, cloneDeep } from 'lodash-es';

import { camelize } from 'vue';

const toString = Object.prototype.toString;
const getProto = Object.getPrototypeOf;
const hasOwn = (o: object, k: PropertyKey) =>
  Object.prototype.hasOwnProperty.call(o, k);
const rootObjectCtorString = Function.prototype.toString.call(Object);

/** 与 lodash isPlainObject 语义等价（含 Object.create(null) 与跨原型链判定） */
export function isPlainObject(v: unknown): v is Record<string, any> {
  if (v === null || typeof v !== 'object') return false;
  if (toString.call(v) !== '[object Object]') return false;
  const proto = getProto(v);
  if (proto === null) return true;
  const Ctor = hasOwn(proto, 'constructor') && proto.constructor;
  return (
    typeof Ctor === 'function' &&
    Ctor instanceof Ctor &&
    Function.prototype.toString.call(Ctor) === rootObjectCtorString
  );
}

/** 与 lodash pick 语义对齐：返回新对象，仅含 keys 中存在于对象（含继承）的属性 */
export function pick<T extends object, K extends keyof T>(
  object: T,
  keys: readonly K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in object) (result as any)[key] = (object as any)[key];
  }
  return result;
}

/**
 * 与 lodash omit 的**顶层 key**语义对齐（差异声明：lodash 的 paths 参数支持点分嵌套路径，本实现仅过滤顶层 key；表单场景无嵌套需求，JSDoc 注明）
 */
export function omit<T extends object, K extends keyof T>(
  object: T,
  keys: readonly K[]
): Omit<T, K> {
  const result = {} as Omit<T, K>;
  for (const key of Object.keys(object)) {
    if (!(keys as readonly PropertyKey[]).includes(key)) {
      (result as any)[key] = (object as any)[key];
    }
  }
  return result;
}

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
