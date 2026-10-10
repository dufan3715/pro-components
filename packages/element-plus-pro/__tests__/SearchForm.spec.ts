import { describe, it, expect, vi } from 'vitest';
import { defineComponent, h, markRaw, type PropType } from 'vue';
import { mount } from '@vue/test-utils';
import SearchForm from '../src/components/table/components/SearchForm.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import { expectWarn, flushPromises } from './helpers/mount';
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

    try {
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
    } finally {
      scrollHeightSpy.mockRestore();
      wrapper.unmount();
    }
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

    try {
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
    } finally {
      scrollHeightSpy.mockRestore();
      wrapper.unmount();
    }
  });

  // ----------------------------------------------------
  // SF-A10 [判别]: 自定义插槽接收作用域方法，点击自定义查询按钮仅发 1 次 search
  // ----------------------------------------------------
  it('SF-A10 [判别]: 自定义插槽接收作用域方法，点击自定义查询按钮仅发 1 次 search', async () => {
    const form = useForm({}, [{ path: 'name', component: 'input' }]);
    let capturedOnReset: any = null;
    let capturedOnSearch: any = null;
    let capturedExpandStatus: any = null;

    const wrapper = mount(SearchForm, {
      props: { form },
      attachTo: document.body,
      slots: {
        'reset-button': (props: any) => {
          capturedOnReset = props.onReset;
          return h(
            'button',
            {
              class: 'custom-reset-btn',
              type: 'button',
              onClick: props.onReset,
            },
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

    try {
      await flushPromises();

      expect(typeof capturedOnReset).toBe('function');
      expect(typeof capturedOnSearch).toBe('function');
      expect(typeof capturedExpandStatus).toBe('boolean');

      // 重置按钮显式 type=button：与默认重置按钮语义一致，点击不产生隐式提交
      await wrapper.find('.custom-reset-btn').trigger('click');
      await flushPromises();
      expect(wrapper.emitted('reset')).toHaveLength(1);
      expect(wrapper.emitted('search')).toBeUndefined();

      // 查询按钮不声明 type：点击同时送达 click 与浏览器隐式 submit
      let nativeSubmitCount = 0;
      wrapper.find('form').element.addEventListener('submit', () => {
        nativeSubmitCount += 1;
      });

      await wrapper.find('.custom-search-btn').trigger('click');
      await flushPromises();
      // 判别点 1：click 与隐式 submit 两条路径均已送达
      expect(nativeSubmitCount).toBe(1);
      // 判别点 2：同 tick 去重后 search 恰好 1 次
      expect(wrapper.emitted('search')).toHaveLength(1);
    } finally {
      wrapper.unmount();
      document.body.innerHTML = '';
    }
  });

  // ----------------------------------------------------
  // SF-A19 [判别]: 自定义 searchButton 点击与隐式提交同 tick 去重
  // ----------------------------------------------------
  it('SF-A19 [判别]: 点击自定义 searchButton 一次仅发 1 次 search', async () => {
    const form = useForm({}, [{ path: 'name', component: 'input' }]);
    const CustomSearchBtn = defineComponent({
      props: {
        onClick: { type: Function as PropType<() => void>, required: true },
      },
      setup(props) {
        return () =>
          h(
            'button',
            { class: 'custom-search-widget', onClick: props.onClick },
            'CustomSearch'
          );
      },
    });

    const wrapper = mount(SearchForm, {
      props: {
        form,
        searchButton: markRaw(CustomSearchBtn),
        resetButton: false,
      },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });

    try {
      await flushPromises();

      let nativeSubmitCount = 0;
      wrapper.find('form').element.addEventListener('submit', () => {
        nativeSubmitCount += 1;
      });

      await wrapper.find('.custom-search-widget').trigger('click');
      await flushPromises();
      // 判别点 1：click 与隐式 submit 两条路径均已送达
      expect(nativeSubmitCount).toBe(1);
      // 判别点 2：同 tick 去重后 search 恰好 1 次
      expect(wrapper.emitted('search')).toHaveLength(1);

      // 判别点 3：下一 tick 的点击独立放行，连续两次点击为两次查询
      await wrapper.find('.custom-search-widget').trigger('click');
      await flushPromises();
      expect(wrapper.emitted('search')).toHaveLength(2);
    } finally {
      wrapper.unmount();
      document.body.innerHTML = '';
    }
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
    expect(wrapperInline.find('.el-form--inline').exists()).toBe(true);
    wrapperInline.unmount();
  });

  // ----------------------------------------------------
  // SF-02: 默认 search / reset 按钮点击事件
  // ----------------------------------------------------
  it('SF-02: 点击默认搜索与重置按钮触发 search 与 reset 事件', async () => {
    const form = useForm({}, [{ path: 'name', component: 'input' }]);

    const wrapper = mount(SearchForm, {
      props: { form },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });

    try {
      await flushPromises();

      await wrapper
        .find('.pro-table_search-form_reset-button')
        .trigger('click');
      expect(wrapper.emitted('reset')).toHaveLength(1);

      // 查询按钮为 native-type=submit：点击必须经原生表单提交触发 search（不手工补 submit）
      const searchButton = wrapper.find('.pro-table_search-form_search-button');
      expect(searchButton.attributes('type')).toBe('submit');
      expect(wrapper.emitted('search')).toBeUndefined();
      await searchButton.trigger('click');
      await flushPromises();
      // 判别点：点击恰好触发 1 次 search（断言未发过 → 点击后精确为 1）
      expect(wrapper.emitted('search')).toHaveLength(1);

      // 点击后再手动 submit 一次：与点击同一 submit 路径，精确累计为 2
      await wrapper.find('form').trigger('submit');
      await flushPromises();
      expect(wrapper.emitted('search')).toHaveLength(2);
      // 重置按钮全程只发 1 次 reset
      expect(wrapper.emitted('reset')).toHaveLength(1);
    } finally {
      wrapper.unmount();
      document.body.innerHTML = '';
    }
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
  // ----------------------------------------------------
  // SF-02b [判别]: 查询按钮经 submit 路径单发 search；回车触发同一路径
  // ----------------------------------------------------
  it('SF-02b [判别]: 查询按钮统一走 submit 路径触发 search，回车与点击同一路径', async () => {
    const form = useForm({}, [{ path: 'name', component: 'input' }]);

    const wrapper = mount(SearchForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 判别点 1：回车（form submit）触发 search
    const formEl = wrapper.find('form');
    await formEl.trigger('submit');
    expect(wrapper.emitted('search')).toHaveLength(1);

    // 判别点 2：再次回车——每次提交独立触发，不被吞（快速连续查询合法）
    await formEl.trigger('submit');
    expect(wrapper.emitted('search')).toHaveLength(2);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // SF-A16 [判别]: form 为必填 prop，无默认值兜底
  // ----------------------------------------------------
  it('SF-A16 [判别]: form 声明为必填且不带默认值', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      // @ts-expect-error form 为必填 prop，省略时不通过类型检查
      const wrapper = mount(SearchForm, { props: {} });

      // 省略必填 prop 时宿主输出缺失提示，且无默认值兜底
      expectWarn(warnSpy, 'Missing required prop: "form"');
      const formProp = (SearchForm as any).props.form;
      expect(formProp.required).toBe(true);
      expect('default' in formProp).toBe(false);

      wrapper.unmount();
    } finally {
      warnSpy.mockRestore();
    }
  });
});
