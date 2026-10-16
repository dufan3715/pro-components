import { describe, it, expect } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { Table as ElTable, TableColumn } from '../src/shared/ui';
import TableColumnRenderer from '../src/components/table/components/TableColumnRenderer.vue';
import { flushPromises } from './helpers/mount';

/**
 * 挂载 ElTable + TableColumnRenderer：列渲染器需处于 ElTable 上下文内才注册列
 */
const mountRenderer = (columns: any, data: any[] = []) =>
  mount(ElTable as any, {
    props: { data },
    slots: {
      default: () => h(TableColumnRenderer as any, { columns }),
    },
    global: { stubs: { transition: false } },
  });

const headerTexts = (wrapper: any) =>
  wrapper.findAll('.el-table__header th').map((th: any) => th.text().trim());

/** 渲染出的 ElTableColumn 组件包装器（宿主组件类型含泛型，测试用途放宽为 any） */
const findColumns = (wrapper: any): any[] =>
  wrapper.findAllComponents(TableColumn as any);

describe('TableColumnRenderer 列渲染器测试', () => {
  // ----------------------------------------------------
  // PT-A21 [判别]: 普通列渲染
  // ----------------------------------------------------
  it('PT-A21 [判别]: 普通列按 label 渲染表头、按 prop 取行数据，prop 归一化后下发 ElTableColumn', async () => {
    const columns = [
      { prop: 'name', label: '姓名' },
      { prop: 'list[0]', label: '首项' },
    ];
    const data = [{ name: '甲', list: ['一号'] }];

    const wrapper = mountRenderer(columns, data);
    await flushPromises();

    expect(headerTexts(wrapper)).toEqual(['姓名', '首项']);
    expect(wrapper.find('.el-table__body').text()).toContain('甲');
    expect(wrapper.find('.el-table__body').text()).toContain('一号');

    // prop 经 normalizePathKey 归一化后下发（list[0] → list.0）
    const rendered = findColumns(wrapper);
    expect(rendered).toHaveLength(2);
    expect(rendered[0].props('prop')).toBe('name');
    expect(rendered[0].props('label')).toBe('姓名');
    expect(rendered[1].props('prop')).toBe('list.0');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A22 [判别]: 分组列 children 递归渲染
  // ----------------------------------------------------
  it('PT-A22 [判别]: 分组列递归展开 children，多层表头与数据单元格均渲染', async () => {
    const columns = [
      {
        label: '基本信息',
        children: [
          { prop: 'name', label: '姓名' },
          {
            label: '联系方式',
            children: [{ prop: 'phone', label: '手机' }],
          },
        ],
      },
      { prop: 'age', label: '年龄' },
    ];
    const data = [{ name: '甲', phone: '13800000000', age: 30 }];

    const wrapper = mountRenderer(columns, data);
    await flushPromises();

    // 分组父列与叶子列各自成为 ElTableColumn（父 1 + 二级父 1 + 叶子 2 + 顶层叶 1）
    expect(findColumns(wrapper)).toHaveLength(5);
    const texts = headerTexts(wrapper);
    for (const label of ['基本信息', '姓名', '联系方式', '手机', '年龄']) {
      expect(texts).toContain(label);
    }
    const body = wrapper.find('.el-table__body').text();
    expect(body).toContain('甲');
    expect(body).toContain('13800000000');
    expect(body).toContain('30');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A23 [判别]: hidden 过滤（含响应式形态）
  // ----------------------------------------------------
  it('PT-A23 [判别]: hidden 列被过滤（布尔与响应式形态均生效），可见列照常渲染', async () => {
    const reactiveHidden = ref(true);
    const reactiveVisible = ref(false);
    const columns = [
      { prop: 'secret', label: '隐藏列', hidden: true },
      { prop: 'reactiveSecret', label: '响应式隐藏列', hidden: reactiveHidden },
      { prop: 'reactiveShown', label: '响应式可见列', hidden: reactiveVisible },
      { prop: 'name', label: '姓名' },
    ];
    const data = [
      { secret: 'S', reactiveSecret: 'R', reactiveShown: 'V', name: '甲' },
    ];

    const wrapper = mountRenderer(columns, data);
    await flushPromises();

    // ref(true) 被过滤；ref(false) 不因「对象恒真值」被误判为隐藏
    expect(findColumns(wrapper)).toHaveLength(2);
    expect(headerTexts(wrapper)).toEqual(['响应式可见列', '姓名']);
    const body = wrapper.find('.el-table__body').text();
    expect(body).not.toContain('S');
    expect(body).not.toContain('R');
    expect(body).toContain('V');
    expect(body).toContain('甲');

    // 响应式切换后列实时消失
    reactiveVisible.value = true;
    await flushPromises();
    expect(findColumns(wrapper)).toHaveLength(1);
    expect(headerTexts(wrapper)).toEqual(['姓名']);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A24 [判别]: key 兜底
  // ----------------------------------------------------
  it('PT-A24 [判别]: 无 prop 列以 key 作为 columnKey；无 key 列获得绑定列对象的稳定 key，重排后不漂移', async () => {
    const first = { label: '匿名列' };
    const second = { label: '匿名列二' };
    const keyed = { key: 'name', label: '姓名' };

    const columns = ref<any[]>([first, second, keyed]);
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            ElTable as any,
            { data: [{ name: '甲' }] },
            {
              default: () =>
                h(TableColumnRenderer as any, { columns: columns.value }),
            }
          );
      },
    });

    const wrapper = mount(Host, {
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // key 兜底为 columnKey；无 prop 列不下发 prop
    const keyedCol = findColumns(wrapper)[2];
    expect(keyedCol.props('columnKey')).toBe('name');
    expect(keyedCol.props('prop')).toBeUndefined();
    expect(headerTexts(wrapper)).toEqual(['匿名列', '匿名列二', '姓名']);

    const vnodeKeyOf = (col: any) => col.vm.$.vnode.key;
    const keysBefore = findColumns(wrapper).map(vnodeKeyOf);
    expect(keysBefore[0]).toBeDefined();
    expect(keysBefore[0]).not.toBe(keysBefore[1]);

    // 重排后稳定 key 仍绑定原列对象
    columns.value = [second, first, keyed];
    await flushPromises();

    const keysAfter = findColumns(wrapper).map(vnodeKeyOf);
    expect(keysAfter[0]).toBe(keysBefore[1]);
    expect(keysAfter[1]).toBe(keysBefore[0]);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A25 [判别]: 空 columns
  // ----------------------------------------------------
  it('PT-A25 [判别]: columns 为空数组或未传入时零列渲染且不抛错', async () => {
    const empty = mountRenderer([], [{ name: '甲' }]);
    await flushPromises();
    expect(findColumns(empty)).toHaveLength(0);
    expect(empty.findAll('.el-table__header th')).toHaveLength(0);
    empty.unmount();

    // 未传入 columns 走默认空数组
    const omitted = mount(ElTable as any, {
      props: { data: [] },
      slots: { default: () => h(TableColumnRenderer as any) },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(findColumns(omitted)).toHaveLength(0);
    omitted.unmount();
  });

  // ----------------------------------------------------
  // PT-A26 [判别]: 自定义 render 列的深层路径取值
  // ----------------------------------------------------
  it('PT-A26 [判别]: render 列作用域携带 column / $index，cellValue 取深层路径值', async () => {
    const scopes: any[] = [];
    const columns = [
      {
        prop: 'address.city',
        label: '城市',
        render: (scope: any) => {
          scopes.push(scope);
          return h('span', { class: 'render-cell' }, scope.cellValue);
        },
      },
      { prop: 'name', label: '姓名' },
    ];
    const data = [{ name: '甲', address: { city: '杭州' } }];

    const wrapper = mountRenderer(columns, data);
    await flushPromises();

    expect(wrapper.find('.render-cell').text()).toBe('杭州');
    // 宿主表格对默认插槽的调用次数不受约束，取承载真实行数据的一次
    const bodyScope = scopes.find(scope => scope.cellValue === '杭州');
    expect(bodyScope).toBeDefined();
    expect(bodyScope.$index).toBe(0);
    expect(bodyScope.column.prop).toBe('address.city');
    expect(bodyScope.row.address.city).toBe('杭州');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A40 [判别]: 空字符串 key 视为未提供，回退 prop / 列对象身份
  // ----------------------------------------------------
  it('PT-A40 [判别]: key 为空字符串时回退 prop 与列对象身份，同名空 key 列不共用渲染 key', async () => {
    const anonymous = { key: '', label: '匿名列' };
    const namedByProp = { key: '', prop: 'name', label: '姓名' };
    const columns = [anonymous, namedByProp];

    const wrapper = mountRenderer(columns, [{ name: '甲' }]);
    await flushPromises();

    // key 为空字符串时以 prop 作为 columnKey，无 prop 列不下发 columnKey
    const rendered = findColumns(wrapper);
    expect(rendered[0].props('columnKey')).toBeUndefined();
    expect(rendered[1].props('columnKey')).toBe('name');
    expect(headerTexts(wrapper)).toEqual(['匿名列', '姓名']);
    expect(wrapper.find('.el-table__body').text()).toContain('甲');

    // 两列的渲染 key 均非空且互不相同
    const keys = rendered.map((col: any) => col.vm.$.vnode.key);
    expect(keys[0]).toBeDefined();
    expect(keys[0]).not.toBe('');
    expect(keys[0]).not.toBe(keys[1]);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PT-A27 [判别]: 分组子列 hidden 递归过滤（布尔与响应式）
  // ----------------------------------------------------
  it('PT-A27 [判别]: 分组列的子列 hidden 参与过滤（含嵌套与响应式）', async () => {
    const hiddenRef = ref(true);
    const columns = [
      {
        label: '分组',
        children: [
          { prop: 'a', label: '子列甲', hidden: true },
          { prop: 'b', label: '子列乙' },
          {
            label: '嵌套分组',
            children: [{ prop: 'c', label: '子列丙', hidden: hiddenRef }],
          },
        ],
      },
    ];

    const wrapper = mountRenderer(columns, [{ a: 'A', b: 'B', c: 'C' }]);
    await flushPromises();

    // 被过滤的子列不生成 ElTableColumn（分组 + 子列乙 + 嵌套分组 = 3）
    expect(findColumns(wrapper).map((c: any) => c.props('label'))).toEqual([
      '分组',
      '子列乙',
      '嵌套分组',
    ]);
    expect(headerTexts(wrapper).join(' ')).not.toContain('子列甲');
    // 被过滤子列的数据不进入表体
    expect(wrapper.find('.el-table__body').text()).toContain('B');
    expect(wrapper.find('.el-table__body').text()).not.toContain('A');

    // 响应式形态：ref(true) → ref(false) 后子列丙出现
    hiddenRef.value = false;
    await flushPromises();
    expect(findColumns(wrapper).map((c: any) => c.props('label'))).toContain(
      '子列丙'
    );

    wrapper.unmount();
  });
});
