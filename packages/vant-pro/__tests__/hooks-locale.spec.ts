import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { h } from 'vue';
import { Locale } from 'vant';
import vanZhCN from 'vant/es/locale/lang/zh-CN';
import vanZhTW from 'vant/es/locale/lang/zh-TW';
import vanEnUS from 'vant/es/locale/lang/en-US';
import { useLocale } from '../src/locale';
import ProComponentProvider from '../src/components/component-provider/components/index.vue';

/** 挂载文案探针：输出 语言名 | 字段占位符 | 查询按钮 | 分页合计 */
const mountLocaleProbe = () =>
  mount({
    setup() {
      const { t, lang } = useLocale();
      return () =>
        h(
          'div',
          { class: 'locale-lang-probe' },
          [
            lang.value,
            t('input.placeholder'),
            t('table.query'),
            t('pagination.total', { total: 5 }),
          ].join('|')
        );
    },
  });

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

  // ----------------------------------------------------
  // HL-03 [判别]: 宿主切换 zh-TW 后解析为繁体文案
  // ----------------------------------------------------
  it('HL-03 [判别]: 宿主 Locale.use(zh-TW) 后语言解析为 zh-TW 并输出繁体文案', () => {
    Locale.use('zh-TW', vanZhTW);
    try {
      const wrapper = mountLocaleProbe();
      expect(wrapper.find('.locale-lang-probe').text()).toBe(
        'zh-TW|請輸入|查詢|共 5 筆'
      );
      wrapper.unmount();
    } finally {
      Locale.use('zh-CN', vanZhCN);
    }

    // 还原宿主语言后回退简体
    const restored = mountLocaleProbe();
    expect(restored.find('.locale-lang-probe').text()).toBe(
      'zh-CN|请输入|查询|共 5 条'
    );
    restored.unmount();
  });

  // ----------------------------------------------------
  // HL-04 [判别]: 宿主切换 en-US 后解析为英文文案
  // ----------------------------------------------------
  it('HL-04 [判别]: 宿主 Locale.use(en-US) 后语言解析为 en-US 并输出英文文案', () => {
    Locale.use('en-US', vanEnUS);
    try {
      const wrapper = mountLocaleProbe();
      expect(wrapper.find('.locale-lang-probe').text()).toBe(
        'en-US|Please input|Search|Total 5 items'
      );
      wrapper.unmount();
    } finally {
      Locale.use('zh-CN', vanZhCN);
    }

    const restored = mountLocaleProbe();
    expect(restored.find('.locale-lang-probe').text()).toBe(
      'zh-CN|请输入|查询|共 5 条'
    );
    restored.unmount();
  });
});
