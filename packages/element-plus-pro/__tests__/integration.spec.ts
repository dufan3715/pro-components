import { describe, it, expect, vi } from 'vitest';
import { h } from 'vue';
import { mount } from '@vue/test-utils';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import ProTable from '../src/components/table/components/ProTable.vue';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import { useTable } from '../src/components/table/hooks/useTable';
import { flushPromises } from './helpers/mount';
import { createBasicColumns } from './helpers/fixtures';

describe('全链路集成与端到端协同测试', () => {
  // ----------------------------------------------------
  // IT-01: 完整表单填写与双向数据流闭环
  // ----------------------------------------------------
  it('IT-01: 完整表单数据填写、formatter 转换与提交校验流程', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const form = useForm({ username: '', age: 18 }, [
      {
        path: 'username',
        label: '用户名',
        component: 'input',
        rules: [{ required: true, message: '请输入用户名' }],
      },
      {
        path: 'age',
        label: '年龄',
        component: 'input-number',
        valueFormatter: (val: any) => Number(val),
      },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    try {
      // 1. 校验失败路径：必填项为空时 validate() reject，字段错误态与错误文案渲染
      await expect(form.formRef.value!.validate()).rejects.toMatchObject({
        username: [expect.objectContaining({ message: '请输入用户名' })],
      });
      // 校验失败恰好产生一条 async-validator 告警，无其他噪声
      expect(warnSpy.mock.calls.map(call => String(call[0]))).toEqual([
        'async-validator:',
      ]);
      expect(wrapper.findAll('.el-form-item')[0].classes()).toContain(
        'is-error'
      );
      await vi.waitFor(() =>
        expect(wrapper.find('.el-form-item__error').text()).toBe('请输入用户名')
      );

      // 2. 用户输入用户名，数据闭环落库
      const nameInput = wrapper.find('input');
      await nameInput.setValue('admin');
      await flushPromises();

      expect(form.getFormData('username')).toBe('admin');
      expect(form.getFormData('age')).toBe(18);

      // 3. 校验通过路径：validate() 解析为 true，错误态与错误文案一并清除
      await expect(form.formRef.value!.validate()).resolves.toBe(true);
      expect(wrapper.findAll('.el-form-item')[0].classes()).not.toContain(
        'is-error'
      );
      await vi.waitFor(() =>
        expect(wrapper.find('.el-form-item__error').exists()).toBe(false)
      );
    } finally {
      warnSpy.mockRestore();
      wrapper.unmount();
    }
  });

  // ----------------------------------------------------
  // IT-06 [判别]: 点分 path 字段以同名 prop 驱动宿主校验
  // ----------------------------------------------------
  it('IT-06 [判别]: 点分 path 原样下发 ElFormItem.prop 并驱动嵌套路径校验与错误渲染', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const form = useForm({ address: { city: '' } }, [
      {
        path: 'address.city',
        label: '城市',
        component: 'input',
        rules: [{ required: true, message: '请输入城市' }],
      },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    try {
      // 判别点 1：点分 path 原样作为宿主 FormItem 的 prop（校验取值入口）
      expect(wrapper.findComponent({ name: 'ElFormItem' }).props('prop')).toBe(
        'address.city'
      );

      // 判别点 2：校验失败 reject 的字段键即点分 path，错误文案渲染在对应表单项
      await expect(form.formRef.value!.validate()).rejects.toMatchObject({
        'address.city': expect.any(Array),
      });
      expect(warnSpy.mock.calls.map(call => String(call[0]))).toEqual([
        'async-validator:',
      ]);
      await vi.waitFor(() =>
        expect(wrapper.find('.el-form-item__error').text()).toBe('请输入城市')
      );

      // 判别点 3：写入嵌套路径后同一 prop 校验通过
      form.setFormData('address.city', '杭州');
      await flushPromises();
      await expect(form.formRef.value!.validate()).resolves.toBe(true);
    } finally {
      warnSpy.mockRestore();
      wrapper.unmount();
    }
  });

  // ----------------------------------------------------
  // IT-02: 表格搜索联动（搜索条件 -> 分页重置为 1 -> 触发 search）
  // ----------------------------------------------------
  it('IT-02: 搜索表单输入条件并点击查询，分页自动重置为 1 且携带搜索参数', async () => {
    let capturedParams: any = null;
    const handleSearch = () => {
      capturedParams = {
        ...table.searchForm?.formData,
        ...table.pageParam,
      };
      return Promise.resolve();
    };

    const table = useTable({
      columns: createBasicColumns(),
      data: [],
      searchFields: [{ path: 'keyword', label: '关键词', component: 'input' }],
    });

    // 初始将页码设为 3
    table.setPageParam({ current: 3 });

    const wrapper = mount(ProTable, {
      props: {
        table,
        search: handleSearch as any,
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    // 1. 在搜索框输入关键词
    const searchInput = wrapper.find('.pro-table_search-form input');
    await searchInput.setValue('核心用户');
    await flushPromises();

    // 2. 点击查询按钮（submit 按钮点击引发原生 form submit）
    const queryBtn = wrapper.find('.pro-table_search-form_search-button');
    await queryBtn.trigger('click');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    // 验证：分页归 1，且 search 函数收到了最新的搜索条件与分页参数
    expect(table.pageParam.current).toBe(1);
    expect(capturedParams.keyword).toBe('核心用户');
    expect(capturedParams.current).toBe(1);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // IT-03: 表格重置联动（重置表单 + 重置分页 + 触发 search）
  // ----------------------------------------------------
  it('IT-03: 点击重置按钮，表单参数清空、分页重置为 1 并触发查询', async () => {
    let searchCount = 0;
    const handleSearch = () => {
      searchCount++;
      return Promise.resolve();
    };

    const table = useTable({
      columns: createBasicColumns(),
      data: [],
      searchFields: [{ path: 'keyword', label: '关键词', component: 'input' }],
    });

    table.searchForm.setFormData('keyword', '要被清空的词');
    table.setPageParam({ current: 4 });

    const wrapper = mount(ProTable, {
      props: {
        table,
        search: handleSearch as any,
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    searchCount = 0; // 重置初始挂载触发的计数

    // 点击重置
    const resetBtn = wrapper.find('.pro-table_search-form_reset-button');
    await resetBtn.trigger('click');
    await flushPromises();

    expect(table.searchForm.getFormData('keyword')).toBeUndefined();
    expect(table.pageParam.current).toBe(1);
    expect(searchCount).toBeGreaterThanOrEqual(1);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // IT-04: 多语言全局切换联动
  // ----------------------------------------------------
  it('IT-04: 全局 Provider 自定义文案实时覆盖各子组件', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      data: [],
      searchFields: [{ path: 'name', component: 'input' }],
    });

    const wrapper = mount(ProComponentProvider, {
      props: {
        locale: {
          'table.query': 'Search Now',
          'table.reset': 'Clear All',
        } as any,
      },
      slots: {
        default: () => h(ProTable, { table }),
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    expect(wrapper.find('.pro-table_search-form_search-button').text()).toBe(
      'Search Now'
    );
    expect(wrapper.find('.pro-table_search-form_reset-button').text()).toBe(
      'Clear All'
    );

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // IT-05: 动态字段生命周期（追加字段 -> 渲染 -> 双向绑定 -> 提交）
  // ----------------------------------------------------
  it('IT-05: 运行期动态追加字段，新组件渲染并正常参与数据读写与生命周期', async () => {
    const form = useForm({ fixed: 'init' }, [
      { path: 'fixed', label: '固定字段', component: 'input' },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    expect(wrapper.findAll('input').length).toBe(1);

    // 运行期动态追加一个新字段
    form.appendField(undefined, {
      path: 'dynamicNewField',
      label: '动态新字段',
      component: 'input',
    });
    await flushPromises();

    // 验证新字段已渲染出 input
    const inputs = wrapper.findAll('input');
    expect(inputs.length).toBe(2);

    // 对新字段进行输入
    await inputs[1].setValue('dynamicValue');
    await flushPromises();

    expect(form.getFormData('dynamicNewField')).toBe('dynamicValue');

    wrapper.unmount();
  });
});
