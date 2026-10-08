/**
 * 注释规范契约回归 —— 锁定适配层注释与公开 JSDoc 的行为陈述口径
 *
 * @description
 * 断言两类事实：CR-090 余项涉及的适配层注释已改为行为陈述，实现手段与动机表述不再回流；
 * ProTable / SearchForm 的公开 JSDoc 与同构包 antd-vue-pro 保持同句（插槽作用域按本包实际如实标注）。
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
});
