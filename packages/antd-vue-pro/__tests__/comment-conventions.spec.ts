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
    '../src/components/form/components/BaseFormItems/index.vue'
  ),
  baseFormRow: read('../src/components/form/components/BaseFormItem/index.vue'),
  baseField: read('../src/components/form/components/BaseField/index.vue'),
  searchForm: read('../src/components/table/components/SearchForm.vue'),
  useFields: read('../src/components/form/hooks/useFields.ts'),
  proTable: read('../src/components/table/components/ProTable.vue'),
};
const proFormDoc = read(
  '../../../docs/antd-vue-pro/components/pro-form/index.md'
);
const proTableDoc = read(
  '../../../docs/antd-vue-pro/components/pro-table/index.md'
);
const readme = read('../README.md');
const aiContext = read('../AI-CONTEXT.md');
const tableTypes = read('../src/components/table/types/index.ts');
const formTypes = read('../src/components/form/types/index.ts');
const providerTypes = read(
  '../src/components/component-provider/types/index.ts'
);
const providerConstants = read(
  '../src/components/component-provider/constants/index.ts'
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

  // ----------------------------------------------------
  // DOC-04 [判别]: 列 hidden 的响应式口径在类型面与文档面同句（Ref / ComputedRef，不含 getter）
  // ----------------------------------------------------
  it('DOC-04 [判别]: 列 hidden 的类型面与文档面口径一致', () => {
    expect(tableTypes).toContain('hidden?: MaybeRefOrComputedRef<boolean>');
    expect(tableTypes).toContain('支持布尔、Ref 与 ComputedRef 形式');
    expect(proTableDoc).toContain('boolean` / `Ref` / `ComputedRef');
    expect(proTableDoc).not.toContain('`Ref` / getter');
    expect(readme).toContain(
      '`boolean \\| Ref<boolean> \\| ComputedRef<boolean>`'
    );
    expect(readme).not.toContain('| `boolean`            | `false` |');
    expect(aiContext).toContain('支持 `boolean` / `Ref` / `ComputedRef`');
  });

  // ----------------------------------------------------
  // DOC-05 [判别]: Provider 注入面边界（columns / dataSource / loading 不可注入）在类型与文档同句
  // ----------------------------------------------------
  it('DOC-05 [判别]: ProTable 注入面边界在类型面与文档面同步', () => {
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
    expect(readme).toContain('不参与 `componentVars` 注入');
    expect(proTableDoc).toContain('不参与注入');
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
  // DOC-07 [判别]: 字段标识口径（name > path）在类型面 JSDoc 声明
  // ----------------------------------------------------
  it('DOC-07 [判别]: 字段标识优先级在类型面 JSDoc 与 useFields JSDoc 同口径', () => {
    // 类型面：字段配置入口处可读到标识口径
    expect(formTypes).toContain('字段标识按 `name`、`path` 的顺序取首个非');
    expect(formTypes).toContain('`name` 优先');
    // 与 core 查找 API 共用同一解析结果
    expect(formTypes).toContain('core 字段查找 API');
    // hook 层保留同一行为陈述
    expect(sources.useFields).toContain(
      '字段标识按 `name`、`path` 的顺序取首个非 `null` / `undefined` 的值'
    );
    // 跨包差异已声明，避免与 element 的 prop 口径混用
    expect(formTypes).toContain('element-plus-pro');
  });

  // ----------------------------------------------------
  // DOC-08 [判别]: 单字段行与字段列表组件同时受注释契约覆盖
  // ----------------------------------------------------
  it('DOC-08 [判别]: BaseFormItem / BaseFormItems 的头块 JSDoc 同时受契约覆盖', () => {
    expect(sources.baseFormRow).toContain('单字段行渲染组件');
    expect(sources.baseFormRow).toContain('@component BaseFormItem');
    expect(sources.baseFormItem).toContain('@component BaseFormItems');
  });
});
