import { toRaw } from 'vue';
import { resolveFieldIdentity, toPath } from '../../../shared/core';

const fieldKeyMap = new WeakMap<object, number>();
let fieldKeySeed = 0;

/** 数据行对象身份编号 */
const rowKeyMap = new WeakMap<object, number>();
let rowKeySeed = 0;

const getRowKey = (row: object) => {
  const raw = toRaw(row);
  let key = rowKeyMap.get(raw);
  if (key === undefined) {
    key = ++rowKeySeed;
    rowKeyMap.set(raw, key);
  }
  return key;
};

/** 数组下标段判定：仅十进制非负整数段按数组下标处理 */
const isIndexSegment = (segment: string) => /^(?:0|[1-9]\d*)$/.test(segment);

/**
 * 字段渲染 key
 *
 * @description 以 `toRaw(field)` 为键在模块级 WeakMap 中缓存自增编号，同一字段对象恒得同一 key：
 * key 与字段在数组中的位置解耦，字段插入 / 删除 / 重排 / 过滤后仍与对象绑定；同 `path` 的兄弟字段各得其唯一 key。
 * 非对象项无对象身份，按字面量生成稳定 key；渲染路径传入的字段项已由调用方过滤为非 null 对象，
 * 该分支供本模块的直接调用者使用
 *
 * @param field - 字段配置项
 * @returns 字段渲染 key
 */
export const getFieldKey = (field: unknown): string | number => {
  if (field === null || typeof field !== 'object')
    return `raw_${String(field)}`;
  const raw = toRaw(field);
  let key = fieldKeyMap.get(raw);
  if (key === undefined) {
    key = ++fieldKeySeed;
    fieldKeyMap.set(raw, key);
  }
  return key;
};

/**
 * 字段的数据行渲染 key
 *
 * @description 沿字段路径逐段解析原始表单数据，取路径经过的对象数组行元素身份与行内剩余路径组成 key；
 * 同一数据行对象在数组增删 / 重排后恒得同一 key。路径不经过对象数组行、行元素为原始值或数据缺失时，
 * 回退到 {@link getFieldKey} 的字段对象身份。同 key 的去重由调用方按兄弟列表收敛。
 *
 * @param field - 字段配置项
 * @param rawFormData - 原始表单数据（非响应式对象）
 * @returns 数据行 key；无法定位数据行时返回字段对象身份 key
 */
export const getFieldDataKey = (
  field: unknown,
  rawFormData: unknown
): string | number => {
  const path = resolveFieldIdentity(field);
  if (!path || rawFormData === null || rawFormData === undefined) {
    return getFieldKey(field);
  }

  const segments = toPath(path);
  let node: any = rawFormData;
  const rowIds: number[] = [];
  let lastRowIndex = -1;

  for (let i = 0; i < segments.length; i++) {
    if (Array.isArray(node)) {
      const segment = segments[i];
      if (!isIndexSegment(segment)) break;
      const element = node[Number(segment)];
      if (element === null || typeof element !== 'object') break;
      rowIds.push(getRowKey(toRaw(element) as object));
      lastRowIndex = i;
      node = element;
      continue;
    }
    if (node === null || typeof node !== 'object') break;
    node = node[segments[i]];
  }

  if (lastRowIndex === -1) return getFieldKey(field);
  const rest = segments.slice(lastRowIndex + 1).join('.');
  return `data:${rowIds.join('/')}:${rest}`;
};
