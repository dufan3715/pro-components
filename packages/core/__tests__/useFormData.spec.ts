import { describe, it, expect, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import useFormData from '../src/form/useFormData';
import useForm from '../src/form/useForm';

describe('useFormData', () => {
  it('FD-01 初始数据创建响应式 formData', () => {
    const init = { name: '张三' };
    const { formData } = useFormData(init);
    expect(formData.name).toBe('张三');
    init.name = '李四';
    expect(formData.name).toBe('李四');
  });

  it('FD-02 setFormData 后 formData 对象身份稳定', () => {
    const { formData, setFormData } = useFormData<{ a?: number; b?: number }>(
      {}
    );
    const before = formData;
    setFormData('a', 1);
    setFormData({ b: 2 });
    expect(formData).toBe(before);
  });

  it('FD-03 getFormData 顶层路径', () => {
    const { getFormData } = useFormData({ name: '张三' });
    expect(getFormData('name')).toBe('张三');
  });

  it('FD-04 getFormData 嵌套路径', () => {
    const { getFormData } = useFormData({ address: { city: '北京' } });
    expect(getFormData('address.city' as any)).toBe('北京');
  });

  it('FD-05 getFormData 数组下标路径', () => {
    const { getFormData } = useFormData({ list: [{ name: 'a' }] });
    expect(getFormData('list[0].name' as any)).toBe('a');
  });

  it('FD-06 不存在路径返回 undefined', () => {
    const { getFormData } = useFormData({ a: 1 });
    expect(getFormData('not.exist' as any)).toBeUndefined();
  });

  it('FD-07 空/undefined 路径返回 undefined', () => {
    const { getFormData } = useFormData({ a: 1 });
    expect(getFormData('' as any)).toBeUndefined();
    expect(getFormData(undefined as any)).toBeUndefined();
  });

  it('FD-08 setFormData 嵌套写入自动创建中间对象', () => {
    const { formData, setFormData } = useFormData<any>({});
    setFormData('a.b.c', 1);
    expect(formData.a.b.c).toBe(1);
  });

  it('FD-09 setFormData 函数式更新收到旧值', () => {
    const { formData, setFormData } = useFormData<any>({});
    setFormData('count', (v: any) => (v ?? 0) + 1);
    expect(formData.count).toBe(1);
    setFormData('count', (v: any) => (v ?? 0) + 1);
    expect(formData.count).toBe(2);
  });

  it('FD-10 批量替换删除多余 key 且身份稳定', () => {
    const { formData, setFormData } = useFormData<any>({ name: 'a', age: 1 });
    const before = formData;
    setFormData({ name: 'b' });
    expect(Object.keys(formData)).toEqual(['name']);
    expect(formData.name).toBe('b');
    expect(formData).toBe(before);
  });

  it('FD-11 批量函数式更新', () => {
    const { formData, setFormData } = useFormData<any>({ initial: 0 });
    setFormData((v: any) => ({ ...v, x: 1 }));
    expect(formData.x).toBe(1);
  });

  it('FD-12 批量传入非普通对象无操作', () => {
    const { formData, setFormData } = useFormData<any>({ name: 'init' });
    setFormData([1, 2] as any);
    expect(formData).toEqual({ name: 'init' });
    setFormData('str' as any);
    expect(formData).toEqual({ name: 'init' });
    setFormData(null as any);
    expect(formData).toEqual({ name: 'init' });
  });

  it('FD-13 路径写入 null 值成功', () => {
    const { formData, setFormData } = useFormData<any>({});
    setFormData('x', null);
    expect(formData.x).toBeNull();
  });

  it('FD-14 [mount] 无 init 时继承父 store', () => {
    let parentStore: any;
    let childStore: any;
    const Child = defineComponent({
      setup() {
        childStore = useFormData();
        return () => h('div');
      },
    });
    const Parent = defineComponent({
      setup() {
        parentStore = useForm({ name: 'x' } as any, [] as any, true);
        return () => h(Child);
      },
    });
    mount(Parent);
    expect(childStore.formData).toBe(parentStore.formData);
  });

  it("FD-15 [红] [mount] falsy init（''）创建独立 store", () => {
    let parentStore: any;
    let childStore: any;
    const Child = defineComponent({
      setup() {
        childStore = useFormData('' as any);
        return () => h('div');
      },
    });
    const Parent = defineComponent({
      setup() {
        parentStore = useForm({ name: 'x' } as any, [] as any, true);
        return () => h(Child);
      },
    });
    mount(Parent);
    // 修复后预期：子 formData 应为 ''，而当前实现会错误地继承父 store
    expect(parentStore.formData.name).toBe('x');
    expect(childStore.formData).toBe('');
  });

  it('FD-16 无父 store 且无 init 创建独立 store', () => {
    const store = useFormData();
    expect(store.formData).toBeDefined();
    expect(JSON.stringify(store.formData)).toBe('{}');
  });

  it('FD-17 setup 外调用 useFormData 不触发 Vue provide 告警且功能正常', () => {
    const warnSpy = vi.spyOn(console, 'warn');
    const store = useFormData({ a: 1 });
    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('provide() can only be used inside setup()')
    );
    expect(store.getFormData('a')).toBe(1);
    store.setFormData('a', 2);
    expect(store.getFormData('a')).toBe(2);
    warnSpy.mockRestore();
  });

  it('FD-18 点号字面量 key 优先读取与写入', () => {
    const store = useFormData<any>({
      'user.name': 'Alice',
      user: { name: 'Bob' },
    });
    expect(store.getFormData('user.name')).toBe('Alice');
    store.setFormData('user.name', 'Charlie');
    expect(store.formData['user.name']).toBe('Charlie');
    expect(store.formData.user.name).toBe('Bob');
  });

  it('FD-19 list.0.name 路径自动创建数组中间层', () => {
    const store = useFormData<any>({});
    store.setFormData('users.0.name', 'David');
    expect(Array.isArray(store.formData.users)).toBe(true);
    expect(store.formData.users[0].name).toBe('David');
    expect(store.getFormData('users.0.name')).toBe('David');
  });

  it('FD-20 深层路径多轮读写', () => {
    const store = useFormData<any>({});
    store.setFormData('a.b.c.d', 100);
    expect(store.getFormData('a.b.c.d')).toBe(100);
    store.setFormData('a.b.c.d', (v: number) => v + 50);
    expect(store.getFormData('a.b.c.d')).toBe(150);
  });
});
