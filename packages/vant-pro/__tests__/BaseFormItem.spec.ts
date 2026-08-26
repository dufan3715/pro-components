import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import BaseFormItem from '../src/components/form/components/BaseFormItem/index.vue';
import { Field as VanField } from '../src/shared/ui';
import { useForm } from '../src/components/form/hooks/useForm';
import { InjectionFormKey } from '../src/components/form/constants';

describe('BaseFormItem 组件测试 (vant-pro)', () => {
  it('BFI-01: 正确渲染字段列表', async () => {
    const form = useForm({ name: 'Alice', age: 18 });
    const wrapper = mount(BaseFormItem, {
      props: {
        fields: [
          { path: 'name', label: '姓名', component: 'field' },
          { path: 'age', label: '年龄', component: 'field' },
        ],
      },
      global: {
        provide: {
          [InjectionFormKey as symbol]: form,
        },
        stubs: { transition: false },
      },
    });

    await flushPromises();
    const fields = wrapper.findAllComponents(VanField);
    expect(fields.length).toBe(2);
    expect(fields[0].props('label')).toBe('姓名');
    expect(fields[1].props('label')).toBe('年龄');
    wrapper.unmount();
  });

  it('BFI-02: 正确过滤 hidden: true 的字段', async () => {
    const form = useForm({});
    const wrapper = mount(BaseFormItem, {
      props: {
        fields: [
          { path: 'visibleField', label: '可见字段', component: 'field' },
          {
            path: 'hiddenField',
            label: '隐藏字段',
            component: 'field',
            hidden: true,
          },
        ],
      },
      global: {
        provide: {
          [InjectionFormKey as symbol]: form,
        },
        stubs: { transition: false },
      },
    });

    await flushPromises();
    const fields = wrapper.findAllComponents(VanField);
    expect(fields.length).toBe(1);
    expect(fields[0].props('label')).toBe('可见字段');
    wrapper.unmount();
  });

  it('BFI-03: 支持嵌套 fields 递归渲染', async () => {
    const form = useForm({ info: { title: 'Test' } });
    const wrapper = mount(BaseFormItem, {
      props: {
        fields: [
          {
            path: 'info',
            fields: [{ path: 'info.title', label: '标题', component: 'field' }],
          },
        ],
      },
      global: {
        provide: {
          [InjectionFormKey as symbol]: form,
        },
        stubs: { transition: false },
      },
    });

    await flushPromises();
    const fields = wrapper.findAllComponents(VanField);
    expect(fields.length).toBe(1);
    expect(fields[0].props('label')).toBe('标题');
    wrapper.unmount();
  });
});
