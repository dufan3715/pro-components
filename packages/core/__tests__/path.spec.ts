import { describe, it, expect, vi } from 'vitest';
import { reactive, watch } from 'vue';
import lodashGet from 'lodash-es/get';
import lodashSet from 'lodash-es/set';
import lodashToPath from 'lodash-es/toPath';
import { get, set, normalizePathKey, toPath } from '../src/shared/path';

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
      for (const p of legalPaths) {
        const data1 = sampleData();
        const data2 = sampleData();
        const val = `val_${Math.random()}`;
        set(data1, p, val);
        lodashSet(data2, p, val);
        expect(data1).toEqual(data2);
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

    it('warnedPaths 有界：超量后 FIFO 驱逐最旧记录，早期路径可再次告警', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        // 灌满告警去重集合并触发驱逐（5000 上限 + 10% 批驱逐）
        for (let i = 0; i <= 5000; i++) toPath(`legacy_${i}[`);
        const countAfterFill = warnSpy.mock.calls.length;

        // 最近写入的路径仍在去重集合内：不重复告警
        toPath('legacy_5000[');
        expect(warnSpy.mock.calls.length).toBe(countAfterFill);

        // 最早写入的路径已被驱逐：去重失效，允许再次告警
        toPath('legacy_0[');
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

    it('SameValueZero 同值跳过不触发响应式变更', () => {
      const state = reactive({ count: 1, notNumber: NaN });
      let triggered = 0;
      watch(
        () => state.count,
        () => {
          triggered++;
        },
        { flush: 'sync' }
      );

      set(state, 'count', 1);
      expect(triggered).toBe(0);

      set(state, 'notNumber', NaN);
      expect(state.notNumber).toBeNaN();
    });

    it('原型污染属性被安全忽略', () => {
      const obj = {};
      set(obj, '__proto__.polluted', 'yes');
      expect(({} as any).polluted).toBeUndefined();
      set(obj, 'constructor.prototype.polluted', 'yes');
      expect(({} as any).polluted).toBeUndefined();
    });
  });
});
