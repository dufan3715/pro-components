import { describe, it, expect, vi } from 'vitest';
import { computed, defineComponent, h } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { useFormPopup } from '../src/components/form/hooks/useFormPopup';
import { useForm } from '../src/components/form/hooks/useForm';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import { Field as VanField } from '../src/shared/ui';

describe('useFormPopup Hook & Popup 交互测试 (vant-pro)', () => {
  // ----------------------------------------------------
  // VP-V15 [判别]: open(path, initialValue) 统一签名
  // ----------------------------------------------------
  it('VP-V15 [判别]: useFormPopup 的 open(path, initialValue) 统一签名可正确设置当前字段与初始值', () => {
    const popup = useFormPopup(true);
    expect(popup.visible.value).toBe(false);

    // 打开指定字段并赋予初始值
    popup.open('address', ['330000', '330100']);
    expect(popup.visible.value).toBe(true);
    expect(popup.popupFieldPath.value).toBe('address');
    expect(popup.popupFieldValue.value).toEqual(['330000', '330100']);

    // 关闭弹窗
    popup.close();
    expect(popup.visible.value).toBe(false);
    expect(popup.popupFieldPath.value).toBeUndefined();
    expect(popup.popupFieldValue.value).toBeUndefined();
  });

  // ----------------------------------------------------
  // VP-V8 [判别]: Popup 选择器点击与弹窗打开流程
  // ----------------------------------------------------
  it('VP-V8 [判别]: 点击配置了 popup 的只读输入框，能正确唤起对应的 formPopup', async () => {
    const form = useForm(
      {
        city: 'Hangzhou',
      },
      [
        {
          path: 'city',
          label: '城市选择',
          component: 'picker',
          popup: true,
        },
      ]
    );

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false, teleport: true } },
    });

    await flushPromises();

    // 找到展现的 VanField 并模拟点击
    const field = wrapper.findComponent(VanField);
    expect(field.exists()).toBe(true);
    expect(field.props('readonly')).toBe(true);

    await field.trigger('click');
    await flushPromises();

    // 验证 formPopup 状态已更新为打开
    expect(form.formPopup.visible.value).toBe(true);
    expect(form.formPopup.popupFieldPath.value).toBe('city');
    expect(form.formPopup.popupFieldValue.value).toBe('Hangzhou');
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // VP-V10 [判别]: 实例级 contentId / Teleport 容器隔离
  // ----------------------------------------------------
  it('VP-V10 [判别]: 多个 FormPopup 实例拥有独立的 contentId 与 Teleport 目标选择器，互不干扰', () => {
    const popup1 = useFormPopup(true);
    const popup2 = useFormPopup(true);

    expect(popup1.contentId.value).toBeTruthy();
    expect(popup2.contentId.value).toBeTruthy();
    expect(popup1.contentId.value).not.toBe(popup2.contentId.value);

    expect(popup1.teleportTo.value).toBe(`#${popup1.contentId.value}`);
    expect(popup2.teleportTo.value).toBe(`#${popup2.contentId.value}`);
  });

  // ----------------------------------------------------
  // VP-V16 [判别]: 跨字段打开弹层时，自动重置回默认属性，杜绝跨字段属性泄漏
  // ----------------------------------------------------
  it('VP-V16 [判别]: 跨字段打开弹层时，自动重置回默认属性，杜绝跨字段属性泄漏', () => {
    const popup = useFormPopup(true);
    expect(popup.props.position).toBe('bottom');
    expect(popup.props.round).toBe(true);

    // 字段 A 配置了自定义属性
    popup.open('fieldA', 'valA', { position: 'top', round: false });
    expect(popup.props.position).toBe('top');
    expect(popup.props.round).toBe(false);

    // 字段 B 为默认配置，open 时应自动重置
    popup.open('fieldB', 'valB');
    expect(popup.props.position).toBe('bottom');
    expect(popup.props.round).toBe(true);
  });

  // ----------------------------------------------------
  // PU-01 [判别]: 弹层确认清空值时，能正确写回 undefined/null
  // ----------------------------------------------------
  it('PU-01 [判别]: 弹层确认清空值时，能正确写回 undefined/null', async () => {
    const form = useForm(
      {
        city: 'Hangzhou',
      },
      [
        {
          path: 'city',
          component: 'picker',
          popup: true,
        },
      ]
    );

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false, teleport: true } },
    });

    await flushPromises();

    // 模拟打开弹层
    form.formPopup.open('city', 'Hangzhou');
    expect(form.formPopup.visible.value).toBe(true);

    // 在弹层中将值清空为 undefined
    form.formPopup.popupFieldValue.value = undefined;

    // 模拟触发确认事件（通过 BaseField 中的 confirm 回调写回）
    const fieldComp = wrapper.findComponent({ name: 'BaseField' });
    const computedProps = (fieldComp.vm as any).getComponentComputedProps();
    computedProps.onConfirm?.();

    await flushPromises();
    expect(form.getFormData('city')).toBeUndefined();
    expect(form.formPopup.visible.value).toBe(false);
    wrapper.unmount();
  });

  // ----------------------------------------------------
  // VP-V11 [判别]: 多字段列表头部增删经 keyed diff 后，仅被点击实例激活弹层内容
  // ----------------------------------------------------
  it('VP-V11 [判别]: 多字段列表头部增删经 keyed diff 后，仅被点击实例激活弹层内容', async () => {
    const form = useForm(
      {
        city: ['Hangzhou'],
        area: ['Zhejiang'],
      },
      [
        {
          path: 'city',
          label: '城市',
          component: 'picker',
          popup: true,
          columns: [{ text: '杭州', value: 'Hangzhou' }],
        },
        {
          path: 'area',
          label: '地区',
          component: 'picker',
          popup: true,
          columns: [{ text: '浙江', value: 'Zhejiang' }],
        },
      ]
    );

    const wrapper = mount(ProForm, {
      props: { form },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });

    await flushPromises();

    const fields = wrapper.findAllComponents(VanField);
    expect(fields.length).toBe(2);
    const areaInputBefore = fields[1].element.querySelector('input');

    // 点击第二个字段
    await fields[1].trigger('click');
    await flushPromises();

    expect(form.formPopup.popupFieldPath.value).toBe('area');
    const clickedUid = (
      wrapper.findAllComponents({ name: 'BaseField' })[1].vm as any
    ).$.uid;
    expect(form.formPopup.activeFieldId.value).toBe(clickedUid);
    // 仅被点击实例激活弹层内容
    expect(wrapper.findAll('.van-picker')).toHaveLength(1);

    // 头部插入新字段：触发 keyed diff 的 map 分支
    form.prependField('city', {
      path: 'country',
      label: '国家',
      component: 'field',
    } as any);
    await flushPromises();

    expect(
      wrapper.findAllComponents(VanField).map(f => f.props('label'))
    ).toEqual(['国家', '城市', '地区']);
    // 判别点：地区字段的输入节点随 key 迁移保留，未被错位复用
    const areaFieldAfter = wrapper
      .findAllComponents(VanField)
      .find(f => f.props('label') === '地区')!;
    expect(areaFieldAfter.element.querySelector('input')).toBe(areaInputBefore);
    // 弹层内容仍仅一份，字段归属未被列表增删改写
    expect(wrapper.findAll('.van-picker')).toHaveLength(1);
    expect(form.formPopup.activeFieldId.value).toBe(clickedUid);

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // POP-01: updateProps 写入的持久属性在后续 open 时保留，单次覆盖仅对本次生效
  // ----------------------------------------------------
  it('POP-01: updateProps 写入的持久属性在后续 open 时保留，单次覆盖仅对本次生效', () => {
    const popup = useFormPopup(true);
    expect(popup.props.position).toBe('bottom');
    expect('closeOnClickOverlay' in popup.props).toBe(false);

    popup.updateProps({ position: 'top', closeOnClickOverlay: false });
    expect(popup.props.position).toBe('top');
    expect(popup.props.closeOnClickOverlay).toBe(false);

    // 判别点：updateProps 的写入不再被 open 重置
    popup.open('fieldA', 'valA');
    expect(popup.props.position).toBe('top');
    expect(popup.props.closeOnClickOverlay).toBe(false);

    // 判别点：open 的 customProps 仅对本次生效
    popup.open('fieldB', 'valB', { position: 'bottom' });
    expect(popup.props.position).toBe('bottom');
    expect(popup.props.closeOnClickOverlay).toBe(false);

    // 判别点：再次 open 无覆盖时回到持久基础属性
    popup.open('fieldC', 'valC');
    expect(popup.props.position).toBe('top');
    expect(popup.props.closeOnClickOverlay).toBe(false);

    // 显式重置后基础属性回到默认值
    popup.resetProps();
    popup.open('fieldD', 'valD');
    expect(popup.props.position).toBe('bottom');
    expect('closeOnClickOverlay' in popup.props).toBe(false);
  });

  // ----------------------------------------------------
  // M10 [判别]: useForm(false) 与 useFormPopup(false) 孤立调用安全回退
  // ----------------------------------------------------
  it('M10 [判别]: useForm(false) 在无注入上下文时回退根实例，仍正确补挂 formPopup', () => {
    const form = useForm(false);
    expect(form).toBeDefined();
    expect(form.formPopup).toBeDefined();
    expect(form.formPopup.visible.value).toBe(false);
    form.formPopup.open('address', '330000');
    expect(form.formPopup.visible.value).toBe(true);
    expect(form.formPopup.popupFieldPath.value).toBe('address');
  });

  it('M11 [判别]: useFormPopup(false) 在无注入上下文时发出告警并安全回退创建独立弹层', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const popup = useFormPopup(false);
    expect(popup).toBeDefined();
    expect(popup.visible.value).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        '[useFormPopup] root=false 但未找到注入的父弹层实例'
      )
    );
    warnSpy.mockRestore();
  });

  // ----------------------------------------------------
  // VP-V12 [判别]: 弹层容器 id 跨独立挂载可复现（useId 派生，SSR hydration 稳定）
  // ----------------------------------------------------
  it('VP-V12 [判别]: 组件上下文内创建的弹层容器 id 跨独立挂载保持一致', async () => {
    // 表单须在组件 setup 内创建
    const captureForm = () => {
      let captured: any;
      const HostApp = defineComponent({
        setup() {
          captured = useForm({ city: 'Hangzhou' }, [
            { path: 'city', label: '城市', component: 'picker', popup: true },
          ]);
          return () => h(ProForm, { form: captured });
        },
      });
      return { HostApp, getForm: () => captured };
    };

    const app1 = captureForm();
    const w1 = mount(app1.HostApp, {
      global: { stubs: { transition: false, teleport: true } },
    });
    await flushPromises();
    // Popup 默认懒渲染，先打开弹层使容器 div 落地
    app1.getForm().formPopup.open('city', 'Hangzhou');
    await flushPromises();
    const div1 = w1.find('div[id^="pro-form-popup-content"]');
    expect(div1.exists()).toBe(true);
    const id1 = div1.attributes('id');
    expect(id1).toBe(app1.getForm().formPopup.contentId.value);

    const app2 = captureForm();
    const w2 = mount(app2.HostApp, {
      global: { stubs: { transition: false, teleport: true } },
    });
    await flushPromises();
    app2.getForm().formPopup.open('city', 'Hangzhou');
    await flushPromises();
    const id2 = w2.find('div[id^="pro-form-popup-content"]').attributes('id');

    // 判别：仅应用级 useId 计数器的 id 序列跨挂载可复现
    expect(id2).toBe(id1);
    w1.unmount();
    w2.unmount();
  });

  // ----------------------------------------------------
  // VP-V13 [判别]: 同一应用内多个 ProForm 的弹层容器 id 互不相同
  // ----------------------------------------------------
  it('VP-V13 [判别]: 同一应用内多个 ProForm 的弹层容器 id 互不相同', async () => {
    const forms: any[] = [];
    const HostApp = defineComponent({
      setup() {
        forms.push(
          useForm({ city: 'a' }, [
            { path: 'city', label: '城市A', component: 'picker', popup: true },
          ]),
          useForm({ city: 'b' }, [
            { path: 'city', label: '城市B', component: 'picker', popup: true },
          ])
        );
        return () =>
          h('div', [
            h(ProForm, { form: forms[0] }),
            h(ProForm, { form: forms[1] }),
          ]);
      },
    });
    const w = mount(HostApp, {
      global: { stubs: { transition: false, teleport: true } },
    });
    await flushPromises();
    forms[0].formPopup.open('city', 'a');
    forms[1].formPopup.open('city', 'b');
    await flushPromises();
    const ids = w
      .findAll('div[id^="pro-form-popup-content"]')
      .map(d => d.attributes('id'));
    expect(ids.length).toBe(2);
    expect(ids[0]).not.toBe(ids[1]);
    w.unmount();
  });

  // ----------------------------------------------------
  // VP-V14 [判别]: 弹层字段归属标识与字段组件实例 uid 恒等
  // ----------------------------------------------------
  it('VP-V14 [判别]: 弹层字段归属标识与字段组件实例 uid 恒等', async () => {
    const form = useForm({ city: 'Hangzhou' }, [
      { path: 'city', label: '城市', component: 'picker', popup: true },
    ]);
    const w = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false, teleport: true } },
    });
    await flushPromises();

    const fieldComp = w.findComponent({ name: 'BaseField' });
    await w.findComponent(VanField).trigger('click');
    await flushPromises();

    expect(form.formPopup.visible.value).toBe(true);
    // 判别：归属标识直接取组件实例 uid，而非模块级自增计数器
    expect(form.formPopup.activeFieldId.value).toBe(
      (fieldComp.vm as any).$.uid
    );
    w.unmount();
  });

  // ----------------------------------------------------
  // VP-V17 [判别]: 首开时弹层内容经真实 defer Teleport 挂载到实例容器
  // ----------------------------------------------------
  it('VP-V17 [判别]: 首开时弹层内容经真实 defer Teleport 挂载到 contentId 容器', async () => {
    const form = useForm({ city: ['Hangzhou'] }, [
      {
        path: 'city',
        label: '城市',
        component: 'picker',
        popup: true,
        columns: [{ text: '杭州', value: 'Hangzhou' }],
      },
    ]);
    const w = mount(ProForm, {
      props: { form },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    // 首开前：Popup 懒渲染，容器尚未落地
    const containerId = form.formPopup.contentId.value;
    expect(document.querySelector(`#${containerId}`)).toBeNull();

    await w.findComponent(VanField).trigger('click');
    await flushPromises();

    const target = document.querySelector(`#${containerId}`);
    expect(target).not.toBeNull();
    // 判别点：解析到实例容器，而非无实例后缀的降级选择器
    expect(document.querySelector('#pro-form-popup-content')).toBeNull();
    const picker = w.findComponent({ name: 'VanPicker' });
    expect(picker.exists()).toBe(true);
    expect(target!.contains(picker.element)).toBe(true);
    w.unmount();
  });

  // ----------------------------------------------------
  // VP-V18 [判别]: 显式覆盖 teleportTo 时弹层内容挂载到指定容器
  // ----------------------------------------------------
  it('VP-V18 [判别]: 显式覆盖 teleportTo 时弹层内容挂载到指定容器', async () => {
    const form = useForm({ city: ['Hangzhou'] }, [
      {
        path: 'city',
        label: '城市',
        component: 'picker',
        popup: true,
        columns: [{ text: '杭州', value: 'Hangzhou' }],
      },
    ]);
    const host = document.createElement('div');
    host.id = 'custom-popup-host';
    document.body.appendChild(host);
    form.formPopup.teleportTo = computed(() => '#custom-popup-host');

    const w = mount(ProForm, {
      props: { form },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    await w.findComponent(VanField).trigger('click');
    await flushPromises();

    const picker = w.findComponent({ name: 'VanPicker' });
    expect(picker.exists()).toBe(true);
    expect(host.contains(picker.element)).toBe(true);
    // 判别点：覆盖后内容不再挂到实例默认容器
    const defaultContainer = document.querySelector(
      `#${form.formPopup.contentId.value}`
    );
    expect(defaultContainer).not.toBeNull();
    expect(defaultContainer!.contains(picker.element)).toBe(false);
    w.unmount();
    host.remove();
  });
});
