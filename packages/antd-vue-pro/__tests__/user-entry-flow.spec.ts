import { describe, it, expect } from 'vitest';
import { defineComponent, h, markRaw, onBeforeUnmount, ref } from 'vue';
import { mount } from '@vue/test-utils';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import { flushPromises } from './helpers/mount';

type Row = { id: string; school: string };
type Stats = { mounts: number; renders: number; unmounts: number };

describe('ProForm 用户录入链路', () => {
  // ----------------------------------------------------
  // UF-01: 录入、格式化、动态行增删重排、插槽刷新
  // ----------------------------------------------------
  it('UF-01: 真实录入链路下校验去重、动态行复用、插槽刷新均符合预期', async () => {
    let validators = 0;
    const stats = new Map<string, Stats>();
    const probes = new Map<string, any>();

    const probeFor = (id: string) => {
      const cached = probes.get(id);
      if (cached) return cached;
      const stat = { mounts: 0, renders: 0, unmounts: 0 };
      stats.set(id, stat);
      const probe = markRaw(
        defineComponent({
          name: `EntryProbe_${id}`,
          props: { value: { type: String, default: '' } },
          emits: ['update:value'],
          setup(props, { emit }) {
            stat.mounts += 1;
            onBeforeUnmount(() => {
              stat.unmounts += 1;
            });
            return () => {
              stat.renders += 1;
              return h('input', {
                class: `probe-${id}`,
                value: props.value,
                onInput: (event: Event) =>
                  emit(
                    'update:value',
                    (event.target as HTMLInputElement).value
                  ),
              });
            };
          },
        })
      );
      probes.set(id, probe);
      return probe;
    };

    const form = useForm(
      {
        name: '',
        rows: [
          { id: 'a', school: '' },
          { id: 'b', school: '' },
          { id: 'c', school: '' },
        ] as Row[],
        remark: '',
      },
      [
        {
          path: 'name',
          label: '姓名',
          component: 'input',
          valueFormatter: (val: any) => String(val).trim(),
          rules: [
            {
              validator: () => {
                validators += 1;
                return Promise.resolve();
              },
            },
          ],
        },
        { path: 'rows', fields: [] },
        { path: 'remark', label: '备注', component: 'input' },
      ]
    );

    const buildRowFields = () =>
      (form.getFormData('rows') as Row[]).flatMap((row, index) => [
        {
          path: `rows.${index}.school`,
          label: `${row.id} 学校`,
          component: probeFor(row.id),
        },
      ]);
    const syncRows = () =>
      form.setField('rows', { fields: buildRowFields() } as any);
    syncRows();

    const extra = ref('extra-1');
    const slotLabel = ref('slot-1');
    const showRemarkSlot = ref(true);
    const variantClass = ref('');

    const Wrapper = defineComponent({
      setup() {
        return () => {
          const remarkSlot = (slotProps: any) => {
            return h('span', { class: 'remark-slot' }, [
              h('span', { class: 'remark-label' }, slotLabel.value),
              h('input', {
                class: 'remark-input',
                value: slotProps.value,
                onInput: (event: Event) =>
                  slotProps['onUpdate:value']?.(
                    (event.target as HTMLInputElement).value
                  ),
              }),
            ]);
          };
          return h(
            ProForm,
            { form, class: variantClass.value },
            {
              default: () => h('span', { class: 'extra-content' }, extra.value),
              ...(showRemarkSlot.value ? { remark: remarkSlot } : {}),
            }
          );
        };
      },
    });

    const wrapper = mount(Wrapper, {
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    validators = 0;

    // 姓名录入：首尾空格被 formatter 归一化
    const nameInput = wrapper.findAll('input')[0];
    expect(nameInput.exists()).toBe(true);

    await nameInput.setValue(' Bob ');
    await flushPromises();
    const afterFirstInput = validators;
    expect(form.getFormData('name')).toBe('Bob');

    // 已存储 bob，后续尾空格/等值写入不再校验
    await nameInput.setValue('Bob ');
    await flushPromises();
    const afterNoopInput = validators;

    await nameInput.setValue('Alice');
    await flushPromises();
    const afterRealChange = validators;
    expect(form.getFormData('name')).toBe('Alice');

    expect(afterFirstInput).toBe(1);
    expect(afterNoopInput).toBe(1);
    expect(afterRealChange).toBe(2);

    // 动态行：追加 d
    form.setFormData('rows', (prev: Row[]) => [
      ...prev,
      { id: 'd', school: '' },
    ]);
    syncRows();
    await flushPromises();
    expect(stats.get('a')?.mounts).toBe(1);
    expect(stats.get('b')?.mounts).toBe(1);
    expect(stats.get('c')?.mounts).toBe(1);
    expect(stats.get('d')?.mounts).toBe(1);

    // 删除 b：仅 b 卸载，其余行复用
    form.setFormData('rows', (prev: Row[]) =>
      prev.filter(row => row.id !== 'b')
    );
    syncRows();
    await flushPromises();
    expect(stats.get('b')?.unmounts).toBe(1);
    expect(stats.get('a')?.mounts).toBe(1);
    expect(stats.get('c')?.mounts).toBe(1);
    expect(stats.get('d')?.mounts).toBe(1);

    // 重排为 [d, c, a]：行实例跟随数据行
    form.setFormData('rows', (prev: Row[]) => [...prev].reverse());
    syncRows();
    await flushPromises();
    for (const id of ['a', 'c', 'd']) {
      expect(stats.get(id)?.mounts).toBe(1);
      expect(stats.get(id)?.unmounts).toBe(0);
    }

    // 重排后在 c 的新下标录入，写入新 path
    const cIndex = (form.getFormData('rows') as Row[]).findIndex(
      row => row.id === 'c'
    );
    const cInput = wrapper.find('input.probe-c');
    await cInput.setValue('C大学');
    await flushPromises();
    expect(form.getFormData(`rows.${cIndex}.school`)).toBe('C大学');
    expect(form.getFormData('rows.0.school')).toBe('');
    expect(form.getFormData('rows.2.school')).toBe('');
    expect((form.getFormData('rows') as Row[]).map(row => row.id)).toEqual([
      'd',
      'c',
      'a',
    ]);

    // 单字段配置更新：仅姓名行重渲染，动态行不受影响
    const cRendersBefore = stats.get('c')!.renders;
    form.setField('name', { label: '姓名（更新）' });
    await flushPromises();
    expect(stats.get('c')!.renders).toBe(cRendersBefore);

    // 普通属性 / default 插槽更新后页面仍正常
    variantClass.value = 'pro-form--updated';
    await flushPromises();
    expect(wrapper.find('.pro-form').classes()).toContain('pro-form--updated');

    extra.value = 'extra-2';
    await flushPromises();
    expect(wrapper.find('.extra-content').text()).toBe('extra-2');

    // 插槽内容自身响应式更新
    slotLabel.value = 'slot-2';
    await flushPromises();
    expect(wrapper.find('.remark-label').text()).toBe('slot-2');

    // 插槽增删：key 集合变化触发刷新
    showRemarkSlot.value = false;
    await flushPromises();
    expect(wrapper.find('.remark-slot').exists()).toBe(false);

    showRemarkSlot.value = true;
    await flushPromises();
    expect(wrapper.find('.remark-slot').exists()).toBe(true);

    wrapper.unmount();
  });
});
