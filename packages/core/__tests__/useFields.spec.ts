import { describe, it, expect } from 'vitest';
import { ref, toRaw } from 'vue';
import useFields from '../src/form/useFields';

const baseFields = [
  { path: 'name', label: '姓名' },
  { path: 'age', label: '年龄' },
  { path: 'address', label: '地址', fields: [{ path: 'city', label: '城市' }] },
];

describe('useFields', () => {
  it('FF-01 init 数组与 fields.value 同一引用', () => {
    const arr = [...baseFields];
    const { fields } = useFields<any>(arr);
    expect(toRaw(fields.value)).toBe(arr);
  });

  it('FF-02 无 init 时为空数组', () => {
    const { fields } = useFields<any>();
    expect(fields.value).toEqual([]);
  });

  it('FF-03 getField 顶层字符串路径', () => {
    const { getField } = useFields<any>(baseFields);
    expect(getField('name')?.label).toBe('姓名');
  });

  it('FF-04a getField 嵌套子字段自身路径', () => {
    const { getField } = useFields<any>(baseFields);
    expect(getField('city')?.label).toBe('城市');
  });

  it('FF-04b getField 父拼接路径（决策：不支持拼接）', () => {
    const { getField } = useFields<any>(baseFields);
    // 决策（2026-08-21）：字段按自身 path 寻址，不支持父拼接路径；src JSDoc 示例待修正
    expect(getField('address.city')).toBeUndefined();
    // 自身 path 仍然可查
    expect(getField('city')?.label).toBe('城市');
  });

  it('FF-05 name 优先于 path', () => {
    const { getField } = useFields<any>([{ path: 'a', name: 'b', label: 'L' }]);
    expect(getField('b')?.label).toBe('L');
  });

  it('FF-06 path 数组形式', () => {
    const { getField } = useFields<any>([{ path: ['a', 'b'], label: 'L' }]);
    expect(getField('a.b')?.label).toBe('L');
  });

  it('FF-07 getField 函数谓词返回首个', () => {
    const { getField } = useFields<any>([
      { path: 'a', label: 'A' },
      { path: 'b', label: 'A' },
    ]);
    const res = getField((f: any) => f.label === 'A');
    expect(Array.isArray(res)).toBe(false);
    expect((res as any)?.path).toBe('a');
  });

  it('FF-08 getField 函数谓词 all:true 返回数组', () => {
    const { getField } = useFields<any>([
      { path: 'a', label: 'A' },
      { path: 'b', label: 'A' },
    ]);
    const res = getField((f: any) => f.label === 'A', { all: true });
    expect(Array.isArray(res)).toBe(true);
    expect((res as any)?.length).toBe(2);
  });

  it('FF-09 未找到返回 undefined', () => {
    const { getField } = useFields<any>(baseFields);
    expect(getField('not-exist')).toBeUndefined();
  });

  it('FF-10 空串/undefined 路径返回 undefined', () => {
    const { getField } = useFields<any>(baseFields);
    expect(getField('')).toBeUndefined();
    expect(getField(undefined as any)).toBeUndefined();
  });

  it('FF-11 缓存：连续两次查找结果对象身份一致', () => {
    const { getField } = useFields<any>(baseFields);
    const r1 = getField('name');
    const r2 = getField('name');
    expect(r1).toBe(r2);
  });

  it('FF-12 缓存：rewrite 改 path 后旧失效新可查', () => {
    const { getField, setField } = useFields<any>([
      { path: 'name', label: '姓名' },
    ]);
    getField('name');
    setField('name', { path: 'x', label: '新' } as any, {
      updateType: 'rewrite',
    });
    expect(getField('name')).toBeUndefined();
    expect(getField('x')?.label).toBe('新');
  });

  it('FF-13 缓存：删除后其余字段仍可查', () => {
    const { getField, deleteField } = useFields<any>([
      { path: 'a' },
      { path: 'b' },
      { path: 'c' },
    ]);
    getField('b');
    deleteField('a');
    expect(getField('b')?.path).toBe('b');
  });

  it('FF-14 缓存：函数全量查找后字符串查找不受影响', () => {
    const { getField } = useFields<any>([
      { path: 'a.b', label: 'TOP' },
      { path: 'a', fields: [{ path: 'b', label: 'NEST' }] },
    ]);
    getField((f: any) => f.path === 'b', { all: true });
    expect(getField('a.b')?.label).toBe('TOP');
  });

  it('FF-15 setField merge 保留其他属性', () => {
    const { getField, setField } = useFields<any>([
      { path: 'name', label: '姓名', extra: 1 },
    ]);
    setField('name', { label: '用户名' });
    const f = getField('name');
    expect(f?.path).toBe('name');
    expect(f?.label).toBe('用户名');
    expect((f as any)?.extra).toBe(1);
  });

  it('FF-16 setField merge 覆盖 ref 属性', () => {
    const { fields, setField } = useFields<any>([
      { path: 'name', disabled: ref(false) },
    ]);
    setField('name', { disabled: true } as any);
    expect(fields.value[0].disabled).toBe(true);
  });

  it('FF-17 setField rewrite 整体替换', () => {
    const { getField, setField } = useFields<any>([
      { path: 'name', label: '旧', extra: 1 },
    ]);
    setField('name', { path: 'name', label: '新' } as any, {
      updateType: 'rewrite',
    });
    const f = getField('name');
    expect(f?.label).toBe('新');
    expect((f as any)?.extra).toBeUndefined();
  });

  it('FF-18 setField 函数式更新收到当前字段', () => {
    const { getField, setField } = useFields<any>([
      { path: 'name', label: '姓名' },
    ]);
    setField('name', (pre: any) => ({ ...pre, label: pre.label + '!' }));
    expect(getField('name')?.label).toBe('姓名!');
  });

  it('FF-19 函数路径默认 all=true（锁现状 C1）', () => {
    const { fields, setField } = useFields<any>([
      { path: 'a', disabled: false },
      { path: 'b', disabled: false },
    ]);
    setField(() => true, { disabled: true } as any);
    expect(fields.value[0].disabled).toBe(true);
    expect(fields.value[1].disabled).toBe(true);
  });

  it('FF-20 字符串路径默认只更新第一个', () => {
    const { fields, setField } = useFields<any>([
      { path: 'name', label: 'A' },
      { path: 'name', label: 'B' },
    ]);
    setField('name', { label: 'X' });
    expect(fields.value[0].label).toBe('X');
    expect(fields.value[1].label).toBe('B');
  });

  it('FF-21 setField 嵌套字段更新', () => {
    const { fields, setField } = useFields<any>(
      JSON.parse(JSON.stringify(baseFields))
    );
    setField('city', { label: '市' });
    expect(fields.value[2].fields![0].label).toBe('市');
  });

  it('FF-22 field 参数为 null/undefined 无操作', () => {
    const { fields, setField } = useFields<any>([
      { path: 'name', label: '姓名' },
    ]);
    setField('name', null as any);
    expect(fields.value[0].label).toBe('姓名');
    setField('name', undefined as any);
    expect(fields.value[0].label).toBe('姓名');
  });

  it('FF-23 fn updater 返回 falsy 无操作', () => {
    const { fields, setField } = useFields<any>([
      { path: 'name', label: '姓名' },
    ]);
    setField('name', () => null as any);
    expect(fields.value[0].label).toBe('姓名');
  });

  it('FF-24 deleteField 字符串路径删除单个', () => {
    const { fields, deleteField } = useFields<any>(
      JSON.parse(JSON.stringify(baseFields))
    );
    deleteField('age');
    expect(fields.value.map((f: any) => f.path)).toEqual(['name', 'address']);
  });

  it('FF-25 deleteField 函数路径默认 all=true（锁现状 C1）', () => {
    const { fields, deleteField } = useFields<any>([
      { path: 'a', label: '姓名' },
      { path: 'b', label: '其他', fields: [{ path: 'c', label: '姓名' }] },
    ]);
    deleteField((f: any) => f.label === '姓名');
    expect(fields.value.map((f: any) => f.path)).toEqual(['b']);
    expect(fields.value[0].fields).toEqual([]);
  });

  it('FF-26 deleteField 函数路径 all:false 只删首个', () => {
    const { fields, deleteField } = useFields<any>([
      { path: 'a', label: 'A' },
      { path: 'b', label: 'A' },
    ]);
    deleteField((f: any) => f.label === 'A', { all: false });
    expect(fields.value.map((f: any) => f.path)).toEqual(['b']);
  });

  it('FF-27 [红] deleteField 函数+all:true 同父级多匹配正确删除', () => {
    const { fields, deleteField } = useFields<any>([
      { path: 'a', label: 'A' },
      { path: 'b', label: 'B' },
      { path: 'c', label: 'C' },
      { path: 'd', label: 'D' },
    ]);
    deleteField((f: any) => ['A', 'B', 'C'].includes(f.label), { all: true });
    expect(fields.value.map((f: any) => f.path)).toEqual(['d']);
  });

  it('FF-28 deleteField 未找到无操作', () => {
    const { fields, deleteField } = useFields<any>([{ path: 'a' }]);
    deleteField('not-exist');
    expect(fields.value.map((f: any) => f.path)).toEqual(['a']);
  });

  it('FF-29 appendField 字符串路径 after', () => {
    const { fields, appendField } = useFields<any>(
      JSON.parse(JSON.stringify(baseFields))
    );
    appendField('name', { path: 'email' });
    expect(fields.value.map((f: any) => f.path)).toEqual([
      'name',
      'email',
      'age',
      'address',
    ]);
  });

  it('FF-30 appendField undefined 追加末尾', () => {
    const { fields, appendField } = useFields<any>([{ path: 'a' }]);
    appendField(undefined, { path: 'x' });
    expect(fields.value.map((f: any) => f.path)).toEqual(['a', 'x']);
  });

  it('FF-31 appendField 批量数组', () => {
    const { fields, appendField } = useFields<any>(
      JSON.parse(JSON.stringify(baseFields))
    );
    appendField('name', [{ path: 'e1' }, { path: 'e2' }]);
    expect(fields.value.map((f: any) => f.path)).toEqual([
      'name',
      'e1',
      'e2',
      'age',
      'address',
    ]);
  });

  it('FF-32 [红] appendField 函数+all:true 插入位置正确', () => {
    const { fields, appendField } = useFields<any>([
      { path: 'a' },
      { path: 'b' },
    ]);
    appendField(() => true, { path: 'x' }, { all: true });
    expect(fields.value.map((f: any) => f.path)).toEqual(['a', 'x', 'b', 'x']);
  });

  it('FF-33 prependField 字符串路径 before', () => {
    const { fields, prependField } = useFields<any>(
      JSON.parse(JSON.stringify(baseFields))
    );
    prependField('age', { path: 'id' });
    expect(fields.value.map((f: any) => f.path)).toEqual([
      'name',
      'id',
      'age',
      'address',
    ]);
  });

  it('FF-34 prependField undefined 插入开头', () => {
    const { fields, prependField } = useFields<any>([{ path: 'a' }]);
    prependField(undefined, { path: 'x' });
    expect(fields.value.map((f: any) => f.path)).toEqual(['x', 'a']);
  });

  it('FF-35 [红] prependField 函数+all:true 插入位置正确', () => {
    const { fields, prependField } = useFields<any>([
      { path: 'a' },
      { path: 'b' },
    ]);
    prependField(() => true, { path: 'x' }, { all: true });
    expect(fields.value.map((f: any) => f.path)).toEqual(['x', 'a', 'x', 'b']);
  });

  it('FF-36 getParentField 顶层字段返回虚拟根', () => {
    const { getParentField } = useFields<any>(
      JSON.parse(JSON.stringify(baseFields))
    );
    const parent = getParentField('name');
    expect(parent?.fields?.length).toBe(3);
  });

  it('FF-37 getParentField 嵌套字段返回父字段', () => {
    const { getParentField } = useFields<any>(
      JSON.parse(JSON.stringify(baseFields))
    );
    const parent = getParentField('city');
    expect(parent?.path).toBe('address');
  });

  it('FF-38 getParentField 函数谓词 all:true', () => {
    const { getParentField } = useFields<any>(
      JSON.parse(JSON.stringify(baseFields))
    );
    const parents = getParentField((f: any) => f.path === 'city', {
      all: true,
    });
    expect(parents?.length).toBe(1);
    expect(parents?.[0]?.path).toBe('address');
  });

  it('FF-39 三层嵌套遍历', () => {
    const { getField } = useFields<any>([
      {
        path: 'a',
        fields: [
          {
            path: 'a1',
            fields: [{ path: 'a11', label: '三层' }],
          },
        ],
      },
    ]);
    expect(getField('a11')?.label).toBe('三层');
  });

  it('FF-40 匹配顺序顶层优先', () => {
    const { getField } = useFields<any>([
      { path: 'a', label: 'X' },
      { path: 'b', fields: [{ path: 'b1', label: 'X' }] },
    ]);
    expect(getField((f: any) => f.label === 'X')?.path).toBe('a');
  });

  it('FF-41 缓存一致性（同 path 字段）', () => {
    const { getField } = useFields<any>([
      { path: 'a.b', label: 'TOP' },
      { path: 'a', fields: [{ path: 'b', label: 'NEST' }] },
    ]);
    const r1 = getField('a.b');
    const r2 = getField('a.b');
    expect(r1).toBe(r2);
    expect(r1?.label).toBe('TOP');
  });

  describe('直接变异 (DM 组)', () => {
    it('DM-01 直接 fields.value.push 后可查新字段', () => {
      const { fields, getField } = useFields<any>([{ path: 'a', label: 'A' }]);
      fields.value.push({ path: 'b', label: 'B' });
      expect(getField('b')?.label).toBe('B');
    });

    it('DM-02 直接 fields.value.splice 删除后旧字段自愈失效、其余可查', () => {
      const { fields, getField } = useFields<any>([
        { path: 'a', label: 'A' },
        { path: 'b', label: 'B' },
      ]);
      getField('a');
      fields.value.splice(0, 1);
      expect(getField('a')).toBeUndefined();
      expect(getField('b')?.label).toBe('B');
    });

    it('DM-03 直接整体替换 fields.value = [...] 后全量新字段正常寻址', () => {
      const { fields, getField } = useFields<any>([
        { path: 'old', label: '旧' },
      ]);
      getField('old');
      fields.value = [
        { path: 'new1', label: '新1' },
        { path: 'new2', label: '新2' },
      ];
      expect(getField('old')).toBeUndefined();
      expect(getField('new1')?.label).toBe('新1');
      expect(getField('new2')?.label).toBe('新2');
    });

    it('DM-04 就地修改 f.path 属性后旧路径失效、新路径生效', () => {
      const { fields, getField } = useFields<any>([
        { path: 'old', label: '值' },
      ]);
      getField('old');
      fields.value[0].path = 'newPath';
      expect(getField('old')).toBeUndefined();
      expect(getField('newPath')?.label).toBe('值');
    });

    it('DM-05 同 path 重复字段 getField 与 BFS 首匹配一致 (keep-first)', () => {
      const { getField } = useFields<any>([
        { path: 'dup', label: 'FIRST' },
        { path: 'dup', label: 'SECOND' },
      ]);
      // 先做全量函数查找：last-write 策略会把缓存覆盖为 SECOND，keep-first 保持 FIRST
      getField(f => f.path === 'dup', { all: true });
      // 再按字符串路径查找：缓存命中必须仍返回 BFS 首匹配 FIRST
      expect(getField('dup')?.label).toBe('FIRST');
    });

    it('DM-06 直接变异嵌套子字段 field.fields.push 正常寻址', () => {
      const { fields, getField } = useFields<any>([
        { path: 'parent', label: 'P', fields: [] },
      ]);
      fields.value[0].fields!.push({ path: 'child', label: 'C' });
      expect(getField('child')?.label).toBe('C');
    });
  });

  // ----------------------------------------------------
  // FF-42 [判别]: fieldIdentityKeys 决定标识解析键序，默认 name 优先于 path
  // ----------------------------------------------------
  it('FF-42 [判别]: fieldIdentityKeys 决定字段标识解析键序，默认 name 优先于 path', () => {
    const defaultKeys = useFields([{ name: 'a', path: 'b' } as any]);
    expect(!!defaultKeys.getField('a')).toBe(true);
    expect(!!defaultKeys.getField('b')).toBe(false);

    const propKeys = useFields([{ prop: 'a', path: 'b' } as any], {
      fieldIdentityKeys: ['prop', 'path'],
    });
    expect(!!propKeys.getField('a')).toBe(true);
    expect(!!propKeys.getField('b')).toBe(false);

    // 未配置 prop 键时，prop 不参与标识解析
    const untouched = useFields([{ prop: 'a' } as any]);
    expect(!!untouched.getField('a')).toBe(false);
  });
});
