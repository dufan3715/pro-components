#!/usr/bin/env node

/**
 * @qin-ui/* AI 上下文初始化 CLI 工具
 *
 * 遵循 Agentic Collaboration Standard (ACS)，
 * 在消费方项目中自动生成统一的 .agents 规范配置文件。
 *
 * 用法:
 *   npx @qin-ui/vant-pro init-ai
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

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;

// ==================== 内容生成 ====================

function getAiContextContent() {
  const filePath = path.join(PKG_ROOT, 'AI-CONTEXT.md');
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8').trim();
  }
  return `# ${PKG_NAME}\n\n> 基于 Vue 3 的配置驱动组件库。`;
}

function getUnifiedAgentContent() {
  const aiContext = getAiContextContent();
  const core = [
    aiContext,
    '',
    '## 完整 API 参考',
    '',
    `使用 \`${PKG_NAME}\` 时，请阅读以下文件获取完整的 API 定义、类型签名和使用示例：`,
    `- \`node_modules/${PKG_NAME}/README.md\` — 详细使用文档和代码示例`,
    `- \`node_modules/${PKG_NAME}/api.json\` — 结构化 API 元数据（组件、Hook、类型的签名和 JSDoc 示例）`,
    '',
  ].join('\n');

  // 包含兼容性的 Frontmatter（如 Cursor 支持的 globs 等）
  return [
    '---',
    `description: "${PKG_NAME} 组件库使用规范"`,
    'globs: ["**/*.vue", "**/*.ts", "**/*.tsx"]',
    'alwaysApply: false',
    '---',
    '',
    core,
  ].join('\n');
}

// ==================== 文件写入 ====================

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ==================== CLI 入口 ====================

function printHelp() {
  console.log(`
${bold(`${PKG_NAME} CLI`)}

${bold('用法:')}
  npx ${PKG_NAME} init-ai

${bold('命令:')}
  init-ai    在当前项目中生成统一的 .agents 规范配置文件

${bold('选项:')}
  --help     显示帮助信息

${bold('说明:')}
  该命令将采用统一的 Agentic 标准，在项目的 .agents/rules/ 目录下
  生成上下文文件。兼容支持读取 .agents 的主流 AI IDE 和 CLI 工具。
`);
}

function main() {
  const args = process.argv.slice(2);
  const subcommand = args.find((a) => !a.startsWith('-'));
  const flags = args.filter((a) => a.startsWith('-'));

  if (!subcommand || flags.includes('--help') || flags.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  if (subcommand !== 'init-ai') {
    console.error(red(`\n  未知命令: ${subcommand}\n`));
    printHelp();
    process.exit(1);
  }

  console.log('');
  console.log(bold(`📦 ${PKG_NAME} — AI 上下文初始化 (ACS 标准)`));
  console.log('');
  
  const content = getUnifiedAgentContent();
  const dirPath = '.agents/rules';
  const fileName = `${PKG_SHORT}.md`;
  
  const fullDir = path.join(process.cwd(), dirPath);
  const fullPath = path.join(fullDir, fileName);

  ensureDir(fullDir);
  fs.writeFileSync(fullPath, content, 'utf-8');

  const relPath = path.join(dirPath, fileName);
  console.log(`  ${green('✔')} ${cyan(relPath)}  ${green('[created/updated]')}`);

  console.log('');
  console.log(green('✅ 完成！已生成统一标准规则文件。'));
  console.log('');
  console.log(`${bold('下一步:')}`);
  console.log(
    `  将 ${cyan(dirPath)} 目录提交到 Git，团队即可自动享受 AI 增强\n`
  );
}

main();
