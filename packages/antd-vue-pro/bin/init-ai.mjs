#!/usr/bin/env node

/**
 * @qin-ui/antd-vue-pro AI 上下文初始化 CLI 工具
 *
 * 在消费方项目中生成分层 AI 上下文文件，使 AI 工具能够：
 * 1. 理解 @qin-ui/antd-vue-pro 的 Schema 驱动架构
 * 2. 掌握属性透传规则（何时查阅 ant-design-vue 文档）
 * 3. 快速获取完整 API 参考
 *
 * 用法:
 *   npx @qin-ui/antd-vue-pro init-ai
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
  return readPackageFile('AI-CONTEXT.md') || `# ${PKG_NAME}\n\n> 基于 Vue 3 的配置驱动组件库。`;
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

// ==================== 内容生成 ====================

/**
 * 生成 rules 文件内容（Instructions 层）
 * 包含：架构关系、透传规则、反模式、ant-design-vue 资源链接
 */
function getRulesContent() {
  const aiContext = getAiContextContent();

  return [
    '---',
    `description: "${PKG_NAME} 组件库使用规范 — Schema 驱动、属性透传规则"`,
    'globs: ["**/*.vue", "**/*.ts", "**/*.tsx"]',
    'alwaysApply: false',
    '---',
    '',
    aiContext,
    '',
    '---',
    '',
    '## 本地参考文件',
    '',
    '本规则文件提供了核心架构和用法指南。需要完整 API 参考或底层组件文档时，请阅读以下资源：',
    '',
    `- **\`.agents/docs/${PKG_SHORT}-api.md\`** — 完整 API 文档（组件、Hooks、类型、Field 配置参考）`,
    `- **\`node_modules/${PKG_NAME}/api.json\`** — 结构化 API 元数据（函数签名、类型定义）`,
    '',
    '## 底层组件文档',
    '',
    `${PKG_NAME} 基于 **ant-design-vue**（v4，\`a-\` 前缀）封装。编写 Field 中的输入控件属性前，请查阅 ant-design-vue 官方文档确认属性名和类型：`,
    '',
    '- **[ant-design-vue 官方文档](https://antdv.com)** — 组件 API 参考（中文）',
    '',
  ].join('\n');
}

/**
 * 生成 API 文档内容（Resources 层）
 * 从 README.md + api.json 合并提取完整 API 参考
 */
function getApiDocContent() {
  const readme = getReadmeContent();
  const apiJson = getApiJsonContent();

  const sections = [];

  sections.push(`# ${PKG_NAME} — 完整 API 参考`, '');
  sections.push(`> 自动生成自 README.md 和 api.json。版本: ${PKG_JSON.version}`, '');

  // README 内容（已包含完整的使用文档）
  if (readme) {
    sections.push(readme);
    sections.push('');
  }

  // 结构化 API 元数据
  if (apiJson && apiJson.api && apiJson.api.length > 0) {
    sections.push('---');
    sections.push('');
    sections.push('## 结构化 API 元数据（自动提取自源码 JSDoc）');
    sections.push('');

    for (const item of apiJson.api) {
      const typeLabel = {
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
          sections.push(`| \`${p.name}\` | \`${p.type}\` | ${p.optional ? '是' : '否'} | ${p.description} |`);
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

// ==================== 文件写入 ====================

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

// ==================== CLI 入口 ====================

function printHelp() {
  console.log(`
${bold(`${PKG_NAME} CLI — AI 上下文初始化`)}

${bold('用法:')}
  npx ${PKG_NAME} init-ai

${bold('说明:')}
  在项目中生成分层 AI 上下文文件，使 AI 工具能够深度理解和规范使用 ${PKG_NAME}。

  生成的文件结构：
    .agents/
      rules/
        ${PKG_SHORT}.md         规则文件（架构、透传规则、反模式）
      docs/
        ${PKG_SHORT}-api.md     API 参考（完整文档 + 结构化元数据）

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
  console.log(bold(`📦 ${PKG_NAME} — AI 上下文初始化 v${PKG_JSON.version}`));
  console.log(dim(`   基于 ant-design-vue 的 Schema 驱动组件库`));
  console.log('');

  // 1. 生成 Rules 文件
  console.log(bold('📋 规则层 (Rules)'));
  const rulesContent = getRulesContent();
  writeFileWithLog(
    path.join(process.cwd(), '.agents/rules', `${PKG_SHORT}.md`),
    rulesContent,
    `.agents/rules/${PKG_SHORT}.md`
  );
  console.log(dim('   → 架构概览、属性透传决策树、渐进用法、反模式'));
  console.log('');

  // 2. 生成 API 文档
  console.log(bold('📖 参考层 (Docs)'));
  const apiDocContent = getApiDocContent();
  writeFileWithLog(
    path.join(process.cwd(), '.agents/docs', `${PKG_SHORT}-api.md`),
    apiDocContent,
    `.agents/docs/${PKG_SHORT}-api.md`
  );
  console.log(dim('   → 完整 README 文档 + 结构化 API 元数据'));
  console.log('');

  // 3. 完成提示
  console.log(green('✅ 完成！已生成分层 AI 上下文文件。'));
  console.log('');
  console.log(`${bold('📂 生成的文件:')}`);
  console.log(`   ${cyan('.agents/')}`);
  console.log(`   ├── ${cyan('rules/')}`);
  console.log(`   │   └── ${cyan(PKG_SHORT + '.md')}            ${dim('← 核心规则（AI 优先读取）')}`);
  console.log(`   └── ${cyan('docs/')}`);
  console.log(`       └── ${cyan(PKG_SHORT + '-api.md')}        ${dim('← 完整 API 参考')}`);
  console.log('');

  console.log(`${bold('🔄 建议的下一步:')}`);
  console.log(`   1. 提交 ${cyan('.agents/')} 目录到 Git 仓库，团队共享`);
  console.log(`   2. 编写 Field 配置中的输入控件属性前，查阅 ant-design-vue 官方文档：`);
  console.log(`      ${cyan('https://antdv.com')}`);
  console.log(`   3. ${dim('（可选）查看完整 API 参考：')}`);
  console.log(`      ${dim(`cat .agents/docs/${PKG_SHORT}-api.md`)}`);
  console.log('');
}

main();
