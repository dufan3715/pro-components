import fs from 'fs';
import path from 'path';

/**
 * 各高阶包 init-ai CLI 的差异化配置。
 * init-ai.mjs 的 98.5% 逻辑共享，仅以下静态文案随包不同，生成时注入。
 */
const pkgConfig: Record<
  string,
  { uiLibDesc: string; docLibName: string; docUrl: string; skillDesc: string }
> = {
  'antd-vue-pro': {
    uiLibDesc: '基于 ant-design-vue 的 Schema 驱动组件库',
    docLibName: 'ant-design-vue',
    docUrl: 'https://antdv.com',
    skillDesc: 'Field/Column 配置',
  },
  'antdv-next-pro': {
    uiLibDesc: '基于 antdv-next 的 Schema 驱动组件库',
    docLibName: 'antdv-next',
    docUrl: 'https://antdv-next.com',
    skillDesc: 'Field/Column 配置',
  },
  'element-plus-pro': {
    uiLibDesc: '基于 element-plus 的 Schema 驱动组件库',
    docLibName: 'element-plus',
    docUrl: 'https://element-plus.org',
    skillDesc: 'Field/Column 配置',
  },
  'vant-pro': {
    uiLibDesc: '基于 vant v4 的 Schema 驱动移动端表单组件库',
    docLibName: 'vant',
    docUrl: 'https://vant-ui.com',
    skillDesc: 'Field 配置',
  },
};

function main() {
  const templatePath = path.resolve(__dirname, 'init-ai.template.mjs');
  const packagesDir = path.resolve(__dirname, '../packages');
  const targetPkg = process.argv[2];

  if (!fs.existsSync(templatePath)) {
    console.error(`Template not found: ${templatePath}`);
    process.exit(1);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const packages = fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'core')
    .map(d => d.name);

  for (const pkg of packages) {
    if (targetPkg && pkg !== targetPkg) continue;

    const config = pkgConfig[pkg];
    if (!config) {
      console.warn(`No config for package: ${pkg}, skip.`);
      continue;
    }

    const pkgJsonPath = path.join(packagesDir, pkg, 'package.json');
    if (!fs.existsSync(pkgJsonPath)) continue;
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    const pkgName = pkgJson.name;

    // 占位符替换（用 split/join 避免 RegExp 特殊字符问题）
    const output = template
      .split('{{PKG_NAME}}')
      .join(pkgName)
      .split('{{UI_LIB_DESC}}')
      .join(config.uiLibDesc)
      .split('{{DOC_LIB_NAME}}')
      .join(config.docLibName)
      .split('{{DOC_URL}}')
      .join(config.docUrl)
      .split('{{SKILL_DESC}}')
      .join(config.skillDesc);

    const binDir = path.join(packagesDir, pkg, 'bin');
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
    }
    const outputPath = path.join(binDir, 'init-ai.mjs');
    fs.writeFileSync(outputPath, output, 'utf-8');
    console.log(`init-ai CLI generated at: ${outputPath}`);
  }
}

main();
