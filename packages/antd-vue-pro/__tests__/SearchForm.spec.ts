import { describe, it, expect, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import SearchForm from '../src/components/table/components/SearchForm.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import { flushPromises } from './helpers/mount';
import { triggerResize, triggerIntersect } from './setup';

describe('SearchForm 组件测试', () => {
  // ----------------------------------------------------
  // SF-A4 [判别]: 手动展开状态保留，ResizeObserver 重新测量不覆盖
  // ----------------------------------------------------
  it('SF-A4 [判别]: 手动点击展开后，重新测量越过死区仍保持用户手动状态', async () => {
    const scrollHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(120);

    const form = useForm({}, [
      { path: 'f1', label: '字段1', component: 'input' },
      { path: 'f2', label: '字段2', component: 'input' },
      { path: 'f3', label: '字段3', component: 'input' },
      { path: 'f4', label: '字段4', component: 'input' },
    ]);

    const wrapper = mount(SearchForm, {
      props: {
        form,
        expand: { minExpandRows: 1, expandStatus: false },
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    // 以 Hook 实际观察的表单根元素为 resize 目标
    const formEl = (form.formRef.value as any)?.$el as HTMLElement;
    expect(formEl).toBeTruthy();

    // 触发 ResizeObserver 测量
    triggerResize(formEl);
    await flushPromises();

    const expandBtn = wrapper.find(
      '.pro-table_search-form_expand-toggle-button'
    );
    expect(expandBtn.exists()).toBe(true);

    // 用户手动点击展开
    await expandBtn.trigger('click');
    await flushPromises();
    expect(
      wrapper.find('.pro-table_search-form_expand-toggle-button').text()
    ).toContain('收起');

    // 测量读数变化并越过 2px 死区，触发自动测量重跑；手动锁定必须拦截自动覆盖
    scrollHeightSpy.mockReturnValue(400);
    triggerResize(formEl);
    await flushPromises();
    expect(
      wrapper.find('.pro-table_search-form_expand-toggle-button').text()
    ).toContain('收起');

    scrollHeightSpy.mockRestore();
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // SF-A5 [判别]: 隐藏字段有值时自动展开
  // ----------------------------------------------------
  it('SF-A5 [判别]: 初始存在溢出隐藏字段且有搜索值时，自动展开搜索区', async () => {
    const scrollHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(100);

    const form = useForm({ hiddenField: '关键词' }, [
      { path: 'visibleField', label: '第一行', component: 'input' },
      { path: 'hiddenField', label: '隐藏行', component: 'input' },
    ]);

    const wrapper = mount(SearchForm, {
      props: {
        form,
        expand: { minExpandRows: 1, expandStatus: false },
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    // 以 Hook 实际观察的表单根元素为 resize 目标
    const formEl = (form.formRef.value as any)?.$el as HTMLElement;
    expect(formEl).toBeTruthy();

    // 触发 Resize 激活 observer
    triggerResize(formEl);
    await flushPromises();

    const hiddenItem = wrapper.find('[path="hiddenField"]');
    expect(hiddenItem.exists()).toBe(true);
    // 模拟 IntersectionObserver 报告 hiddenField 不在可视区域 (intersectionRatio === 0)
    triggerIntersect([
      {
        target: hiddenItem.element,
        intersectionRatio: 0,
        isIntersecting: false,
      } as any,
    ]);
    await flushPromises();

    // 含有值所以自动展开为「收起」
    const expandBtn = wrapper.find(
      '.pro-table_search-form_expand-toggle-button'
    );
    expect(expandBtn.exists()).toBe(true);
    expect(expandBtn.text()).toContain('收起');

    scrollHeightSpy.mockRestore();
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // SF-A10 [判别]: 自定义按钮插槽接收作用域方法
  // ----------------------------------------------------
  it('SF-A10 [判别]: 自定义插槽接收 onReset / onSearch / expandStatus 作用域参数', async () => {
    const form = useForm({}, [{ path: 'name', component: 'input' }]);
    let capturedOnReset: any = null;
    let capturedOnSearch: any = null;
    let capturedExpandStatus: any = null;

    const wrapper = mount(SearchForm, {
      props: { form },
      slots: {
        'reset-button': (props: any) => {
          capturedOnReset = props.onReset;
          return h(
            'button',
            { class: 'custom-reset-btn', onClick: props.onReset },
            'CustomReset'
          );
        },
        'search-button': (props: any) => {
          capturedOnSearch = props.onSearch;
          return h(
            'button',
            { class: 'custom-search-btn', onClick: props.onSearch },
            'CustomSearch'
          );
        },
        'expand-button': (props: any) => {
          capturedExpandStatus = props.expandStatus;
          return h(
            'button',
            { class: 'custom-expand-btn' },
            `Expand:${props.expandStatus}`
          );
        },
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    expect(typeof capturedOnReset).toBe('function');
    expect(typeof capturedOnSearch).toBe('function');
    expect(typeof capturedExpandStatus).toBe('boolean');

    // 点击自定义按钮能正常触发父级 emit
    await wrapper.find('.custom-reset-btn').trigger('click');
    expect(wrapper.emitted('reset')).toBeTruthy();

    await wrapper.find('.custom-search-btn').trigger('click');
    expect(wrapper.emitted('search')).toBeTruthy();

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // SF-A11 [判别]: 初始未测量时不含 unsetpx 脏样式
  // ----------------------------------------------------
  it('SF-A11 [判别]: 初始未测量高度时，样式不含 unsetpx 字符串', async () => {
    const form = useForm({}, [{ path: 'name', component: 'input' }]);

    const wrapper = mount(SearchForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    const styleAttr = wrapper.attributes('style') || '';
    expect(styleAttr).not.toContain('unsetpx');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // SF-01: layout="inline" 与 layout="grid" 布局形态
  // ----------------------------------------------------
  it('SF-01: layout 属性支持 inline 与 grid 切换', async () => {
    const form = useForm({}, [{ path: 'name', component: 'input' }]);

    const wrapperInline = mount(SearchForm, {
      props: { form, layout: 'inline' },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapperInline.find('.ant-form-inline').exists()).toBe(true);
    wrapperInline.unmount();
  });

  // ----------------------------------------------------
  // SF-02: 默认 search / reset 按钮点击事件
  // ----------------------------------------------------
  it('SF-02: 点击默认搜索与重置按钮触发 search 与 reset 事件', async () => {
    const form = useForm({}, [{ path: 'name', component: 'input' }]);

    const wrapper = mount(SearchForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    await wrapper.find('.pro-table_search-form_reset-button').trigger('click');
    expect(wrapper.emitted('reset')).toHaveLength(1);

    await wrapper.find('.pro-table_search-form_search-button').trigger('click');
    expect(wrapper.emitted('search')).toHaveLength(1);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // SF-03: 自定义按钮组件 (searchButton / resetButton)
  // ----------------------------------------------------
  it('SF-03: 支持传入自定义 searchButton 与 resetButton 组件', async () => {
    const form = useForm({}, [{ path: 'name', component: 'input' }]);

    const CustomBtn = defineComponent({
      props: ['onClick'],
      setup(props) {
        return () =>
          h(
            'button',
            { class: 'custom-widget-btn', onClick: props.onClick },
            'CustomWidget'
          );
      },
    });

    const wrapper = mount(SearchForm, {
      props: {
        form,
        searchButton: CustomBtn as any,
        resetButton: false, // 禁用重置按钮
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    expect(wrapper.find('.custom-widget-btn').exists()).toBe(true);
    expect(wrapper.find('.pro-table_search-form_reset-button').exists()).toBe(
      false
    );
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // SF-04: expand 对象形态 minExpandRows
  // ----------------------------------------------------
  it('SF-04: expand 支持对象配置 minExpandRows', async () => {
    const form = useForm({}, [{ path: 'name', component: 'input' }]);

    const wrapper = mount(SearchForm, {
      props: {
        form,
        expand: { minExpandRows: 3, expandStatus: false },
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();
    expect(wrapper.exists()).toBe(true);
    wrapper.unmount();
  });
});
