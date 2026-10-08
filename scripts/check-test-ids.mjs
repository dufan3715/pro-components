#!/usr/bin/env node
/**
 * 判别性用例编号卫兵：同一包内编号必须唯一
 *
 * @description 扫描 `packages/<pkg>/__tests__/**\/*.spec.ts` 中以 `编号:` 开头的字符串字面量
 * 与独立的编号字面量（覆盖 `it('编号: ...')` 与 `it.each` 参数表内 `id: '编号'` 等写法），
 * 同一编号出现在多个**不同行**即视为冲突（跨包同号用于同构用例，属预期，不做限制）。
 * 发现冲突时打印 编号 → 文件:行 清单并以非零码退出，供本地与 CI 门禁使用。
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PACKAGES_DIR = 'packages';
/*
 * 编号字面量的两种写法：
 * 1. `'编号: 用例名'` —— it / describe 的用例名；
 * 2. `'编号'` —— it.each 参数表内的 id 字段，要求带连字符或数字段为 2 位以上，
 *    以免把 `'X2'`、`'O2'` 这类普通字符串值误判为编号。
 */
const NAMED_PATTERN = /['"`]([A-Z]{1,6}(?:-[A-Za-z]{1,3})*-?\d+[a-z]?)\s*:/g;
const BARE_PATTERN =
  /['"`]([A-Z]{1,6}-[A-Za-z]{1,3}-?\d+[a-z]?|[A-Z]{1,6}\d{2,}[a-z]?)['"`]/g;

const collectSpecFiles = dir => {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectSpecFiles(full));
    else if (entry.name.endsWith('.spec.ts')) out.push(full);
  }
  return out;
};

const conflicts = [];

for (const pkg of readdirSync(PACKAGES_DIR, { withFileTypes: true })) {
  if (!pkg.isDirectory()) continue;
  const testsDir = join(PACKAGES_DIR, pkg.name, '__tests__');
  let files = [];
  try {
    files = collectSpecFiles(testsDir);
  } catch {
    continue;
  }

  const seen = new Map();
  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      const idsOnLine = [
        ...line.matchAll(NAMED_PATTERN),
        ...line.matchAll(BARE_PATTERN),
      ];
      for (const match of idsOnLine) {
        const id = match[1];
        const hits = seen.get(id) ?? [];
        const where = `${file}:${index + 1}`;
        if (!hits.includes(where)) hits.push(where);
        seen.set(id, hits);
      }
    });
  }

  for (const [id, hits] of seen) {
    // 同一行重复出现（如 it.each 表内用例名与其它引用同行）不算冲突，跨行才是
    if (hits.length > 1) conflicts.push({ pkg: pkg.name, id, hits });
  }
}

if (conflicts.length === 0) {
  console.log('[check-test-ids] 用例编号在同一包内唯一 ✓');
  globalThis.process.exit(0);
}

console.error('[check-test-ids] 同一包内存在重复的判别性用例编号：');
for (const { pkg, id, hits } of conflicts) {
  console.error(`  ${pkg} → ${id}`);
  for (const hit of hits) console.error(`      ${hit}`);
}
globalThis.process.exit(1);
