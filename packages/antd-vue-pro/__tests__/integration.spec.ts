import { describe, it, expect } from 'vitest';
import { h } from 'vue';
import { mount } from '@vue/test-utils';
import { FormItem } from 'ant-design-vue';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import ProTable from '../src/components/table/components/ProTable.vue';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import { useTable } from '../src/components/table/hooks/useTable';
import { flushPromises } from './helpers/mount';
import { createBasicColumns, createNestedFields } from './helpers/fixtures';

describe('全链路集成与端到端协同测试', () => {
  // ----------------------------------------------------
  // IT-01: 完整表单填写与双向数据流闭环
  // ----------------------------------------------------
  it('IT-01: 完整表单数据填写、formatter 转换与提交校验流程', async () => {
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

    // 1. 用户输入用户名
    const nameInput = wrapper.find('input');
    await nameInput.setValue('admin');
    await flushPromises();

    expect(form.getFormData('username')).toBe('admin');

    // 2. 校验通过路径：validate() resolve 出表单当前值（含未触碰的 age 初值）
    await expect(form.formRef.value?.validate()).resolves.toEqual({
      username: 'admin',
      age: 18,
    });

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // IT-01b [判别]: 点分 path → FormItem name 段数组驱动校验，required 未填时 reject 并渲染错误文案
  // ----------------------------------------------------
  it('IT-01b [判别]: 点分 path 映射为 FormItem name 段数组，required 失败时 validate() reject 且错误文案渲染', async () => {
    const form = useForm(
      { user: { name: '', address: { city: '' } } },
      createNestedFields()
    );

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    // 点分 path 不落在单个 name 上，而是拆为段数组交给宿主 FormItem
    expect(
      wrapper.findAllComponents(FormItem).map(item => item.props('name'))
    ).toEqual([
      ['user', 'name'],
      ['user', 'address', 'city'],
    ]);

    // 失败路径：required 未填 → validate() reject
    const validated = form.formRef.value?.validate();
    await expect(validated).rejects.toBeTruthy();

    // errorFields 按段数组归位且携带字段级文案（数量与顺序精确）
    const rejection: any = await validated?.catch((error: any) => error);
    expect(
      rejection?.errorFields.map((field: any) => [field.name, field.errors])
    ).toEqual([
      [['user', 'name'], ['请输入用户名']],
      [['user', 'address', 'city'], ['请输入城市']],
    ]);
    await flushPromises();
    expect(
      wrapper.findAll('.ant-form-item-explain-error').map(el => el.text())
    ).toEqual(['请输入用户名', '请输入城市']);

    // 补齐两个必填字段的值：同一表单校验通过，resolve 出嵌套结构表单值
    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('张三');
    await inputs[1].setValue('北京');
    await flushPromises();
    await expect(form.formRef.value?.validate()).resolves.toEqual({
      user: { name: '张三', address: { city: '北京' } },
    });

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // IT-02: 表格搜索联动（搜索条件 -> 分页重置为 1 -> 触发 search）
  // ----------------------------------------------------
  it('IT-02: 搜索表单输入条件并点击查询，分页自动重置为 1 且携带搜索参数', async () => {
    let capturedParams: any = null;
    const handleSearch = async () => {
      capturedParams = {
        ...table.searchForm?.formData,
        ...table.pageParam,
      };
    };

    const table = useTable({
      columns: createBasicColumns(),
      dataSource: [],
      searchFields: [{ path: 'keyword', label: '关键词', component: 'input' }],
    });

    // 初始将页码设为 3
    table.setPageParam({ current: 3 });

    const wrapper = mount(ProTable, {
      props: {
        table,
        search: handleSearch,
      },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    // 1. 在搜索框输入关键词
    const searchInput = wrapper.find('.pro-table_search-form input');
    await searchInput.setValue('核心用户');
    await flushPromises();

    // 2. 点击查询按钮
    const queryBtn = wrapper.find('.pro-table_search-form_search-button');
    await queryBtn.trigger('click');
    await flushPromises();

    // 验证：分页归 1，且 search 函数收到了最新的搜索条件与分页参数
    expect(table.pageParam.current).toBe(1);
    expect(capturedParams.keyword).toBe('核心用户');
    expect(capturedParams.current).toBe(1);

    wrapper.unmount();
    document.body.innerHTML = '';
  });

  // ----------------------------------------------------
  // IT-03: 表格重置联动（重置表单 + 重置分页 + 触发 search）
  // ----------------------------------------------------
  it('IT-03: 点击重置按钮，表单参数清空、分页重置为 1 并触发查询', async () => {
    let searchCount = 0;
    const handleSearch = async () => {
      searchCount++;
    };

    const table = useTable({
      columns: createBasicColumns(),
      dataSource: [],
      searchFields: [{ path: 'keyword', label: '关键词', component: 'input' }],
    });

    table.searchForm.setFormData('keyword', '要被清空的词');
    table.setPageParam({ current: 4 });

    const wrapper = mount(ProTable, {
      props: {
        table,
        search: handleSearch,
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
    // 判别点：重置恰好触发一次查询
    expect(searchCount).toBe(1);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // IT-04: 多语言全局切换联动
  // ----------------------------------------------------
  it('IT-04: 全局 Provider 自定义文案实时覆盖各子组件', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      dataSource: [],
      searchFields: [{ path: 'name', component: 'input' }],
    });

    const wrapper = mount(ProComponentProvider, {
      props: {
        locale: {
          'table.query': 'Search Now',
          'table.reset': 'Clear All',
        },
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
