/**
 * @module Core/Shared/Path
 * @description 高性能路径解析与对象读写模块：`get` / `set` / `toPath` / `normalizePathKey`。
 *
 * ## 设计定位
 * - 收窄语法 + 非法路径告警：支持点分('a.b')、数字段('list.0')、简单括号('a[0]')。
 * - 零外部依赖、解析缓存、原生循环遍历、原型污染防护、Vue 响应式安全重读与同值跳过。
 *
 * ## 与 lodash get/set/toPath 的行为差异
 * 本模块的 `get` / `set` / `toPath` 覆盖 lodash 同名 API 的主流用法（点分路径、数字索引），
 * 但不追求全量边界兼容，以下分歧为有意设计：
 * 1. 未闭合括号 'a[b'：按段解析 (['a','b']) 并输出告警；lodash 整体视为字面量 key (obj['a[b'])。
 * 2. 引号括号段 'a["x.y"]'：保留引号原样作为段内容并输出告警；lodash 会去除引号 (['a','x.y'])。
 *    如需访问含点号的 key，请直接使用变量下标访问（obj[key]）。
 * 3. normalizePathKey 对非字符串/非数组/非数字布尔（如对象/symbol）返回 ''；lodash toPath({}) 会产生 '[object Object]' 垃圾 key。
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
      // 括号后的点是纯分隔符（'a[0].b' -> ['a','0','b']）；连续点保留空段（与 lodash 兜底一致）
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

/** 解析结果视为不可变、缓存共享；路径高度重复，每个字符串仅解析一次 */
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
const isIndexKey = (v: string | number) =>
  typeof v === 'number' || /^(?:0|[1-9]\d*)$/.test(v);
/** 原型污染危险键判定（`__proto__` / `constructor` / `prototype`） */
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
    if (isDangerousKey(path)) return obj; // 原型污染防护（对齐 lodash 4.17.21）
    if (isObjectLike(obj) && path in obj) {
      assignValue(obj as any, path, value);
      return obj;
    }
    if (isSimple(path)) {
      assignValue(obj as any, path, value);
      return obj;
    }
    path = cachedParse(path);
  }
  const n = path.length;
  if (n === 0) return obj;
  let nested = obj as any;
  /*
   * 中间层遍历：层级缺失时自动创建（下一段为数字 key 建数组，否则建对象）
   * 任一中间段为原型敏感键则整条路径放弃写入
   */
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

/** 自身属性且 SameValueZero 等值时跳过写入，语义对齐 lodash assignValue */
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
 * 字段路径归一化（toPath(p).join('.') 语义）。
 * 无 '[' 的路径 toPath(p).join('.') 恒等于 p 本身，直接返回（零分配）。
 */
export function normalizePathKey(path: unknown): string {
  if (typeof path === 'string') {
    if (path === '') return '';
    return path.indexOf('[') === -1 ? path : parseBracketPath(path).join('.');
  }
  if (Array.isArray(path)) return path.join('.');
  if (typeof path === 'number' || typeof path === 'boolean')
    return String(path);
  return ''; // undefined/null/symbol/对象 -> ''（优于 lodash 的 '[object Object]' 垃圾 key）
}

/**
 * 将路径字符串解析为段数组。
 *
 * 与 `normalizePathKey` 互补：本函数返回段数组形式，供需要嵌套路径数组的绑定场景
 * （如 ant-design-vue FormItem 的 `name` 数组语义：`['user','address','city']`）。
 * 非法语法（空段、未闭合括号、引号段）输出告警并给出确定性兜底；空字符串返回 `[]`。
 * 非字符串入参：数组按段取字符串、数字与布尔取单段、其余类型返回 `[]`；
 * 与 `normalizePathKey` 满足 `toPath(v).join('.') === normalizePathKey(v)`。
 * 返回值为模块级缓存中的同一数组实例且已冻结，调用方按只读使用。
 */
export function toPath(path: unknown): string[] {
  if (Array.isArray(path)) return path.map(String);
  if (typeof path === 'number' || typeof path === 'boolean')
    return [String(path)];
  if (typeof path !== 'string') return [];
  if (!path) return [];
  return cachedParse(path);
}
