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
