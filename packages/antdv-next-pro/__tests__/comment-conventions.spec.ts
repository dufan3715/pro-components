/**
 * 注释规范契约回归 —— 锁定适配层注释与公开 JSDoc 的行为陈述口径
 *
 * @description
 * 断言三类事实：CR-090 余项涉及的适配层注释已改为行为陈述，实现手段与动机表述不再回流；
 * ProTable / SearchForm 的公开 JSDoc 与同构包 antd-vue-pro 保持同句；
 * 字段 hidden 口径与 ProTable 注入面边界在四包类型面与文档面同句。
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path: string) => readFileSync(resolve(__dirname, path), 'utf-8');

const sources = {
  useGroupFieldAttrs: read(
    '../src/components/form/hooks/useGroupFieldAttrs.ts'
  ),
  baseFormItem: read(
    '../src/components/form/components/BaseFormItem/index.vue'
  ),
  baseField: read('../src/components/form/components/BaseField/index.vue'),
  proForm: read('../src/components/form/components/ProForm/index.vue'),
  searchForm: read('../src/components/table/components/SearchForm.vue'),
  proTable: read('../src/components/table/components/ProTable.vue'),
};

const antd = {
  searchForm: read(
    '../../antd-vue-pro/src/components/table/components/SearchForm.vue'
  ),
  proTable: read(
    '../../antd-vue-pro/src/components/table/components/ProTable.vue'
  ),
};

const readme = read('../README.md');
const aiContext = read('../AI-CONTEXT.md');
const proTableDoc = read(
  '../../../docs/antdv-next-pro/components/pro-table/index.md'
);
const providerTypes = read(
  '../src/components/component-provider/types/index.ts'
);
const providerConstants = read(
  '../src/components/component-provider/constants/index.ts'
);

/*
 * 字段 hidden 口径的四包同构来源：类型面声明、渲染过滤注释、组件文档行
 */
const hiddenSources = [
  'antd-vue-pro',
  'antdv-next-pro',
  'element-plus-pro',
  'vant-pro',
].map(
  pkg =>
    [
      pkg,
      read(`../../${pkg}/src/components/form/types/index.ts`),
      read(
        `../../${pkg}/src/components/form/components/BaseFormItem/index.vue`
      ),
      read(`../../../docs/${pkg}/components/pro-form/index.md`),
    ] as const
);

/*
 * 字段类名 / 样式口径的四包同构来源：类型面声明与 README 字段表（vant 的 FormItem 层命名为 field*）
 */
const classStyleSources = [
  ['antd-vue-pro', ['formItemClass', 'formItemStyle']],
  ['antdv-next-pro', ['formItemClass', 'formItemStyle']],
  ['element-plus-pro', ['formItemClass', 'formItemStyle']],
  ['vant-pro', ['fieldClass', 'fieldStyle']],
].map(
  ([pkg, itemKeys]) =>
    [
      pkg as string,
      read(`../../${pkg}/src/components/form/types/index.ts`),
      read(`../../${pkg}/README.md`),
      [...itemKeys, 'componentClass', 'componentStyle'],
    ] as const
);

describe('注释规范契约 · antdv-next-pro', () => {
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
      '不随 injectRest 透传为 FormItem 的 DOM 属性',
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
    expect(sources.useGroupFieldAttrs).toContain(
      '字段级容器优先，回退注入级配置'
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
  });

  // ----------------------------------------------------
  // DOC-02 [判别]: ProTable / SearchForm 公开 JSDoc 与 antd 包同句
  // ----------------------------------------------------
  it('DOC-02 [判别]: ProTable / SearchForm 公开 JSDoc 与 antd 包逐句一致', () => {
    const proTableLines = [
      ' * ## 搜索行为',
      ' * 1. 搜索：分页回到第一页后发起查询',
      ' * 2. 分页变化：分页参数同步后发起查询',
      ' * 3. 重置：查询参数恢复初始值后重新查询',
      ' * @template T - 表格实例类型（useTable 返回值）',
      ' * @param {T} [table] - 列表表格对象，来自 useTable',
      ' * @param {ContainerComponent | false} [tableContainer] - 表格区域包裹容器',
      ' * @slot search-form - 搜索区域插槽，作用域参数 form / search / reset',
      ' * @slot table - 表格区域插槽，作用域参数 columns / dataSource / pagination / loading / size / onChange',
    ];
    for (const line of proTableLines) {
      expect(antd.proTable, `antd ProTable 缺同构行：${line}`).toContain(line);
      expect(
        sources.proTable,
        `antdv-next ProTable 缺同构行：${line}`
      ).toContain(line);
    }

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
        `antdv-next SearchForm 缺同构行：${line}`
      ).toContain(line);
    }
  });

  // ----------------------------------------------------
  // DOC-03 [判别]: 字段 hidden 的口径在四包类型面 / 注释 / 文档三处同句（Ref / ComputedRef，不含 getter）
  // ----------------------------------------------------
  it('DOC-03 [判别]: 字段 hidden 的类型面、渲染注释与组件文档口径四包一致', () => {
    for (const [pkg, types, baseFormItem, proFormDoc] of hiddenSources) {
      // 声明处保持原始值类型：响应式形态由 WithRef 统一派生，声明处再包装会形成二次包装
      expect(
        types,
        `${pkg} 字段 hidden 未声明为原始值类型（响应式形态应由 WithRef 派生）`
      ).toContain('hidden?: boolean;');
      expect(
        types,
        `${pkg} 的 WithRef 未派生响应式形态，类型面 JSDoc 与实际能力不符`
      ).toContain('MaybeRefOrComputedRef<T[P]>');
      expect(
        types,
        `${pkg} 字段 hidden 的类型面 JSDoc 未声明有效形态`
      ).toContain('支持布尔、Ref 与 ComputedRef 形式');
      expect(baseFormItem, `${pkg} 过滤注释未声明 hidden 的有效形态`).toContain(
        'hidden 支持 Ref / ComputedRef 响应式形态（统一使用 toValue 取值）'
      );
      expect(baseFormItem, `${pkg} 过滤注释仍宣称 getter 形态`).not.toContain(
        'getter 等响应式形态'
      );
      expect(
        proFormDoc,
        `${pkg} 组件文档的字段 hidden 说明未同步有效形态`
      ).toContain('`boolean` / `Ref` / `ComputedRef`');
      expect(proFormDoc, `${pkg} 组件文档仍宣称 getter 形态`).not.toContain(
        'getter'
      );
      // 嵌套路径说明归属字段 path 的注释，不落在 hidden 注释块内
      const hiddenCommentStart = types.indexOf('字段是否隐藏');
      expect(
        types.slice(0, hiddenCommentStart),
        `${pkg} 字段 path 的嵌套路径说明缺失`
      ).toContain('嵌套字段的 `path` 使用各自独立的完整路径');
      expect(
        types.slice(hiddenCommentStart, types.indexOf('hidden?: boolean;')),
        `${pkg} 的 hidden 注释混入了字段 path 的说明`
      ).not.toContain('嵌套字段的 `path`');
    }
  });

  // ----------------------------------------------------
  // DOC-04 [判别]: ProTable 注入面边界（columns / dataSource / loading 不可注入）在类型与文档同句
  // ----------------------------------------------------
  it('DOC-04 [判别]: ProTable 注入面边界在类型面与文档面同步', () => {
    // 类型面在 RequiredComponentVars 内直接剔除不可注入键
    expect(providerTypes).toContain(
      "Omit<TableProps, 'loading' | 'columns' | 'dataSource'>"
    );
    expect(providerTypes).toContain("Omit<ProFormProps, 'form' | 'grid'>");
    expect(providerTypes).toContain(
      'ComponentVars = Partial<RequiredComponentVars>'
    );
    expect(providerTypes).toContain('不参与全局注入');
    // 运行期清单直接声明在注入项内，与类型面同键（两处分别锁定）
    expect(providerConstants).toContain(
      "ignoreProps: ['loading', 'columns', 'dataSource'],"
    );
    expect(providerConstants).toContain("ignoreProps: ['form'],");
    expect(providerConstants).not.toContain('IGNORE_PROPS');
    expect(providerConstants).toContain('不接受 Provider 注入的键');
    expect(aiContext).toContain(
      '`columns` / `dataSource` / `loading` 不可经 `componentVars'
    );
    // searchFormConfig 的下发边界：容器与显隐由 ProTable 消费
    expect(aiContext).toContain('由 ProTable 消费，不下发 `SearchForm`');
    expect(readme).toContain('不参与 `componentVars` 注入');
    expect(proTableDoc).toContain('不参与注入');
  });

  // ----------------------------------------------------
  // DOC-06 [判别]: 字段类名 / 样式四包复用宿主 ClassValue / StyleValue
  // ----------------------------------------------------
  it('DOC-06 [判别]: 字段类名与样式在四包类型面与 README 复用宿主类型', () => {
    for (const [pkg, types, pkgReadme, keys] of classStyleSources) {
      expect(types, `${pkg} 未复用宿主类名类型`).toContain('type ClassValue');
      expect(types, `${pkg} 未复用宿主样式类型`).toContain('type StyleValue');
      for (const key of keys) {
        const hostType = key.endsWith('Class') ? 'ClassValue' : 'StyleValue';
        expect(types, `${pkg} 的 ${key} 未按宿主类型声明`).toContain(
          `${key}?: ${hostType};`
        );
        expect(pkgReadme, `${pkg} 的 README 未同步 ${key}`).toMatch(
          new RegExp(`\`${key}\`[^\\n]*\`${hostType}\``)
        );
      }
    }
  });
});
