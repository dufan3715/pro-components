#!/usr/bin/env node
/**
 * 判别性用例编号卫兵：同一包内编号必须唯一
 *
 * @description 扫描 `packages/<pkg>/__tests__/**\/*.spec.ts` 中 `it('编号: ...')` 形式的编号，
 * 同一包内出现重复编号即视为冲突（跨包同号用于同构用例，属预期，不做限制）。
 * 发现冲突时打印 编号 → 文件:行 清单并以非零码退出，供本地与 CI 门禁使用。
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PACKAGES_DIR = 'packages';
const ID_PATTERN =
  /\bit\(\s*['"`]([A-Z]{1,6}(?:-[A-Za-z]{1,3})*-?\d+[a-z]?)\b/g;

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
      for (const match of line.matchAll(ID_PATTERN)) {
        const id = match[1];
        const hits = seen.get(id) ?? [];
        hits.push(`${file}:${index + 1}`);
        seen.set(id, hits);
      }
    });
  }

  for (const [id, hits] of seen) {
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
