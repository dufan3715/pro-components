import { toRaw } from 'vue';

const fieldKeyMap = new WeakMap<object, number>();
let fieldKeySeed = 0;

/**
 * 字段渲染 key
 *
 * @description 以 `toRaw(field)` 为键在模块级 WeakMap 中缓存自增编号，同一字段对象恒得同一 key，
 * 与字段 `path` 无关（同 path 的兄弟字段仍各得其唯一 key）；非对象项无对象身份，按字面量生成稳定 key
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
