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

  it('FD-04 getFormData 2层与3层嵌套路径强类型推导', () => {
    interface NestedUser {
      user: {
        name: string;
        address: {
          city: string;
        };
      };
      address: {
        city: string;
      };
    }
    const { getFormData } = useFormData<NestedUser>({
      user: { name: '张三', address: { city: '上海' } },
      address: { city: '北京' },
    });
    // 2 层推导，无需 as any
    const city: string = getFormData('address.city');
    expect(city).toBe('北京');
    // 3 层推导，无需 as any
    const userCity: string = getFormData('user.address.city');
    expect(userCity).toBe('上海');
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

  it("FD-15 [mount] falsy init（''）创建独立 store 且归一化为空对象", () => {
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
    expect(parentStore.formData.name).toBe('x');
    expect(childStore.formData.name).toBeUndefined();
    expect(JSON.stringify(childStore.formData)).toBe('{}');
    // 验证写入正常，不抛 TypeError
    childStore.setFormData('a', 1);
    expect(childStore.getFormData('a')).toBe(1);
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

  it('FD-21 泛型结构下支持已知 key 强类型写入与函数式更新', () => {
    interface UserForm {
      name: string;
      count: number;
    }
    const store = useFormData<UserForm>({ name: '张三', count: 1 });
    store.setFormData('name', '李四');
    expect(store.getFormData('name')).toBe('李四');
    store.setFormData('count', prev => prev + 1);
    expect(store.getFormData('count')).toBe(2);
  });

  it('FD-22 批量覆盖支持带有扩展属性的对象（ExtendWithAny 兼容）', () => {
    interface StrictProfile {
      nickname: string;
      age: number;
    }
    const store = useFormData<StrictProfile>({ nickname: 'Alice', age: 18 });
    // 验证允许传入含有动态额外 key 的对象并覆盖
    store.setFormData({ nickname: 'Bob', extraTag: 'vip' } as any);
    expect(store.formData.nickname).toBe('Bob');
    expect(store.formData.extraTag).toBe('vip');
    expect(store.formData.age).toBeUndefined();
  });

  it('FD-23 函数式批量更新支持返回展开对象', () => {
    interface CounterForm {
      count: number;
      label: string;
    }
    const store = useFormData<CounterForm>({ count: 10, label: '计数' });
    store.setFormData(prev => ({ ...prev, count: prev.count + 5, extra: 999 }));
    expect(store.formData.count).toBe(15);
    expect(store.formData.label).toBe('计数');
    expect((store.formData as any).extra).toBe(999);
  });
});
