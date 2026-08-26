import { describe, it, expect } from 'vitest';
import { computed, defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { useLocale } from '../src/locale';
import { useGroupFieldAttrs } from '../src/components/form/hooks/useGroupFieldAttrs';
import { useProviderDisabled, useInjectDisabled } from '../src/shared/ui';
import { flushPromises } from './helpers/mount';

describe('Hooks 与 Locale 基础能力测试', () => {
  // ----------------------------------------------------
  // HK-02: useProviderDisabled 与 useInjectDisabled 跨层级穿透
  // ----------------------------------------------------
  it('HK-02: useProviderDisabled 与 useInjectDisabled 支持跨层级响应式穿透', async () => {
    let childDisabledState: boolean | undefined = undefined;

    const ChildComponent = defineComponent({
      setup() {
        const disabled = useInjectDisabled();
        return () => {
          childDisabledState = disabled.value;
          return h('div', { class: 'child-box' });
        };
      },
    });

    const parentDisabled = ref(false);

    const ParentComponent = defineComponent({
      setup() {
        useProviderDisabled(computed(() => parentDisabled.value));
        return () => h(ChildComponent);
      },
    });

    const wrapper = mount(ParentComponent);
    await flushPromises();

    expect(childDisabledState).toBe(false);

    // 动态修改父级禁用状态
    parentDisabled.value = true;
    await flushPromises();
    expect(childDisabledState).toBe(true);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // HK-03: useGroupFieldAttrs 属性分离
  // ----------------------------------------------------
  it('HK-03: useGroupFieldAttrs 正确将字段属性分离为 grid / formItem / component / slots', () => {
    const fields = computed(() => [
      {
        path: 'user.name',
        label: '用户名',
        span: 12,
        component: 'input',
        placeholder: '请输入用户名',
        extraProps: { customTag: 'internal' },
        slots: {
          extra: () => '提示说明',
        },
      },
    ]);

    const Parent = defineComponent({
      setup() {
        const grouped = useGroupFieldAttrs(fields as any);
        return { grouped };
      },
      template: '<div></div>',
    });

    const wrapper = mount(Parent);
    const item = (wrapper.vm as any).grouped[0];

    expect(item.path).toBe('user.name');
    expect(item.gridItemProps.span).toBe(12);
    expect(item.formItemProps.label).toBe('用户名');
    expect(item.componentProps.placeholder).toBe('请输入用户名');
    // extraProps 从 componentProps 剥离
    expect(item.componentProps.extraProps).toBeUndefined();
    // extra 插槽归入 formItemSlots
    expect(typeof item.formItemSlots.extra).toBe('function');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // LC-01: useLocale 默认回退
  // ----------------------------------------------------
  it('LC-01: useLocale 默认回退为简体中文 zh-CN', () => {
    const Parent = defineComponent({
      setup() {
        const { t, lang } = useLocale();
        return { t, lang };
      },
      template: '<div></div>',
    });

    const wrapper = mount(Parent);
    const { t, lang } = wrapper.vm as any;

    expect(lang).toBe('zh-CN');
    expect(t('table.query')).toBe('查询');
    expect(t('table.reset')).toBe('重置');
    expect(t('table.index')).toBe('序号');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // LC-02: t 函数参数插值
  // ----------------------------------------------------
  it('LC-02: t 函数支持 {placeholder} 参数动态插值', () => {
    const Parent = defineComponent({
      setup() {
        const { t } = useLocale();
        return { t };
      },
      template: '<div></div>',
    });

    const wrapper = mount(Parent);
    const { t } = wrapper.vm as any;

    const totalText = t('pagination.total', { total: 100 });
    expect(totalText).toBe('共 100 条');

    wrapper.unmount();
  });
});
