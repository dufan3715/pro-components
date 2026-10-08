/**
 * 注释规范契约回归 —— 锁定适配层注释与公开 JSDoc 的行为陈述口径
 *
 * @description
 * 断言两类事实：CR-088 的栅格边界声明在源码 / 类型 / 文档三处同句存在；
 * CR-090 移除的实现手段、动机与改动史表述不再回流到源码注释。
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path: string) => readFileSync(resolve(__dirname, path), 'utf-8');

const sources = {
  useGroupFieldAttrs: read(
    '../src/components/form/hooks/useGroupFieldAttrs.ts'
  ),
  formTypes: read('../src/components/form/types/index.ts'),
  baseFormItem: read(
    '../src/components/form/components/BaseFormItem/index.vue'
  ),
  baseField: read('../src/components/form/components/BaseField/index.vue'),
  searchForm: read('../src/components/table/components/SearchForm.vue'),
  proTable: read('../src/components/table/components/ProTable.vue'),
};
const proFormDoc = read(
  '../../../docs/antd-vue-pro/components/pro-form/index.md'
);

describe('注释规范契约 · antd-vue-pro', () => {
  // ----------------------------------------------------
  // DOC-01 [判别]: CR-088 栅格边界声明三处同句
  // ----------------------------------------------------
  it('DOC-01 [判别]: 栅格边界在源码注释 / 字段类型 / 组件文档中同句声明', () => {
    expect(sources.useGroupFieldAttrs).toContain(
      '字段显式指定 span 时整体接管栅格，不再叠加注入的响应式断点'
    );
    expect(sources.formTypes).toContain(
      '字段显式指定 `span` 时整体接管栅格，不再叠加 Provider 注入的响应式断点'
    );
    expect(proFormDoc).toContain(
      '字段显式指定 `span` 时整体接管栅格，不再叠加 Provider 注入的响应式断点'
    );
  });

  // ----------------------------------------------------
  // DOC-02 [判别]: 实现手段 / 动机 / 改动史表述不回流
  // ----------------------------------------------------
  it('DOC-02 [判别]: 实现手段、动机与改动史表述不出现在适配层源码注释中', () => {
    const banned = [
      '替代数组 includes 线性扫描',
      '不进入 Object.keys / spread，不随字段配置透传',
      'WeakMap 不参与响应式追踪',
      '通过 useGroupFieldAttrs Hook 纯计算将 field 配置拆分',
      'shallowRef 形态，computed 内经 .value 读取建立依赖',
      '守卫过渡状态或空列下 column 为 undefined 的情况',
      '首次渲染后，测量 ProForm 的实际高度',
      '使用 IntersectionObserver 检测隐藏字段是否有值',
      '用户点击搜索 → SearchForm @search → searchPage1st()',
    ];
    for (const [name, source] of Object.entries(sources)) {
      for (const phrase of banned) {
        expect(source, `${name} 命中禁用表述：${phrase}`).not.toContain(phrase);
      }
    }
  });

  // ----------------------------------------------------
  // DOC-03 [判别]: ProTable / SearchForm 公开 JSDoc 结构完整
  // ----------------------------------------------------
  it('DOC-03 [判别]: ProTable / SearchForm 公开 JSDoc 具备 @param / @returns / @template', () => {
    expect(sources.proTable).toContain('@template T - 表格实例类型');
    expect(sources.proTable).toContain('@param {T} [table] - 列表表格对象');
    expect(sources.proTable).toContain('@returns 该插槽是否参与渲染');
    expect(sources.searchForm).toContain(
      '@param {Form} form - 搜索表单实例，由 table.searchForm 提供'
    );
    expect(sources.searchForm).toContain('@slot expand-button -');
  });
});
