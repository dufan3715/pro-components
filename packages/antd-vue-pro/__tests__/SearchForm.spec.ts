import { describe, it, expect, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import SearchForm from '../src/components/table/components/SearchForm.vue';
import ProForm from '../src/components/form/components/ProForm/index.vue';
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
    // 折叠高度 = minExpandRows × 行高(默认 32) + (minExpandRows - 1) × rowGap(默认 16)
    const scrollHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(400);

    const form = useForm({}, [{ path: 'name', component: 'input' }]);

    const wrapper = mount(SearchForm, {
      props: {
        form,
        expand: { minExpandRows: 3, expandStatus: false },
      },
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    // 判别点：minExpandRows: 3 对应可观测折叠高度 3×32 + 2×16 = 128px
    const heightOf = (w: typeof wrapper) =>
      (w.find('.pro-table_search-form').element as HTMLElement).style.height;
    expect(heightOf(wrapper)).toBe('128px');

    // 同构对照：minExpandRows: 1 时折叠高度为 1×32 = 32px，锁定配置项真实参与计算
    const singleRowForm = useForm({}, [{ path: 'name', component: 'input' }]);
    const singleRowWrapper = mount(SearchForm, {
      props: {
        form: singleRowForm,
        expand: { minExpandRows: 1, expandStatus: false },
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(heightOf(singleRowWrapper)).toBe('32px');

    scrollHeightSpy.mockRestore();
    wrapper.unmount();
    singleRowWrapper.unmount();
  });

  // ----------------------------------------------------
  // SF-A12 [判别]: 自定义 expandButton 组件与 expandButton: false
  // ----------------------------------------------------
  it('SF-A12 [判别]: expandButton 自定义组件接收 expandStatus 并接管点击切换；expandButton=false 时不渲染任何展开按钮', async () => {
    const scrollHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(400);

    const form = useForm({}, [{ path: 'name', component: 'input' }]);
    const CustomExpand = defineComponent({
      props: ['expandStatus', 'onClick'],
      setup(props) {
        return () =>
          h(
            'button',
            { class: 'custom-expand-btn', onClick: props.onClick },
            props.expandStatus ? '已展开' : '已折叠'
          );
      },
    });

    const wrapper = mount(SearchForm, {
      props: {
        form,
        expand: { minExpandRows: 1, expandStatus: false },
        expandButton: CustomExpand as any,
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const customBtn = wrapper.find('.custom-expand-btn');
    expect(customBtn.exists()).toBe(true);
    // 自定义按钮顶掉默认展开按钮
    expect(
      wrapper.find('.pro-table_search-form_expand-toggle-button').exists()
    ).toBe(false);
    expect(customBtn.text()).toBe('已折叠');

    // 点击自定义按钮（组件经 onClick 接收 changeExpandStatus）后状态透传回 expandStatus
    await customBtn.trigger('click');
    await flushPromises();
    expect(wrapper.find('.custom-expand-btn').text()).toBe('已展开');

    // expandButton === false：溢出成立也不渲染默认展开按钮
    const disabledForm = useForm({}, [{ path: 'name', component: 'input' }]);
    const disabledWrapper = mount(SearchForm, {
      props: {
        form: disabledForm,
        expand: { minExpandRows: 1, expandStatus: false },
        expandButton: false,
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(
      disabledWrapper
        .find('.pro-table_search-form_expand-toggle-button')
        .exists()
    ).toBe(false);
    expect(disabledWrapper.find('.custom-expand-btn').exists()).toBe(false);

    scrollHeightSpy.mockRestore();
    wrapper.unmount();
    disabledWrapper.unmount();
  });

  // ----------------------------------------------------
  // SF-A13 [判别]: expand-button 插槽暴露 changeExpandStatus
  // ----------------------------------------------------
  it('SF-A13 [判别]: expand-button 插槽作用域的 changeExpandStatus 可切换展开状态并驱动重渲染', async () => {
    const scrollHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(400);

    const form = useForm({}, [{ path: 'name', component: 'input' }]);
    const captured: { change?: () => void; status?: boolean } = {};

    const wrapper = mount(SearchForm, {
      props: {
        form,
        expand: { minExpandRows: 1, expandStatus: false },
      },
      slots: {
        'expand-button': (scope: any) => {
          captured.change = scope.changeExpandStatus;
          captured.status = scope.expandStatus;
          return h(
            'button',
            { class: 'slot-expand-btn' },
            scope.expandStatus ? '已展开' : '已折叠'
          );
        },
      },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    expect(typeof captured.change).toBe('function');
    expect(captured.status).toBe(false);
    expect(wrapper.find('.slot-expand-btn').text()).toBe('已折叠');

    // 调用暴露方法 → 状态翻转并经插槽作用域回传
    captured.change!();
    await flushPromises();
    expect(captured.status).toBe(true);
    expect(wrapper.find('.slot-expand-btn').text()).toBe('已展开');

    captured.change!();
    await flushPromises();
    expect(captured.status).toBe(false);

    scrollHeightSpy.mockRestore();
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // SF-A14 [判别]: rowGap / columnGap 驱动网格间距
  // ----------------------------------------------------
  it('SF-A14 [判别]: rowGap 与 columnGap 分别映射为 grid gutter 的纵向/横向间距及 inline gap', async () => {
    const form = useForm({}, [{ path: 'name', component: 'input' }]);

    const gridWrapper = mount(SearchForm, {
      props: { form, rowGap: 8, columnGap: 12 },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // gutter 顺序为 [横向 columnGap, 纵向 rowGap]
    expect(
      (gridWrapper.findComponent(ProForm as any) as any).props('grid').gutter
    ).toEqual([12, 8]);

    const inlineWrapper = mount(SearchForm, {
      props: { form, layout: 'inline', rowGap: 8, columnGap: 12 },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    expect(
      (inlineWrapper.find('.pro-table_search-form').element as HTMLElement)
        .style.gap
    ).toBe('8px 12px');

    gridWrapper.unmount();
    inlineWrapper.unmount();
  });

  // ----------------------------------------------------
  // SF-A15 [判别]: expand 布尔形态
  // ----------------------------------------------------
  it('SF-A15 [判别]: expand=true 按默认 2 行折叠并显示展开按钮；expand=false 不约束高度且无按钮', async () => {
    const scrollHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(400);

    const form = useForm({}, [{ path: 'name', component: 'input' }]);
    const enabled = mount(SearchForm, {
      props: { form, expand: true },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 默认 minExpandRows = 2：2×32 + 1×16 = 80px
    const enabledEl = enabled.find('.pro-table_search-form')
      .element as HTMLElement;
    expect(enabledEl.style.height).toBe('80px');
    expect(
      enabled.find('.pro-table_search-form_expand-toggle-button').exists()
    ).toBe(true);

    const disabledForm = useForm({}, [{ path: 'name', component: 'input' }]);
    const disabled = mount(SearchForm, {
      props: { form: disabledForm, expand: false },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const disabledEl = disabled.find('.pro-table_search-form')
      .element as HTMLElement;
    expect(disabledEl.style.height).toBe('');
    expect(
      disabled.find('.pro-table_search-form_expand-toggle-button').exists()
    ).toBe(false);

    scrollHeightSpy.mockRestore();
    enabled.unmount();
    disabled.unmount();
  });

  // ----------------------------------------------------
  // SF-A16 [判别]: form 为必填 prop，无默认值兜底
  // ----------------------------------------------------
  it('SF-A16 [判别]: form 声明为必填且不带默认值', () => {
    // @ts-expect-error form 为必填 prop，省略时不通过类型检查
    const wrapper = mount(SearchForm, { props: {} });

    const formProp = (SearchForm as any).props.form;
    expect(formProp.required).toBe(true);
    expect('default' in formProp).toBe(false);

    wrapper.unmount();
  });
});
