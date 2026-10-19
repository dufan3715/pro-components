/**
 * 注释规范契约回归 —— 锁定适配层注释与公开 JSDoc 的行为陈述口径
 *
 * @description
 * 断言两类事实：CR-090 余项涉及的适配层注释已改为行为陈述，实现手段与动机表述不再回流；
 * ProTable / SearchForm 的公开 JSDoc 与同构包 antd-vue-pro 保持同句（插槽作用域按本包实际如实标注）。
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { auditPackage } from '../../../scripts/check-jsdoc-hover';
import { resolve } from 'node:path';

const read = (path: string) => readFileSync(resolve(__dirname, path), 'utf-8');

const readme = read('../README.md');
const aiContext = read('../AI-CONTEXT.md');
const docsProTable = read(
  '../../../docs/element-plus-pro/components/pro-table/index.md'
);
const providerTypes = read(
  '../src/components/component-provider/types/index.ts'
);
const providerConstants = read(
  '../src/components/component-provider/constants/index.ts'
);

const sources = {
  useGroupFieldAttrs: read(
    '../src/components/form/hooks/useGroupFieldAttrs.ts'
  ),
  baseFormItem: read(
    '../src/components/form/components/BaseFormItem/index.vue'
  ),
  baseField: read('../src/components/form/components/BaseField/index.vue'),
  proForm: read('../src/components/form/components/ProForm/index.vue'),
  componentProvider: read(
    '../src/components/component-provider/components/index.vue'
  ),
  searchForm: read('../src/components/table/components/SearchForm.vue'),
  proTable: read('../src/components/table/components/ProTable.vue'),
  tableColumnRenderer: read(
    '../src/components/table/components/TableColumnRenderer.vue'
  ),
};

const antd = {
  useGroupFieldAttrs: read(
    '../../antd-vue-pro/src/components/form/hooks/useGroupFieldAttrs.ts'
  ),
  baseFormItem: read(
    '../../antd-vue-pro/src/components/form/components/BaseFormItem/index.vue'
  ),
  proForm: read(
    '../../antd-vue-pro/src/components/form/components/ProForm/index.vue'
  ),
  componentProvider: read(
    '../../antd-vue-pro/src/components/component-provider/components/index.vue'
  ),
  searchForm: read(
    '../../antd-vue-pro/src/components/table/components/SearchForm.vue'
  ),
  proTable: read(
    '../../antd-vue-pro/src/components/table/components/ProTable.vue'
  ),
};

/** 递归收集 src 下的源码文件（ts / vue） */
const collectSources = (dir: string): string[] =>
  readdirSync(resolve(__dirname, dir), { withFileTypes: true }).flatMap(
    entry => {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) return collectSources(rel);
      return /\.(ts|vue)$/.test(entry.name) ? [rel] : [];
    }
  );

/** 抽取文件内全部 JSDoc 块的首个内容行（跳过 /** 与纯装饰性星号行） */
const jsdocFirstLines = (
  source: string
): Array<{ line: number; first: string }> => {
  const lines = source.split('\n');
  const out: Array<{ line: number; first: string }> = [];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim().startsWith('/**')) continue;
    const start = i;
    const block: string[] = [lines[i]];
    if (!lines[i].trim().endsWith('*/')) {
      i++;
      while (i < lines.length && !lines[i].includes('*/')) {
        block.push(lines[i]);
        i++;
      }
      if (i < lines.length) block.push(lines[i]);
    }
    const first = block
      .map(raw =>
        raw
          .trim()
          .replace(/^\/\*\*/, '')
          .replace(/\*\/$/, '')
          .replace(/^\*\s?/, '')
          .trim()
      )
      .find(text => text.length > 0);
    if (first !== undefined) out.push({ line: start + 1, first });
  }
  return out;
};

/** 类型字面量块内以 // 注释的成员位置 */
const slashMemberComments = (source: string): string[] => {
  const lines = source.split('\n');
  const out: string[] = [];
  let inTypeBlock = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(export )?(type|interface)\s+\w+.*\{\s*$/.test(line)) {
      inTypeBlock = true;
      continue;
    }
    if (inTypeBlock && /^\s*\}/.test(line)) {
      inTypeBlock = false;
      continue;
    }
    if (inTypeBlock && /^\s*\/\//.test(line))
      out.push(`:${i + 1} ${line.trim()}`);
  }
  return out;
};

/** 同一位置出现多个连续 JSDoc 块（前一块为死注释，编辑器只取最近一块） */
const stackedJsdocBlocks = (source: string): string[] => {
  const lines = source.split('\n');
  const blocks: Array<[number, number]> = [];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim().startsWith('/**')) continue;
    const start = i;
    while (i < lines.length && !lines[i].includes('*/')) i++;
    blocks.push([start, i]);
  }
  const out: string[] = [];
  for (let k = 0; k + 1 < blocks.length; k++) {
    const [s1, e1] = blocks[k];
    const [s2] = blocks[k + 1];
    const between = lines.slice(e1 + 1, s2).filter(line => line.trim() !== '');
    if (
      between.every(line => line.trim().startsWith('//')) &&
      between.length <= 1
    ) {
      out.push(`:${s1 + 1} → :${s2 + 1}`);
    }
  }
  return out;
};

/** 组件 JSDoc 块内的标签序列（按出现顺序），用于跨包比对结构 */
const jsdocTagSequence = (source: string, component: string) => {
  const start = source.indexOf(`@component ${component}`);
  const block = source.slice(start, source.indexOf('*/', start));
  return block
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^\*\s*@/.test(line))
    .map(line => line.replace(/^\*\s*/, '').split(/\s+/)[0]);
};

describe('注释规范契约 · element-plus-pro', () => {
  // ----------------------------------------------------
  // DOC-01 [判别]: 实现手段 / 动机表述缺席，行为陈述在场
  // ----------------------------------------------------
  it('DOC-01 [判别]: 实现手段与动机表述不出现在适配层注释中，行为陈述在场', () => {
    const banned = [
      '不可枚举：不进入 Object.keys / spread，不随字段配置透传',
      'WeakMap 不参与响应式追踪',
      '字段显式 span 优先，否则回退注入配置的响应式断点',
      'shallowRef 形态，computed 内经 .value 读取建立依赖',
      'slots 以 shallowRef 注入，组件每次更新后触发通知',
      '首次渲染后，测量 ProForm 的实际高度',
      '使用 IntersectionObserver 检测隐藏字段是否有值',
      '用户点击搜索 → SearchForm @search → searchPage1st()',
    ];
    for (const [name, source] of Object.entries(sources)) {
      for (const phrase of banned) {
        expect(source, `${name} 命中禁用表述：${phrase}`).not.toContain(phrase);
      }
    }

    expect(sources.useGroupFieldAttrs).toContain(
      '字段显式指定 span 时整体接管栅格，不再叠加注入的响应式断点'
    );
    expect(sources.baseFormItem).toContain(
      '访问器仅用于字段对象读取，不参与属性遍历与字段配置透传'
    );
    expect(sources.baseFormItem).toContain('字段对象被回收后对应条目不再可读');
    expect(sources.baseField).toContain(
      '从 ProForm 插槽注入的 slots 集合（优先级最高）'
    );
    expect(sources.proForm).toContain(
      '向深层 BaseField 提供 ProForm 的具名插槽'
    );
    expect(sources.proTable).toContain('## 搜索行为');
    expect(sources.searchForm).toContain('## 展开/折叠行为');
    expect(sources.tableColumnRenderer).toContain('渲染 key 与列对象身份绑定');
  });

  // ----------------------------------------------------
  // DOC-02 [判别]: 公开 JSDoc 与 antd 包同句，插槽作用域按本包实际标注
  // ----------------------------------------------------
  it('DOC-02 [判别]: ProTable / SearchForm 公开 JSDoc 与 antd 包同句，插槽如实标注无作用域', () => {
    const sharedProTableLines = [
      ' * ## 搜索行为',
      ' * 1. 搜索：分页回到第一页后发起查询',
      ' * 2. 分页变化：分页参数同步后发起查询',
      ' * 3. 重置：查询参数恢复初始值后重新查询',
      ' * @template T - 表格实例类型（useTable 返回值）',
      ' * @param {T} [table] - 列表表格对象，来自 useTable',
      ' * @param {ContainerComponent | false} [tableContainer] - 表格区域包裹容器',
    ];
    for (const line of sharedProTableLines) {
      expect(antd.proTable, `antd ProTable 缺同构行：${line}`).toContain(line);
      expect(sources.proTable, `element ProTable 缺同构行：${line}`).toContain(
        line
      );
    }

    // 本包 search-form / table 插槽无作用域，文档如实标注
    expect(sources.proTable).toContain(
      ' * @slot search-form - 搜索区域插槽（无作用域）'
    );
    expect(sources.proTable).toContain(
      ' * @slot table - 表格区域插槽（无作用域）'
    );

    const searchFormLines = [
      ' * ## 展开/折叠行为',
      ' * 1. 内容高度超出折叠高度（由 minExpandRows 决定，默认 2 行）时显示展开/折叠按钮',
      ' * @param {Form} form - 搜索表单实例，由 table.searchForm 提供',
      ' * @slot reset-button - 重置按钮插槽，作用域参数 onReset',
      ' * @slot search-button - 搜索按钮插槽，作用域参数 onSearch',
      ' * @slot expand-button - 展开/折叠按钮插槽，作用域参数 expandStatus / changeExpandStatus',
    ];
    for (const line of searchFormLines) {
      expect(antd.searchForm, `antd SearchForm 缺同构行：${line}`).toContain(
        line
      );
      expect(
        sources.searchForm,
        `element SearchForm 缺同构行：${line}`
      ).toContain(line);
    }
  });

  // ----------------------------------------------------
  // DOC-03 [判别]: ProForm / ProComponentProvider 公开 JSDoc 标签序列与 antd 包一致
  // ----------------------------------------------------
  it('DOC-03 [判别]: ProForm 与 ProComponentProvider 的 JSDoc 标签序列、@public 位置与 antd 包一致', () => {
    // 标签顺序锁定 @public 位置以及 @param / @slot / @example 的完整清单
    expect(jsdocTagSequence(sources.proForm, 'ProForm')).toEqual(
      jsdocTagSequence(antd.proForm, 'ProForm')
    );
    expect(
      jsdocTagSequence(sources.componentProvider, 'ProComponentProvider')
    ).toEqual(jsdocTagSequence(antd.componentProvider, 'ProComponentProvider'));

    // 摘要居首，@component / @public 依次随后，其后才是功能清单
    expect(sources.proForm).toContain(
      ' * 配置驱动表单组件\n *\n * @component ProForm\n *\n * 架构设计说明'
    );
    expect(sources.proForm).toContain(' * @public\n *\n * 通过配置驱动的方式');
    expect(sources.componentProvider).toContain(
      ' * 全局配置提供者组件\n *\n * @component ProComponentProvider\n * @public'
    );

    // 宿主组件属性与完整示例按同一结构落地
    expect(sources.proForm).toContain(
      ' * @param {...FormProps} ...attrs - Element Plus Form 组件的其他属性'
    );
    expect(antd.proForm).toContain(' * @param {...FormProps} ...attrs - ');
    expect(sources.proForm).toContain(' * @example');
    expect(sources.componentProvider).toContain(' * @example');

    // 同构 Hook 的 @description 清单与 antd 包同句
    const descriptionLines = [
      ' * 1. 响应式集成 ProComponentProvider 的 `pro-form-item` 全局变量配置；',
      ' * 2. 剥离 `extraProps`（用户自定义字段标识袋）：保留在字段原始对象上供业务层存取，渲染层经解构剥离，不落入 componentProps 透传。',
    ];
    for (const line of descriptionLines) {
      expect(antd.useGroupFieldAttrs, `antd 缺同构行：${line}`).toContain(line);
      expect(sources.useGroupFieldAttrs, `element 缺同构行：${line}`).toContain(
        line
      );
    }

    // BaseFormItem 的 @param 清单与 @internal 位置同构
    const baseFormItemLines = [
      ' * @param {Fields} [fields] - 字段配置数组',
      ' * @param {boolean | GridProps} [grid] - 是否启用网格布局',
      ' * @param {boolean} [disabled] - 是否禁用所有子字段',
      ' * @internal',
    ];
    for (const line of baseFormItemLines) {
      expect(antd.baseFormItem, `antd 缺同构行：${line}`).toContain(line);
      expect(sources.baseFormItem, `element 缺同构行：${line}`).toContain(line);
    }
  });

  // ----------------------------------------------------
  // DOC-04 [判别]: Provider 注入面边界（data / form 不可注入）在类型与文档同句
  // ----------------------------------------------------
  it('DOC-04 [判别]: Provider 注入面边界在类型面与文档面同步', () => {
    // 类型面在 RequiredComponentVars 内直接剔除不可注入键
    expect(providerTypes).toContain("Omit<TableProps, 'data'>");
    expect(providerTypes).toContain("Omit<ProFormProps, 'form' | 'grid'>");
    expect(providerTypes).toContain(
      'ComponentVars = Partial<RequiredComponentVars>'
    );
    expect(providerTypes).toContain('不参与全局注入');
    // 运行期清单直接声明在注入项内（`columns` / `loading` 非类型面成员，同样在注入层忽略）
    expect(providerConstants).toContain(
      "ignoreProps: ['loading', 'columns', 'data'],"
    );
    expect(providerConstants).toContain("ignoreProps: ['form'],");
    expect(providerConstants).not.toContain('IGNORE_PROPS');
    expect(providerConstants).toContain('不接受 Provider 注入的键');
    expect(aiContext).toContain(
      "`data` / `columns` / `loading` 不可经 `componentVars['pro-table']` 配置"
    );
    expect(aiContext).toContain('在注入层静默忽略（类型面已限制，不输出告警）');
    expect(readme).toContain('不参与 `componentVars` 注入');
  });

  // ----------------------------------------------------
  // DOC-06 [判别]: useFormData 的兜底 store 边界在 README 与 AI 上下文同步声明
  // ----------------------------------------------------
  it('DOC-06 [判别]: useFormData 取值边界在 README 与 AI 上下文中同句声明', () => {
    expect(readme).toContain('**`useFormData()` 的取值边界**');
    expect(readme).toContain('**不是同一对象**');
    expect(aiContext).toContain('承接**内部兜底实例**的数据 store');
    expect(aiContext).toContain('useForm(false)');
  });

  // ----------------------------------------------------
  // DOC-11 [判别]: 导出符号悬浮可见性（与 vant / antdv-next 的 DOC-07 同口径）
  // ----------------------------------------------------
  it('DOC-11 [判别]: 导出符号 JSDoc 悬浮可见，无「仅标签」「无 JSDoc」与缺失头块的 .vue', () => {
    const { tagOnly, missing, vue } = auditPackage('element-plus-pro', {
      repoRoot: resolve(__dirname, '../../..'),
    });
    expect(
      tagOnly,
      `仅含标签（悬浮主体为空）：\n${tagOnly.join('\n')}`
    ).toEqual([]);
    expect(missing, `无 JSDoc（悬浮为空）：\n${missing.join('\n')}`).toEqual(
      []
    );
    expect(vue, `无 JSDoc 头块的 .vue：\n${vue.join('\n')}`).toEqual([]);
  });

  // ----------------------------------------------------
  // DOC-08 [判别]: 全部源码 JSDoc 首行为自由文本摘要（编辑器悬浮主体非空）
  // ----------------------------------------------------
  it('DOC-08 [判别]: 源码 JSDoc 首行均为自由文本摘要，无「仅标签」块', () => {
    const offenders: string[] = [];
    for (const rel of collectSources('../src')) {
      const source = read(rel);
      for (const { line, first } of jsdocFirstLines(source)) {
        if (first.startsWith('@')) offenders.push(`${rel}:${line} ${first}`);
      }
    }
    // 首行若只有标签（如 /** @description … */），悬浮主体为空、消费方取不到文档
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  // ----------------------------------------------------
  // DOC-10 [判别]: 同一位置不叠加多个 JSDoc 块（前一块为死注释）
  // ----------------------------------------------------
  it('DOC-10 [判别]: 声明前不出现两个连续 JSDoc 块', () => {
    const offenders: string[] = [];
    for (const rel of collectSources('../src')) {
      const source = read(resolve(__dirname, rel));
      for (const hit of stackedJsdocBlocks(source))
        offenders.push(`${rel}${hit}`);
    }
    // TS 只把最近的前置 JSDoc 挂到声明上，被指令注释隔开的前一块成为死注释
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  // ----------------------------------------------------
  // DOC-09 [判别]: 组件 Props / 配置类型成员使用 JSDoc，保证悬浮可取到说明
  // ----------------------------------------------------
  it('DOC-09 [判别]: Props 与配置类型成员不使用行注释，均以 JSDoc 声明', () => {
    const offenders: string[] = [];
    for (const rel of collectSources('../src')) {
      const source = read(rel);
      for (const hit of slashMemberComments(source))
        offenders.push(`${rel}${hit}`);
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  // ----------------------------------------------------
  // DOC-07 [判别]: default 插槽保留语义在 JSDoc / README / docs 三处声明
  // ----------------------------------------------------
  it('DOC-07 [判别]: default 插槽保留给列渲染器在 JSDoc、README 与 docs 同步声明', () => {
    expect(sources.proTable).toContain(
      ' * @slot default - 保留给列渲染器，传入内容不参与渲染'
    );
    expect(readme).toContain(
      '| `default`     | 保留给列渲染器，传入内容不参与渲染'
    );
    expect(docsProTable).toContain('保留给列渲染器');
    // 列插槽透传说明不再把 default 计入透传面
    expect(docsProTable).not.toContain(
      '其余 el-table 列插槽（如 `el-table-column` 的 `default`、`header` 等）'
    );
  });
});
