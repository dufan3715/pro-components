import { describe, it, expect } from 'vitest';
import { ref, toRaw } from 'vue';
import useFields, { DEFAULT_FIELD_IDENTITY_KEYS } from '../src/form/useFields';

const baseFields = [
  { path: 'name', label: '姓名' },
  { path: 'age', label: '年龄' },
  { path: 'address', label: '地址', fields: [{ path: 'city', label: '城市' }] },
];

describe('useFields', () => {
  it('FF-01 [判别] 内部持有 init 数组浅拷贝：增删字段不修改调用方数组', () => {
    const arr = [...baseFields];
    const snapshot = [...arr];
    const { fields, appendField, deleteField } = useFields<any>(arr);

    // 数组层解耦（非同一引用），元素仍共享（浅拷贝语义）
    expect(toRaw(fields.value)).not.toBe(arr);
    expect(toRaw(fields.value[0])).toBe(arr[0]);

    // 内部增删不反作用于调用方数组
    appendField('extra', { path: 'extra', label: '额外' } as any);
    deleteField('name');
    expect(arr).toEqual(snapshot);
    expect(arr).toHaveLength(snapshot.length);
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
    /*
     * 判别构型：首个顶层的后代先于第二个顶层声明，但层序更浅的第二个顶层应优先命中
     * 深度优先会返回 p1.c，仅 BFS 层序返回 p2
     */
    const { getField } = useFields<any>([
      { path: 'p1', label: 'P1', fields: [{ path: 'p1.c', label: 'TARGET' }] },
      { path: 'p2', label: 'TARGET' },
    ]);
    expect(getField((f: any) => f.label === 'TARGET')?.path).toBe('p2');
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
    // 身份断言：'a' 命中同一字段对象（name 优先解析），'b' 不参与匹配
    expect((defaultKeys.getField('a') as any)?.path).toBe('b');
    expect(defaultKeys.getField('b' as any)).toBeUndefined();

    const propKeys = useFields([{ prop: 'a', path: 'b' } as any], {
      fieldIdentityKeys: ['prop', 'path'],
    });
    expect((propKeys.getField('a') as any)?.path).toBe('b');
    expect(propKeys.getField('b' as any)).toBeUndefined();

    // 未配置 prop 键时，prop 不参与标识解析
    const untouched = useFields([{ prop: 'a' } as any]);
    expect(untouched.getField('a' as any)).toBeUndefined();
  });

  // ----------------------------------------------------
  // FF-43 [判别]: 数字路径 0 作为合法 key（不再被 falsy 守卫吞掉）
  // ----------------------------------------------------
  it('FF-43 [判别]: getField/setField/deleteField 支持数字路径 0', () => {
    const { fields, getField, setField, deleteField } = useFields<any>([
      { path: '0', label: '零' },
      { path: 'a', label: 'A' },
    ]);

    // 读取命中（此前 !0 直接 return undefined）
    expect(getField(0 as any)).toBeTruthy();
    expect((getField(0 as any) as any).label).toBe('零');

    // 更新命中
    setField(0 as any, { label: '零改' });
    expect((getField(0 as any) as any).label).toBe('零改');

    // 删除命中
    deleteField(0 as any);
    expect(fields.value.map((f: any) => f.path)).toEqual(['a']);
  });

  // ----------------------------------------------------
  // FF-44 [判别]: append/prependField 的数字路径 0 走分组匹配分支
  // ----------------------------------------------------
  it('FF-44 [判别]: appendField/prependField 的数字路径 0 命中分组匹配，零命中不插入', () => {
    const matched = useFields<any>([
      { path: '0', label: '零' },
      { path: 'a', label: 'A' },
    ]);
    matched.appendField(0 as any, { path: 'x', label: 'X' } as any);
    expect(matched.fields.value.map((f: any) => f.path)).toEqual([
      '0',
      'x',
      'a',
    ]);
    matched.prependField(0 as any, { path: 'y', label: 'Y' } as any);
    expect(matched.fields.value.map((f: any) => f.path)).toEqual([
      'y',
      '0',
      'x',
      'a',
    ]);

    // 无标识为 '0' 的字段：走匹配分支但零命中，不插入（不回退顶层插入）
    const unmatched = useFields<any>([{ path: 'a' }, { path: 'b' }]);
    unmatched.appendField(0 as any, { path: 'x' } as any);
    unmatched.prependField(0 as any, { path: 'y' } as any);
    expect(unmatched.fields.value.map((f: any) => f.path)).toEqual(['a', 'b']);
  });

  // ----------------------------------------------------
  // FF-45 [判别]: 空字符串路径不匹配任何字段
  // ----------------------------------------------------
  it("FF-45 [判别]: appendField/prependField 传 '' 时不插入，undefined 仍回退顶层插入", () => {
    // 标识解析为空串的字段不参与字符串路径匹配
    const withEmpty = useFields<any>([
      { path: 'a', label: 'A' },
      { path: '', label: '空' },
    ]);
    withEmpty.appendField('' as any, { path: 'x' } as any);
    withEmpty.prependField('' as any, { path: 'y' } as any);
    expect(withEmpty.fields.value.map((f: any) => f.path)).toEqual(['a', '']);

    const unmatched = useFields<any>([{ path: 'a' }]);
    unmatched.appendField('' as any, { path: 'x' } as any);
    unmatched.prependField('' as any, { path: 'y' } as any);
    expect(unmatched.fields.value.map((f: any) => f.path)).toEqual(['a']);

    unmatched.appendField(undefined, { path: 'tail' } as any);
    unmatched.prependField(undefined, { path: 'head' } as any);
    expect(unmatched.fields.value.map((f: any) => f.path)).toEqual([
      'head',
      'a',
      'tail',
    ]);
  });

  // ----------------------------------------------------
  // FF-47 [判别]: initFields 含非对象项不摧毁字段 API
  // ----------------------------------------------------
  it('FF-47 [判别]: initFields 含 null/undefined/原始值时剔除该项，字段查找与编排保持可用', () => {
    const {
      fields,
      getField,
      setField,
      deleteField,
      getParentField,
      appendField,
    } = useFields<any>([
      null,
      { path: 'a', label: 'A' },
      undefined,
      'raw',
    ] as any);

    // 判别点：非对象项在构造期剔除，查找与动态编排 API 全程不抛 TypeError
    expect(fields.value.map((f: any) => f?.path)).toEqual(['a']);
    expect((getField('a') as any)?.label).toBe('A');
    setField('a', { label: 'A2' } as any);
    expect((getField('a') as any)?.label).toBe('A2');
    expect(getParentField('a')).toEqual({ fields: fields.value });
    appendField('a', { path: 'b' } as any);
    expect(fields.value.map((f: any) => f.path)).toEqual(['a', 'b']);
    deleteField('a');
    expect(fields.value.map((f: any) => f.path)).toEqual(['b']);

    // 嵌套 children 内的非对象项不参与遍历（原样保留在子数组中，遍历与插入不受影响）
    const nested = useFields<any>([
      { path: 'g', fields: [null, { path: 'g.x' }] } as any,
    ]);
    expect((nested.getField('g.x') as any)?.path).toBe('g.x');
    nested.appendField('g.x', { path: 'g.y' } as any);
    const nestedChildren = (nested.getField('g') as any)?.fields;
    expect(nestedChildren[1]?.path).toBe('g.x');
    expect(nestedChildren[2]?.path).toBe('g.y');
  });

  // ----------------------------------------------------
  // FF-48 [判别]: 非数组入参回退空字段数组
  // ----------------------------------------------------
  it('FF-48 [判别]: initFields 非数组时回退空数组，字符串不被拆成多个假字段', () => {
    // 字符串入参不再被静默展开为 ['a','b'] 两个假字段
    const fromString = useFields<any>('ab' as any);
    expect(fromString.fields.value).toEqual([]);
    expect(fromString.getField('a' as any)).toBeUndefined();
    fromString.appendField(undefined, { path: 'x' } as any);
    expect(fromString.fields.value.map((f: any) => f.path)).toEqual(['x']);

    // 对象 / 函数入参不再抛 TypeError
    const fromObject = useFields<any>({ path: 'a' } as any);
    expect(fromObject.fields.value).toEqual([]);
    const fromFn = useFields<any>((() => []) as any);
    expect(fromFn.fields.value).toEqual([]);

    // falsy 入参保持空数组
    expect(useFields<any>(0 as any).fields.value).toEqual([]);
    expect(useFields<any>('' as any).fields.value).toEqual([]);
    expect(useFields<any>(false as any).fields.value).toEqual([]);
    expect(useFields<any>().fields.value).toEqual([]);
  });

  // ----------------------------------------------------
  // FF-50 [判别]: 多位点插入时嵌套 fields 逐层克隆，单位点保持原引用
  // ----------------------------------------------------
  it('FF-50 [判别]: 多位点插入的字段嵌套 fields 独立，单位点插入保持原引用', () => {
    const nested = { path: 'child', label: '子字段' };
    const groupField = { path: 'group', fields: [nested] } as any;

    const multi = useFields<any>([{ path: 'a' }, { path: 'b' }]);
    multi.appendField(() => true, groupField, { all: true });
    const first = toRaw(multi.fields.value[1]) as any;
    const second = toRaw(multi.fields.value[3]) as any;

    // 判别点：根字段与嵌套子字段均按位点独立分配
    expect(first).not.toBe(second);
    expect(first).not.toBe(groupField);
    expect(toRaw(first.fields[0])).not.toBe(toRaw(second.fields[0]));
    expect(toRaw(first.fields[0])).not.toBe(nested);
    // 克隆保留字段配置内容
    expect(first.fields[0].path).toBe('child');

    // 反向约束：单位点插入保持原引用，不产生额外副本
    const single = useFields<any>([{ path: 'a' }]);
    single.appendField('a', groupField);
    expect(toRaw(single.fields.value[1])).toBe(groupField);
  });

  // ----------------------------------------------------
  // FF-51 [判别]: rewrite 就地重写保持字段对象身份
  // ----------------------------------------------------
  it('FF-51 [判别]: updateType=rewrite 就地覆盖且字段对象身份不变', () => {
    const api = useFields<any>([
      { path: 'name', label: '姓名', extra: 'old', fields: [] },
    ]);
    const before = api.fields.value[0] as any;
    const rawBefore = toRaw(before);

    api.setField('name', { path: 'name', label: '用户名' } as any, {
      updateType: 'rewrite',
    });

    const after = api.fields.value[0] as any;
    // 判别点：对象身份保持（渲染 key 与实例登记不漂移），未包含的键被删除
    expect(toRaw(after)).toBe(rawBefore);
    expect(after.label).toBe('用户名');
    expect('extra' in toRaw(after)).toBe(false);
    expect('fields' in toRaw(after)).toBe(false);
  });

  // ----------------------------------------------------
  // FF-52 [判别]: 默认字段标识键序为只读常量
  // ----------------------------------------------------
  it('FF-52 [判别]: DEFAULT_FIELD_IDENTITY_KEYS 不可在运行期被改写', () => {
    expect(Object.isFrozen(DEFAULT_FIELD_IDENTITY_KEYS)).toBe(true);
    // 判别点：外部 push/splice 会抛错，不再污染全进程默认键序
    expect(() => (DEFAULT_FIELD_IDENTITY_KEYS as any).push('x')).toThrow();
    expect([...DEFAULT_FIELD_IDENTITY_KEYS]).toEqual(['name', 'path']);
  });

  // ----------------------------------------------------
  // FF-49 [判别]: 环状 fields 下遍历类 API 全部终止
  // ----------------------------------------------------
  it('FF-49 [判别]: 环状 fields 的查找/更新/插入/删除遍历均终止', () => {
    const cyclic: any = { path: 'loop' };
    cyclic.fields = [cyclic];
    const api = useFields<any>([cyclic, { path: 'normal' }]);

    // 判别点：finder 全量查找、非命中路径遍历与多位点写入均不挂死
    expect(() => api.getField(() => true, { all: true })).not.toThrow();
    expect(api.getField('normal')).toBeTruthy();
    expect(api.getField('loop')).toBeTruthy();
    expect(() =>
      api.setField(() => true, { label: 'x' } as any, { all: true })
    ).not.toThrow();
    expect(() =>
      api.appendField('loop', { path: 'child' } as any)
    ).not.toThrow();
    expect(() => api.getParentField(() => true, { all: true })).not.toThrow();
    expect(() => api.deleteField('loop')).not.toThrow();
    expect(api.getField('loop')).toBeUndefined();
    expect(api.getField('normal')).toBeTruthy();
  });
});
