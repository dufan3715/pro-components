import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { h } from 'vue';
import { useLocale } from '../src/locale';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';

describe('useLocale 多语言测试 (vant-pro)', () => {
  it('HL-01: 默认使用简体中文文案', () => {
    const wrapper = mount({
      setup() {
        const { t } = useLocale();
        return () =>
          h('div', { class: 'locale-probe' }, t('input.placeholder'));
      },
    });

    expect(wrapper.find('.locale-probe').text()).toBe('请输入');
    wrapper.unmount();
  });

  it('HL-02: 支持通过 ProComponentProvider 自定义覆盖 locale', async () => {
    const wrapper = mount(ProComponentProvider, {
      props: {
        locale: {
          'input.placeholder': 'Please type here',
        } as any,
      },
      slots: {
        default: () =>
          h({
            setup() {
              const { t } = useLocale();
              return () =>
                h(
                  'div',
                  { class: 'custom-locale-probe' },
                  t('input.placeholder')
                );
            },
          }),
      },
    });

    await flushPromises();
    expect(wrapper.find('.custom-locale-probe').text()).toBe(
      'Please type here'
    );
    wrapper.unmount();
  });
});
