import { toRaw } from 'vue';

const fieldKeyMap = new WeakMap<object, number>();
let fieldKeySeed = 0;

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
