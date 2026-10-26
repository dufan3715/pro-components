import { describe, it, expect, vi } from 'vitest';
import { isProxy, reactive, ref } from 'vue';
import {
  getObject,
  camelizeProperties,
  isPlainObject,
  isObjectItem,
  pick,
  omit,
  omitBy,
  cloneDeep,
  isPromise,
} from '../src/shared/utils';
import {
  isPlainObject as lodashIsPlainObject,
  pick as lodashPick,
  omit as lodashOmit,
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

  describe('omit 与 lodash 差分对拍', () => {
    it('omit 剔除自有属性并保留其余键', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(omit(obj, ['b'])).toEqual(lodashOmit(obj, ['b']));
    });

    it('omit 保留继承属性，仅剔除自有属性', () => {
      const parent = { inherited: 'from_parent' };
      const child = Object.create(parent);
      child.own = 'own_val';
      child.other = 123;

      expect(omit(child, ['own'])).toEqual(lodashOmit(child, ['own']));
    });

    it('omit 空 keys 返回浅拷贝而非原引用', () => {
      const obj = { a: 1, b: 2 };
      const actual = omit(obj, []);
      expect(actual).toEqual(lodashOmit(obj, []));
      expect(actual).not.toBe(obj);
    });

    it('omit 不存在的键与 null / undefined 入参', () => {
      const obj = { a: 1 };
      expect(omit(obj, ['nope'] as any)).toEqual(
        lodashOmit(obj, ['nope'] as any)
      );
      expect(omit(null as any, ['a'])).toEqual(lodashOmit(null as any, ['a']));
      expect(omit(undefined as any, ['a'])).toEqual(
        lodashOmit(undefined as any, ['a'])
      );
    });

    it('omit 数组入参按索引键剔除并返回普通对象', () => {
      const arr = [1, 2, 3];
      const actual = omit(arr, ['1']);
      expect(actual).toEqual(lodashOmit(arr, ['1']));
      expect(Array.isArray(actual)).toBe(false);
    });

    it('omit 拷贝可枚举 Symbol 键，且支持按 Symbol 键剔除', () => {
      const kept = Symbol('kept');
      const dropped = Symbol('dropped');
      const obj = { a: 1, [kept]: 'kept_val', [dropped]: 'dropped_val' };

      expect(omit(obj, [dropped])).toEqual(lodashOmit(obj, [dropped]));
      expect(Reflect.ownKeys(omit(obj, [])).length).toBe(
        Reflect.ownKeys(lodashOmit(obj, [])).length
      );
    });

    it('omit 不修改源对象', () => {
      const obj = { a: { deep: 1 }, b: 2 };
      const actual = omit(obj, ['b']);
      expect(actual).not.toBe(obj);
      expect(obj).toEqual({ a: { deep: 1 }, b: 2 });
      expect(actual.a).toBe(obj.a);
    });

    it('SU-07 [判别]: omit 不拷贝危险键（__proto__ 不替换结果对象原型）', () => {
      const polluted = JSON.parse('{"__proto__": {"pwned": true}, "safe": 1}');
      const actual = omit(polluted, [] as any);
      expect(Object.getPrototypeOf(actual)).toBe(Object.prototype);
      expect((actual as any).pwned).toBeUndefined();
      expect((actual as any).safe).toBe(1);
      expect(Object.prototype.hasOwnProperty.call(actual, '__proto__')).toBe(
        false
      );
    });

    it('SU-12 [判别]: omit 仅剔除顶层键，不解析 a.b 深层路径', () => {
      const obj = { a: { b: 1, c: 2 } };
      expect(omit(obj, ['a.b'] as any)).toEqual({ a: { b: 1, c: 2 } });
      expect(omit(obj, ['a'] as any)).toEqual({});
    });

    it('SU-14 [判别]: omit 的数字 / 布尔键按字符串键比对（对齐 lodash toKey）', () => {
      const numeric = { 1: 'a', 2: 'b' };
      // 判别点：数字键入参同样剔除同名属性，结果与 lodash 一致
      expect(omit(numeric, [1])).toEqual(lodashOmit(numeric, [1]));
      expect(omit(numeric, [1])).toEqual({ 2: 'b' });

      const flag = { true: 't', false: 'f' };
      expect(omit(flag, [true] as any)).toEqual(
        lodashOmit(flag, [true] as any)
      );
      expect(omit(flag, [true] as any)).toEqual({ false: 'f' });

      // 数组索引键同口径
      expect(omit(['x', 'y', 'z'], [1 as any])).toEqual({ 0: 'x', 2: 'z' });

      // -0 与 0 是不同键：toKey(-0) === '-0'
      const zero = { 0: 'a', '-0': 'b' } as any;
      expect(omit(zero, [-0] as any)).toEqual(lodashOmit(zero, [-0] as any));
      expect(omit(zero, [0])).toEqual(lodashOmit(zero, [0]));
      expect(pick(zero, [-0] as any)).toEqual(lodashPick(zero, [-0] as any));
      expect(pick(zero, [0])).toEqual(lodashPick(zero, [0]));
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

    it('SU-06 [判别]: JSON 降级路径的类型变形告警在多次降级中仅输出一次', () => {
      // 首个进入降级路径的用例：连续两次含函数入参的降级拷贝只应产生 1 条告警
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const first = cloneDeep({ a: 1, fn: () => 'hello' });
      const second = cloneDeep({
        b: 2,
        nested: { fn2: function () {} },
      });
      expect(first.a).toBe(1);
      expect((first as any).fn).toBeUndefined();
      expect(second.b).toBe(2);
      expect((second as any).nested.fn2).toBeUndefined();
      expect(
        warnSpy.mock.calls.filter(c => String(c[0]).includes('cloneDeep'))
      ).toHaveLength(1);

      // 第三次进入降级路径同样不再重复告警
      cloneDeep({ c: 3, fn: () => 1 });
      expect(
        warnSpy.mock.calls.filter(c => String(c[0]).includes('cloneDeep'))
      ).toHaveLength(1);
      warnSpy.mockRestore();
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
          expect.stringContaining('[pro-components] cloneDeep 无法快照')
        );
        expect(copy).toBe(circular);
      } finally {
        globalThis.structuredClone = originalStructuredClone;
        warnSpy.mockRestore();
      }
    });

    // ----------------------------------------------------
    // SU-09 [判别]: 快照失败的告警按真实失败阶段归因，且每次失败都可感知
    // ----------------------------------------------------
    it('SU-09 [判别]: 快照失败按真实原因归因告警并返回原引用', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const cloneWarnings = () =>
        warnSpy.mock.calls
          .map(call => String(call[0]))
          .filter(msg => msg.includes('cloneDeep'));

      // 含函数（structuredClone 失败）且含 BigInt（JSON 序列化失败）：两条真实原因都要出现在文案中
      const source = { fn: () => 1, big: 10n };
      const copy = cloneDeep(source);
      expect(copy).toBe(source);
      const failure = cloneWarnings().find(msg => msg.includes('无法快照'));
      expect(failure).toBeDefined();
      expect(failure).toContain('JSON 序列化失败');
      expect(failure).toContain('structuredClone 失败');
      // 判别点：不再谎称「循环引用且环境不支持 structuredClone」
      expect(failure).not.toContain('且环境不支持 structuredClone');

      // 抛错 getter：告警携带真实错误信息
      warnSpy.mockClear();
      const throwing = {
        get boom(): number {
          throw new Error('getter-boom');
        },
      };
      expect(cloneDeep(throwing)).toBe(throwing);
      expect(cloneWarnings().some(msg => msg.includes('getter-boom'))).toBe(
        true
      );

      // 判别点：快照隔离失效每次都告警（不受「降级告警仅一次」去重约束）
      warnSpy.mockClear();
      cloneDeep({ fn: () => 1, big: 1n });
      cloneDeep({ fn: () => 1, big: 2n });
      expect(
        cloneWarnings().filter(msg => msg.includes('无法快照'))
      ).toHaveLength(2);
      warnSpy.mockRestore();
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
    // data-* / aria-* 保名（大小写前缀均识别；DOM 属性值形态）
    expect(out['data-testid']).toBe('form-x');
    expect(out['aria-label']).toBe('表单');
    expect(out['aria-hidden']).toBe('true');
    expect(out['ARIA-live']).toBe('polite');
    expect(out.dataTestid).toBeUndefined();
    expect(out.ariaLabel).toBeUndefined();
  });

  // ----------------------------------------------------
  // SU-11 [判别]: data-*/aria-* 仅在 DOM 属性值形态下保名
  // ----------------------------------------------------
  it('SU-11 [判别]: data-*/aria-* 取值为组件 prop 形态时参与驼峰转换', () => {
    const rows = [{ id: 1 }];
    const out = camelizeProperties({
      'data-source': rows,
      'data-columns': [{ key: 'a' }],
      'data-fetch': () => rows,
      'aria-modal': true,
      'aria-hidden': false,
      'data-count': 0,
      'data-title': '',
      'data-testid': 'tbl',
    });

    // 判别点：对象 / 数组 / 函数取值按组件 prop 处理，kebab 写法不再被静默忽略
    expect(out.dataSource).toBe(rows);
    expect(out.dataColumns).toEqual([{ key: 'a' }]);
    expect(typeof out.dataFetch).toBe('function');
    expect(out['data-source']).toBeUndefined();
    expect(out['data-columns']).toBeUndefined();

    // DOM 属性值形态（字符串 / 数字 / 布尔）保持原样
    expect(out['aria-modal']).toBe(true);
    expect(out['aria-hidden']).toBe(false);
    expect(out['data-count']).toBe(0);
    expect(out['data-title']).toBe('');
    expect(out['data-testid']).toBe('tbl');
    expect(out.ariaModal).toBeUndefined();
    expect(out.dataCount).toBeUndefined();
  });

  it('SU-08 [判别]: pick 不拷贝危险键（__proto__ 不替换结果对象原型）', () => {
    const polluted = JSON.parse('{"__proto__":{"polluted":"yes"},"ok":1}');
    const result = pick(polluted, ['__proto__', 'ok'] as never);
    // 判别点：结果对象原型仍是 Object.prototype，危险键未落地
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect((result as Record<string, unknown>).polluted).toBeUndefined();
    expect(result.ok).toBe(1);
  });

  it('SU-05 [判别]: isObjectItem 仅非 null 的对象为 true', () => {
    // 对象形态（含数组 / 内建对象 / 装箱原始值 / 无原型对象）均为 true
    expect(isObjectItem({})).toBe(true);
    expect(isObjectItem([])).toBe(true);
    expect(isObjectItem([1])).toBe(true);
    expect(isObjectItem(new Date())).toBe(true);
    expect(isObjectItem(new Map())).toBe(true);
    expect(isObjectItem(/re/)).toBe(true);
    expect(isObjectItem(Promise.resolve())).toBe(true);
    expect(isObjectItem(Object.create(null))).toBe(true);
    expect(isObjectItem(new Number(1))).toBe(true);

    // 非对象（null / undefined / 原始值 / 函数 / Symbol）均为 false
    expect(isObjectItem(null)).toBe(false);
    expect(isObjectItem(undefined)).toBe(false);
    expect(isObjectItem(0)).toBe(false);
    expect(isObjectItem(1)).toBe(false);
    expect(isObjectItem('')).toBe(false);
    expect(isObjectItem('str')).toBe(false);
    expect(isObjectItem(false)).toBe(false);
    expect(isObjectItem(() => {})).toBe(false);
    expect(isObjectItem(Symbol('s'))).toBe(false);
    expect(isObjectItem(10n)).toBe(false);
  });

  it('SU-13 [判别]: omitBy 按谓词剔除属性，其余假值原样保留', () => {
    const source = {
      disabled: undefined,
      enabled: false,
      count: 0,
      empty: '',
      nothing: null,
      size: 'small',
    } as Record<string, unknown>;
    const result = omitBy(source, value => value === undefined);

    // 判别点：undefined 键被剔除，false / 0 / '' / null 原样保留
    expect('disabled' in result).toBe(false);
    expect(result).toEqual({
      enabled: false,
      count: 0,
      empty: '',
      nothing: null,
      size: 'small',
    });
    // 不修改源对象；null / undefined 入参返回空对象
    expect('disabled' in source).toBe(true);
    expect(omitBy(null, () => true)).toEqual({});
    expect(omitBy(undefined, () => true)).toEqual({});

    // 谓词同时接收 value 与 key，可按 key 剔除
    expect(omitBy({ a: 1, b: 2 }, (_value, key) => key === 'a')).toEqual({
      b: 2,
    });
    // 任意谓词：剔除字符串值
    expect(
      omitBy({ a: 1, b: 'x' }, value => typeof value === 'string')
    ).toEqual({ a: 1 });
    // 危险键不参与拷贝
    const polluted = omitBy(
      JSON.parse('{"__proto__":{"x":1},"ok":2}'),
      () => false
    );
    expect(Object.getPrototypeOf(polluted)).toBe(Object.prototype);
    expect(Object.prototype.hasOwnProperty.call(polluted, '__proto__')).toBe(
      false
    );
  });
});
