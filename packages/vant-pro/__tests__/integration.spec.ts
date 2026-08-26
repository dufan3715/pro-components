import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { h } from 'vue';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import { Field as VanField } from '../src/shared/ui';

describe('端到端集成测试 (vant-pro)', () => {
  it('IT-01: 移动端表单提交与数据联动完整流程', async () => {
    const form = useForm(
      {
        name: 'David',
        phone: '13800000000',
        agree: true,
      },
      [
        { path: 'name', label: '姓名', component: 'field' },
        { path: 'phone', label: '手机号', component: 'field' },
      ]
    );

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    const inputs = wrapper.findAll('input');
    expect((inputs[0].element as HTMLInputElement).value).toBe('David');
    expect((inputs[1].element as HTMLInputElement).value).toBe('13800000000');

    // 修改输入框并验证 formData 联动更新
    await inputs[0].setValue('David Updated');
    await flushPromises();
    expect(form.getFormData('name')).toBe('David Updated');
    wrapper.unmount();
  });

  it('IT-02: 全局 Provider 自定义文案实时覆盖各子组件', async () => {
    const form = useForm({}, [{ path: 'name', component: 'field' }]);

    const Parent = {
      setup() {
        return () =>
          h('div', { class: 'test-wrapper' }, [
            h(
              ProComponentProvider,
              {
                locale: {
                  'input.placeholder': 'Please type your name',
                } as any,
              },
              {
                default: () => h(ProForm, { form }),
              }
            ),
          ]);
      },
    };

    const wrapper = mount(Parent, {
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    const fieldComp = wrapper.findComponent(VanField);
    expect(fieldComp.props('placeholder')).toBe('Please type your name');
    wrapper.unmount();
  });
});
