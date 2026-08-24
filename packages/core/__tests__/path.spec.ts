import { describe, it, expect, vi } from 'vitest';
import { reactive, watch } from 'vue';
import lodashGet from 'lodash-es/get';
import lodashSet from 'lodash-es/set';
import lodashToPath from 'lodash-es/toPath';
import { getByPath, setByPath, normalizePathKey } from '../src/shared/path';

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
    it('getByPath 差分全等', () => {
      const data = sampleData();
      for (const p of legalPaths) {
        const actual = getByPath(data, p);
        const expected = lodashGet(data, p);
        expect(actual).toEqual(expected);
      }
    });

    it('setByPath 差分全等', () => {
      for (const p of legalPaths) {
        const data1 = sampleData();
        const data2 = sampleData();
        const val = `val_${Math.random()}`;
        setByPath(data1, p, val);
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
  });

  describe('告警与去重', () => {
    it('非法路径输出 warning 且相同路径只告警一次', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const invalidPath = 'invalid..double..dot';
      getByPath({ a: 1 }, invalidPath);
      getByPath({ a: 1 }, invalidPath);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '[pro-components] 非法路径 "invalid..double..dot"'
        )
      );
      warnSpy.mockRestore();
    });
  });

  describe('与 lodash-es 的有意分歧用例锁定', () => {
    it('分歧 1：未闭合括号 a[b 按段解析并告警', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const obj = { a: { b: 123 } };
      expect(getByPath(obj, 'a[b')).toBe(123);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('括号未闭合')
      );
      warnSpy.mockRestore();
    });

    it('分歧 2：引号括号段 a["x.y"] 保留引号段并告警', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const obj = { a: { '"x.y"': 'quoted' } };
      expect(getByPath(obj, 'a["x.y"]')).toBe('quoted');
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

  describe('Vue 响应式与性能边界', () => {
    it('setByPath 中间层对象自动创建并保持响应式代理', () => {
      const state = reactive<{ user?: { profile?: { city?: string } } }>({});
      let triggered = 0;
      watch(
        () => state.user?.profile?.city,
        () => {
          triggered++;
        },
        { flush: 'sync' }
      );

      setByPath(state, 'user.profile.city', 'Hangzhou');
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

      setByPath(state, 'count', 1);
      expect(triggered).toBe(0);

      setByPath(state, 'notNumber', NaN);
      expect(state.notNumber).toBeNaN();
    });

    it('原型污染属性被安全忽略', () => {
      const obj = {};
      setByPath(obj, '__proto__.polluted', 'yes');
      expect(({} as any).polluted).toBeUndefined();
      setByPath(obj, 'constructor.prototype.polluted', 'yes');
      expect(({} as any).polluted).toBeUndefined();
    });
  });
});
