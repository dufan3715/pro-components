import { camelize, isProxy, toRaw } from 'vue';
import { isDangerousKey } from '../path';

// 降级告警去重标记与失败原因描述工具
let warnedJsonFallback = false;
const describeCloneError = (error: unknown): string =>
  error instanceof Error ? `${error.name}: ${error.message}` : String(error);

/**
 * 深拷贝：优先 `structuredClone`，不可用时降级 JSON 往返
 *
 * @description 降级路径的类型变形：函数 / Symbol 键丢失，`Date` → ISO 字符串，
 * `Map` / `Set` / `RegExp` / `Error` → `{}`，`NaN` / `Infinity` → `null`（首次降级一次性告警）；
 * 序列化失败（BigInt、抛错访问器、循环引用）或顶层不可序列化时返回原引用并告警（快照隔离失效）。
 * 入口为响应式代理时按其原始对象克隆，代理嵌套在内层时仍走降级路径。
 *
 * @template T - 入参类型
 * @param {T} value - 待拷贝的值
 * @returns {T} 拷贝结果；无法快照时返回原引用
 */
export function cloneDeep<T>(value: T): T {
  // 响应式代理无法结构化克隆，先解包原始对象
  const source = isProxy(value) ? toRaw(value) : value;
  let structuredCloneError: unknown;
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(source);
    } catch (error) {
      // DataCloneError：函数等不可结构化类型 → 走 JSON 降级
      structuredCloneError = error;
    }
  }
  let json: string | undefined;
  try {
    json = JSON.stringify(source);
  } catch (error) {
    console.warn(
      `[pro-components] cloneDeep 无法快照，已返回原引用（快照隔离失效）：JSON 序列化失败（${describeCloneError(error)}）；structuredClone ${
        structuredCloneError
          ? `失败（${describeCloneError(structuredCloneError)}）`
          : '不可用'
      }。可能原因：含 BigInt、抛错的数据访问器、循环引用，或数据含不可结构化类型（函数 / Symbol / 代理）。`
    );
    return source as T;
  }
  if (json === undefined) {
    console.warn(
      '[pro-components] cloneDeep 无法快照，已返回原引用（快照隔离失效）：顶层入参不可 JSON 序列化（函数 / undefined / Symbol）。'
    );
    return source as T;
  }
  if (!warnedJsonFallback) {
    warnedJsonFallback = true;
    console.warn(
      '[pro-components] cloneDeep 已降级为 JSON 拷贝：函数与 Symbol 键丢失；Date → ISO 字符串、Map/Set/RegExp/Error → {}、NaN/Infinity → null；顶层入参不可序列化时原样返回引用。'
    );
  }
  return JSON.parse(json);
}

/**
 * 判断是否为可用配置项（字段 / 列）
 *
 * @description 仅非 null 对象为 true：数组 / Date / Map 等对象形态同样通过，原始值与函数为 false
 * @param value - 待判断的值
 * @returns 对象形态为 true
 */
export const isObjectItem = (value: unknown): boolean =>
  value !== null && typeof value === 'object';

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

/**
 * 与 lodash pick 语义对齐：返回新对象，仅含 keys 中存在于对象（含继承）的属性
 *
 * @description 危险键（`__proto__` / `constructor` / `prototype`）不参与拷贝。
 */
export function pick<T extends object, K extends PropertyKey>(
  object: T,
  keys: readonly K[]
): Pick<T, Extract<K, keyof T>> {
  const result = {} as Pick<T, Extract<K, keyof T>>;
  for (const key of keys) {
    if (isDangerousKey(key as string | number)) continue;
    if (key in object) (result as any)[key] = (object as any)[key];
  }
  return result;
}

/** 自身与原型链上的可枚举 Symbol 键（对齐 lodash 浅拷贝分支的取值面） */
const enumerableSymbolsIn = (object: object): symbol[] => {
  const symbols: symbol[] = [];
  for (let current: any = object; current; current = getProto(current)) {
    for (const symbol of Object.getOwnPropertySymbols(current)) {
      if (Object.prototype.propertyIsEnumerable.call(current, symbol)) {
        symbols.push(symbol);
      }
    }
  }
  return symbols;
};

/**
 * 与 lodash omit 语义对齐：返回新对象，含对象（含继承）的可枚举属性并剔除 keys 中的属性
 *
 * @description 仅处理顶层键（不解析 `a.b` 深层路径）；危险键（`__proto__` / `constructor` / `prototype`）不参与拷贝；
 * Symbol 键与可枚举继承属性照常拷贝（数组入参不拷贝 Symbol 键，对齐 lodash）；`null` / `undefined` 入参返回空对象；
 * 不修改源对象。
 *
 * @template T - 源对象类型
 * @template K - 待剔除的键类型
 * @param {T} object - 源对象
 * @param {readonly K[]} keys - 待剔除的顶层键集合
 * @returns {Omit<T, Extract<K, keyof T>>} 剔除后的新对象
 */
export function omit<T extends object, K extends PropertyKey>(
  object: T,
  keys: readonly K[]
): Omit<T, Extract<K, keyof T>> {
  const result = {} as Omit<T, Extract<K, keyof T>>;
  const excluded = new Set<PropertyKey>(keys);
  if (object == null) return result;
  const copy = (key: PropertyKey) => {
    if (excluded.has(key) || isDangerousKey(key as string)) return;
    (result as any)[key] = (object as any)[key];
  };
  for (const key in object) copy(key);
  if (!Array.isArray(object)) {
    for (const symbol of enumerableSymbolsIn(object)) copy(symbol);
  }
  return result;
}

/**
 * 将任意值安全转为对象
 *
 * @description 普通对象（plain object）原样返回引用，其余值返回新的空对象
 * @param val - 任意值
 * @returns 普通对象本身或空对象
 */
export function getObject(val: any): Record<string, any> {
  return isPlainObject(val) ? val : {};
}

const verbatimAttrRE = /^(data|aria)-/i;

/** DOM 属性值形态：字符串 / 数字 / 布尔；对象、数组、函数等按组件 prop 取值处理 */
const isDomAttrValue = (value: unknown): boolean =>
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'boolean';

/**
 * 遍历自有可枚举属性，将 kebab-case 键转为 camelCase
 *
 * @description `data-*` / `aria-*` 前缀在取值为 DOM 属性值（字符串 / 数字 / 布尔）时保名；
 * 取值为对象 / 数组 / 函数等组件 prop 形态时转驼峰（`data-source` → `dataSource`）。
 *
 * @param obj - 源对象
 * @returns 键名转换后的新对象
 *
 * @example
 * ```ts
 * camelizeProperties({ 'user-name': '张三', 'data-testid': 'form-x', 'data-source': [] })
 * // { userName: '张三', 'data-testid': 'form-x', dataSource: [] }
 * ```
 */
export function camelizeProperties(
  obj: Record<string, any>
): Record<string, any> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      verbatimAttrRE.test(key) && isDomAttrValue(value) ? key : camelize(key),
      value,
    ])
  );
}

/**
 * 判断目标值是否为 Promise 或 Thenable（Promises/A+）
 *
 * @description 非 null 的 object / function 且 `then` 为函数时为 true
 * @param val - 待检查的任意值
 * @returns 是 Promise / Thenable 时为 true 并收窄为 `Promise<T>`
 */
export function isPromise<T = any>(val: unknown): val is Promise<T> {
  return (
    val !== null &&
    (typeof val === 'object' || typeof val === 'function') &&
    typeof (val as Record<string, any>).then === 'function'
  );
}
