import { isReadonly, isRef, toRaw } from 'vue';

/** ref 键的写入策略：`all` 移除任意 ref 后写普通值，`readonly` 仅移除只读 ref */
export type RefWriteStrategy = 'all' | 'readonly';

/**
 * 就地写入对象属性
 *
 * @description 目标键为 ref 且来源值不是 ref 时按 `refStrategy` 处理：
 * `all` 移除该键后写入普通值，`readonly` 仅对只读 ref 移除后写入；
 * `removeMissing` 为 true 时移除来源未包含的键；写入保留目标对象身份。
 * @internal
 * @param target - 被写入对象（可为响应式对象）
 * @param source - 新属性
 * @param removeMissing - 是否移除来源未包含的键
 * @param refStrategy - ref 键的处理策略，默认 `all`
 */
export function writeObjectProps<T extends object>(
  target: T,
  source: Partial<T>,
  removeMissing = false,
  refStrategy: RefWriteStrategy = 'all'
): void {
  for (const key of Object.keys(target)) {
    if (removeMissing && !(key in source)) {
      delete (target as Record<string, any>)[key];
    }
  }
  for (const key of Object.keys(source)) {
    const current = (toRaw(target) as Record<string, any>)[key];
    if (
      isRef(current) &&
      !isRef((source as Record<string, any>)[key]) &&
      (refStrategy === 'all' || isReadonly(current))
    ) {
      delete (target as Record<string, any>)[key];
    }
    (target as Record<string, any>)[key] = (source as Record<string, any>)[key];
  }
}

/**
 * 匹配快照：目标所在的数组（组）与其在组内的索引。
 * @internal
 */
export interface GroupMatch<T = any> {
  group: T[];
  index: number;
}

/**
 * 将匹配快照按所属数组分组，组内按索引降序执行操作，
 * 高位变更不影响低位索引。
 *
 * 注意：分组必须按数组引用（group）而不是父对象身份——
 * BFS 中每个顶层条目的虚拟根包装对象都是新分配的。
 * @internal
 */
export function applyByGroupDesc<T extends GroupMatch>(
  matches: T[],
  apply: (match: T) => void
): void {
  if (matches.length === 0) return;
  const groupMap = new Map<any[], T[]>();
  for (const match of matches) {
    let list = groupMap.get(match.group);
    if (!list) {
      list = [];
      groupMap.set(match.group, list);
    }
    list.push(match);
  }
  for (const list of groupMap.values()) {
    list.sort((a, b) => b.index - a.index);
    for (const match of list) apply(match);
  }
}
