import { describe, it, expect, vi } from 'vitest';
import { reactive, watch } from 'vue';
import lodashGet from 'lodash-es/get';
import lodashSet from 'lodash-es/set';
import lodashToPath from 'lodash-es/toPath';
import {
  get,
  set,
  normalizePathKey,
  toPath,
  isDangerousKey,
} from '../src/shared/path';

describe('shared/path', () => {
  const sampleData = () => ({
    user: {
      name: '张三',
      profile: {
        age: 25,
        hobbies: ['coding', 'gaming'],
      },
      tags: [
        { id: 1, text: 'admin' },
        { id: 2, text: 'dev' },
      ],
    },
    list: [10, 20, 30],
    'a.b': 'literal_dot',
  });

  const legalPaths = [
    'user',
    'user.name',
    'user.profile.age',
    'user.profile.hobbies',
    'user.profile.hobbies[0]',
    'user.profile.hobbies.1',
    'user.tags[0].text',
    'user.tags.1.id',
    'list[0]',
    'list.2',
    'not.exist.path',
    'user.notExist',
  ];

  describe('合法语料与 lodash 差分对拍', () => {
    it('get 差分全等', () => {
      const data = sampleData();
      for (const p of legalPaths) {
        const actual = get(data, p);
        const expected = lodashGet(data, p);
        expect(actual).toEqual(expected);
      }
    });

    it('set 差分全等', () => {
      const values = [0, -0, NaN, '', 'val', false, null];
      for (const p of legalPaths) {
        for (const val of values) {
          const data1 = sampleData();
          const data2 = sampleData();
          set(data1, p, val);
          lodashSet(data2, p, val);
          expect(data1).toEqual(data2);
        }
      }
    });

    it('normalizePathKey 针对合法路径与 toPath.join 一致', () => {
      for (const p of legalPaths) {
        const actual = normalizePathKey(p);
        const expected = lodashToPath(p).join('.');
        expect(actual).toBe(expected);
      }
    });

    it('toPath 与 lodash toPath 对拍（段数组形式）', () => {
      for (const p of legalPaths) {
        expect(toPath(p)).toEqual(lodashToPath(p));
      }
      expect(toPath('')).toEqual([]); // 对齐旧 toPath('') -> []
    });

    it('空段与畸形兼容路径与 lodash 行为对拍', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const edgePaths = ['.a', 'a.', 'a..b', 'a[]', ''];
      const testData = {
        '': 'empty',
        a: { '': 'empty_sub', b: 1 },
        '.a': 'dot_a',
      };
      for (const p of edgePaths) {
        expect(get(testData, p)).toEqual(lodashGet(testData, p));
        expect(normalizePathKey(p)).toBe(lodashToPath(p).join('.'));
      }
      warnSpy.mockRestore();
    });
  });

  describe('告警与去重', () => {
    it('非法路径输出 warning 且相同路径只告警一次', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const invalidPath = 'invalid..double..dot';
      get({ a: 1 }, invalidPath);
      get({ a: 1 }, invalidPath);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '[pro-components] 非法路径 "invalid..double..dot"'
        )
      );
      warnSpy.mockRestore();
    });

    it('去重状态有界：重复路径不重复告警，超量后新路径仍会告警', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        // 行为一：同一非法路径重复解析只告警一次
        const first = warnSpy.mock.calls.length;
        toPath('bounded..dup[');
        toPath('bounded..dup[');
        expect(warnSpy.mock.calls.length).toBe(first + 1);

        // 行为二：灌入大量不同非法路径后，去重状态不阻断新路径告警
        for (let i = 0; i <= 5000; i++) toPath(`legacy_${i}[`);
        const countAfterFill = warnSpy.mock.calls.length;
        toPath('legacy_after_fill_new[');
        expect(warnSpy.mock.calls.length).toBe(countAfterFill + 1);
      } finally {
        warnSpy.mockRestore();
      }
    });
  });

  describe('与 lodash-es 的有意分歧用例锁定', () => {
    it('分歧 1：未闭合括号 a[b 按段解析并告警', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const obj = { a: { b: 123 } };
      expect(get(obj, 'a[b')).toBe(123);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('括号未闭合')
      );
      warnSpy.mockRestore();
    });

    it('分歧 2：引号括号段 a["x.y"] 保留引号段并告警', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const obj = { a: { '"x.y"': 'quoted' } };
      expect(get(obj, 'a["x.y"]')).toBe('quoted');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('不支持引号括号段')
      );
      warnSpy.mockRestore();
    });

    it('分歧 3：normalizePathKey 对非字符串/数组输入安全返回空字符串', () => {
      expect(normalizePathKey({})).toBe('');
      expect(normalizePathKey(null)).toBe('');
      expect(normalizePathKey(undefined)).toBe('');
      expect(normalizePathKey(Symbol('key'))).toBe('');
    });
  });

  describe('缓存契约与非字符串入参', () => {
    // ----------------------------------------------------
    // [判别]: 与 lodash 对齐的部分（数组 / 整数 / 布尔）
    // ----------------------------------------------------
    it('非字符串入参的 lodash 对齐部分：数组、整数、布尔逐项对拍', () => {
      for (const input of [
        123,
        0,
        true,
        false,
        ['a', 'b'],
        [0, 'x'],
      ] as any[]) {
        expect(toPath(input)).toEqual(lodashToPath(input));
      }
      expect(toPath(123)).toEqual(['123']);
      expect(toPath(true)).toEqual(['true']);
      expect(toPath(['a', 'b'])).toEqual(['a', 'b']);
    });

    // ----------------------------------------------------
    // [判别]: 与 normalizePathKey 的口径一致性（非字符串全域）
    // ----------------------------------------------------
    it('toPath 与 normalizePathKey 口径一致：join 结果恒等', () => {
      const matrix: any[] = [
        'a.b',
        'a[0].b',
        '',
        123,
        1.5,
        true,
        false,
        null,
        undefined,
        { a: 1 },
        ['a', 'b'],
        ['a', 0],
      ];
      for (const input of matrix) {
        expect(toPath(input).join('.')).toBe(normalizePathKey(input));
      }
    });

    // ----------------------------------------------------
    // 分歧 4：对象 / symbol 返回空数组（lodash 产出垃圾段）
    // ----------------------------------------------------
    it('分歧 4：toPath 对对象/symbol 返回空数组，不产出 lodash 的垃圾段', () => {
      expect(toPath({ a: 1 })).toEqual([]);
      expect(lodashToPath({ a: 1 })).toEqual(['object Object']);
      const symbol = Symbol('s');
      expect(toPath(symbol as any)).toEqual([]);
      // lodash 原样保留 symbol 段（不可用作路径 key），本实现返回空数组
      const lodashSymbol = lodashToPath(symbol as any);
      expect(lodashSymbol).toHaveLength(1);
      expect(typeof lodashSymbol[0]).toBe('symbol');
    });

    // ----------------------------------------------------
    // 分歧 5：小数数字取单段（lodash 按点分拆为 ['1','5']）
    // ----------------------------------------------------
    it('分歧 5：toPath 对小数数字取单段', () => {
      expect(toPath(1.5)).toEqual(['1.5']);
      expect(lodashToPath(1.5)).toEqual(['1', '5']);
    });

    // ----------------------------------------------------
    // [判别]: 返回值为缓存实例且已冻结，就地修改抛错且缓存不被污染
    // ----------------------------------------------------
    it('toPath 返回值冻结：就地修改抛错，后续同路径解析不受影响', () => {
      const first = toPath('user.address.city');
      expect(first).toEqual(['user', 'address', 'city']);
      expect(Object.isFrozen(first)).toBe(true);
      // 缓存共享：同路径返回同一实例
      expect(toPath('user.address.city')).toBe(first);
      // 就地修改抛错（严格模式），缓存不被污染
      expect(() => (first as string[]).push('x')).toThrow(TypeError);
      expect(() => ((first as string[])[0] = 'hacked')).toThrow(TypeError);
      expect(toPath('user.address.city')).toEqual(['user', 'address', 'city']);
    });

    // ----------------------------------------------------
    // PT-01 [判别]: 返回实例与冻结状态按入参分支分档
    // ----------------------------------------------------
    it('PT-01 [判别]: 字符串分支返回缓存同一实例且已冻结，数组与标量分支每次新建且不冻结', () => {
      // 字符串分支（含单段）：缓存共享 + 冻结
      const str = toPath('user.address.city');
      expect(str).toBe(toPath('user.address.city'));
      expect(Object.isFrozen(str)).toBe(true);
      expect(toPath('user')).toBe(toPath('user'));
      expect(Object.isFrozen(toPath('user'))).toBe(true);

      // 数组 / 数字 / 布尔分支：每次新建、不冻结、不共享
      for (const input of [
        ['a', 'b'],
        [0, 'x'],
        123,
        0,
        true,
        false,
      ] as any[]) {
        const first = toPath(input);
        const second = toPath(input);
        expect(first).toEqual(second);
        expect(first).not.toBe(second);
        expect(Object.isFrozen(first)).toBe(false);
      }

      // 空字符串与非法类型返回的新空数组同样每次新建
      expect(toPath('')).toEqual([]);
      expect(toPath('')).not.toBe(toPath(''));
      expect(Object.isFrozen(toPath(''))).toBe(false);
    });

    // ----------------------------------------------------
    // PT-02 [判别]: 段值归一化矩阵——数组含 null/undefined 段时 join 不变量分叉
    // ----------------------------------------------------
    it('PT-02 [判别]: 段值归一化矩阵：null/undefined 段上 toPath 与 normalizePathKey 分叉', () => {
      // 分叉：toPath 逐段 String 归一化（对齐 lodash toPath），normalizePathKey 走 join
      expect(toPath(['a', null])).toEqual(['a', 'null']);
      expect(toPath(['a', null])).toEqual(lodashToPath(['a', null]));
      expect(normalizePathKey(['a', null])).toBe('a.');
      expect(toPath(['a', null]).join('.')).not.toBe(
        normalizePathKey(['a', null])
      );

      expect(toPath(['a', undefined])).toEqual(['a', 'undefined']);
      expect(toPath(['a', undefined])).toEqual(lodashToPath(['a', undefined]));
      expect(normalizePathKey(['a', undefined])).toBe('a.');
      expect(toPath(['a', undefined]).join('.')).not.toBe(
        normalizePathKey(['a', undefined])
      );

      // 同口径：数字段、空字符串段、纯字符串、数字/布尔标量
      for (const input of [
        ['a', 0],
        ['a', ''],
        [1, 2],
        'a.b',
        123,
        true,
      ] as any[]) {
        expect(toPath(input).join('.')).toBe(normalizePathKey(input));
      }
      expect(toPath(['a', 0])).toEqual(['a', '0']);
      expect(toPath(['a', ''])).toEqual(['a', '']);
      expect(toPath([1, 2])).toEqual(['1', '2']);
    });
  });

  // ----------------------------------------------------
  // PT-03 [判别]: isDangerousKey 判定矩阵（深层导入面）
  // ----------------------------------------------------
  describe('isDangerousKey 判定矩阵', () => {
    it('PT-03 [判别]: 原型敏感键返回 true，普通键与数字键返回 false', () => {
      for (const key of ['__proto__', 'prototype', 'constructor']) {
        expect(isDangerousKey(key)).toBe(true);
      }
      for (const key of [
        'name',
        '0',
        '',
        'toString',
        '__proto',
        'Constructor',
      ]) {
        expect(isDangerousKey(key)).toBe(false);
      }
      expect(isDangerousKey(0)).toBe(false);
    });
  });

  describe('Vue 响应式与性能边界', () => {
    it('set 中间层对象自动创建并保持响应式代理', () => {
      const state = reactive<{ user?: { profile?: { city?: string } } }>({});
      let triggered = 0;
      watch(
        () => state.user?.profile?.city,
        () => {
          triggered++;
        },
        { flush: 'sync' }
      );

      set(state, 'user.profile.city', 'Hangzhou');
      expect(state.user?.profile?.city).toBe('Hangzhou');
      expect(triggered).toBe(1);
    });

    // ----------------------------------------------------
    // PT-06 [判别]: SameValueZero 同值跳过写入（普通对象 setter 计数）
    // ----------------------------------------------------
    it('PT-06 [判别]: SameValueZero 同值跳过写入，异值正常写入', () => {
      let writes = 0;
      const target: any = {};
      Object.defineProperty(target, 'count', {
        get: () => 1,
        set: () => {
          writes += 1;
        },
        configurable: true,
      });
      Object.defineProperty(target, 'notNumber', {
        get: () => NaN,
        set: () => {
          writes += 1;
        },
        configurable: true,
      });

      // 判别点：同值（1 / NaN）不触发 setter，异值触发
      set(target, 'count', 1);
      set(target, 'notNumber', NaN);
      expect(writes).toBe(0);

      set(target, 'count', 2);
      expect(writes).toBe(1);
    });

    // ----------------------------------------------------
    // PT-04 [判别]: SameValueZero 口径下 ±0 视为相同值（对齐 lodash assignValue）
    // ----------------------------------------------------
    it('PT-04 [判别]: set 对 ±0 视为相同值并跳过写入', () => {
      const state = reactive({ zero: 0, negZero: -0 });
      let triggered = 0;
      watch(
        () => state.zero,
        () => {
          triggered++;
        },
        { flush: 'sync' }
      );

      // 0 → -0：SameValueZero 视为相同值，跳过写入，依赖更新不触发
      set(state, 'zero', -0);
      expect(triggered).toBe(0);
      expect(Object.is(state.zero, -0)).toBe(false);

      // -0 → 0：同样跳过写入，原值保持 -0
      set(state, 'negZero', 0);
      expect(Object.is(state.negZero, -0)).toBe(true);
    });

    it('原型污染属性被安全忽略', () => {
      const obj = {};
      set(obj, '__proto__.polluted', 'yes');
      expect(({} as any).polluted).toBeUndefined();
      set(obj, 'constructor.prototype.polluted', 'yes');
      expect(({} as any).polluted).toBeUndefined();
    });

    // ----------------------------------------------------
    // PT-05 [判别]: 非字符串路径（段数组 / 裸数字 / 布尔）入口归一，与 lodash 对拍
    // ----------------------------------------------------
    it('PT-05 [判别]: 裸数字/布尔路径按单段键读写，不再返回整个对象或写入 undefined 键', () => {
      // 读取：数字 / 布尔标量按单段键；未命中返回 undefined（旧实现返回整个入参对象）
      expect(get({ a: 1 }, 0 as any)).toBe(lodashGet({ a: 1 }, 0 as any));
      expect(get({ a: 1 }, 0 as any)).toBeUndefined();
      expect(get({ 0: 'zero' }, 0 as any)).toBe('zero');
      expect(get([1, 2] as any, 0 as any)).toBe(1);
      expect(get({ a: 1 }, true as any)).toBe(lodashGet({ a: 1 }, true as any));
      expect(get({ a: 1 }, true as any)).toBeUndefined();
      expect(get({ 1.5: 'x' }, 1.5 as any)).toBe('x');
      expect(get({ a: 1 }, NaN as any)).toBe(lodashGet({ a: 1 }, NaN as any));

      // 写入：数字 / 布尔路径与 lodash 落位一致（旧实现写入键名 "undefined"）
      const numeric: any = {};
      set(numeric, 0 as any, 'v');
      expect(numeric).toEqual(lodashSet({} as any, 0 as any, 'v'));
      expect(numeric).toEqual({ 0: 'v' });

      const decimal: any = {};
      set(decimal, 1.5 as any, 'v');
      expect(decimal).toEqual(lodashSet({} as any, 1.5 as any, 'v'));

      const bool: any = { a: 1 };
      set(bool, true as any, 'v');
      expect(bool).toEqual(lodashSet({ a: 1 } as any, true as any, 'v'));

      // 段数组路径与 lodash 对拍
      expect(get({ a: { b: 1 } }, ['a', 'b'])).toBe(
        lodashGet({ a: { b: 1 } }, ['a', 'b'])
      );
      const nested: any = {};
      expect(set(nested, ['a', 'b'], 2)).toBe(nested);
      expect(nested).toEqual(lodashSet({} as any, ['a', 'b'], 2));

      // 空段数组：读取返回 undefined（与 lodash 一致），写入早退
      expect(get({ a: 1 }, [])).toBe(lodashGet({ a: 1 }, []));
      expect(get({ a: 1 }, [])).toBeUndefined();
      const target: any = { a: 1 };
      expect(set(target, [], 'v')).toBe(target);
      expect(target).toEqual({ a: 1 });

      // null / 对象路径：读取返回 undefined，写入不产生键（对齐 toPath 归一口径）
      expect(get({ a: 1 }, null as any)).toBeUndefined();
      expect(get({ a: 1 }, {} as any)).toBeUndefined();
      const guarded: any = { a: 1 };
      expect(set(guarded, null as any, 'v')).toBe(guarded);
      expect(set(guarded, {} as any, 'v')).toBe(guarded);
      expect(guarded).toEqual({ a: 1 });

      // 目标为 null / undefined 时读写均不抛错
      expect(get(null, 'a')).toBeUndefined();
      expect(get(undefined, 0 as any)).toBeUndefined();
      expect(set(null as any, 'a', 1)).toBeNull();
      expect(set(undefined as any, 'a', 1)).toBeUndefined();
    });

    // ----------------------------------------------------
    // PT-07 [判别]: 段数组中的非索引数字段建对象而非数组（对齐 lodash）
    // ----------------------------------------------------
    it('PT-07 [判别]: 负数/小数/NaN/超大整数段建对象，非负整数段仍建数组', () => {
      const objectSegments = [-1, 1.5, NaN, Infinity, 1e21, 2 ** 53];
      for (const seg of objectSegments) {
        const ours: any = {};
        const theirs: any = {};
        set(ours, ['k', seg], 'v');
        lodashSet(theirs, ['k', seg], 'v');
        // 判别点：不再建数组并挂隐藏属性（旧实现得到 { k: [] }，JSON 不可见）
        expect(Array.isArray(ours.k)).toBe(false);
        expect(ours).toEqual(theirs);
      }

      // 非负整数段保持数组语义（含 0 与 -0，以及数组下标上限）
      for (const seg of [0, -0, 2, 4294967294]) {
        const list: any = {};
        set(list, ['k', seg], 'v');
        expect(Array.isArray(list.k)).toBe(true);
        expect(list.k[seg]).toBe('v');
      }
      const asArray: any = {};
      lodashSet(asArray, ['k', 2], 'v');
      const oursArray: any = {};
      set(oursArray, ['k', 2], 'v');
      expect(oursArray).toEqual(asArray);
    });
  });
});
