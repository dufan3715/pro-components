#!/usr/bin/env node

/**
 * @qin-ui/antdv-next-pro AI 上下文初始化 CLI 工具
 *
 * 在消费方项目中生成分层 AI 上下文文件，使 AI 工具能够：
 * 1. 理解 @qin-ui/antdv-next-pro 的 Schema 驱动架构
 * 2. 掌握属性透传规则（何时查阅 antdv-next 文档）
 * 3. 快速获取完整 API 参考和 antdv-next 查阅指南
 *
 * 用法:
 *   npx @qin-ui/antdv-next-pro init-ai
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
 * 包含：架构关系、透传规则、反模式、antdv-next 资源链接
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
    '## 📌 本地参考文件',
    '',
    '本规则文件提供了核心架构和用法指南。需要完整 API 参考时，请阅读以下文件：',
    '',
    `- **\`.agents/docs/${PKG_SHORT}-api.md\`** — 完整 API 文档（组件、Hooks、类型、Field 配置参考）`,
    `- **\`.agents/docs/antdv-next-reference.md\`** — antdv-next 底层组件查阅指南（llms 链接、常用 Props 速查）`,
    `- **\`node_modules/${PKG_NAME}/api.json\`** — 结构化 API 元数据（函数签名、类型定义）`,
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
    sections.push('## 📊 结构化 API 元数据（自动提取自源码 JSDoc）');
    sections.push('');

    for (const item of apiJson.api) {
      const typeLabel = {
        component: '🧩 组件',
        function: '🔧 函数/Hook',
        type: '📐 类型',
        interface: '📋 接口',
        constant: '📌 常量',
      }[item.type] || '📄';

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

/**
 * 生成 antdv-next 查阅指南（Reference 层）
 * 说明底层组件关系 + llms 资源 + 常用 Props 速查
 */
function getAntdvReferenceContent() {
  return [
    '# antdv-next 底层组件查阅指南',
    '',
    `> ${PKG_NAME} 基于 **antdv-next**（Vue 3 组件库，对齐 Ant Design 设计规范）封装。`,
    '> 所有在 Field 配置中编写的非保留属性，会经过 Grid→Col / FormItem→a-form-item 逐层剥离后，剩余属性透传给输入控件。',
    '',
    '---',
    '',
    '## 1. antdv-next 与 @qin-ui/antdv-next-pro 的关系',
    '',
    `${PKG_NAME} 是 **Schema 驱动渲染引擎**，antdv-next 是 **UI 组件实现**。`,
    `查阅底层组件 API 时，请使用 antdv-next 官方文档（见第 2 节），而非 ant-design-vue 文档。`,
    '',
    'Field 配置中的属性通过两阶段分流：',
    '',
    '**第一阶段（GroupedFieldAttrs）：**',
    '- 显式解构消费：path, fields, hidden, span, slots, formItemStyle/Class/Container 等',
    '- 剩余属性按 key 名匹配：',
    '  - 命中 antdv-next Col props → gridItemProps → `<a-col>`',
    '  - 命中 antdv-next FormItem props → formItemProps → `<a-form-item>`',
    '  - 其余 → componentProps → BaseField',
    '',
    '**第二阶段（BaseField）：**',
    '- 解构消费：valueFormatter, modelProp, componentStyle/Class/Container, slots',
    '- v-model 绑定消费：modelBindingProp + onUpdate 回调',
    '- 其余（包括 disabled）→ v-bind 到输入组件',
    '',
    `例如 \`{ path:'city', component:'select', label:'城市', span:8, placeholder:'选择', options:[...] }\`：`,
    `- span → 命中 Col props → \`<a-col :span="8">\``,
    `- label → 命中 FormItem props → \`<a-form-item label="城市">\``,
    `- placeholder, options → 均未命中 Col/FormItem props → BaseField → \`<a-select>\``,
    '',
    '**关键规则：编写 Field 属性前，务必查阅 antdv-next 文档确认属性的正确名称和所属组件。**',
    '',
    '---',
    '',
    '## 2. antdv-next 文档资源',
    '',
    '### 在线文档（AI 可直接 fetch）',
    '',
    '| 资源 | URL | 内容 |',
    '|:--|:--|:--|',
    '| llms.txt | https://antdv-next.com/llms.txt | 文档索引（轻量） |',
    '| llms-full-cn.txt | https://antdv-next.com/llms-full-cn.txt | **完整组件 API 文档（中文）** |',
    '| llms-semantic-cn.md | https://antdv-next.com/llms-semantic-cn.md | 组件语义化 DOM 结构 |',
    '',
    '### Agent Skills（推荐安装）',
    '',
    '```bash',
    'npx skills add antdv-next/skills',
    '```',
    '',
    '安装后 AI 获得三级按需加载能力：',
    '- Level 1 (~100 tokens): 始终加载的元数据',
    '- Level 2 (<5k tokens): 触发时加载的组件使用指南',
    '- Level 3 (按需): 完整组件 API 文档',
    '',
    '---',
    '',
    '## 3. 常用透传属性速查',
    '',
    '> ⚠️ 以下仅为高频使用的属性速查表，**并非完整列表**。',
    '> 完整属性列表请查阅 [llms-full-cn.txt](https://antdv-next.com/llms-full-cn.txt)。',
    '',
    '### Input 系列 (input / textarea / input-password / input-search)',
    '',
    '| 属性 | 类型 | 说明 |',
    '|:--|:--|:--|',
    '| placeholder | string | 占位文本 |',
    '| maxlength | number | 最大字符数 |',
    '| allowClear | boolean | 是否显示清除按钮 |',
    '| showCount | boolean | 是否显示字数统计 |',
    '| addonBefore | string\\|slot | 前置标签 |',
    '| addonAfter | string\\|slot | 后置标签 |',
    '| prefix | string\\|slot | 前缀图标 |',
    '| suffix | string\\|slot | 后缀图标 |',
    '',
    '### Select',
    '',
    '| 属性 | 类型 | 说明 |',
    '|:--|:--|:--|',
    '| options | {label,value}[] | 选项数据 |',
    '| mode | \'multiple\'\\|\'tags\' | 选择模式 |',
    '| showSearch | boolean | 是否支持搜索 |',
    '| filterOption | function | 自定义过滤逻辑 |',
    '| allowClear | boolean | 是否显示清除按钮 |',
    '| maxTagCount | number | 最多显示标签数 |',
    '| loading | boolean | 加载状态 |',
    '| bordered | boolean | 是否有边框 |',
    '',
    '### DatePicker / RangePicker',
    '',
    '| 属性 | 类型 | 说明 |',
    '|:--|:--|:--|',
    '| picker | \'date\'\\|\'week\'\\|\'month\'\\|\'year\' | 选择器类型 (DatePicker) |',
    '| format | string | 日期格式 |',
    '| valueFormat | string | 值格式 |',
    '| showTime | boolean\\|object | 是否显示时间选择 |',
    '| disabledDate | function | 禁用日期 |',
    '| allowClear | boolean | 是否显示清除按钮 |',
    '',
    '### InputNumber',
    '',
    '| 属性 | 类型 | 说明 |',
    '|:--|:--|:--|',
    '| min | number | 最小值 |',
    '| max | number | 最大值 |',
    '| step | number | 步长 |',
    '| precision | number | 小数精度 |',
    '| formatter | function | 格式化函数 |',
    '| parser | function | 解析函数 |',
    '',
    '### Switch',
    '',
    '| 属性 | 类型 | 说明 |',
    '|:--|:--|:--|',
    '| checkedChildren | string\\|slot | 选中时内容 |',
    '| unCheckedChildren | string\\|slot | 非选中时内容 |',
    '| loading | boolean | 加载状态 |',
    '| size | \'default\'\\|\'small\' | 尺寸 |',
    '',
    `> ⚠️ Switch 的 v-model 绑定属性是 \`checked\` 而非 \`value\`。`,
    `> **但 ${PKG_NAME} 的 ProComponentProvider 已为 switch 预设了 \`modelProp: 'checked'\`，因此 Field 中通常无需手动指定。**`,
    '',
    '### Cascader',
    '',
    '| 属性 | 类型 | 说明 |',
    '|:--|:--|:--|',
    '| options | CascaderOption[] | 级联选项 |',
    '| fieldNames | object | 自定义字段名 |',
    '| showSearch | boolean | 是否支持搜索 |',
    '| allowClear | boolean | 是否显示清除按钮 |',
    '| expandTrigger | \'click\'\\|\'hover\' | 展开触发方式 |',
    '',
    '### TreeSelect',
    '',
    '| 属性 | 类型 | 说明 |',
    '|:--|:--|:--|',
    '| treeData | TreeNode[] | 树形数据 |',
    '| showSearch | boolean | 是否支持搜索 |',
    '| allowClear | boolean | 是否显示清除按钮 |',
    '| treeCheckable | boolean | 是否显示复选框 |',
    '| fieldNames | object | 自定义字段名 |',
    '',
    '### RadioGroup / CheckboxGroup',
    '',
    '| 属性 | 类型 | 说明 |',
    '|:--|:--|:--|',
    '| options | {label,value}[] | 选项数据 |',
    '| direction | \'horizontal\'\\|\'vertical\' | 排列方向 (RadioGroup) |',
    '| buttonStyle | \'outline\'\\|\'solid\' | 按钮样式 (RadioGroup) |',
    '',
    '---',
    '',
    '## 4. ProTable Column 属性（继承 antdv-next ColumnType）',
    '',
    `${PKG_NAME} 的 Column 类型继承自 antdv-next 的 ColumnType，支持所有原生列属性：`,
    '',
    '| 常用属性 | 类型 | 说明 |',
    '|:--|:--|:--|',
    '| dataIndex | Path<D> | 列数据字段路径（类型安全） |',
    '| title | string | 列标题 |',
    '| width | number\\|string | 列宽 |',
    '| fixed | \'left\'\\|\'right\' | 固定列 |',
    '| align | \'left\'\\|\'center\'\\|\'right\' | 对齐方式 |',
    '| sorter | boolean\\|function | 排序 |',
    '| customRender | function | 自定义渲染（antdv-next 中取代 slots） |',
    '| hidden | boolean | 列显隐（@qin-ui 扩展属性） |',
    '',
    '> 更多属性查阅 [antdv-next Table 文档](https://antdv-next.com/llms-full-cn.txt)',
    '',
    '---',
    '',
    '## 5. 组件语义化 DOM 结构',
    '',
    'antdv-next 的每个组件都有明确的语义化 DOM 结构（如 `root`、`content`、`icon`、`popup` 等），',
    '方便通过 CSS class 或 componentVars 进行精准样式覆盖。',
    '',
    '完整语义描述查阅：[llms-semantic-cn.md](https://antdv-next.com/llms-semantic-cn.md)',
    '',
  ].join('\n');
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
        antdv-next-reference.md antdv-next 底层组件查阅指南

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
  console.log(dim(`   基于 antdv-next 的 Schema 驱动组件库`));
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

  // 3. 生成 antdv-next 查阅指南
  const refContent = getAntdvReferenceContent();
  writeFileWithLog(
    path.join(process.cwd(), '.agents/docs', 'antdv-next-reference.md'),
    refContent,
    '.agents/docs/antdv-next-reference.md'
  );
  console.log(dim('   → antdv-next 关系说明、llms 资源链接、常用透传属性速查'));
  console.log('');

  // 4. 完成提示
  console.log(green('✅ 完成！已生成分层 AI 上下文文件。'));
  console.log('');
  console.log(`${bold('📂 生成的文件:')}`);
  console.log(`   ${cyan('.agents/')}`);
  console.log(`   ├── ${cyan('rules/')}`);
  console.log(`   │   └── ${cyan(PKG_SHORT + '.md')}            ${dim('← 核心规则（AI 优先读取）')}`);
  console.log(`   └── ${cyan('docs/')}`);
  console.log(`       ├── ${cyan(PKG_SHORT + '-api.md')}        ${dim('← 完整 API 参考')}`);
  console.log(`       └── ${cyan('antdv-next-reference.md')} ${dim('← antdv-next 查阅指南')}`);
  console.log('');

  console.log(`${bold('🔄 建议的下一步:')}`);
  console.log(`   1. 提交 ${cyan('.agents/')} 目录到 Git 仓库，团队共享`);
  console.log(`   2. ${bold('安装 antdv-next Agent Skills')}（强烈推荐）：`);
  console.log(`      ${cyan('npx skills add antdv-next/skills')}`);
  console.log(`   3. ${dim('（可选）下载 antdv-next 完整文档到本地：')}`);
  console.log(`      ${dim('curl -o .agents/docs/antdv-next-full.txt https://antdv-next.com/llms-full-cn.txt')}`);
  console.log('');
}

main();
