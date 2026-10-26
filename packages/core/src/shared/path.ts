/**
 * @module Core/Shared/Path
 * @description 路径解析与对象读写：`get` / `set` / `toPath` / `normalizePathKey`。
 *
 * 支持语法：点分 `a.b`、数字段 `list.0`、简单括号 `a[0]`；非法语法输出去重告警并给出确定性兜底。
 * 写侧不落 `__proto__` / `constructor` / `prototype` 键；解析结果按路径缓存并冻结。
 *
 * 与 lodash 的口径差异：未闭合括号 `a[b` 解析为 `['a','b']`；引号段 `a["x.y"]` 保留引号；
 * `normalizePathKey` 对对象 / symbol 等返回 `''`；`get` / `set` 的非字符串路径统一经 `toPath` 归一
 * （数字 / 布尔按单段键，空数组 / `null` / 对象不读不写）。
 */

const PATH_CACHE_LIMIT = 5000;
const pathCache = new Map<string, string[]>();
// 告警去重集合容量上限
const WARNED_PATHS_LIMIT = 5000;
const warnedPaths = new Set<string>();

/** FIFO 分批驱逐最旧的 10% */
function evictOldestBatch(
  store: Set<string> | Map<string, unknown>,
  limit: number
) {
  const batch = Math.ceil(limit * 0.1);
  let evicted = 0;
  for (const key of store.keys()) {
    store.delete(key);
    if (++evicted >= batch) break;
  }
}

function warnInvalid(p: string, reason: string) {
  if (warnedPaths.has(p)) return;
  if (warnedPaths.size >= WARNED_PATHS_LIMIT) {
    evictOldestBatch(warnedPaths, WARNED_PATHS_LIMIT);
  }
  warnedPaths.add(p);
  console.warn(
    `[pro-components] 非法路径 "${p}"：${reason}。支持语法：点分('a.b')、数字段('list.0')、简单括号('a[0]')。`
  );
}

function parseBracketPath(p: string): string[] {
  if (p.charCodeAt(0) === 46 || p.endsWith('.') || p.includes('..')) {
    warnInvalid(p, '空路径段（前导/尾随/连续点号）');
  }
  const segs: string[] = [];
  const n = p.length;
  let buf = '';
  let i = 0;
  let afterBracket = false;
  while (i < n) {
    const c = p[i];
    if (c === '.') {
      // 括号后的点是纯分隔符（a[0].b -> ['a','0','b']），连续点保留空段
      if (buf !== '' || !afterBracket) segs.push(buf);
      buf = '';
      i++;
      afterBracket = false;
    } else if (c === '[') {
      if (buf) {
        segs.push(buf);
        buf = '';
      }
      const close = p.indexOf(']', i + 1);
      if (close === -1) {
        warnInvalid(p, '括号未闭合');
        segs.push(p.slice(i + 1));
        i = n;
      } else {
        const content = p.slice(i + 1, close);
        if (content === '') warnInvalid(p, '空括号段');
        else if (content.indexOf('"') !== -1 || content.indexOf("'") !== -1) {
          warnInvalid(p, '不支持引号括号段，请改用点分路径');
        }
        segs.push(content);
        i = close + 1;
      }
      afterBracket = true;
    } else {
      buf += c;
      i++;
    }
  }
  if (buf !== '' || segs.length === 0) segs.push(buf);
  return segs;
}

function parsePath(p: string): string[] {
  if (p.indexOf('[') === -1) {
    const segs = p.split('.'); // 原生 split：空段兜底行为与 lodash 一致
    if (segs.includes('')) warnInvalid(p, '空路径段（前导/尾随/连续点号）');
    return segs;
  }
  return parseBracketPath(p);
}

// 解析结果缓存共享并冻结，同一路径只解析一次
function cachedParse(p: string): string[] {
  let s = pathCache.get(p);
  if (s === undefined) {
    s = Object.freeze(parsePath(p)) as string[];
    if (pathCache.size >= PATH_CACHE_LIMIT) {
      evictOldestBatch(pathCache, PATH_CACHE_LIMIT);
    }
    pathCache.set(p, s);
  }
  return s;
}

const isObjectLike = (v: unknown): v is object =>
  v !== null && (typeof v === 'object' || typeof v === 'function');
// 数组下标判定：仅 0 ~ 2^32-2 的十进制整数段建数组，负数 / 小数 / NaN / 超大整数段按对象键处理
const MAX_ARRAY_INDEX = 4294967294;
const isIndexKey = (v: string | number) => {
  const key = String(v);
  return /^(?:0|[1-9]\d*)$/.test(key) && Number(key) <= MAX_ARRAY_INDEX;
};
/**
 * 原型污染危险键判定（`__proto__` / `constructor` / `prototype`）
 *
 * @internal 仅包内使用，不进入包根导出清单
 *
 * @param {string | number} v - 待判定的键
 * @returns {boolean} 字符串且命中危险键清单时为 true
 */
export const isDangerousKey = (v: string | number) =>
  typeof v === 'string' &&
  (v === '__proto__' || v === 'constructor' || v === 'prototype');
const sameValueZero = (a: unknown, b: unknown) =>
  a === b || (a !== a && b !== b);
const hasOwn = (o: object, k: string | number) =>
  Object.prototype.hasOwnProperty.call(o, k);
const isSimple = (p: string) => p.indexOf('.') === -1 && p.indexOf('[') === -1;

/**
 * 沿路径获取对象属性值
 *
 * @description 字符串路径命中整串字面量键时直接读取，否则按段解析；段数组与数字 / 布尔经
 * {@link toPath} 归一。空段数组、`null` / `undefined` 与对象路径返回 `undefined`。
 *
 * @param {unknown} obj - 目标对象
 * @param {string | readonly (string | number)[]} path - 路径字符串或段数组
 * @returns {unknown} 获取到的属性值，未命中返回 undefined
 */
export function get(
  obj: unknown,
  path: string | readonly (string | number)[]
): unknown {
  if (obj == null) return undefined;
  if (typeof path === 'string') {
    if (isObjectLike(obj) && path in obj) return (obj as any)[path]; // 单段命中或字面量点号 key
    if (isSimple(path)) return (obj as any)[path]; // 单段未命中
    path = cachedParse(path);
  } else {
    // 非字符串路径（段数组 / 裸数字 / 布尔）经 toPath 归一；无可读段时返回 undefined
    path = toPath(path);
    if (path.length === 0) return undefined;
  }
  let cur = obj as any;
  // 中间段取到 null/undefined 即视为路径断裂返回 undefined；终点值本身为 null/undefined 时原样返回
  for (let i = 0; i < path.length; i++) {
    cur = cur[path[i]];
    if (cur === undefined || cur === null) {
      return i === path.length - 1 ? cur : undefined;
    }
  }
  return cur;
}

/**
 * 沿路径设置对象属性值（支持自动创建中间层对象/数组）
 *
 * @description 字符串路径命中整串字面量键时直接写入，否则按段解析（中间层缺失即创建）；
 * 段数组与数字 / 布尔经 {@link toPath} 归一，空段数组、`null` / `undefined` 与对象路径不写入。
 *
 * @param {object} obj - 目标对象
 * @param {string | readonly (string | number)[]} path - 路径字符串或段数组
 * @param {unknown} value - 待设置的值
 * @returns {object} 原对象
 */
export function set(
  obj: object,
  path: string | readonly (string | number)[],
  value: unknown
): object {
  if (obj == null) return obj;
  if (typeof path === 'string') {
    if (isDangerousKey(path)) return obj; // 原型污染防护
    if (isObjectLike(obj) && path in obj) {
      assignValue(obj as any, path, value);
      return obj;
    }
    if (isSimple(path)) {
      assignValue(obj as any, path, value);
      return obj;
    }
    path = cachedParse(path);
  } else {
    // 非字符串路径经 toPath 归一；无可写段时不做变更
    path = toPath(path);
  }
  const n = path.length;
  if (n === 0) return obj;
  let nested = obj as any;
  // 中间层缺失时创建（下一段为数组下标建数组，否则建对象）；遇危险键整条路径放弃写入
  for (let i = 0; i < n - 1; i++) {
    const key = path[i];
    if (isDangerousKey(key)) return obj;
    const cur = nested[key];
    if (isObjectLike(cur)) {
      nested = cur;
    } else {
      nested[key] = isIndexKey(path[i + 1]) ? [] : {};
      nested = nested[key]; // 经（代理）重读，保持 Vue 响应式包装
    }
  }
  const last = path[n - 1];
  if (!isDangerousKey(last)) assignValue(nested, last, value);
  return obj;
}

/** 自身属性且 SameValueZero 等值时跳过写入（`0` / `-0`、`NaN` / `NaN` 视为同值） */
function assignValue(object: any, key: string | number, value: unknown) {
  const cur = object[key];
  if (
    !(hasOwn(object, key) && sameValueZero(cur, value)) ||
    (value === undefined && !(key in object))
  ) {
    object[key] = value;
  }
}

/**
 * 字段路径归一化（`toPath(p).join('.')` 语义）
 *
 * @description 无 `[` 的字符串直接返回（零分配），含 `[` 走解析缓存；数组经 `join('.')` 归一
 * （`null` / `undefined` 段视为空串）。与 {@link toPath} 的逐段 `String` 口径仅在数组含空段时不同。
 *
 * @param {unknown} path - 路径字符串、段数组或数字 / 布尔标量
 * @returns {string} 归一化后的路径键，不可归一时返回空串
 */
export function normalizePathKey(path: unknown): string {
  if (typeof path === 'string') {
    if (path === '') return '';
    return path.indexOf('[') === -1 ? path : cachedParse(path).join('.');
  }
  if (Array.isArray(path)) return path.join('.');
  if (typeof path === 'number' || typeof path === 'boolean')
    return String(path);
  return ''; // undefined/null/symbol/对象 -> ''（优于 lodash 的 '[object Object]' 垃圾 key）
}

/**
 * 将路径解析为段数组（供 `name` / `path` 数组语义的绑定场景使用）
 *
 * @description 非空字符串取自模块级缓存：同路径返回同一**已冻结**实例，调用方按只读使用；
 * 数组逐段 `String` 后返回新数组，数字 / 布尔返回单段新数组，空字符串 / `null` / `undefined` /
 * 对象 / symbol 返回空数组。非法语法（空段、未闭合括号、引号段）输出告警并给出确定性兜底。
 *
 * @param {unknown} path - 路径字符串、段数组或数字 / 布尔标量
 * @returns {string[]} 路径段数组；不可解析时返回空数组
 */
export function toPath(path: unknown): string[] {
  if (Array.isArray(path)) return path.map(String);
  if (typeof path === 'number' || typeof path === 'boolean')
    return [String(path)];
  if (typeof path !== 'string') return [];
  if (!path) return [];
  return cachedParse(path);
}
