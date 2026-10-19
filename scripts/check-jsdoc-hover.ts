#!/usr/bin/env node
/**
 * 注释悬浮覆盖核查
 *
 * @description 按编辑器的取数口径（TypeScript 语言服务的 documentation）统计各包 `src/**\/*.ts`
 * 导出符号的悬浮可见性，并检查含 script 块的 `.vue` 是否以 JSDoc 头块开头：
 * - `ok`：JSDoc 首行为自由文本摘要，悬浮可见；
 * - `tagOnly`：JSDoc 仅含标签（如 `/** @description x *\/`），悬浮主体为空；
 * - `missing`：无 JSDoc，悬浮为空。
 *
 * 用法：`npx tsx scripts/check-jsdoc-hover.ts [包名...]`（缺省为 `packages/` 下全部包）
 * 退出码：存在 `tagOnly` / `missing` / `.vue` 头块缺失时为 1。
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

/** 单包核查结果：`ok` 为悬浮可见的符号，其余三类为缺口 */
export type HoverAuditResult = {
  packageName: string;
  ok: string[];
  tagOnly: string[];
  missing: string[];
  vue: string[];
};

/*
 * 仓库根：脚本以 CLI 运行时由自身路径推导；被测试用例以模块方式引入（非 file 协议或非入口）时
 * 回退为自 cwd 向上查找 packages 目录
 */
const defaultRepoRoot = (): string => {
  const url = import.meta.url;
  if (url.startsWith('file:')) return fileURLToPath(new URL('..', url));
  let dir = globalThis.process.cwd();
  for (;;) {
    if (existsSync(join(dir, 'packages'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return globalThis.process.cwd();
    dir = parent;
  }
};

const listPackages = (repoRoot: string): string[] =>
  readdirSync(join(repoRoot, 'packages')).filter(name =>
    statSync(join(repoRoot, 'packages', name)).isDirectory()
  );

const listSourceFiles = (dir: string): string[] => {
  const out: string[] = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|vue)$/.test(entry.name)) out.push(full);
    }
  };
  walk(dir);
  return out;
};

/**
 * 统计单个包的悬浮覆盖情况
 *
 * @param packageName - `packages/` 下的包目录名
 * @param options - `repoRoot` 指定仓库根，缺省由脚本位置或 cwd 推导
 * @returns 悬浮可见符号与三类缺口清单
 */
export const auditPackage = (
  packageName: string,
  options: { repoRoot?: string } = {}
): HoverAuditResult => {
  const repoRoot = options.repoRoot ?? defaultRepoRoot();
  const packageRoot = join(repoRoot, 'packages', packageName);
  const sourceRoot = join(packageRoot, 'src');
  const files = listSourceFiles(sourceRoot);
  const tsFiles = files.filter(file => file.endsWith('.ts'));

  const program = ts.createProgram(tsFiles, {
    target: ts.ScriptTarget.ESNext,
    strict: false,
  });
  const checker = program.getTypeChecker();
  const result: HoverAuditResult = {
    packageName,
    ok: [],
    tagOnly: [],
    missing: [],
    vue: [],
  };

  for (const file of tsFiles) {
    const source = program.getSourceFile(file);
    if (!source) continue;
    const rel = relative(packageRoot, file);

    const visit = (node: ts.Node): void => {
      const modifiers = ts.canHaveModifiers(node)
        ? ts.getModifiers(node)
        : undefined;
      if (modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        const declarations: readonly ts.Node[] = ts.isVariableStatement(node)
          ? node.declarationList.declarations
          : [node];
        for (const declaration of declarations) {
          const named = declaration as ts.NamedDeclaration;
          const nameNode = named.name ?? (node as ts.NamedDeclaration).name;
          if (!nameNode) continue;
          const symbol = checker.getSymbolAtLocation(nameNode);
          if (!symbol) continue;
          const doc = ts
            .displayPartsToString(symbol.getDocumentationComment(checker))
            .trim();
          const tags = symbol.getJsDocTags(checker).map(tag => `@${tag.name}`);
          const line =
            source.getLineAndCharacterOfPosition(node.getStart(source)).line +
            1;
          const entry = `${rel}:${line} ${nameNode.getText(source)}`;
          if (doc) result.ok.push(entry);
          else if (tags.length)
            result.tagOnly.push(`${entry} [${tags.join(' ')}]`);
          else result.missing.push(entry);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }

  for (const file of files.filter(f => f.endsWith('.vue'))) {
    const content = readFileSync(file, 'utf8');
    const rel = relative(packageRoot, file);
    const scripts = [
      ...content.matchAll(
        /<script\b(?:"[^"]*"|'[^']*'|[^>"'])*>([\s\S]*?)<\/script>/g
      ),
    ];
    // 类型块与 setup 块并存的组件，头块 JSDoc 位于任一 script 块即算覆盖
    if (!scripts.length) continue;
    if (!scripts.some(script => script[1].trimStart().startsWith('/**')))
      result.vue.push(rel);
  }

  return result;
};

const format = (result: HoverAuditResult): string => {
  const lines = [
    `===== ${result.packageName} =====`,
    `悬浮可见（自由文本摘要）：${result.ok.length}`,
    `仅含标签（悬浮主体为空）：${result.tagOnly.length}`,
  ];
  if (result.tagOnly.length)
    lines.push(...result.tagOnly.map(e => `  ⚠️ ${e}`));
  lines.push(`无 JSDoc（悬浮为空）：${result.missing.length}`);
  if (result.missing.length)
    lines.push(...result.missing.map(e => `  ❌ ${e}`));
  lines.push(`无 JSDoc 头块的 .vue：${result.vue.length}`);
  if (result.vue.length) lines.push(...result.vue.map(e => `  ❌ ${e}`));
  return lines.join('\n');
};

const main = (): void => {
  const repoRoot = defaultRepoRoot();
  const targets = globalThis.process.argv.slice(2);
  const packages = targets.length ? targets : listPackages(repoRoot);
  let failed = false;
  let total = 0;
  for (const name of packages) {
    const result = auditPackage(name, { repoRoot });
    console.log(format(result));
    total += result.tagOnly.length + result.missing.length + result.vue.length;
    if (result.tagOnly.length || result.missing.length || result.vue.length) {
      failed = true;
    }
  }
  console.log(`\n[check-jsdoc-hover] 缺口合计 ${total}`);
  globalThis.process.exit(failed ? 1 : 0);
};

if (
  import.meta.url.startsWith('file:') &&
  globalThis.process.argv[1] !== undefined &&
  resolve(globalThis.process.argv[1]) === fileURLToPath(import.meta.url)
)
  main();
