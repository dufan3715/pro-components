#!/usr/bin/env node
/* global process -- Node.js CLI 脚本 */

/**
 * {{PKG_NAME}} AI 上下文初始化 CLI 工具
 *
 * 在消费方项目中生成双载体 AI 上下文：
 * 1. 根目录 AGENTS.md -- 核心使用规则，跨工具自动注入（主载体）
 * 2. .agents/skills/{pkg}/SKILL.md + references/ -- 分层参考文档，支持 skills 发现的工具按需逐层调取（参考载体）
 *
 * 用法:
 *   npx {{PKG_NAME}} init-ai
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ==================== 常量 ====================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PKG_ROOT = path.resolve(__dirname, '..');

const PKG_JSON = JSON.parse(
  fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf-8')
);
const PKG_NAME = PKG_JSON.name;
const PKG_SHORT = PKG_NAME.replace(/^@qin-ui\//, '');

// AGENTS.md 智能合并区块标记（支持多库共存，幂等更新）
const BEGIN_MARKER = `<!-- BEGIN ${PKG_NAME} -->`;
const END_MARKER = `<!-- END ${PKG_NAME} -->`;

// ==================== 终端颜色 ====================

const green = s => `\x1b[32m${s}\x1b[0m`;
const cyan = s => `\x1b[36m${s}\x1b[0m`;
const bold = s => `\x1b[1m${s}\x1b[0m`;
const yellow = s => `\x1b[33m${s}\x1b[0m`;
const dim = s => `\x1b[2m${s}\x1b[0m`;

// ==================== 内容读取 ====================

function readPackageFile(filename) {
  const filePath = path.join(PKG_ROOT, filename);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8').trim();
  }
  return null;
}

function getAiContextContent() {
  return (
    readPackageFile('AI-CONTEXT.md') ||
    `# ${PKG_NAME}\n\n> 基于 Vue 3 的配置驱动组件库。`
  );
}

function getReadmeContent() {
  return readPackageFile('README.md') || '';
}

function getApiJsonContent() {
  try {
    const raw = readPackageFile('api.json');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ==================== 工具函数 ====================

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeFileWithLog(filePath, content, label) {
  const dir = path.dirname(filePath);
  ensureDir(dir);
  const existed = fs.existsSync(filePath);
  fs.writeFileSync(filePath, content, 'utf-8');
  const status = existed ? yellow('[更新]') : green('[创建]');
  console.log(`  ${status} ${cyan(label)}`);
}

// ==================== AGENTS.md（主载体，自动注入）====================

/**
 * 生成 AGENTS.md 区块内容
 * = AI-CONTEXT.md 全文（核心使用规则，AI 必然读到）
 */
function getAgentsBlock() {
  return getAiContextContent();
}

/**
 * 智能合并 AGENTS.md：
 * - 文件不存在 -> 创建，内容 = 标记区块
 * - 已有本库区块 -> 幂等替换区块内容（支持升级后更新）
 * - 已有其他内容但无本库区块 -> 末尾追加区块（多库共存不冲突）
 */
function writeAgentsMd(cwd) {
  const agentsPath = path.join(cwd, 'AGENTS.md');
  const blockContent = getAgentsBlock();
  const newBlock = `${BEGIN_MARKER}\n${blockContent}\n${END_MARKER}`;

  let existing = '';
  if (fs.existsSync(agentsPath)) {
    existing = fs.readFileSync(agentsPath, 'utf-8');
  }

  let result;
  const hasBlock =
    existing.includes(BEGIN_MARKER) && existing.includes(END_MARKER);

  if (hasBlock) {
    // 幂等替换已有区块
    const blockRegex = new RegExp(
      `${escapeRegExp(BEGIN_MARKER)}[\\s\\S]*?${escapeRegExp(END_MARKER)}`,
      'g'
    );
    result = existing.replace(blockRegex, newBlock);
  } else if (existing.trim()) {
    // 已有其他内容，追加区块
    result = `${existing.trimEnd()}\n\n${newBlock}\n`;
  } else {
    // 文件不存在或空
    result = `${newBlock}\n`;
  }

  const existed = fs.existsSync(agentsPath);
  fs.writeFileSync(agentsPath, result, 'utf-8');
  const status = existed ? yellow('[更新]') : green('[创建]');
  console.log(`  ${status} ${cyan('AGENTS.md')}`);
}

// ==================== Skills（参考载体，按需调取）====================

/**
 * 生成 SKILL.md 内容
 * = skill frontmatter + AI-CONTEXT.md 速查内容 + references 导航
 * 供支持 skills 发现的工具按需调取，精准定位后查阅 references
 */
function getSkillMainContent() {
  const aiContext = getAiContextContent();
  const sections = [];

  // skill frontmatter
  sections.push('---');
  sections.push(`name: ${PKG_SHORT}`);
  sections.push(
    `description: ${PKG_NAME} 使用指南 - 组件、Hooks、类型、{{SKILL_DESC}}。Schema 驱动的配置式组件库。当需要组件映射、默认预设、属性透传规则或完整用法时按需调取。`
  );
  sections.push('---');
  sections.push('');

  // AI-CONTEXT.md 速查内容（与 AGENTS.md 主载体同源，确保一致）
  sections.push(aiContext);
  sections.push('');

  // references 导航
  sections.push('---');
  sections.push('');
  sections.push('## 参考文档');
  sections.push('');
  sections.push(
    `以下文件位于 \`.agents/skills/${PKG_SHORT}/references/\`，可在需要精确细节时进一步查阅：`
  );
  sections.push('');
  sections.push(
    `- [references/README.md](references/README.md) — 完整使用文档与进阶示例`
  );
  sections.push(
    `- [references/api.md](references/api.md) — 结构化 API 元数据（函数签名、参数类型、返回值，提取自源码 JSDoc）`
  );
  sections.push(`- 底层组件属性查阅 {{DOC_LIB_NAME}} 官方文档：{{DOC_URL}}`);
  sections.push('');

  return sections.join('\n');
}

/**
 * 生成 references/api.md 内容（结构化 API 元数据 + skill frontmatter）
 * 从 api.json 提取 @public 标记的 JSDoc，含签名、参数、返回值、示例
 */
function getSkillApiContent() {
  const apiJson = getApiJsonContent();
  const sections = [];

  // skill frontmatter
  sections.push('---');
  sections.push(`name: ${PKG_SHORT}-api`);
  sections.push(
    `description: ${PKG_NAME} 结构化 API 元数据 - 函数签名、参数类型、返回值、示例。从源码 JSDoc（@public 标记）自动提取。`
  );
  sections.push('---');
  sections.push('');

  sections.push(`# ${PKG_NAME} - 结构化 API 元数据`, '');
  sections.push(
    `> 自动提取自源码 JSDoc（\`@public\` 标记）。版本: ${PKG_JSON.version}`,
    ''
  );

  // 结构化 API 元数据
  if (apiJson && apiJson.api && apiJson.api.length > 0) {
    for (const item of apiJson.api) {
      const typeLabel =
        {
          component: '组件',
          function: '函数/Hook',
          type: '类型',
          interface: '接口',
          constant: '常量',
        }[item.type] || '';

      sections.push(`### ${typeLabel} \`${item.name}\``);
      sections.push('');
      sections.push(`**类型:** ${item.type}`);
      if (item.signature) {
        sections.push('');
        sections.push('```typescript');
        sections.push(item.signature);
        sections.push('```');
      }
      if (item.description) {
        sections.push('');
        sections.push(item.description);
      }

      if (item.typeParams && item.typeParams.length > 0) {
        sections.push('');
        sections.push('**泛型参数:**');
        for (const tp of item.typeParams) {
          const extras = [];
          if (tp.extends) extras.push(`extends ${tp.extends}`);
          if (tp.default) extras.push(`默认 ${tp.default}`);
          const extra = extras.length ? ` (${extras.join(', ')})` : '';
          sections.push(`- \`${tp.name}\`${extra}`);
        }
      }

      if (item.params && item.params.length > 0) {
        sections.push('');
        sections.push('**参数:**');
        sections.push('');
        sections.push('| 参数名 | 类型 | 可选 | 描述 |');
        sections.push('| :--- | :--- | :--- | :--- |');
        for (const p of item.params) {
          sections.push(
            `| \`${p.name}\` | \`${p.type}\` | ${p.optional ? '是' : '否'} | ${p.description} |`
          );
        }
      }

      if (item.returns) {
        sections.push('');
        sections.push(`**返回值:** ${item.returns}`);
      }

      if (item.examples && item.examples.length > 0) {
        sections.push('');
        sections.push('**示例:**');
        for (const ex of item.examples) {
          sections.push('');
          sections.push(ex);
        }
      }

      sections.push('');
      sections.push('---');
      sections.push('');
    }
  }

  return sections.join('\n');
}

// ==================== CLI 入口 ====================

function printHelp() {
  console.log(`
${bold(`${PKG_NAME} CLI - AI 上下文初始化`)}

${bold('用法:')}
  npx ${PKG_NAME} init-ai

${bold('说明:')}
  在项目中生成双载体 AI 上下文，使 AI 工具能够深度理解和规范使用 ${PKG_NAME}。

  生成的文件结构：
    AGENTS.md                          核心使用规则（跨工具自动注入）
    .agents/
      skills/
        ${PKG_SHORT}/
          SKILL.md                     skills 入口（速查 + 导航）
          references/
            README.md                  完整使用文档
            api.md                     结构化 API 元数据

  ${dim('AGENTS.md 是跨工具开放约定，Codex / Claude Code / Cursor 等会话时自动注入。')}
  ${dim('.agents/skills/ 供支持 skills 发现的工具按需逐层调取。')}

${bold('选项:')}
  --help     显示帮助信息
`);
}

function main() {
  const args = process.argv.slice(2);
  const subcommand = args.find(a => !a.startsWith('-'));
  const flags = args.filter(a => a.startsWith('-'));

  if (!subcommand || flags.includes('--help') || flags.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  if (subcommand !== 'init-ai') {
    console.error(`\n  ❌ 未知命令: ${subcommand}\n`);
    printHelp();
    process.exit(1);
  }

  console.log('');
  console.log(bold(`📦 ${PKG_NAME} - AI 上下文初始化 v${PKG_JSON.version}`));
  console.log(dim(`   {{UI_LIB_DESC}}`));
  console.log('');

  // 1. 生成 AGENTS.md（主载体）
  console.log(bold('📋 主载体：AGENTS.md（自动注入）'));
  writeAgentsMd(process.cwd());
  console.log(
    dim('   -> 核心使用规则，Codex/Claude Code/Cursor 等会话自动加载')
  );
  console.log('');

  // 2. 生成 Skills（标准结构：SKILL.md + references/）
  console.log(bold('📖 参考载体：.agents/skills/（按需调取）'));
  const skillDir = path.join(process.cwd(), '.agents/skills', PKG_SHORT);
  const skillRefsDir = path.join(skillDir, 'references');

  // SKILL.md（入口：frontmatter + 速查内容 + 参考导航）
  writeFileWithLog(
    path.join(skillDir, 'SKILL.md'),
    getSkillMainContent(),
    `.agents/skills/${PKG_SHORT}/SKILL.md`
  );

  // references/README.md（完整使用文档）
  const readme = getReadmeContent();
  if (readme) {
    writeFileWithLog(
      path.join(skillRefsDir, 'README.md'),
      readme,
      `.agents/skills/${PKG_SHORT}/references/README.md`
    );
  }

  // references/api.md（结构化 API 元数据）
  const apiJson = getApiJsonContent();
  if (apiJson && apiJson.api && apiJson.api.length > 0) {
    writeFileWithLog(
      path.join(skillRefsDir, 'api.md'),
      getSkillApiContent(),
      `.agents/skills/${PKG_SHORT}/references/api.md`
    );
  }

  console.log(
    dim('   -> SKILL.md 入口 + references/ 完整文档，skills 工具按需逐层调取')
  );
  console.log('');

  // 3. 完成提示
  console.log(green('✅ 完成！已生成双载体 AI 上下文文件。'));
  console.log('');
  console.log(`${bold('📂 生成的文件:')}`);
  console.log(
    `   ${cyan('AGENTS.md')}                          ${dim('← 核心规则（AI 自动读取）')}`
  );
  console.log(`   ${cyan('.agents/skills/' + PKG_SHORT + '/')}`);
  console.log(
    `       ├── ${cyan('SKILL.md')}                    ${dim('← skills 入口（速查 + 导航）')}`
  );
  console.log(`       └── ${cyan('references/')}`);
  console.log(
    `             ├── ${cyan('README.md')}              ${dim('← 完整使用文档')}`
  );
  if (apiJson && apiJson.api && apiJson.api.length > 0) {
    console.log(
      `             └── ${cyan('api.md')}                ${dim('← 结构化 API 元数据')}`
    );
  }
  console.log('');
  console.log(`${bold('🔄 说明:')}`);
  console.log(
    `   - AGENTS.md 已用标记区块写入，重复执行 init-ai 可安全更新（不破坏其他库的指令）`
  );
  console.log(
    `   - 编写 Field 中输入控件属性前，查阅 {{DOC_LIB_NAME}} 官方文档：${cyan('{{DOC_URL}}')}`
  );
  console.log('');
}

main();
