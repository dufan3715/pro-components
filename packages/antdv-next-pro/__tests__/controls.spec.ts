import { describe, it, expect, vi } from 'vitest';
import { computed, defineComponent, h, isRef, markRaw, ref, toRaw } from 'vue';
import { mount } from '@vue/test-utils';
import SizeControl from '../src/components/table/components/SizeControl.vue';
import ColumnControl from '../src/components/table/components/ColumnControl.vue';
import ProTable from '../src/components/table/components/ProTable.vue';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import { useTable } from '../src/components/table/hooks/useTable';
import { useForm } from '../src/components/form/hooks/useForm';
import { flushPromises } from './helpers/mount';
import { createBasicColumns } from './helpers/fixtures';
import { Dropdown, Input } from '../src/shared/ui';

describe('控制组件与全局 Provider 测试', () => {
  // ----------------------------------------------------
  // SC-A13 [判别]: SizeControl 挂载时不静默回写父级 v-model
  // ----------------------------------------------------
  it('SC-A13 [判别]: SizeControl 挂载时不静默向父级发出 update:size 事件', async () => {
    const onUpdateSize = vi.fn();

    const wrapper = mount(SizeControl, {
      props: {
        'onUpdate:size': onUpdateSize,
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    // 关键判别点：挂载期保持静默，不污染父级未绑定的状态
    expect(onUpdateSize).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // SC-01 [判别]: SizeControl 尺寸切换菜单交互
  // ----------------------------------------------------
  it('SC-01 [判别]: 展开尺寸菜单并点击「紧凑」项触发一次 update:size', async () => {
    let currentSize: any = 'large';

    const wrapper = mount(SizeControl, {
      props: {
        size: currentSize,
        'onUpdate:size': (val: any) => {
          currentSize = val;
        },
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    // Menu 位于 Dropdown 惰性浮层内：先展开弹层，再从真实 DOM 点击菜单项
    const dropdown = wrapper.findComponent(Dropdown);
    expect(dropdown.exists()).toBe(true);
    await wrapper.find('.pro-table_size-control_button').trigger('mouseenter');
    await new Promise(resolve => setTimeout(resolve, 300));
    await flushPromises();

    const menuItems = Array.from(
      document.querySelectorAll<HTMLElement>('.ant-dropdown-menu-item')
    );
    expect(menuItems).toHaveLength(3);
    const smallItem = menuItems.find(item =>
      item.dataset.menuId?.endsWith('-small')
    );
    expect(smallItem).toBeTruthy();
    smallItem!.click();
    await flushPromises();
    expect(currentSize).toBe('small');

    wrapper.unmount();
    document.body.innerHTML = '';
  });

  // ----------------------------------------------------
  // CC-01 [判别]: 列控面板菜单项点击联动 table.setColumn
  // ----------------------------------------------------
  it('CC-01 [判别]: 列控面板中点击列项复选框驱动 table.setColumn 变更列 hidden 状态', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      dataSource: [],
    });

    const wrapper = mount(ColumnControl, {
      props: {
        columns: table.columns.value,
        table,
        // 去掉「全选」项，使面板选项与列一一对应
        columnControl: { disableCheckAll: true },
      },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    expect(table.columns.value.find(c => c.key === 'name')?.hidden).toBeFalsy();

    // 展开面板：默认 trigger 为 hover，等待弹出延迟后从真实 DOM 取菜单项
    await wrapper
      .find('.pro-table_column-control_button')
      .trigger('mouseenter');
    await new Promise(resolve => setTimeout(resolve, 300));
    await flushPromises();

    const menuItems = Array.from(
      document.querySelectorAll<HTMLElement>('.ant-dropdown-menu-item')
    );
    expect(menuItems.map(item => item.textContent)).toEqual([
      'ID',
      '姓名',
      '状态',
    ]);

    // 取消勾选「姓名」列：仅该列 hidden 置位
    const nameItem = menuItems.find(item => item.textContent?.includes('姓名'));
    expect(nameItem).toBeTruthy();
    nameItem!
      .querySelector<HTMLInputElement>('input[type="checkbox"]')!
      .click();
    await flushPromises();

    expect(table.columns.value.find(c => c.key === 'name')?.hidden).toBe(true);
    expect(table.columns.value.find(c => c.key === 'id')?.hidden).toBeFalsy();

    wrapper.unmount();
    document.body.innerHTML = '';
  });

  // ----------------------------------------------------
  // CC-04 [判别]: columns 含 null / 原始值项时被过滤，面板项与合法列一一对应且不抛错
  // ----------------------------------------------------
  it('CC-04 [判别]: columns 含 null/原始值项时被过滤，面板项与合法列一一对应', async () => {
    const table = useTable({ columns: createBasicColumns(), dataSource: [] });

    const wrapper = mount(ColumnControl, {
      props: {
        // 运行期注入非对象列项：核心的列规整不覆盖该路径
        columns: [...table.columns.value, null, 'not-a-column'] as any,
        table,
        columnControl: { disableCheckAll: true },
      },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    await wrapper
      .find('.pro-table_column-control_button')
      .trigger('mouseenter');
    await new Promise(resolve => setTimeout(resolve, 300));
    await flushPromises();

    const menuItems = Array.from(
      document.querySelectorAll<HTMLElement>('.ant-dropdown-menu-item')
    );
    expect(menuItems.map(item => item.textContent)).toEqual([
      'ID',
      '姓名',
      '状态',
    ]);

    wrapper.unmount();
    document.body.innerHTML = '';
  });

  // ----------------------------------------------------
  // CC-02: ColumnControl excludedKeys 排除列
  // ----------------------------------------------------
  it('CC-02: excludedKeys 中指定的列不在控制列表项中生成', async () => {
    const table = useTable({
      columns: [
        { key: 'id', title: 'ID' },
        { key: 'name', title: '姓名' },
        { key: 'secret', title: '机密列' },
      ],
      dataSource: [],
    });

    const wrapper = mount(ColumnControl, {
      props: {
        columns: table.columns.value,
        table,
        columnControl: {
          excludedKeys: ['secret'],
        },
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    // 验证 checkedColumnsOptions 已经排除了 secret 列，且默认排除 __INDEX__ 序号列
    const vm = wrapper.vm as any;
    expect(
      vm.checkedColumnsOptions.some((opt: any) => opt.value === 'secret')
    ).toBe(false);
    expect(
      vm.checkedColumnsOptions.some((opt: any) => opt.value === '__INDEX__')
    ).toBe(false);
    expect(
      vm.checkedColumnsOptions.some((opt: any) => opt.value === 'name')
    ).toBe(true);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // ----------------------------------------------------
  // CC-A2 [判别]: 无 key 或无 title 的列不进入列控面板
  // ----------------------------------------------------
  it('CC-A2 [判别]: 无 key 与无 title 的列均不出现在列控面板选项中', async () => {
    // 直接传入未经理化的原始列配置（经 core useTable 的列会自动补齐 key 与 title）
    const wrapper = mount(ColumnControl, {
      props: {
        columns: [
          { key: 'id', title: 'ID' },
          { title: '无键列' },
          { key: 'noTitle' },
          { key: '', title: '空串键列' },
        ] as any,
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    const options = (wrapper.vm as any).checkedColumnsOptions;

    // 判别点：仅「既有 key 又有 title」的列进入面板，缺任一者均被过滤
    expect(options.map((opt: any) => opt.value)).toEqual(['id']);
    expect(options.map((opt: any) => opt.label)).toEqual(['ID']);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PC-A1 [判别]: ProComponentProvider componentVars 动态修改响应式生效
  // ----------------------------------------------------
  it('PC-A1 [判别]: 运行期动态修改 Provider 的 componentVars，子组件立即响应新配置', async () => {
    const form = useForm({}, [{ path: 'username', component: 'input' }]);

    const currentPlaceholder = ref('初始占位符');

    const Parent = defineComponent({
      setup() {
        return () =>
          h(
            ProComponentProvider,
            {
              componentVars: {
                input: { placeholder: currentPlaceholder.value },
              },
            },
            {
              default: () => h(ProForm, { form }),
            }
          );
      },
    });

    const wrapper = mount(Parent, {
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    const inputComp = wrapper.findComponent(Input);
    expect(inputComp.props('placeholder')).toBe('初始占位符');

    // 动态修改 componentVars
    currentPlaceholder.value = '更新后的占位符';
    await flushPromises();

    expect(inputComp.props('placeholder')).toBe('更新后的占位符');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PC-02: 自定义 componentMap 替换内置组件
  // ----------------------------------------------------
  it('PC-02: 通过 componentMap 能够将内置组件替换为自定义组件', async () => {
    const CustomInput = defineComponent({
      props: ['value'],
      setup(props) {
        return () => h('div', { class: 'brand-new-input' }, props.value);
      },
    });

    const form = useForm({ title: 'Hello' }, [
      { path: 'title', component: 'input' },
    ]);

    const wrapper = mount(ProComponentProvider, {
      props: {
        componentMap: {
          input: markRaw(CustomInput),
        },
      },
      slots: {
        default: () => h(ProForm, { form }),
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    expect(wrapper.find('.brand-new-input').exists()).toBe(true);
    expect(wrapper.find('.brand-new-input').text()).toBe('Hello');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PC-03: locale 自定义覆盖
  // ----------------------------------------------------
  it('PC-03: 支持通过 locale prop 自定义覆盖多语言文案', async () => {
    const form = useForm({}, [{ path: 'name', component: 'input' }]);

    const wrapper = mount(ProComponentProvider, {
      props: {
        locale: {
          'input.placeholder': '自定义全局占位符',
        },
      },
      slots: {
        default: () => h(ProForm, { form }),
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    const inputComp = wrapper.findComponent(Input);
    expect(inputComp.props('placeholder')).toBe('自定义全局占位符');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PC-04: 动态扩展非内置 key 注入
  // ----------------------------------------------------
  it('PC-04: 支持在 componentVars 中注入扩展组件的自定义属性', async () => {
    const form = useForm({}, [
      { path: 'customTag', component: 'custom-tag-widget' as any },
    ]);

    const CustomWidget = defineComponent({
      props: ['colorTag'],
      setup(props) {
        return () => h('span', { class: 'custom-colored-tag' }, props.colorTag);
      },
    });

    const wrapper = mount(ProComponentProvider, {
      props: {
        componentMap: {
          'custom-tag-widget': markRaw(CustomWidget),
        } as any,
        componentVars: {
          'custom-tag-widget': { colorTag: 'cyan-blue' },
        } as any,
      },
      slots: {
        default: () => h(ProForm, { form: form as any }),
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    expect(wrapper.find('.custom-colored-tag').text()).toBe('cyan-blue');
    wrapper.unmount();
  });
  // ----------------------------------------------------
  // CC-03 [判别]: 勾选操作仅写 hidden 真实翻转的列，未变化列不被重写
  // ----------------------------------------------------
  it('CC-03 [判别]: 勾选/取消单列时仅该列触发 setColumn，其余列不被写入', async () => {
    const table = useTable({
      columns: [
        { key: 'a', title: 'A' },
        { key: 'b', title: 'B' },
        { key: 'c', title: 'C' },
      ],
      dataSource: [],
    });
    // spy：包装 table.setColumn 计数
    const setColumnCalls: string[] = [];
    const rawSetColumn = table.setColumn.bind(table);
    (table as any).setColumn = (key: any, column: any, opts?: any) => {
      setColumnCalls.push(String(key));
      return rawSetColumn(key, column, opts);
    };

    const wrapper = mount(ColumnControl, {
      props: { columns: table.columns.value, table },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    const vm = wrapper.vm as any;

    // 场景1：取消勾选列 b —— 旧实现会对 a/b/c 全部 setColumn，新实现仅写 b
    setColumnCalls.length = 0;
    vm.checkedColumnKeys = vm.checkedColumnKeys.filter(
      (k: string) => k !== 'b'
    );
    await flushPromises();
    expect(setColumnCalls).toEqual(['b']);
    expect(table.columns.value.find(c => c.key === 'b')?.hidden).toBe(true);
    expect(table.columns.value.find(c => c.key === 'a')?.hidden).toBeFalsy();

    // 场景2：恢复勾选 b —— 仅写 b
    setColumnCalls.length = 0;
    vm.checkedColumnKeys = [...vm.checkedColumnKeys, 'b'];
    await flushPromises();
    expect(setColumnCalls).toEqual(['b']);
    expect(table.columns.value.find(c => c.key === 'b')?.hidden).toBeFalsy();

    // 场景3：写入与当前一致的状态 —— 零写入（幂等无副作用）
    setColumnCalls.length = 0;
    vm.checkedColumnKeys = [...vm.checkedColumnKeys];
    await flushPromises();
    expect(setColumnCalls).toEqual([]);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // SC-A15 [判别]: 高亮项与表格实际使用的尺寸一致（Provider 注入 / 控件回写 / 显式绑定）
  // ----------------------------------------------------
  it('SC-A15 [判别]: Provider 注入 size 时高亮项跟随注入值，控件回写优先于注入', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      dataSource: [],
    });
    const mountWithProvider = () =>
      mount(ProComponentProvider, {
        props: {
          componentVars: {
            'pro-table': { size: 'small', control: { sizeControl: true } },
          },
        },
        slots: { default: () => h(ProTable, { table }) },
        global: { stubs: { transition: false } },
      });

    // ① Provider 注入 size：表格与高亮同步为注入值，本地模型未被静默拉回默认
    const injected = mountWithProvider();
    await flushPromises();
    let sizeControl = injected.findComponent(SizeControl);
    expect(injected.findComponent({ name: 'ATable' }).props('size')).toBe(
      'small'
    );
    expect((sizeControl.vm as any).currentSize).toBe('small');

    // 渲染层：展开菜单，被选中项与表格有效尺寸一致
    await injected.find('.pro-table_size-control_button').trigger('mouseenter');
    await new Promise(resolve => setTimeout(resolve, 300));
    await flushPromises();
    const selected = document.querySelector<HTMLElement>(
      '.ant-dropdown-menu-item-selected'
    );
    expect(selected?.dataset.menuId?.endsWith('-small')).toBe(true);
    injected.unmount();
    document.body.innerHTML = '';

    // ② 用户经控件改尺寸：回写值优先于 Provider 注入，表格与高亮同步跟随
    const clicked = mountWithProvider();
    await flushPromises();
    sizeControl = clicked.findComponent(SizeControl);
    await clicked.find('.pro-table_size-control_button').trigger('mouseenter');
    await new Promise(resolve => setTimeout(resolve, 300));
    await flushPromises();
    const middleItem = Array.from(
      document.querySelectorAll<HTMLElement>('.ant-dropdown-menu-item')
    ).find(item => item.dataset.menuId?.endsWith('-middle'));
    expect(middleItem).toBeTruthy();
    middleItem!.click();
    await flushPromises();

    expect(clicked.findComponent({ name: 'ATable' }).props('size')).toBe(
      'middle'
    );
    expect((sizeControl.vm as any).currentSize).toBe('middle');
    clicked.unmount();
    document.body.innerHTML = '';

    // ③ 显式绑定 size：表格与高亮跟随显式值
    const explicit = mount(ProTable, {
      props: { table, size: 'middle', control: { sizeControl: true } },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(explicit.findComponent({ name: 'ATable' }).props('size')).toBe(
      'middle'
    );
    expect((explicit.findComponent(SizeControl).vm as any).currentSize).toBe(
      'middle'
    );
    explicit.unmount();
  });

  // ----------------------------------------------------
  // PC-A2 [判别]: 嵌套空 Provider 继承外层 componentVars / componentMap / locale
  // ----------------------------------------------------
  it('PC-A2 [判别]: 嵌套空 Provider 继承外层 componentVars、componentMap 与 locale', async () => {
    const CustomInput = defineComponent({
      props: ['value', 'placeholder'],
      setup(props) {
        return () =>
          h('input', {
            class: 'nested-brand-input',
            value: props.value,
            placeholder: props.placeholder,
          });
      },
    });
    const form = useForm({ title: '' }, [
      { path: 'title', component: 'input' },
    ]);
    const table = useTable({
      columns: [{ dataIndex: 'id', title: 'ID' }],
      dataSource: [],
      searchFields: [{ path: 'keyword', label: '关键词', component: 'input' }],
    });
    const Inner = defineComponent({
      setup:
        (_, { slots }) =>
        () =>
          h(ProComponentProvider, null, slots),
    });

    const wrapper = mount(ProComponentProvider, {
      props: {
        componentMap: { input: markRaw(CustomInput) },
        componentVars: { input: { placeholder: 'OUTER-PH' } },
        locale: { 'table.query': 'OUTER-QUERY' },
      },
      slots: {
        default: () =>
          h(Inner, null, {
            default: () => [h(ProForm, { form }), h(ProTable, { table })],
          }),
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const brandInput = wrapper.find('.nested-brand-input');
    expect(brandInput.exists()).toBe(true);
    expect(brandInput.attributes('placeholder')).toBe('OUTER-PH');
    expect(wrapper.find('.pro-table_search-form_search-button').text()).toBe(
      'OUTER-QUERY'
    );

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // PC-A3 [判别]: 嵌套 Provider 同名键覆盖外层，未覆盖键与外层映射继续生效
  // ----------------------------------------------------
  it('PC-A3 [判别]: 嵌套 Provider 覆盖同名键时保留兄弟键与外层 componentMap', async () => {
    const CustomInput = defineComponent({
      props: ['value', 'placeholder'],
      setup(props) {
        return () =>
          h('input', {
            class: 'nested-brand-input',
            value: props.value,
            placeholder: props.placeholder,
          });
      },
    });
    const form = useForm({ title: '' }, [
      { path: 'title', component: 'input' },
    ]);
    const table = useTable({
      columns: [{ dataIndex: 'id', title: 'ID' }],
      dataSource: [],
      searchFields: [{ path: 'keyword', label: '关键词', component: 'input' }],
    });
    const Inner = defineComponent({
      setup:
        (_, { slots }) =>
        () =>
          h(
            ProComponentProvider,
            {
              componentVars: { input: { placeholder: 'INNER-PH' } },
              locale: { 'table.query': 'INNER-QUERY' },
            },
            slots
          ),
    });

    const wrapper = mount(ProComponentProvider, {
      props: {
        componentMap: { input: markRaw(CustomInput) },
        componentVars: { input: { placeholder: 'OUTER-PH' } },
        locale: {
          'table.query': 'OUTER-QUERY',
          'table.reset': 'OUTER-RESET',
        },
      },
      slots: {
        default: () =>
          h(Inner, null, {
            default: () => [h(ProForm, { form }), h(ProTable, { table })],
          }),
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const brandInput = wrapper.find('.nested-brand-input');
    expect(brandInput.exists()).toBe(true);
    expect(brandInput.attributes('placeholder')).toBe('INNER-PH');
    expect(wrapper.find('.pro-table_search-form_search-button').text()).toBe(
      'INNER-QUERY'
    );
    expect(wrapper.find('.pro-table_search-form_reset-button').text()).toBe(
      'OUTER-RESET'
    );

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // CC-A3 [判别]: 只读 ref 的 hidden 列经列控切换后写入生效
  // ----------------------------------------------------
  it('CC-A3 [判别]: hidden 为只读 ref 的列经列控取消勾选后真实隐藏', async () => {
    const hiddenComputed = computed(() => false);
    const table = useTable({
      columns: [
        {
          dataIndex: 'name',
          key: 'name',
          title: '姓名',
          hidden: hiddenComputed,
        },
        { dataIndex: 'age', key: 'age', title: '年龄' },
      ] as any,
      dataSource: [],
    });
    const wrapper = mount(ColumnControl, {
      props: { columns: table.columns.value, table },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const vm = wrapper.vm as any;
    expect(
      vm.checkedColumnsOptions.find((opt: any) => opt.value === 'name')
    ).toMatchObject({ checked: true });

    // 取消勾选：ref 被普通值替换后写入
    vm.checkedColumnKeys = ['age'];
    await flushPromises();
    const nameColumn = table.columns.value.find(
      (item: any) => item.key === 'name'
    ) as any;
    expect(nameColumn.hidden).toBe(true);
    expect(isRef(toRaw(nameColumn).hidden)).toBe(false);

    // 再次勾选恢复展示
    vm.checkedColumnKeys = ['name', 'age'];
    await flushPromises();
    expect(
      (table.columns.value.find((item: any) => item.key === 'name') as any)
        .hidden
    ).toBe(false);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // CC-A4 [判别]: 列控菜单行整行点击切换列，disabled 列不响应
  // ----------------------------------------------------
  it('CC-A4 [判别]: 列控菜单行整行点击与勾选框均切换列，disabled 列不响应', async () => {
    const table = useTable({ columns: createBasicColumns(), dataSource: [] });
    const wrapper = mount(ColumnControl, {
      props: {
        columns: table.columns.value,
        table,
        columnControl: { disabledKeys: ['status'] },
      },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 分割线项与其他动态菜单项一样带唯一 key
    expect(
      (wrapper.vm as any).items.find((item: any) => item.type === 'divider')
        ?.key
    ).toBe('divider');

    await wrapper
      .find('.pro-table_column-control_button')
      .trigger('mouseenter');
    await new Promise(resolve => setTimeout(resolve, 300));
    await flushPromises();

    const menuRows = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>('.ant-dropdown-menu-item')
      );
    const rowByText = (text: string) =>
      menuRows().find(item => item.textContent?.includes(text));
    const hiddenOf = (key: string) =>
      (table.columns.value.find(c => c.key === key) as any)?.hidden;

    // 行本体点击即可切换列
    rowByText('姓名')?.click();
    await flushPromises();
    expect(hiddenOf('name')).toBe(true);

    // 勾选框点击仍生效（事件冒泡到菜单行，不重复切换）
    rowByText('姓名')
      ?.querySelector<HTMLInputElement>('input[type="checkbox"]')
      ?.click();
    await flushPromises();
    expect(hiddenOf('name')).toBe(false);

    // disabled 列由 MenuItem 拦截，行点击不改变状态
    rowByText('状态')?.click();
    await flushPromises();
    expect(hiddenOf('status')).toBe(false);

    // 「全选」行本体点击切换全部可勾选列
    rowByText('全选')?.click();
    await flushPromises();
    expect(hiddenOf('id')).toBe(true);
    expect(hiddenOf('name')).toBe(true);
    expect(hiddenOf('status')).toBe(false);

    // 再次点击恢复全选
    rowByText('全选')?.click();
    await flushPromises();
    expect(hiddenOf('id')).toBe(false);
    expect(hiddenOf('name')).toBe(false);

    wrapper.unmount();
    document.body.innerHTML = '';
  });

  // ----------------------------------------------------
  // PC-A4 [判别]: 嵌套 Provider 同一组件键的兄弟属性逐属性继承
  // ----------------------------------------------------
  it('PC-A4 [判别]: 嵌套 Provider 同一组件键的兄弟属性逐属性继承，同名属性内层覆盖', async () => {
    const mountNested = async (innerVars: Record<string, any>) => {
      const form = useForm({}, [{ path: 'a', component: 'input' }]);
      const wrapper = mount(ProComponentProvider, {
        props: {
          componentVars: { input: { placeholder: 'OUTER-PH' } } as any,
        },
        slots: {
          default: () =>
            h(
              ProComponentProvider,
              { componentVars: innerVars as any },
              { default: () => h(ProForm, { form }) }
            ),
        },
        global: { stubs: { transition: false } },
      });
      await flushPromises();
      const merged = (
        form.fields.value[0] as any
      ).getComponentComputedProps?.();
      wrapper.unmount();
      return merged;
    };

    // 内层只覆盖 allowClear：外层的 placeholder 继续生效
    expect(await mountNested({ input: { allowClear: false } })).toMatchObject({
      placeholder: 'OUTER-PH',
      allowClear: false,
    });

    // 内层同名属性覆盖外层
    expect(
      await mountNested({ input: { placeholder: 'INNER-PH' } })
    ).toMatchObject({ placeholder: 'INNER-PH' });
  });
});
