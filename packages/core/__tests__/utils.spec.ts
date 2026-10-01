import { describe, it, expect, vi } from 'vitest';
import { isProxy, reactive, ref } from 'vue';
import {
  getObject,
  camelizeProperties,
  isPlainObject,
  pick,
  cloneDeep,
  isPromise,
} from '../src/shared/utils';
import {
  isPlainObject as lodashIsPlainObject,
  pick as lodashPick,
  cloneDeep as lodashCloneDeep,
} from 'lodash-es';

describe('utils', () => {
  it('SU-01 getObject 普通对象原样返回', () => {
    const o = { a: 1 };
    expect(getObject(o)).toBe(o);
  });

  it('SU-02 getObject 非对象返回空对象', () => {
    expect(getObject(null)).toEqual({});
    expect(getObject(undefined)).toEqual({});
    expect(getObject('str')).toEqual({});
    expect(getObject([1])).toEqual({});
  });

  it('SU-03 camelizeProperties', () => {
    expect(camelizeProperties({ 'user-name': 1, 'is-active': true })).toEqual({
      userName: 1,
      isActive: true,
    });
    expect(camelizeProperties({})).toEqual({});
  });

  describe('isPlainObject 与 lodash 差分对拍', () => {
    class CustomClass {
      foo = 1;
    }

    const testCases: [string, any][] = [
      ['纯对象字面量', {}],
      ['有属性对象', { a: 1, b: 'str' }],
      ['Object.create(null)', Object.create(null)],
      ['Object.create({})', Object.create({})],
      [
        '双空原型链 Object.create(Object.create(null))',
        Object.create(Object.create(null)),
      ],
      ['数组', []],
      ['null', null],
      ['undefined', undefined],
      ['Date', new Date()],
      ['RegExp', /abc/],
      ['Map', new Map()],
      ['Set', new Set()],
      ['Error', new Error('err')],
      ['类实例', new CustomClass()],
      ['函数', () => {}],
      ['普通函数', function test() {}],
      ['字符串', 'string'],
      ['数字', 123],
      ['布尔值', true],
      ['Symbol', Symbol('sym')],
    ];

    for (const [name, val] of testCases) {
      it(`isPlainObject 对拍: ${name}`, () => {
        const actual = isPlainObject(val);
        const expected = lodashIsPlainObject(val);
        expect(actual).toBe(expected);
      });
    }
  });

  describe('pick 与 lodash 差分对拍', () => {
    it('pick 提取自有属性与继承属性', () => {
      const parent = { inherited: 'from_parent' };
      const child = Object.create(parent);
      child.own = 'own_val';
      child.other = 123;

      const actual = pick(child, ['own', 'inherited', 'nonExist'] as any);
      const expected = lodashPick(child, [
        'own',
        'inherited',
        'nonExist',
      ] as any);
      expect(actual).toEqual(expected);
    });

    it('pick 继承原型上的 toString 方法', () => {
      const obj = {};
      const actual = pick(obj, ['toString'] as any);
      const expected = lodashPick(obj, ['toString'] as any);
      expect(actual).toEqual(expected);
    });

    it('pick 空 keys 返回空对象', () => {
      const obj = { a: 1, b: 2 };
      expect(pick(obj, [])).toEqual(lodashPick(obj, []));
    });
  });

  describe('cloneDeep 规格测试与对拍', () => {
    it('CR-008 [判别]: 响应式代理入参按原始对象克隆，Date/Map 类型不降级且无降级告警', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const date = new Date('2020-01-01T00:00:00Z');
      const map = new Map<string, number>([['k', 1]]);
      const source = reactive({
        d: date,
        m: map,
        info: { n: 1 },
        list: [{ id: 1 }],
      });

      const copy = cloneDeep(source);

      // 类型不降级：JSON 降级会把 Date 变字符串、Map 变 {}
      expect(copy.d).toBeInstanceOf(Date);
      expect(copy.d.getTime()).toBe(date.getTime());
      expect(copy.m).toBeInstanceOf(Map);
      expect(copy.m.get('k')).toBe(1);
      // 拷贝结果为普通对象且与源快照隔离
      expect(isProxy(copy)).toBe(false);
      expect(copy).not.toBe(source);
      expect(copy.info).not.toBe(source.info);
      copy.info.n = 2;
      copy.list[0].id = 2;
      expect(source.info.n).toBe(1);
      expect(source.list[0].id).toBe(1);
      // 可克隆数据不应产生 JSON 降级告警
      expect(
        spy.mock.calls.filter(c => String(c[0]).includes('cloneDeep'))
      ).toHaveLength(0);

      // ref.value 同为 Proxy 形态
      const fromRef = cloneDeep(ref({ d: date }).value);
      expect(fromRef.d).toBeInstanceOf(Date);
      spy.mockRestore();
    });

    it('JSON 型数据深拷贝与快照隔离', () => {
      const source = {
        name: 'test',
        info: { age: 18, tags: ['a', 'b'] },
        list: [{ id: 1 }, { id: 2 }],
      };
      const copy = cloneDeep(source);
      expect(copy).toEqual(source);
      expect(copy).not.toBe(source);
      expect(copy.info).not.toBe(source.info);
      expect(copy.list).not.toBe(source.list);
      expect(copy.list[0]).not.toBe(source.list[0]);

      // 变异隔离
      copy.info.age = 20;
      copy.list[0].id = 99;
      expect(source.info.age).toBe(18);
      expect(source.list[0].id).toBe(1);
    });

    it('类型矩阵：Date / RegExp / Map / Set / NaN / undefined / 稀疏数组', () => {
      const date = new Date('2026-08-24');
      const reg = /test/gi;
      const map = new Map([['k', 'v']]);
      const set = new Set([1, 2, 3]);
      const sparse = [1, , 3]; // eslint-disable-line no-sparse-arrays

      const source = {
        date,
        reg,
        map,
        set,
        nan: NaN,
        inf: Infinity,
        negZero: -0,
        undef: undefined,
        sparse,
      };

      const copy = cloneDeep(source);
      expect(copy.date).toBeInstanceOf(Date);
      expect(copy.date.getTime()).toBe(date.getTime());
      expect(copy.date).not.toBe(date);

      expect(copy.reg).toBeInstanceOf(RegExp);
      expect(copy.reg.source).toBe(reg.source);
      expect(copy.reg.flags).toBe(reg.flags);

      expect(copy.map).toBeInstanceOf(Map);
      expect(copy.map.get('k')).toBe('v');
      expect(copy.map).not.toBe(map);

      expect(copy.set).toBeInstanceOf(Set);
      expect(copy.set.has(2)).toBe(true);
      expect(copy.set).not.toBe(set);

      expect(Number.isNaN(copy.nan)).toBe(true);
      expect(copy.inf).toBe(Infinity);
      expect(Object.is(copy.negZero, -0)).toBe(true);
      expect(copy.undef).toBeUndefined();
      expect('undef' in copy).toBe(true);

      expect(copy.sparse.length).toBe(3);
      expect(0 in copy.sparse).toBe(true);
      expect(1 in copy.sparse).toBe(false);
      expect(2 in copy.sparse).toBe(true);
    });

    it('循环引用正常处理', () => {
      const obj: any = { a: 1 };
      obj.self = obj;
      const copy = cloneDeep(obj);
      expect(copy.a).toBe(1);
      expect(copy.self).toBe(copy);
      expect(copy.self).not.toBe(obj);
    });

    it('降级路径：含函数属性的对象安全丢弃函数并成功克隆其他属性', () => {
      const obj = {
        a: 1,
        fn: () => 'hello',
        nested: { b: 2, fn2: function () {} },
      };
      const copy = cloneDeep(obj);
      expect(copy.a).toBe(1);
      expect((copy as any).fn).toBeUndefined();
      expect(copy.nested.b).toBe(2);
      expect((copy as any).nested.fn2).toBeUndefined();
    });

    it('环境降级：无 structuredClone 时 JSON 降级正常工作', () => {
      const originalStructuredClone = globalThis.structuredClone;
      try {
        (globalThis as any).structuredClone = undefined;
        const source = { a: 1, list: [2, 3] };
        const copy = cloneDeep(source);
        expect(copy).toEqual(source);
        expect(copy).not.toBe(source);
        expect(copy.list).not.toBe(source.list);
      } finally {
        globalThis.structuredClone = originalStructuredClone;
      }
    });

    it('环境降级 + 循环引用时兜底告警并返回原引用', () => {
      const originalStructuredClone = globalThis.structuredClone;
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        (globalThis as any).structuredClone = undefined;
        const circular: any = { a: 1 };
        circular.self = circular;

        const copy = cloneDeep(circular);
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('[pro-components] cloneDeep 降级失败')
        );
        expect(copy).toBe(circular);
      } finally {
        globalThis.structuredClone = originalStructuredClone;
        warnSpy.mockRestore();
      }
    });

    it('JSON 子集与 lodash cloneDeep 差分对拍', () => {
      const jsonSamples = [
        { num: 1, str: 'hello', bool: true, nil: null },
        [1, '2', false, { sub: [3, 4] }],
        { deep: { level1: { level2: { val: 'end' } } } },
      ];
      for (const sample of jsonSamples) {
        const actual = cloneDeep(sample);
        const expected = lodashCloneDeep(sample);
        expect(actual).toEqual(expected);
      }
    });
  });

  describe('isPromise', () => {
    it('标准 Promise 实例识别为 true', () => {
      expect(isPromise(Promise.resolve(1))).toBe(true);
      expect(isPromise(new Promise(() => {}))).toBe(true);
      expect(isPromise(Promise.reject(new Error('err')).catch(() => {}))).toBe(
        true
      );
    });

    it('Async 函数执行返回值识别为 true', () => {
      const asyncFn = async () => 1;
      expect(isPromise(asyncFn())).toBe(true);
    });

    it('自定义 Thenable 对象识别为 true', () => {
      const thenable = {
        then: (resolve: any) => resolve('ok'),
      };
      expect(isPromise(thenable)).toBe(true);

      const customClassThenable = new (class {
        then() {}
      })();
      expect(isPromise(customClassThenable)).toBe(true);
    });

    it('非 Promise/Thenable 值识别为 false', () => {
      expect(isPromise(null)).toBe(false);
      expect(isPromise(undefined)).toBe(false);
      expect(isPromise(123)).toBe(false);
      expect(isPromise('promise')).toBe(false);
      expect(isPromise(true)).toBe(false);
      expect(isPromise({})).toBe(false);
      expect(isPromise({ then: 'not a function' })).toBe(false);
      expect(isPromise(() => {})).toBe(false);
      expect(isPromise([])).toBe(false);
      expect(isPromise(new Date())).toBe(false);
    });
  });

  it('SU-04 [判别]: camelizeProperties 转换 kebab-case，data-*/aria-* 属性名按原样保留', () => {
    const out = camelizeProperties({
      'user-name': '张三',
      'is-active': true,
      'data-testid': 'form-x',
      'aria-label': '表单',
      'aria-hidden': 'true',
      'ARIA-live': 'polite',
      'on-row-click': 1,
    });

    // kebab-case → camelCase 语义不变
    expect(out.userName).toBe('张三');
    expect(out.isActive).toBe(true);
    expect(out.onRowClick).toBe(1);
    // data-* / aria-* 保名（大小写前缀均识别）
    expect(out['data-testid']).toBe('form-x');
    expect(out['aria-label']).toBe('表单');
    expect(out['aria-hidden']).toBe('true');
    expect(out['ARIA-live']).toBe('polite');
    expect(out.dataTestid).toBeUndefined();
    expect(out.ariaLabel).toBeUndefined();
  });
});
