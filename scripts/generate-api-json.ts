import fs from 'fs';
import path from 'path';

interface ApiItem {
  name: string;
  type: 'function' | 'type' | 'interface' | 'component' | 'hook' | 'constant';
  package: string;
  description: string;
  signature?: string;
  params?: Array<{
    name: string;
    type: string;
    optional: boolean;
    description: string;
  }>;
  returns?: string;
  typeParams?: Array<{ name: string; extends?: string; default?: string }>;
  examples?: string[];
}

interface ApiJson {
  generatedAt: string;
  packages: Record<string, ApiItem[]>;
}

function parseJSDoc(commentBlock: string): Partial<ApiItem> {
  const lines = commentBlock.split('\n');
  const description: string[] = [];
  const params: ApiItem['params'] = [];
  let returns = '';
  const typeParams: ApiItem['typeParams'] = [];
  const examples: string[] = [];

  let captureExample = false;
  let inCodeBlock = false;
  let exampleBuffer: string[] = [];

  for (const line of lines) {
    // 移除每行开头的 * 号和前后的空白
    let cleaned = line.replace(/^\s*\*\s?/, '').trim();

    // 清理掉首行 /** 或尾行 */ 等无用标签
    cleaned = cleaned.replace(/^\/\*\*|\*\/$/, '').trim();
    if (!cleaned && !captureExample) continue;

    if (captureExample) {
      if (cleaned.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          exampleBuffer.push(cleaned);
        } else {
          inCodeBlock = false;
          exampleBuffer.push(cleaned);
          examples.push(exampleBuffer.join('\n'));
          exampleBuffer = [];
          captureExample = false;
        }
      } else {
        exampleBuffer.push(cleaned);
      }
      continue;
    }

    if (cleaned.startsWith('@description')) {
      description.push(cleaned.replace('@description', '').trim());
    } else if (cleaned.startsWith('@param')) {
      const paramMatch = cleaned.match(
        /@param\s+\{([^}]+)\}\s+(\w+)\s*(?:-?\s*(.*))?/
      );
      if (paramMatch) {
        params.push({
          name: paramMatch[2],
          type: paramMatch[1],
          optional:
            paramMatch[1].endsWith('=') ||
            paramMatch[3]?.includes('optional') ||
            paramMatch[3]?.includes('可选'),
          description: paramMatch[3] || '',
        });
      }
    } else if (cleaned.startsWith('@returns')) {
      returns = cleaned.replace('@returns', '').trim();
    } else if (cleaned.startsWith('@template')) {
      const tplMatch = cleaned.match(
        /@template\s+(\w+)(?:\s*-\s*([^-]*))?(?:\s*extends\s+(\w+))?(?:\s*默认\s*(\w+))?/
      );
      if (tplMatch) {
        typeParams.push({
          name: tplMatch[1],
          extends: tplMatch[3],
          default: tplMatch[4],
        });
      }
    } else if (cleaned.startsWith('@example')) {
      captureExample = true;
    } else if (!cleaned.startsWith('@')) {
      description.push(cleaned);
    }
  }

  return {
    description: description.join('\n').trim(),
    params: params.length > 0 ? params : undefined,
    returns: returns || undefined,
    typeParams: typeParams.length > 0 ? typeParams : undefined,
    examples: examples.length > 0 ? examples : undefined,
  };
}

function getSignature(contentAfterJsdoc: string): string {
  const lines = contentAfterJsdoc.split('\n');
  const signatureLines: string[] = [];

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].trim();

    // 跳过空行（仅当还没有收集到有效内容时）
    if (!line && signatureLines.length === 0) continue;

    // 跳过工具注释行（eslint-disable、prettier-ignore 等）
    if (line.startsWith('//')) continue;

    // 如果已有内容时遇到新的 JSDoc 或空行，终止
    if (line.startsWith('/**') || (signatureLines.length > 0 && line === '')) {
      break;
    }

    signatureLines.push(lines[i]);

    // 如果该行包含终结符（分号、左大括号），说明声明主体在该行结束
    if (line.includes(';') || line.includes('{') || line.endsWith('}')) {
      break;
    }
  }

  let sig = signatureLines.join('\n').trim();
  // 格式微调：去除行尾多余的左大括号
  sig = sig.replace(/\s*\{\s*$/, '').trim();
  return sig;
}

function scanFile(filePath: string, pkgName: string): ApiItem[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  // 全局匹配所有的 JSDoc 注释
  const jsdocRegex = /\/\*\*([\s\S]*?)\*\//g;

  const items: ApiItem[] = [];

  // 如果遇到子包重导出 useFormData，则自动到 core 包的物理源文件中拉取其 JSDoc
  if (filePath.endsWith('hooks/index.ts')) {
    const reExportMatch = content.match(
      /export\s*\{\s*(useFormData)\s*\}\s*from/
    );
    if (reExportMatch) {
      const coreFilePath = path.resolve(
        __dirname,
        '../packages/core/src/form/useFormData.ts'
      );
      if (fs.existsSync(coreFilePath)) {
        // 使用当前子包的 pkgName 递归解析 core 物理源文件
        const coreItems = scanFile(coreFilePath, pkgName);
        items.push(...coreItems);
      }
    }
  }

  let match;

  while ((match = jsdocRegex.exec(content)) !== null) {
    const commentBlock = match[1];
    const jsdocEndIndex = jsdocRegex.lastIndex;

    // 仅提取标记了 @public 的 JSDoc 注释，未标记的视为内部实现，不录入 api.json
    if (!commentBlock.includes('@public')) continue;

    // 截取该 JSDoc 块结束后的所有后续内容
    const contentAfterJsdoc = content.substring(jsdocEndIndex);

    // 提取完整的多行代码声明签名
    let signature = getSignature(contentAfterJsdoc);
    if (!signature) continue;

    let name = '';
    let type: ApiItem['type'] = 'function';

    // 匹配 export function 或 async function
    const funcMatch = signature.match(
      /(?:export\s+)?(?:async\s+)?function\s+(\w+)/
    );
    // 匹配 export const
    const constMatch = signature.match(/(?:export\s+)?const\s+(\w+)/);
    // 匹配 export type
    const typeMatch = signature.match(/(?:export\s+)?type\s+(\w+)/);
    // 匹配 export interface
    const interfaceMatch = signature.match(/(?:export\s+)?interface\s+(\w+)/);

    if (funcMatch) {
      name = funcMatch[1];
      type = 'function';
    } else if (constMatch) {
      name = constMatch[1];
      // 全大写 + 下划线命名风格为常量
      if (/^[A-Z][A-Z0-9_]*$/.test(name)) {
        type = 'constant';
        // PascalCase 且签名中包含字面量赋值（= '...' 或 = 数字 或 = [），视为常量
      } else if (/^[A-Z]/.test(name) && /=\s*['"\d[]/.test(signature)) {
        type = 'constant';
        // PascalCase 其他情况为组件
      } else if (/^[A-Z]/.test(name)) {
        type = 'component';
      } else {
        type = 'function';
      }
    } else if (typeMatch) {
      name = typeMatch[1];
      type = 'type';
    } else if (interfaceMatch) {
      name = interfaceMatch[1];
      type = 'interface';
    }

    // 尝试提取 @component 等标签作为后备支持（仅用于 Vue SFC 场景）
    if (!name) {
      const componentTag = commentBlock.match(/@component\s+(\w+)/);
      if (componentTag) {
        name = componentTag[1];
        type = 'component';
        // Vue SFC 中 JSDoc 后紧跟的是 import 语句，用标签式签名代替
        signature = `<${name}>`;
      }
    }

    // 如果代码行匹配到了名字，但 JSDoc 中有 @component 标签，强制标记为 component
    if (name && commentBlock.includes('@component')) {
      type = 'component';
      // 如果 signature 是 import 语句开头，说明 is Vue SFC，用标签式签名
      if (signature.startsWith('import')) {
        signature = `<${name}>`;
      }
    }

    // 只有找到真实 API 标识名才予以录入
    if (!name) continue;

    // 格式化签名，确保暴露出来的签名符合导出的表现形式
    if (
      signature &&
      !signature.startsWith('export') &&
      !signature.startsWith('<')
    ) {
      signature = 'export ' + signature;
    }

    const parsed = parseJSDoc(commentBlock);
    if (parsed.description) {
      items.push({
        name,
        type,
        package: pkgName,
        signature,
        ...parsed,
      } as ApiItem);
    }
  }

  return items;
}

function scanPackage(pkgPath: string, pkgName: string): ApiItem[] {
  const items: ApiItem[] = [];
  const srcDir = path.join(pkgPath, 'src');

  function walkDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        walkDir(fullPath);
      } else if (
        (file.name.endsWith('.ts') && !file.name.endsWith('.d.ts')) ||
        file.name.endsWith('.vue')
      ) {
        const fileItems = scanFile(fullPath, pkgName);
        items.push(...fileItems);
      }
    }
  }

  walkDir(srcDir);
  return items;
}

function main() {
  const packagesDir = path.resolve(__dirname, '../packages');
  const targetPkg = process.argv[2];

  const packages = fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'core')
    .map(d => d.name);

  const result: ApiJson = {
    generatedAt: new Date().toISOString(),
    packages: {},
  };

  for (const pkg of packages) {
    if (targetPkg && pkg !== targetPkg) continue;

    const pkgJsonPath = path.join(packagesDir, pkg, 'package.json');
    if (!fs.existsSync(pkgJsonPath)) continue;
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    const pkgName = pkgJson.name;
    const apiItems = scanPackage(path.join(packagesDir, pkg), pkgName);
    result.packages[pkgName] = apiItems;

    const pkgApiJson = {
      generatedAt: result.generatedAt,
      name: pkgName,
      api: apiItems,
    };
    const pkgOutputPath = path.join(packagesDir, pkg, 'api.json');
    fs.writeFileSync(
      pkgOutputPath,
      JSON.stringify(pkgApiJson, null, 2),
      'utf-8'
    );
    console.log(`Package API JSON generated at: ${pkgOutputPath}`);
  }
}

main();
