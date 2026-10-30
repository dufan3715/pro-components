import { describe, it, expect, vi } from 'vitest';
import { computed, defineComponent, h, markRaw, ref } from 'vue';
import { mount } from '@vue/test-utils';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';
import BaseField from '../src/components/form/components/BaseField/index.vue';
import ContainerFragment from '../src/components/form/components/ContainerFragment/index.vue';
import BaseFormItem from '../src/components/form/components/BaseFormItem/index.vue';
import BaseFormItems from '../src/components/form/components/BaseFormItems/index.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import { flushPromises } from './helpers/mount';
import { FormItem } from 'ant-design-vue';
import type { Field } from '../src/components/form/types';

describe('BaseFormItems 组件测试', () => {
  // ----------------------------------------------------
  // BI-A3 [判别]: WeakMap 实例绑定，直接变异 fields.value.splice 不发生索引错位
  // ----------------------------------------------------
  it('BI-A3 [判别]: 字段变异 splice/重排后，getFormItemRef 与 getComponentRef 精准绑定自身实例', async () => {
    const f1: Field = { path: 'field1', label: '字段1', component: 'input' };
    const f2: Field = { path: 'field2', label: '字段2', component: 'input' };
    const f3: Field = { path: 'field3', label: '字段3', component: 'input' };

    const form = useForm({}, [f1, f2, f3]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    // 挂载后各字段获得 getFormItemRef
    const f1Ref = (f1 as any).getFormItemRef?.();
    const f2Ref = (f2 as any).getFormItemRef?.();
    const f3Ref = (f3 as any).getFormItemRef?.();

    expect(f1Ref).toBeDefined();
    expect(f2Ref).toBeDefined();
    expect(f3Ref).toBeDefined();
    expect(f1Ref).not.toBe(f2Ref);

    // 直接变异 fields: 删除头部 f1
    form.fields.value.splice(0, 1);
    await flushPromises();

    // 关键判别点：f2 虽移动到了索引 0，但 getFormItemRef 依然指向 f2Ref 自身实例，绝不发生索引错位变成 f1Ref
    expect((f2 as any).getFormItemRef?.()).toBe(f2Ref);
    expect((f3 as any).getFormItemRef?.()).toBe(f3Ref);

    // 字段重排：把 f3 移到 f2 前面
    form.fields.value = [f3, f2];
    await flushPromises();

    expect((f2 as any).getFormItemRef?.()).toBe(f2Ref);
    expect((f3 as any).getFormItemRef?.()).toBe(f3Ref);

    wrapper.unmount();
    await flushPromises();

    // 卸载后从 WeakMap 清理
    expect((f2 as any).getFormItemRef?.()).toBeUndefined();
  });

  // ----------------------------------------------------
  // BI-A4 [判别]: 卸载后字段对象上的注入访问器同步删除
  // ----------------------------------------------------
  it('BI-A4 [判别]: 字段卸载后 getFormItemRef 等注入访问器从字段对象上删除', async () => {
    const f1: Field = { path: 'field1', label: '字段1', component: 'input' };
    const f2: Field = { path: 'field2', label: '字段2', component: 'input' };

    const form = useForm({}, [f1, f2]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 挂载期字段对象携带注入访问器
    expect(typeof (f1 as any).getFormItemRef).toBe('function');
    expect(typeof (f1 as any).getFormItemComputedProps).toBe('function');
    expect(typeof (f1 as any).getComponentRef).toBe('function');
    expect(typeof (f1 as any).getComponentComputedProps).toBe('function');

    // 删除字段 f1：其 ref 回调以 null 触发清理
    form.fields.value.splice(0, 1);
    await flushPromises();

    // 判别点：访问器属性本身被删除（而非仅返回 undefined）
    expect((f1 as any).getFormItemRef).toBeUndefined();
    expect((f1 as any).getFormItemComputedProps).toBeUndefined();
    expect((f1 as any).getComponentRef).toBeUndefined();
    expect((f1 as any).getComponentComputedProps).toBeUndefined();
    // 在册字段不受影响
    expect(typeof (f2 as any).getFormItemRef).toBe('function');

    // 整体卸载同理
    wrapper.unmount();
    await flushPromises();
    expect((f2 as any).getFormItemRef).toBeUndefined();
    expect((f2 as any).getComponentComputedProps).toBeUndefined();
  });

  // ----------------------------------------------------
  // BI-A6 [判别]: frozen 字段对象不抛错，访问器挂载失败输出一次性告警
  // ----------------------------------------------------
  it('BI-A6 [判别]: Object.freeze 的字段对象渲染不抛错，访问器挂载失败仅告警一次', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const frozenField: Field = Object.freeze({
        path: 'frozen',
        label: '冻结字段',
        component: 'input',
      });
      const normalField: Field = {
        path: 'normal',
        label: '普通字段',
        component: 'input',
      };

      const form = useForm({}, [frozenField, normalField]);
      const wrapper = mount(ProForm, {
        props: { form },
        global: { stubs: { transition: false } },
      });
      await flushPromises();

      // 判别点 1：渲染不崩溃，两个字段都正常渲染
      expect(wrapper.html()).toContain('冻结字段');
      expect(wrapper.html()).toContain('普通字段');

      // 判别点 2：frozen 字段访问器静默缺失（WeakMap 注册不受影响，但对象不可写故访问器无法挂载）
      expect((frozenField as any).getFormItemRef).toBeUndefined();
      // 普通字段访问器正常挂载
      expect(typeof (normalField as any).getFormItemRef).toBe('function');

      // 判别点 3：告警输出且去重（setFormItemRef + setComponentRef 两轮挂载仅一条）
      const warnCalls = warnSpy.mock.calls
        .map(c => String(c[0]))
        .filter(msg => msg.includes('字段配置对象不可写'));
      expect(warnCalls.length).toBe(1);
      wrapper.unmount();
    } finally {
      warnSpy.mockRestore();
    }
  });
  // ----------------------------------------------------
  // BI-A5 [判别]: 无 path 字段插删后组件实例按对象身份复用，不随数组索引错位
  // ----------------------------------------------------
  it('BI-A5 [判别]: 无 path 字段以稳定对象 key 渲染，头部插入新字段后原字段实例不复用错位', async () => {
    const g1: Field = { label: '分组1', fields: [] };
    const g2: Field = { label: '分组2', fields: [] };

    const form = useForm({}, [g1, g2]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const g1Ref = (g1 as any).getFormItemRef?.();
    const g2Ref = (g2 as any).getFormItemRef?.();
    expect(g1Ref).toBeDefined();
    expect(g2Ref).toBeDefined();

    // 头部插入新的无 path 字段：若 key 退化为数组索引，g2 的组件实例会被 g1 复用错位
    const g0: Field = { label: '分组0', fields: [] };
    form.fields.value.unshift(g0);
    await flushPromises();

    // 判别点：实例与字段对象身份保持绑定，g2 移位后仍持有自身实例而非 g1 的
    expect((g1 as any).getFormItemRef?.()).toBe(g1Ref);
    expect((g2 as any).getFormItemRef?.()).toBe(g2Ref);

    // 中部删除同样不引起错位
    form.fields.value.splice(1, 1); // 删除 g1
    await flushPromises();
    expect((g2 as any).getFormItemRef?.()).toBe(g2Ref);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-01: hidden 过滤
  // ----------------------------------------------------
  it('BI-01: hidden: true 的字段不应被渲染', async () => {
    const form = useForm({}, [
      { path: 'visible1', label: '可见1', component: 'input' },
      { path: 'hidden1', label: '隐藏1', component: 'input', hidden: true },
      { path: 'visible2', label: '可见2', component: 'input' },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    const items = wrapper.findAllComponents(FormItem);
    expect(items.length).toBe(2);
    // 判别点：渲染的字段项与可见字段一一对应，hidden1 不在其列（FormItem 未声明 path，改按其 name 路径断言）
    expect(items.map(i => (i.props('name') as string[]).join('.'))).toEqual([
      'visible1',
      'visible2',
    ]);
    expect(
      wrapper.findAllComponents(BaseField).map(f => f.props('path'))
    ).toEqual(['visible1', 'visible2']);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-02: gridItemProps 属性落位
  // ----------------------------------------------------
  it('BI-02: 开启 grid 布局时，gridItemProps 正确生效', async () => {
    const form = useForm({}, [
      { path: 'name', label: '姓名', component: 'input', span: 12 },
    ]);

    const wrapper = mount(ProForm, {
      props: {
        form,
        grid: true,
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    const col = wrapper.find('.ant-col-12');
    expect(col.exists()).toBe(true);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-03: FormItem 插槽透传 (extra / help)
  // ----------------------------------------------------
  it('BI-03: 支持通过字段配置 slots 透传 extra / help 插槽', async () => {
    const form = useForm({}, [
      {
        path: 'email',
        label: '邮箱',
        component: 'input',
        slots: {
          extra: (() =>
            h('span', { class: 'custom-extra-tip' }, '请输入工作邮箱')) as any,
        },
      },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    const extraEl = wrapper.find('.custom-extra-tip');
    expect(extraEl.exists()).toBe(true);
    expect(extraEl.text()).toBe('请输入工作邮箱');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-04: 自定义 componentContainer
  // ----------------------------------------------------
  it('BI-04: 支持自定义 componentContainer 包裹 FormItem', async () => {
    const CustomBox = defineComponent({
      props: ['path'],
      setup(props, { slots }) {
        return () =>
          h('div', { class: `custom-box-${props.path}` }, slots.default?.());
      },
    });

    const form = useForm({}, [
      {
        path: 'userPhone',
        label: '手机号',
        component: 'input',
        formItemContainer: CustomBox,
      },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    const customContainer = wrapper.find('.custom-box-userPhone');
    expect(customContainer.exists()).toBe(true);
    wrapper.unmount();
  });
  // ----------------------------------------------------
  // BI-07 [判别]: 分组字段默认整行 span 24，显式 span 优先，栅格属性透传
  // ----------------------------------------------------
  it('BI-07 [判别]: 分组字段默认整行 span=24，显式 span/offset 正确透传至栅格容器', async () => {
    const form = useForm({}, [
      {
        label: '默认分组',
        fields: [{ path: 'a', label: 'A', component: 'input' }],
      },
      {
        label: '半宽分组',
        span: 12,
        fields: [{ path: 'b', label: 'B', component: 'input' }],
      },
      {
        label: '带偏移分组',
        span: 8,
        offset: 4,
        fields: [{ path: 'c', label: 'C', component: 'input' }],
      },
    ]);

    const wrapper = mount(ProForm, {
      props: { form, grid: true },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    // 默认分组占满 24 栅格
    expect(wrapper.find('.ant-col-24').exists()).toBe(true);
    // 显式 span 12 的分组
    expect(wrapper.find('.ant-col-12').exists()).toBe(true);
    // 显式 offset 4 的分组（此前分组分支会静默丢弃 offset）
    expect(wrapper.find('.ant-col-offset-4').exists()).toBe(true);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-A15 [判别]: fields 中的 null / undefined 项被忽略（不抛错、不影响合法字段）
  // ----------------------------------------------------
  it('BI-A15 [判别]: fields 含 null/undefined 项时不抛错，合法字段照常渲染', async () => {
    const form = useForm({ a: '' }, [
      null,
      undefined,
      { path: 'a', label: 'A', component: 'input' },
    ] as any);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 仅合法字段被渲染
    expect(wrapper.findAll('input')).toHaveLength(1);
    await wrapper.find('input').setValue('x');
    await flushPromises();
    expect(form.getFormData('a')).toBe('x');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-A15b [判别]: 原始值项仍走兜底分支，渲染 key 不抛 WeakMap 错误
  // ----------------------------------------------------
  it('BI-A15b [判别]: fields 含原始值项时渲染不抛错（key 走非对象回退）', async () => {
    const form = useForm({ a: '' }, [
      'not-a-field',
      { path: 'a', label: 'A', component: 'input' },
    ] as any);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 原始值项被忽略：仅 1 个表单项、1 个输入框，且合法字段可用
    expect(wrapper.findAll('.ant-form-item')).toHaveLength(1);
    const inputs = wrapper.findAll('input');
    expect(inputs).toHaveLength(1);
    await inputs[0].setValue('y');
    await flushPromises();
    expect(form.getFormData('a')).toBe('y');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-A16 [判别]: 字段实例访问器经公开类型可直接访问（无需 as any）
  // ----------------------------------------------------
  it('BI-A16 [判别]: 字段实例访问器在公开类型面可直接访问且运行时可用', async () => {
    const form = useForm({ a: '' }, [
      { path: 'a', label: 'A', component: 'input' },
    ] as any);

    const wrapper = mount(ProForm as any, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 类型层：字段公开类型已声明访问器，以下访问无需断言
    const field: Field = form.fields.value[0] as Field;
    expect(typeof field.getFormItemRef).toBe('function');
    expect(typeof field.getComponentRef).toBe('function');
    // 运行时：实例已挂载
    expect(field.getFormItemRef?.()).toBeTruthy();
    expect(field.getComponentRef?.()).toBeTruthy();
    expect(field.getComponentComputedProps?.()).toBeDefined();

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-A17 [判别]: 同 path 兄弟字段渲染 key 唯一（交换后节点随 key 迁移）
  // ----------------------------------------------------
  it('BI-A17 [判别]: 同 path 兄弟字段渲染 key 唯一，交换后节点随 key 迁移', async () => {
    const form = useForm({ date: '' }, [
      { path: 'date', label: 'A', component: 'input' },
      { path: 'date', label: 'B', component: 'input' },
    ] as any);

    const wrapper = mount(ProForm as any, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const before = wrapper.findAll('.ant-form-item');
    expect(before).toHaveLength(2);
    const elA = before[0].element as HTMLElement;
    const elB = before[1].element as HTMLElement;
    expect(before[0].text()).toContain('A');
    expect(before[1].text()).toContain('B');

    // 交换两个同 path 字段
    const arr = form.fields.value as any[];
    [arr[0], arr[1]] = [arr[1], arr[0]];
    await flushPromises();

    const after = wrapper.findAll('.ant-form-item');
    expect(after).toHaveLength(2);
    // key 唯一时 Vue 迁移既有节点：显示 B / A 的仍是各自的元素
    expect(after[0].element).toBe(elB);
    expect(after[1].element).toBe(elA);
    expect(after[0].text()).toContain('B');
    expect(after[1].text()).toContain('A');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-A20 [判别]: slots 组件对象经 <component :is> 渲染，原始值仍走文本插值
  // ----------------------------------------------------
  it('BI-A20 [判别]: slots 传入组件对象时渲染组件本体，传入字符串时按文本渲染', async () => {
    const CustomExtra = defineComponent({
      setup() {
        return () =>
          h('span', { class: 'slot-comp-extra' }, 'EXTRA-FROM-COMPONENT');
      },
    });

    const form = useForm({}, [
      {
        path: 'email',
        label: '邮箱',
        component: 'input',
        slots: { extra: CustomExtra as any },
      },
      {
        path: 'phone',
        label: '手机号',
        component: 'input',
        slots: { extra: '纯文本提示' as any },
      },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const extras = wrapper.findAll('.ant-form-item-extra');
    expect(extras).toHaveLength(2);
    // 组件对象：渲染组件本体，而非组件对象的序列化文本
    expect(extras[0].find('.slot-comp-extra').exists()).toBe(true);
    expect(extras[0].text()).toBe('EXTRA-FROM-COMPONENT');
    // 原始值：保持文本插值
    expect(extras[1].text()).toBe('纯文本提示');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-A21 [判别]: 显式 span 整体接管栅格，不叠加注入的响应式断点
  // ----------------------------------------------------
  it('BI-A21 [判别]: 字段显式 span 时不渲染注入的响应式断点类，未指定 span 时断点生效', async () => {
    const form = useForm({}, [
      { path: 'explicit', label: '显式', component: 'input', span: 6 },
      { path: 'injected', label: '注入', component: 'input' },
    ]);

    const wrapper = mount(ProComponentProvider, {
      props: {
        componentVars: {
          'pro-form-item': { xs: 24, sm: 12, span: 8 },
        },
      },
      slots: { default: () => h(ProForm, { form, grid: true }) },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const colOf = (path: string) =>
      wrapper
        .find(`[path="${path}"]`)
        .element.closest('.ant-col') as HTMLElement;

    // 显式 span 6：整体接管栅格，注入的断点类不出现
    expect(wrapper.find('[path="explicit"]').exists()).toBe(true);
    const explicitCol = colOf('explicit');
    expect(explicitCol).toBeInstanceOf(HTMLElement);
    expect(explicitCol.className).toContain('ant-col-6');
    expect(explicitCol.className).not.toContain('ant-col-xs-24');
    expect(explicitCol.className).not.toContain('ant-col-sm-12');

    // 未指定 span：使用注入的断点配置
    const injectedCol = colOf('injected');
    expect(injectedCol.className).toContain('ant-col-xs-24');
    expect(injectedCol.className).toContain('ant-col-sm-12');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-A22 [判别]: label 同时来自字段属性与 slots 时 slot 胜出
  // ----------------------------------------------------
  it('BI-A22 [判别]: label 同时来自字段属性与 slots 时 slot 胜出', async () => {
    const form = useForm({ name: '' }, [
      {
        path: 'name',
        label: '属性标签',
        component: 'input',
        slots: { label: () => h('span', { class: 'slot-label' }, '插槽标签') },
      },
    ] as any);
    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    expect(wrapper.find('.slot-label').text()).toBe('插槽标签');
    expect(wrapper.find('.ant-form-item-label').text()).not.toContain(
      '属性标签'
    );
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-A23 [判别]: 仅字段 label 时按属性渲染（无 label 插槽时不丢失标签）
  // ----------------------------------------------------
  it('BI-A23 [判别]: 仅配置字段 label 时标签正常渲染', async () => {
    const form = useForm({ name: '' }, [
      { path: 'name', label: '属性标签', component: 'input' },
    ] as any);
    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    expect(wrapper.find('.ant-form-item-label').text()).toContain('属性标签');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // BI-A24 [判别]: 字段 hidden 的类型面为 Ref / ComputedRef，渲染期按 toValue 过滤
  // ----------------------------------------------------
  it('BI-A24 [判别]: 字段 hidden 支持 Ref / ComputedRef 形态，翻转驱动字段显隐', async () => {
    const hiddenRef = ref(true);
    const hiddenComputed = computed(() => hiddenRef.value);
    const fields: Field[] = [
      { path: 'a', label: '甲', component: 'input' },
      { path: 'b', label: '乙', component: 'input', hidden: hiddenRef },
      { path: 'c', label: '丙', component: 'input', hidden: hiddenComputed },
      // 类型面：getter 形态不属于 hidden 契约（四包统一为 Ref / ComputedRef）
      // @ts-expect-error hidden 不接受 getter 形式
      { path: 'd', label: '丁', component: 'input', hidden: () => true },
    ];
    const form = useForm({ a: '', b: '', c: '', d: '' }, fields);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const labels = () =>
      wrapper.findAll('.ant-form-item-label').map(item => item.text());
    // Ref(true) 与 ComputedRef(true) 的字段均不渲染；getter 项运行期经 toValue 同样被过滤
    expect(labels()).toContain('甲');
    expect(labels()).not.toContain('乙');
    expect(labels()).not.toContain('丙');

    hiddenRef.value = false;
    await flushPromises();

    // 翻转外部 ref：两个响应式形态同时随取值出现，getter 项仍不进入渲染
    expect(labels()).toContain('乙');
    expect(labels()).toContain('丙');
    expect(labels()).not.toContain('丁');

    wrapper.unmount();
  });
  // ----------------------------------------------------
  // BI-A25 [判别]: 字段配置更新与联动翻转仅重渲染目标字段行
  // ----------------------------------------------------
  it('BI-A25 [判别]: setField / hidden 翻转仅重渲染目标字段行', async () => {
    const renderCounts: Record<string, number> = {};
    const holder: { form?: any } = {};
    const createProbe = (key: string) =>
      markRaw(
        defineComponent({
          name: `RowProbe_${key}`,
          props: {
            value: { type: null, default: undefined },
            modelValue: { type: null, default: undefined },
          },
          setup() {
            return () => {
              renderCounts[key] = (renderCounts[key] ?? 0) + 1;
              return h('input');
            };
          },
        })
      );

    const fields = Array.from({ length: 5 }, (_, i) => ({
      path: `f${i}`,
      component: createProbe(`f${i}`),
    })) as Field[];
    fields[1] = {
      ...fields[1],
      hidden: computed(
        () => (holder.form?.getFormData('f0') as string)?.length > 0
      ),
    };

    const form = useForm(
      Object.fromEntries(fields.map((_, i) => [`f${i}`, ''])),
      fields
    );
    holder.form = form;

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 单字段配置更新：仅目标行重渲染
    const beforeSetField = { ...renderCounts };
    form.setField('f3', { componentClass: 'target-cls' } as any);
    await flushPromises();
    expect(renderCounts.f3).toBe(beforeSetField.f3 + 1);
    for (const key of ['f0', 'f1', 'f2', 'f4']) {
      expect(renderCounts[key]).toBe(beforeSetField[key]);
    }

    // hidden 联动翻转：仅值变更字段重渲染，隐藏字段卸载，其余行不动
    const beforeHidden = { ...renderCounts };
    form.setFormData('f0', 'x');
    await flushPromises();
    expect(renderCounts.f0).toBe(beforeHidden.f0 + 1);
    expect(renderCounts.f1).toBe(beforeHidden.f1);
    for (const key of ['f2', 'f3', 'f4']) {
      expect(renderCounts[key]).toBe(beforeHidden[key]);
    }
    expect(wrapper.findAll('input')).toHaveLength(4);

    wrapper.unmount();
  });
  // ----------------------------------------------------
  // BI-A26 [判别]: 行内包裹链与字段列表顶层包裹均由 h()/条件分支直接承担
  // ----------------------------------------------------
  it('BI-A26 [判别]: 字段行与字段列表不再产生 ContainerFragment，grid 与自定义容器仍按需渲染', async () => {
    const expectNoLayoutWrappers = (target: any) => {
      expect(
        target
          .findAllComponents(ContainerFragment)
          .filter(
            (c: any) =>
              c.vm.$.parent?.type === BaseFormItem ||
              c.vm.$.parent?.type === BaseFormItems
          )
      ).toHaveLength(0);
    };

    const form = useForm({ f0: '', f1: '' }, [
      { path: 'f0', component: 'input' },
      { path: 'f1', component: 'input' },
    ] as Field[]);
    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expectNoLayoutWrappers(wrapper);
    wrapper.unmount();

    const gridForm = useForm({ g0: '' }, [
      { path: 'g0', component: 'input', span: 12 },
    ] as Field[]);
    const gridWrapper = mount(ProForm, {
      props: { form: gridForm, grid: true },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(gridWrapper.find('.ant-col-12').exists()).toBe(true);
    expectNoLayoutWrappers(gridWrapper);
    gridWrapper.unmount();

    const containerForm = useForm({ c0: '' }, [
      {
        path: 'c0',
        component: 'input',
        formItemContainer: (_: any, ctx: any) =>
          h('div', { class: 'field-box' }, ctx.slots.default?.()),
      },
    ] as Field[]);
    const containerWrapper = mount(ProForm, {
      props: { form: containerForm },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(containerWrapper.find('.field-box').exists()).toBe(true);
    expectNoLayoutWrappers(containerWrapper);
    containerWrapper.unmount();
  });
});
