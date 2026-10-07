import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import { useFields } from '../src/components/form/hooks/useFields';
import { useFormRef } from '../src/components/form/hooks/useFormRef';
import { useFormPopup } from '../src/components/form/hooks/useFormPopup';

describe('表单适配层 Hook 测试 (vant-pro)', () => {
  // ----------------------------------------------------
  // VP-F16 [判别]: 适配层 useFields 的增删改查
  // ----------------------------------------------------
  it('VP-F16 [判别]: 经适配层 useFields 返回的字段配置可增删改查并保留初始字段', () => {
    const {
      fields,
      getField,
      setField,
      appendField,
      prependField,
      deleteField,
      getParentField,
    } = useFields([
      { path: 'name', label: '姓名', component: 'field' },
      {
        path: 'group',
        label: '分组',
        component: 'field',
        fields: [{ path: 'group.child', label: '子项', component: 'field' }],
      },
    ] as any);

    // 初始字段经适配层透传
    expect(fields.value).toHaveLength(2);

    // 查：路径（含深层点分路径）
    expect(getField('name')?.label).toBe('姓名');
    expect(getField('group.child')?.label).toBe('子项');

    // 改：合并模式保留未声明属性
    setField('name', { label: '用户名' } as any);
    expect(getField('name')?.label).toBe('用户名');
    expect(getField('name')?.component).toBe('field');

    // 增：指定字段后追加、指定字段前插入
    appendField('name', {
      path: 'age',
      label: '年龄',
      component: 'stepper',
    } as any);
    expect(fields.value.map(field => field.path)).toEqual([
      'name',
      'age',
      'group',
    ]);
    prependField(undefined, {
      path: 'id',
      label: 'ID',
      component: 'field',
    } as any);
    expect(fields.value.map(field => field.path)).toEqual([
      'id',
      'name',
      'age',
      'group',
    ]);

    // 父级字段查找
    expect(getParentField('group.child')?.path).toBe('group');

    // 删
    deleteField('age');
    expect(getField('age')).toBeUndefined();
    expect(fields.value.map(field => field.path)).toEqual([
      'id',
      'name',
      'group',
    ]);
  });

  // ----------------------------------------------------
  // VP-F17 [判别]: 适配层 useFormRef 转发宿主表单方法
  // ----------------------------------------------------
  it('VP-F17 [判别]: 适配层 useFormRef 绑定宿主 VanForm 实例并经 formRef 调用其校验/重置方法', async () => {
    const form = useForm({ name: '' }, [
      {
        path: 'name',
        label: '姓名',
        component: 'field',
        rules: [{ required: true, message: '请输入姓名' }],
      },
    ]);

    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const hostForm = form.formRef.value as any;
    expect(hostForm).toBeTruthy();
    expect(typeof hostForm.validate).toBe('function');

    const { formRef, setFormRef } = useFormRef();
    expect(formRef.value).toBeUndefined();

    // setFormRef 转发宿主实例
    setFormRef(hostForm);
    expect(formRef.value).toBe(hostForm);

    // 经适配层 formRef 调用宿主 validate：校验失败并经宿主表单回显错误
    await expect(formRef.value!.validate()).rejects.toBeDefined();
    await flushPromises();
    expect(wrapper.text()).toContain('请输入姓名');

    // 经适配层 formRef 调用宿主 resetValidation：错误回显被清除
    formRef.value!.resetValidation();
    await flushPromises();
    expect(wrapper.text()).not.toContain('请输入姓名');

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // VP-F18 [判别]: standalone-N 兜底 id 唯一性
  // ----------------------------------------------------
  it('VP-F18 [判别]: 无组件上下文创建的弹层 id 走 standalone-N 兜底且多次创建互不重复', () => {
    const first = useFormPopup(true);
    const second = useFormPopup(true);

    expect(first.contentId.value).toMatch(
      /^pro-form-popup-content-standalone-\d+$/
    );
    expect(second.contentId.value).toMatch(
      /^pro-form-popup-content-standalone-\d+$/
    );
    // 兜底种子逐次自增：两个独立弹层容器 id 与 Teleport 目标均不重复
    expect(first.contentId.value).not.toBe(second.contentId.value);
    expect(first.teleportTo.value).toBe(`#${first.contentId.value}`);
    expect(second.teleportTo.value).toBe(`#${second.contentId.value}`);
    // 同一实例内 id 恒定
    expect(first.contentId.value).toBe(first.contentId.value);
  });
});
