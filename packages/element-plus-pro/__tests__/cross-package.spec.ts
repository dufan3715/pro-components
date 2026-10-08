/**
 * 跨包行为一致性回归用例 —— element-plus-pro 子集
 */
import { describe, expect, it, vi, afterEach } from 'vitest';
import { h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { flushPromises, mountProTable } from './helpers/mount';
import { useForm, useFields } from '../src/components/form';
import { useTable } from '../src/components/table/hooks/useTable';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import ProTable from '../src/components/table/components/ProTable.vue';
import { INJECT_CONFIG } from '../src/components/component-provider/constants';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('跨包一致性 · element-plus-pro', () => {
  it('5.4 input-number 默认配置 min/max 保持对称', () => {
    const config = INJECT_CONFIG['input-number'].default;
    expect(config.max).toBe(10 ** 15 - 1);
    expect(config.min).toBe(-(10 ** 15 - 1));
  });
  it('索引列序号随分页偏移（既有 getIndex 行为防回归）', async () => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      id: `row-${i + 1}`,
    }));
    const table = useTable({
      columns: [{ prop: 'id', label: 'ID' }] as any,
      data,
    });
    const { wrapper } = await mountProTable({
      table,
      props: { addIndexColumn: true },
    });
    table.setPageParam({ current: 2, pageSize: 10 });
    await flushPromises();
    expect(wrapper.text()).toContain('11');
    wrapper.unmount();
  });

  it('render 返回字符串按文本渲染，不再解析为组件名', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { wrapper } = await mountProTable({
      table: useTable({
        columns: [
          {
            prop: 'a',
            label: 'A',
            // 返回原始字符串（含特殊字符），不作为组件/标签名解析
            render: ({ cellValue }: any) => cellValue ?? '<unknown-tag>',
          },
        ] as any,
        data: [{ a: 'v1' }, {}],
      }),
    });
    await flushPromises();
    expect(wrapper.text()).toContain('v1');
    expect(wrapper.text()).toContain('<unknown-tag>');
    const noise = [...errorSpy.mock.calls, ...warnSpy.mock.calls]
      .flat()
      .map(String)
      .join('\n');
    expect(noise).not.toContain('Failed to resolve');
    wrapper.unmount();
  });

  it('render 返回 VNode / 组件定义仍正常渲染', async () => {
    const { wrapper } = await mountProTable({
      table: useTable({
        columns: [
          {
            prop: 'a',
            label: 'A',
            render: () => h('em', { class: 'r4-vnode-marker' }, 'V'),
          },
        ] as any,
        data: [{ a: 'ignored' }],
      }),
    });
    await flushPromises();
    expect(wrapper.find('em.r4-vnode-marker').exists()).toBe(true);
    wrapper.unmount();
  });

  it('getter 形式 hidden 随取值动态生效', async () => {
    const flag = ref(true);
    const form = useForm({}, [
      { path: 'a', label: '甲', component: 'input' },
      { path: 'b', label: '乙', component: 'input', hidden: () => flag.value },
    ] as any);
    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapper.text()).not.toContain('乙');
    flag.value = false;
    await flushPromises();
    expect(wrapper.text()).toContain('乙');
    wrapper.unmount();
  });

  it('全部搜索字段隐藏时不渲染搜索区（防回归）', async () => {
    const table = useTable({
      columns: [{ prop: 'id', label: 'ID' }] as any,
      data: [],
      searchFields: [
        { path: 'kw', label: '关键词', component: 'input', hidden: true },
      ] as any,
    });
    const { wrapper } = await mountProTable({ table });
    await flushPromises();
    expect(wrapper.find('.pro-table_search-form').exists()).toBe(false);
    table.searchForm.setField('kw' as any, { hidden: false });
    await flushPromises();
    expect(wrapper.find('.pro-table_search-form').exists()).toBe(true);
    wrapper.unmount();
  });

  it('先结束的旧请求不会熄灭新请求的 loading', async () => {
    const resolvers: Array<() => void> = [];
    const search = vi
      .fn()
      .mockImplementation(() => new Promise<void>(r => resolvers.push(r)));
    const { wrapper } = await mountProTable({
      search,
      columns: [{ prop: 'id', label: 'ID' }],
      data: [],
    });
    (wrapper.vm as any).search();
    (wrapper.vm as any).search();
    await flushPromises();

    resolvers[0]();
    await flushPromises();
    expect((wrapper.findComponent(ProTable) as any).vm.loading).toBe(true);

    resolvers[1]();
    await flushPromises();
    expect((wrapper.findComponent(ProTable) as any).vm.loading).toBe(false);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // [判别] 宿主标识键优先于 path：prop 覆盖 path，值绑定与字段查找共用同一标识
  // ----------------------------------------------------
  it('[判别] 宿主标识键优先于 path：prop 覆盖 path，值绑定与字段查找共用同一标识', async () => {
    const form = useForm({ a: '', b: '' }, [
      { prop: 'a', path: 'b', component: 'input' },
    ] as any);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    await wrapper.find('input').setValue('x');
    await flushPromises();

    expect(form.getFormData('a')).toBe('x');
    expect(form.getFormData('b')).toBe('');
    expect(!!form.getField('a')).toBe(true);
    expect(!!form.getField('b')).toBe(false);

    // 直接调用 useFields 时同样按宿主标识键解析
    const fields = useFields([{ prop: 'a', path: 'b' } as any]);
    expect(!!fields.getField('a')).toBe(true);
    expect(!!fields.getField('b')).toBe(false);

    wrapper.unmount();
  });
});
