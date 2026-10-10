import { describe, it, expect, vi } from 'vitest';
import { defineComponent, h, markRaw, type PropType } from 'vue';
import { mount } from '@vue/test-utils';
import SearchForm from '../src/components/table/components/SearchForm.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import { expectWarn, flushPromises, waitForRaf } from './helpers/mount';
import { triggerResize, triggerIntersect } from './setup';

describe('SearchForm 组件测试', () => {
  // ----------------------------------------------------
  // SF-A4 [判别]: 手动展开状态保留，ResizeObserver 重新测量不覆盖
  // ----------------------------------------------------
  it('SF-A4 [判别]: 手动点击展开后，越过死区的重测写入新高度但不覆盖手动状态', async () => {
    const scrollHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(120);
    let wrapper: ReturnType<typeof mount> | undefined;

    try {
      const form = useForm({}, [
        { path: 'f1', label: '字段1', component: 'input' },
        { path: 'f2', label: '字段2', component: 'input' },
        { path: 'f3', label: '字段3', component: 'input' },
        { path: 'f4', label: '字段4', component: 'input' },
      ]);

      wrapper = mount(SearchForm, {
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
      const toggleText = () =>
        wrapper!.find('.pro-table_search-form_expand-toggle-button').text();

      // 挂载期测量：读数 120 超过折叠高度 32，未展开时施加折叠高度，展开按钮出现
      expect(wrapper.attributes('style')).toContain('height: 32px');
      expect(toggleText()).toContain('展开');

      // 用户手动点击展开：高度切到自然高度
      await wrapper
        .find('.pro-table_search-form_expand-toggle-button')
        .trigger('click');
      await flushPromises();
      expect(toggleText()).toContain('收起');
      expect(wrapper.attributes('style')).toContain('height: 120px');

      // 测量读数变化并越过 2px 死区，经 RO → rAF 重测；手动锁定必须拦截自动覆盖
      scrollHeightSpy.mockReturnValue(400);
      // RO 回调经 rAF 合帧后写入：同步读取仍是旧读数
      triggerResize(formEl);
      expect(wrapper.attributes('style')).toContain('height: 120px');
      await waitForRaf();
      await flushPromises();

      // 重测确实执行并写入新读数
      expect(wrapper.attributes('style')).toContain('height: 400px');
      // 手动状态未被自动测量覆盖
      expect(toggleText()).toContain('收起');
    } finally {
      scrollHeightSpy.mockRestore();
      wrapper?.unmount();
    }
  });

  // ----------------------------------------------------
  // SF-A5 [判别]: 隐藏字段有值时自动展开
  // ----------------------------------------------------
  it('SF-A5 [判别]: 初始存在溢出隐藏字段且有搜索值时，自动展开搜索区', async () => {
    const scrollHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(100);
    let wrapper: ReturnType<typeof mount> | undefined;

    try {
      const form = useForm({ hiddenField: '关键词' }, [
        { path: 'visibleField', label: '第一行', component: 'input' },
        { path: 'hiddenField', label: '隐藏行', component: 'input' },
      ]);

      wrapper = mount(SearchForm, {
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
    } finally {
      scrollHeightSpy.mockRestore();
      wrapper?.unmount();
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
  // SF-01 [判别]: layout="inline" 与 layout="grid" 布局形态
  // ----------------------------------------------------
  it('SF-01 [判别]: layout 属性支持 inline 与 grid 切换', async () => {
    const form = useForm({}, [{ path: 'name', component: 'input' }]);

    // grid（默认）：栅格容器 + 折叠高度约束
    const wrapperGrid = mount(SearchForm, {
      props: { form, layout: 'grid' },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapperGrid.find('.ant-form-inline').exists()).toBe(false);
    expect(wrapperGrid.find('.ant-row').exists()).toBe(true);
    expect(wrapperGrid.attributes('style')).toContain('display: flex');
    expect(wrapperGrid.attributes('style')).toContain('overflow: hidden');
    wrapperGrid.unmount();

    // inline：行内布局 + 无折叠高度约束
    const wrapperInline = mount(SearchForm, {
      props: { form, layout: 'inline' },
      global: { stubs: { transition: false } },
    });
    await flushPromises();
    expect(wrapperInline.find('.ant-form-inline').exists()).toBe(true);
    expect(wrapperInline.attributes('style')).not.toContain('overflow: hidden');
    wrapperInline.unmount();
  });

  // ----------------------------------------------------
  // SF-02 [判别]: 默认按钮交互（查询按钮经表单 submit 触发 search）
  // ----------------------------------------------------
  it('SF-02 [判别]: 点击默认搜索与重置按钮触发 search 与 reset 事件', async () => {
    const form = useForm({}, [{ path: 'name', component: 'input' }]);

    const wrapper = mount(SearchForm, {
      props: { form },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    await wrapper.find('.pro-table_search-form_reset-button').trigger('click');
    expect(wrapper.emitted('reset')).toHaveLength(1);

    // 查询按钮为 html-type=submit：点击必须经原生表单提交触发 search（不手工补 submit）
    const searchButton = wrapper.find('.pro-table_search-form_search-button');
    expect(searchButton.attributes('type')).toBe('submit');
    await searchButton.trigger('click');
    await flushPromises();
    expect(wrapper.emitted('search')).toHaveLength(1);

    wrapper.unmount();
    document.body.innerHTML = '';
  });

  // ----------------------------------------------------
  // SF-05 [判别]: 回车（表单 submit）触发查询，点击与回车各只触发一次
  // ----------------------------------------------------
  it('SF-05 [判别]: 搜索框内回车触发一次 search，与点击合计不重复触发', async () => {
    const form = useForm({}, [{ path: 'name', component: 'input' }]);

    const wrapper = mount(SearchForm, {
      props: { form },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 回车由宿主表单的 submit 事件送达（浏览器隐式提交路径）
    await wrapper.find('form').trigger('submit');
    await flushPromises();
    expect(wrapper.emitted('search')).toHaveLength(1);

    // 点击走同一 submit 路径：合计恰好两次，不存在 @click 与 @submit 双触发
    await wrapper.find('.pro-table_search-form_search-button').trigger('click');
    await flushPromises();
    expect(wrapper.emitted('search')).toHaveLength(2);

    wrapper.unmount();
    document.body.innerHTML = '';
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
        searchButton: markRaw(CustomBtn) as any,
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
  // SF-A16 [判别]: form 为必填 prop，无默认值兜底
  // ----------------------------------------------------
  it('SF-A16 [判别]: form 声明为必填且不带默认值', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    let wrapper: ReturnType<typeof mount> | undefined;

    try {
      // @ts-expect-error form 为必填 prop，省略时不通过类型检查
      wrapper = mount(SearchForm, { props: {} });

      const formProp = (SearchForm as any).props.form;
      expect(formProp.required).toBe(true);
      expect('default' in formProp).toBe(false);
      // 运行期缺参由宿主 Vue 校验兜底：输出缺失必填 prop 告警
      expectWarn(warnSpy, 'Missing required prop: "form"');
    } finally {
      warnSpy.mockRestore();
      wrapper?.unmount();
    }
  });
});
