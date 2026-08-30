import { describe, it, expect, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import SizeControl from '../src/components/table/components/SizeControl.vue';
import ColumnControl from '../src/components/table/components/ColumnControl.vue';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import { useTable } from '../src/components/table/useTable';
import { useForm } from '../src/components/form/hooks/useForm';
import { flushPromises } from './helpers/mount';
import { createBasicColumns } from './helpers/fixtures';
import { ElInput, ElDropdown } from 'element-plus';

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
  // SC-01: SizeControl 尺寸切换菜单交互
  // ----------------------------------------------------
  it('SC-01: 点击尺寸菜单项触发 update:size 事件', async () => {
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

    // 触发内部 dropdown command
    const dropdown = wrapper.findComponent(ElDropdown);
    if (dropdown.exists()) {
      await dropdown.vm.$emit('command', 'small');
      expect(currentSize).toBe('small');
    }

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // CC-01: ColumnControl 列勾选/取消勾选联动 table.setColumn
  // ----------------------------------------------------
  it('CC-01: ColumnControl 勾选与取消联动 table.setColumn 变更列 hidden 状态', async () => {
    const table = useTable({
      columns: createBasicColumns(),
      data: [],
    });

    const wrapper = mount(ColumnControl, {
      props: {
        columns: table.columns.value,
        table,
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    // 验证初始列未隐藏
    expect(
      table.columns.value.find(c => (c.prop || c.key) === 'name')?.hidden
    ).toBeFalsy();

    // 操作 table 隐藏列
    table.setColumn('name', { hidden: true });
    await flushPromises();
    expect(
      table.columns.value.find(c => (c.prop || c.key) === 'name')?.hidden
    ).toBe(true);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // CC-02: ColumnControl excludedKeys 排除列
  // ----------------------------------------------------
  it('CC-02: excludedKeys 中指定的列不在控制列表项中生成', async () => {
    const table = useTable({
      columns: [
        { prop: 'id', label: 'ID' },
        { prop: 'name', label: '姓名' },
        { prop: 'secret', label: '机密列' },
      ],
      data: [],
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
  // CC-A1 [判别]: ColumnControl 列标题 VNode/函数时安全降级，且 labels 优先
  // ----------------------------------------------------
  it('CC-A1 [判别]: ColumnControl 列标题为 VNode 时安全降级不产生 [object Object]，且 labels 配置优先', async () => {
    const table = useTable({
      columns: [
        {
          prop: 'vnodeCol',
          label: h('span', { class: 'custom-header' }, '自定义表头'),
        } as any,
        { prop: 'fnCol', label: () => '函数表头' } as any,
        { key: 'customAlias', label: '原标题' } as any,
        { key: 'noPropOrLabel' } as any,
      ],
      data: [],
    });

    const wrapper = mount(ColumnControl, {
      props: {
        columns: table.columns.value,
        table,
        columnControl: {
          labels: {
            customAlias: '自定义别名',
          },
        },
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    const vm = wrapper.vm as any;
    const options = vm.checkedColumnsOptions;

    // VNode 列安全降级为 prop 名称，绝不为 [object Object]
    const vnodeOpt = options.find((o: any) => o.value === 'vnodeCol');
    expect(vnodeOpt?.label).toBe('vnodeCol');
    expect(vnodeOpt?.label).not.toContain('[object Object]');

    // 函数列安全降级为 prop 名称
    const fnOpt = options.find((o: any) => o.value === 'fnCol');
    expect(fnOpt?.label).toBe('fnCol');

    // labels 自定义别名优先覆盖
    const aliasOpt = options.find((o: any) => o.value === 'customAlias');
    expect(aliasOpt?.label).toBe('自定义别名');

    // 无 label 无 prop 列降级为 key
    const fallbackOpt = options.find((o: any) => o.value === 'noPropOrLabel');
    expect(fallbackOpt?.label).toBe('noPropOrLabel');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // CC-A2 [判别]: 无 key/prop 列不进入列控面板
  // ----------------------------------------------------
  it('CC-A2 [判别]: 无 key 且无 prop 的列不出现在列控面板选项中', async () => {
    // 直接传入未经理化的原始列配置（经 core useTable 的列会自动补齐 key）
    const wrapper = mount(ColumnControl, {
      props: {
        columns: [
          { prop: 'id', label: 'ID' },
          { label: '无键列' },
          { key: '', label: '空串键列' },
        ] as any,
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    const options = (wrapper.vm as any).checkedColumnsOptions;

    // 有 key 列正常出现
    expect(options.some((opt: any) => opt.value === 'id')).toBe(true);
    // 判别点：无键列不生成合成序号 key（__col_N）进入面板
    expect(
      options.some((opt: any) => String(opt.value).startsWith('__col_'))
    ).toBe(false);
    expect(options.length).toBe(1);

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
    const inputComp = wrapper.findComponent(ElInput);
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
      props: ['modelValue'],
      setup(props) {
        return () => h('div', { class: 'brand-new-input' }, props.modelValue);
      },
    });

    const form = useForm({ title: 'Hello' }, [
      { path: 'title', component: 'input' },
    ]);

    const wrapper = mount(ProComponentProvider, {
      props: {
        componentMap: {
          input: CustomInput,
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
        } as any,
      },
      slots: {
        default: () => h(ProForm, { form }),
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    const inputComp = wrapper.findComponent(ElInput);
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
          'custom-tag-widget': CustomWidget,
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
});
