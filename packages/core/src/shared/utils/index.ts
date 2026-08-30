import { camelize } from 'vue';

/**
 * 深拷贝：structuredClone + JSON 降级
 *
 * 覆盖业务场景（JSON 型表单/分页数据）：
 * - 原生路径：JSON 全类型、循环引用、Date/RegExp/Map/Set/Error、稀疏数组、undefined/NaN/-0 均保留
 * - 降级路径（structuredClone 缺失，或抛 DataCloneError 如含函数属性）：JSON 往返。
 *   该路径的类型变形超出「丢函数」范畴，首次进入时输出一次性告警：
 *   · 函数与 Symbol 键静默丢弃
 *   · Date → ISO 字符串、Map/Set/RegExp/Error → {}、NaN/Infinity → null
 *   · 顶层入参本身不可序列化（函数/undefined/Symbol）→ 返回原引用（快照隔离失效）
 * - 最后兜底（环境无 structuredClone 且数据含循环引用导致 JSON 亦失败）：告警并返回原引用（快照隔离失效，需感知）
 */
let warnedJsonFallback = false;

export function cloneDeep<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      // DataCloneError：函数等不可结构化类型 → 走 JSON 降级
    }
  }
  if (!warnedJsonFallback) {
    warnedJsonFallback = true;
    console.warn(
      '[pro-components] cloneDeep 已降级为 JSON 拷贝：函数与 Symbol 键丢失；Date → ISO 字符串、Map/Set/RegExp/Error → {}、NaN/Infinity → null；顶层入参不可序列化时原样返回引用。'
    );
  }
  try {
    const json = JSON.stringify(value);
    return json === undefined ? value : JSON.parse(json);
  } catch {
    console.warn(
      '[pro-components] cloneDeep 降级失败：数据含循环引用且环境不支持 structuredClone，已返回原引用，快照隔离失效。'
    );
    return value;
  }
}

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
export function pick<T extends object, K extends PropertyKey>(
  object: T,
  keys: readonly K[]
): Pick<T, Extract<K, keyof T>> {
  const result = {} as Pick<T, Extract<K, keyof T>>;
  for (const key of keys) {
    if (key in object) (result as any)[key] = (object as any)[key];
  }
  return result;
}

/**
 * 安全地将任意值转换为对象
 *
 * @description 如果传入的值是普通对象（plain object），直接返回；
 * 否则返回空对象 `{}`。
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

/**
 * 判断目标值是否为 Promise 或 Thenable 对象
 *
 * @description 符合 Promises/A+ 规范的 Thenable 判定：
 * 1. 目标值非 null/undefined
 * 2. 目标值类型为 object 或 function
 * 3. 目标值拥有类型为 function 的 `then` 属性
 *
 * @param val - 待检查的任意值
 * @returns 如果是 Promise/Thenable 则返回 true 并收窄类型为 `Promise<T>`
 *
 * @example
 * ```ts
 * isPromise(Promise.resolve(1)) // true
 * isPromise(new Promise(() => {})) // true
 * isPromise({ then: () => {} }) // true
 * isPromise(null) // false
 * isPromise({}) // false
 * ```
 */
export function isPromise<T = any>(val: unknown): val is Promise<T> {
  return (
    val !== null &&
    (typeof val === 'object' || typeof val === 'function') &&
    typeof (val as Record<string, any>).then === 'function'
  );
}
